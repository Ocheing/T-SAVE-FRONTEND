/**
 * Paystack Payment Service
 * 
 * Production-ready payment integration using Paystack via Supabase Edge Functions.
 * 
 * Security Architecture:
 * - Secret keys are ONLY in Edge Functions (server-side)
 * - Payment initialization happens server-side
 * - Verification is ALWAYS done server-side
 * - Webhooks provide redundant verification
 * - Idempotency is enforced at the database level
 * 
 * Flow:
 * 1. Frontend calls Edge Function to initialize payment
 * 2. Edge Function creates DB record + calls Paystack API
 * 3. User is redirected to Paystack checkout page
 * 4. After payment, user returns to callback URL
 * 5. Frontend calls Edge Function to verify payment
 * 6. Edge Function verifies with Paystack API + updates DB
 * 7. Webhook provides backup verification
 */

import { supabase } from '@/lib/supabase';
import type { PaystackPayment, PaystackPaymentStatus } from '@/types/database.types';

// ============================================================================
// Types
// ============================================================================

export interface PaystackInitializeParams {
    amount: number;          // Amount in KES
    email: string;
    tripId?: string;         // Link to savings goal
    bookingId?: string;      // Link to booking
    paymentType: 'savings_deposit' | 'booking_payment';
    description?: string;
    metadata?: Record<string, unknown>;
}

export interface PaystackInitializeResponse {
    success: boolean;
    data?: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
    error?: string;
}

export interface PaystackVerifyResponse {
    success: boolean;
    data?: {
        status: PaystackPaymentStatus;
        amount: number;
        currency: string;
        reference: string;
        channel: string;
        card_type?: string;
        card_last4?: string;
        bank?: string;
        paid_at: string;
        already_verified?: boolean;
    };
    error?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Paystack public key (safe for frontend - only used for inline JS checkout if needed)
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

/**
 * Get the callback URL for Paystack redirects
 */
export function getPaystackCallbackUrl(): string {
    return `${window.location.origin}/payment/callback`;
}

// ============================================================================
// Core Payment Functions
// ============================================================================

/**
 * Initialize a Paystack payment
 * 
 * This calls the Edge Function which:
 * 1. Validates the request
 * 2. Creates a pending payment record in the DB
 * 3. Calls Paystack API to get authorization URL
 * 4. Returns the URL for redirect
 */
export async function initializePayment(
    params: PaystackInitializeParams
): Promise<PaystackInitializeResponse> {
    try {
        // Get current session for auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return { success: false, error: 'Not authenticated. Please log in.' };
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/paystack-initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
                ...params,
                callbackUrl: getPaystackCallbackUrl(),
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error || 'Payment initialization failed' };
        }

        return data;
    } catch (error) {
        console.error('[Paystack] Initialize error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to initialize payment',
        };
    }
}

/**
 * Verify a Paystack payment after user returns from checkout
 * 
 * This calls the Edge Function which:
 * 1. Verifies the payment with Paystack API (server-side)
 * 2. Validates amount matches (prevents tampering)
 * 3. Updates payment record in the DB
 * 4. Creates transaction + updates savings goal (via DB function)
 */
export async function verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return { success: false, error: 'Not authenticated' };
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/paystack-verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ reference }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error || 'Payment verification failed' };
        }

        return data;
    } catch (error) {
        console.error('[Paystack] Verify error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to verify payment',
        };
    }
}

// ============================================================================
// Payment History & Status
// ============================================================================

/**
 * Get user's payment history from the database
 */
export async function getPaymentHistory(options?: {
    tripId?: string;
    status?: PaystackPaymentStatus;
    limit?: number;
}): Promise<PaystackPayment[]> {
    let query = supabase
        .from('paystack_payments')
        .select('*')
        .order('created_at', { ascending: false });

    if (options?.tripId) {
        query = query.eq('trip_id', options.tripId);
    }

    if (options?.status) {
        query = query.eq('status', options.status);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[Paystack] History error:', error);
        return [];
    }

    return data as PaystackPayment[];
}

/**
 * Get a single payment by reference
 */
export async function getPaymentByReference(reference: string): Promise<PaystackPayment | null> {
    const { data, error } = await supabase
        .from('paystack_payments')
        .select('*')
        .eq('paystack_reference', reference)
        .single();

    if (error) {
        console.error('[Paystack] Lookup error:', error);
        return null;
    }

    return data as PaystackPayment;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format amount for display (KES)
 */
export function formatKES(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Get status badge color for a payment status
 */
export function getPaymentStatusColor(status: PaystackPaymentStatus): string {
    switch (status) {
        case 'success':
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'failed':
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        case 'abandoned':
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        case 'reversed':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

/**
 * Get display label for a payment channel
 */
export function getChannelLabel(channel: string | null): string {
    switch (channel) {
        case 'card':
            return 'Card Payment';
        case 'bank':
            return 'Bank Transfer';
        case 'bank_transfer':
            return 'Bank Transfer';
        case 'mobile_money':
            return 'Mobile Money';
        case 'ussd':
            return 'USSD';
        default:
            return 'Payment';
    }
}
