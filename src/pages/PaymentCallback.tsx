/**
 * Payment Callback Page
 * 
 * This page handles the redirect from Paystack after payment.
 * It extracts the reference from URL params and verifies the payment
 * server-side via the Edge Function.
 * 
 * URL: /payment/callback?reference=TSAVE_xxx&trxref=xxx
 */

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, RefreshCw, CreditCard, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePaystackVerify } from '@/hooks/usePaystack';
import { formatKES, getChannelLabel } from '@/lib/paystackService';

export default function PaymentCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const verify = usePaystackVerify();
    const [hasVerified, setHasVerified] = useState(false);
    const verifyAttemptedRef = useRef(false);

    const reference = searchParams.get('reference') || searchParams.get('trxref');

    useEffect(() => {
        if (reference && !verifyAttemptedRef.current) {
            verifyAttemptedRef.current = true;
            verify.mutate(reference, {
                onSettled: () => {
                    setHasVerified(true);
                },
            });
        }
    }, [reference]); // eslint-disable-line react-hooks/exhaustive-deps

    // No reference in URL
    if (!reference) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 dark:bg-background">
                <Card className="max-w-md w-full p-8 text-center space-y-4">
                    <XCircle className="h-16 w-16 mx-auto text-red-500" />
                    <h1 className="text-xl font-bold">Invalid Payment Link</h1>
                    <p className="text-sm text-muted-foreground">
                        No payment reference was found. This link may be invalid or expired.
                    </p>
                    <Button onClick={() => navigate('/travel-goals')} className="w-full">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Go to My Goals
                    </Button>
                </Card>
            </div>
        );
    }

    // Verifying...
    if (verify.isPending || !hasVerified) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 dark:bg-background">
                <Card className="max-w-md w-full p-8 text-center space-y-6">
                    <div className="relative mx-auto w-20 h-20">
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                        <div className="relative flex items-center justify-center w-full h-full bg-primary/10 rounded-full">
                            <Shield className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-xl font-bold">Verifying Payment</h1>
                        <p className="text-sm text-muted-foreground">
                            Please wait while we securely verify your payment with Paystack...
                        </p>
                    </div>
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <p className="text-xs text-muted-foreground">
                        Reference: <code className="font-mono">{reference}</code>
                    </p>
                </Card>
            </div>
        );
    }

    // Payment verified successfully
    if (verify.isSuccess && verify.data) {
        const isSuccess = verify.data.status === 'success';

        return (
            <div className="min-h-screen flex items-center justify-center p-4 dark:bg-background">
                <Card className="max-w-md w-full p-8 text-center space-y-6 animate-fade-in">
                    {isSuccess ? (
                        <>
                            <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    Payment Successful! 🎉
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Your payment has been verified and your savings have been updated.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mx-auto w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                                <XCircle className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                    Payment {verify.data.status === 'pending' ? 'Processing' : 'Not Completed'}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {verify.data.status === 'pending'
                                        ? 'Your payment is still being processed. It will be updated shortly.'
                                        : 'The payment was not completed. Please try again.'}
                                </p>
                            </div>
                        </>
                    )}

                    {/* Payment details */}
                    <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Amount</span>
                            <span className="font-bold text-lg">{formatKES(verify.data.amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Reference</span>
                            <code className="font-mono text-xs">{verify.data.reference}</code>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-muted-foreground">Status</span>
                            <Badge
                                variant={isSuccess ? 'default' : 'secondary'}
                                className={isSuccess ? 'bg-green-500 text-white' : ''}
                            >
                                {verify.data.status}
                            </Badge>
                        </div>
                        {verify.data.channel && (
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-muted-foreground">Method</span>
                                <span className="flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" />
                                    {getChannelLabel(verify.data.channel)}
                                    {verify.data.card_last4 && ` •••• ${verify.data.card_last4}`}
                                </span>
                            </div>
                        )}
                        {verify.data.paid_at && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Date</span>
                                <span>{new Date(verify.data.paid_at).toLocaleString()}</span>
                            </div>
                        )}
                        {verify.data.already_verified && (
                            <p className="text-xs text-muted-foreground italic">
                                ℹ️ This payment was already verified previously.
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate('/transactions')}
                        >
                            View Transactions
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => navigate('/travel-goals')}
                        >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            My Goals
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // Verification failed
    return (
        <div className="min-h-screen flex items-center justify-center p-4 dark:bg-background">
            <Card className="max-w-md w-full p-8 text-center space-y-6 animate-fade-in">
                <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
                        Verification Failed
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {verify.error instanceof Error
                            ? verify.error.message
                            : 'We could not verify your payment. Please try again or contact support.'}
                    </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-left">
                    <p className="text-xs text-muted-foreground">
                        Reference: <code className="font-mono">{reference}</code>
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                            verifyAttemptedRef.current = false;
                            setHasVerified(false);
                            verify.reset();
                            verify.mutate(reference, {
                                onSettled: () => setHasVerified(true),
                            });
                        }}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={() => navigate('/travel-goals')}
                    >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        My Goals
                    </Button>
                </div>
            </Card>
        </div>
    );
}
