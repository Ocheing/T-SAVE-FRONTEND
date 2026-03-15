/**
 * usePaystack Hook
 * 
 * React hooks for Paystack payment operations using React Query
 * for caching, deduplication, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
    initializePayment,
    verifyPayment,
    getPaymentHistory,
    getPaymentByReference,
    type PaystackInitializeParams,
} from '@/lib/paystackService';
import type { PaystackPaymentStatus } from '@/types/database.types';

/**
 * Hook to initialize a Paystack payment
 * Returns a mutation that:
 * 1. Creates a pending payment in DB (via Edge Function)
 * 2. Gets a Paystack authorization URL
 * 3. Redirects the user to Paystack checkout
 */
export function usePaystackInitialize() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: PaystackInitializeParams) => {
            const result = await initializePayment(params);

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Payment initialization failed');
            }

            return result.data;
        },
        onSuccess: () => {
            // Invalidate payment history to reflect the new pending payment
            queryClient.invalidateQueries({ queryKey: ['paystackPayments'] });
        },
    });
}

/**
 * Hook to verify a Paystack payment after redirect
 * This should be called on the payment callback page
 */
export function usePaystackVerify() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (reference: string) => {
            const result = await verifyPayment(reference);

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Payment verification failed');
            }

            return result.data;
        },
        onSuccess: (data) => {
            // Invalidate all relevant queries after verification
            queryClient.invalidateQueries({ queryKey: ['paystackPayments'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            queryClient.invalidateQueries({ queryKey: ['tripStats'] });

            // If it's a specific trip payment
            if (data.reference) {
                queryClient.invalidateQueries({ queryKey: ['paystackPayment', data.reference] });
            }
        },
    });
}

/**
 * Hook to fetch user's Paystack payment history
 */
export function usePaystackPayments(options?: {
    tripId?: string;
    status?: PaystackPaymentStatus;
    limit?: number;
}) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['paystackPayments', user?.id, options?.tripId, options?.status, options?.limit],
        queryFn: () => getPaymentHistory(options),
        enabled: !!user,
        staleTime: 30_000, // 30 seconds
    });
}

/**
 * Hook to fetch a single payment by reference
 */
export function usePaystackPaymentByRef(reference: string | null) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['paystackPayment', reference],
        queryFn: () => getPaymentByReference(reference!),
        enabled: !!user && !!reference,
    });
}
