/**
 * PaystackPaymentModal
 * 
 * A beautifully designed payment modal that uses Paystack for secure payments.
 * 
 * Flow:
 * 1. User sees payment summary with amount and goal info
 * 2. User clicks "Pay with Paystack"
 * 3. Payment is initialized via Edge Function (server-side)
 * 4. User is redirected to Paystack's hosted checkout
 * 5. After payment, user returns to /payment/callback for verification
 */

import { useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { usePaystackInitialize } from '@/hooks/usePaystack';
import { formatKES } from '@/lib/paystackService';
import type { PaystackPaymentType } from '@/types/database.types';

interface PaystackPaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    amount: number;
    description: string;
    goalName?: string;
    tripId?: string;
    bookingId?: string;
    paymentType?: PaystackPaymentType;
    onInitiated?: (reference: string) => void;
    onCancel?: () => void;
}

type ModalStep = 'confirm' | 'initializing' | 'error';

export default function PaystackPaymentModal({
    open,
    onOpenChange,
    amount,
    description,
    goalName,
    tripId,
    bookingId,
    paymentType = 'savings_deposit',
    onInitiated,
    onCancel,
}: PaystackPaymentModalProps) {
    const { user, profile } = useAuth();
    const initPayment = usePaystackInitialize();
    const [step, setStep] = useState<ModalStep>('confirm');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const resetModal = useCallback(() => {
        setStep('confirm');
        setErrorMsg(null);
        initPayment.reset();
    }, [initPayment]);

    const handleClose = () => {
        if (step === 'initializing') return; // Don't close while initializing
        resetModal();
        onOpenChange(false);
        onCancel?.();
    };

    const handlePayWithPaystack = async () => {
        if (!user) return;

        setStep('initializing');
        setErrorMsg(null);

        try {
            const result = await initPayment.mutateAsync({
                amount,
                email: user.email || profile?.email || '',
                tripId: tripId || undefined,
                bookingId: bookingId || undefined,
                paymentType,
                description,
                metadata: {
                    goal_name: goalName,
                },
            });

            // Store reference for tracking
            onInitiated?.(result.reference);

            // Redirect to Paystack checkout
            window.location.href = result.authorization_url;

        } catch (error) {
            console.error('[PaystackModal] Init error:', error);
            setErrorMsg(error instanceof Error ? error.message : 'Failed to initialize payment');
            setStep('error');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md" id="paystack-payment-modal">
                {/* Confirm Step */}
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
                                Complete your payment securely via Paystack
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            {/* Amount Display */}
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

                            {/* Payment methods supported */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Accepted Payment Methods
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/50">
                                        <CreditCard className="h-5 w-5 text-blue-500" />
                                        <span className="text-[10px] text-muted-foreground">Card</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/50">
                                        <Building className="h-5 w-5 text-purple-500" />
                                        <span className="text-[10px] text-muted-foreground">Bank</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/50">
                                        <Smartphone className="h-5 w-5 text-green-500" />
                                        <span className="text-[10px] text-muted-foreground">Mobile</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment summary */}
                            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Payment for</span>
                                    <span className="font-medium truncate ml-2 max-w-[200px]">{description}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-mono text-xs">{user?.email}</span>
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

                {/* Initializing Step */}
                {step === 'initializing' && (
                    <div className="py-12 text-center space-y-6">
                        <div className="relative mx-auto w-20 h-20">
                            <div className="absolute inset-0 bg-[#0BA4DB]/20 rounded-full animate-ping" />
                            <div className="relative flex items-center justify-center w-full h-full bg-[#0BA4DB]/10 rounded-full">
                                <Shield className="h-10 w-10 text-[#0BA4DB]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">Preparing Secure Checkout</h3>
                            <p className="text-sm text-muted-foreground">
                                Setting up your payment session with Paystack...
                            </p>
                        </div>
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#0BA4DB]" />
                        <p className="text-xs text-muted-foreground">
                            You'll be redirected to Paystack's secure checkout page
                        </p>
                    </div>
                )}

                {/* Error Step */}
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
                                    Could Not Start Payment
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {errorMsg || 'Something went wrong. Please try again.'}
                                </p>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={() => {
                                resetModal();
                                handlePayWithPaystack();
                            }}>
                                Try Again
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
