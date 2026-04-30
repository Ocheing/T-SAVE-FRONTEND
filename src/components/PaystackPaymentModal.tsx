/**
 * PaystackPaymentModal
 *
 * Uses Paystack's Inline Popup (react-paystack) for payment initialization.
 * This approach requires ONLY the public key — no Edge Function needed to start a payment.
 *
 * Flow:
 * 1. User sees payment summary
 * 2. User clicks "Pay with Paystack"
 * 3. Paystack popup opens directly (using public key + react-paystack)
 * 4. User completes payment inside the popup
 * 5. On success, we record the transaction in Supabase and update the savings goal
 * 6. On close/cancel, we close the modal gracefully
 */

import { useState, useCallback } from 'react';
import { usePaystackPayment } from 'react-paystack';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    CreditCard,
    Shield,
    CheckCircle2,
    AlertCircle,
    Lock,
    Wallet,
    Building,
    Smartphone,
    ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatKES } from '@/lib/paystackService';
import { useQueryClient } from '@tanstack/react-query';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

interface PaystackPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    amount: number;           // Amount in KES
    description: string;
    goalName?: string;
    tripId?: string;
    onSuccess?: () => void;   // Called when payment is confirmed and DB is updated
    onCancel?: () => void;
}

type ModalStep = 'confirm' | 'processing' | 'success' | 'error';

export default function PaystackPaymentModal({
    open,
    onOpenChange,
    amount,
    description,
    goalName,
    tripId,
    onSuccess,
    onCancel,
}: PaystackPaymentModalProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [step, setStep] = useState<ModalStep>('confirm');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Generate a unique reference for this payment attempt
    const reference = `TSAVE_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const paystackConfig = {
        reference,
        email: user?.email || '',
        amount: Math.round(amount * 100), // Paystack requires smallest unit (kobo/cents)
        currency: 'KES',
        publicKey: PAYSTACK_PUBLIC_KEY,
        label: goalName ? `Savings for ${goalName}` : 'TembeaSave Deposit',
        metadata: {
            trip_id: tripId || '',
            description,
            custom_fields: [
                {
                    display_name: 'Goal',
                    variable_name: 'goal',
                    value: goalName || 'General Savings',
                },
            ],
        },
    };

    const onPaystackSuccess = useCallback(async (response: { reference: string }) => {
        setStep('processing');

        try {
            // Record the payment directly in Supabase using service role via anon key RLS
            // 1. Insert transaction record
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user?.id,
                    trip_id: tripId || null,
                    type: 'deposit',
                    amount: amount,
                    description: description || (goalName ? `Savings for ${goalName}` : 'Paystack deposit'),
                    status: 'completed',
                });

            if (txError) throw new Error('Failed to record transaction: ' + txError.message);

            // 2. Update trip saved_amount if a trip is linked
            if (tripId) {
                // Fetch current saved_amount first
                const { data: tripData, error: fetchErr } = await supabase
                    .from('trips')
                    .select('saved_amount')
                    .eq('id', tripId)
                    .single();

                if (fetchErr) throw new Error('Failed to fetch trip: ' + fetchErr.message);

                const newSaved = (Number(tripData?.saved_amount) || 0) + amount;

                const { error: updateErr } = await supabase
                    .from('trips')
                    .update({ saved_amount: newSaved })
                    .eq('id', tripId);

                if (updateErr) throw new Error('Failed to update savings: ' + updateErr.message);
            }

            // 3. Optionally store in paystack_payments for audit trail (best-effort)
            try {
                await supabase.from('paystack_payments').insert({
                    user_id: user?.id,
                    paystack_reference: response.reference,
                    amount: Math.round(amount * 100), // in kobo
                    currency: 'KES',
                    email: user?.email || '',
                    status: 'success',
                    trip_id: tripId || null,
                    payment_type: 'savings_deposit',
                    description,
                    paid_at: new Date().toISOString(),
                });
            } catch {
                // Non-critical — don't fail the whole flow if audit insert fails
            }

            // 4. Refresh all relevant queries
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            queryClient.invalidateQueries({ queryKey: ['tripStats'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
            queryClient.invalidateQueries({ queryKey: ['transactionStats'] });

            setStep('success');
            onSuccess?.();

        } catch (err) {
            console.error('[PaystackModal] Post-payment update error:', err);
            setErrorMsg(
                err instanceof Error
                    ? err.message
                    : 'Payment succeeded but we failed to update your goal. Please contact support.'
            );
            setStep('error');
        }
    }, [user, tripId, amount, description, goalName, queryClient, onSuccess]);

    const onPaystackClose = useCallback(() => {
        // Called when user closes the Paystack popup WITHOUT paying
        if (step === 'confirm') {
            onCancel?.();
        }
    }, [step, onCancel]);

    const initializePayment = usePaystackPayment(paystackConfig);

    const handlePayWithPaystack = () => {
        if (!user?.email) {
            setErrorMsg('You must be logged in to make a payment.');
            setStep('error');
            return;
        }
        if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY.includes('your_paystack')) {
            setErrorMsg('Paystack is not configured. Please contact support.');
            setStep('error');
            return;
        }

        initializePayment({
            onSuccess: onPaystackSuccess,
            onClose: onPaystackClose,
        });
    };

    const handleClose = () => {
        if (step === 'processing') return; // Don't allow closing while updating DB
        setStep('confirm');
        setErrorMsg(null);
        onOpenChange(false);
        if (step !== 'success') onCancel?.();
    };

    const handleDone = () => {
        setStep('confirm');
        setErrorMsg(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md" id="paystack-payment-modal">

                {/* ── Confirm Step ── */}
                {step === 'confirm' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                    <Wallet className="h-4 w-4 text-primary" />
                                </div>
                                Secure Payment
                            </DialogTitle>
                            <DialogDescription>
                                Complete your savings deposit via Paystack
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            {/* Amount */}
                            <div className="text-center py-3">
                                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                    {formatKES(amount)}
                                </div>
                                {goalName && (
                                    <p className="text-sm text-muted-foreground mt-1.5">
                                        For: <span className="font-medium text-foreground">{goalName}</span>
                                    </p>
                                )}
                            </div>

                            {/* Payment methods */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Accepted Payment Methods
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/50">
                                        <CreditCard className="h-5 w-5 text-blue-500" />
                                        <span className="text-[10px] text-muted-foreground text-center">Card</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/50">
                                        <Building className="h-5 w-5 text-purple-500" />
                                        <span className="text-[10px] text-muted-foreground text-center">Bank Transfer</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/50">
                                        <Smartphone className="h-5 w-5 text-green-500" />
                                        <span className="text-[10px] text-muted-foreground text-center">M-Pesa</span>
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Payment for</span>
                                    <span className="font-medium truncate ml-2 max-w-[200px]">{description}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-mono text-xs truncate max-w-[200px]">{user?.email}</span>
                                </div>
                                <div className="flex justify-between text-sm pt-2 border-t border-border">
                                    <span className="font-semibold">Total</span>
                                    <span className="font-bold text-primary">{formatKES(amount)}</span>
                                </div>
                            </div>

                            {/* Security badge */}
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                <Shield className="h-3.5 w-3.5 text-green-500" />
                                <span>SSL Encrypted • Secured by Paystack</span>
                                <Lock className="h-3 w-3" />
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePayWithPaystack}
                                className="bg-[#0BA4DB] hover:bg-[#0993C7] text-white flex-1"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Pay with Paystack
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* ── Processing Step (updating DB after payment) ── */}
                {step === 'processing' && (
                    <div className="py-12 text-center space-y-6">
                        <div className="relative mx-auto w-20 h-20">
                            <div className="absolute inset-0 bg-[#0BA4DB]/20 rounded-full animate-ping" />
                            <div className="relative flex items-center justify-center w-full h-full bg-[#0BA4DB]/10 rounded-full">
                                <Shield className="h-10 w-10 text-[#0BA4DB]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">Updating Your Savings</h3>
                            <p className="text-sm text-muted-foreground">
                                Payment confirmed! Updating your goal balance...
                            </p>
                        </div>
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#0BA4DB]" />
                    </div>
                )}

                {/* ── Success Step ── */}
                {step === 'success' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-5 w-5" />
                                Payment Successful!
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-6 text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                                    {formatKES(amount)} added! 🎉
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Your savings goal has been updated successfully.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button className="w-full" onClick={handleDone}>
                                Done
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* ── Error Step ── */}
                {step === 'error' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="h-5 w-5" />
                                Payment Error
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-6 text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                                    Something went wrong
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {errorMsg || 'An unexpected error occurred. Please try again.'}
                                </p>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={() => { setStep('confirm'); setErrorMsg(null); }}>
                                Try Again
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
