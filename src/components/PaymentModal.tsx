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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import {
    Loader2,
    Smartphone,
    CreditCard,
    Building,
    CheckCircle2,
    AlertCircle,
    Phone,
    Lock,
    Info,
    ArrowRight,
} from 'lucide-react';
import {
    processPayment,
    calculateFee,
    validateKenyanPhone,
    formatKES,
    KENYAN_BANKS,
    type PaymentProvider,
    type PaymentResponse,
} from '@/lib/paymentService';

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    amount: number;
    description: string;
    goalName?: string;
    onSuccess: (response: PaymentResponse, amountPaid: number) => void;
    onCancel?: () => void;
}

type PaymentStep = 'select' | 'details' | 'processing' | 'result';

export default function PaymentModal({
    open,
    onOpenChange,
    amount,
    description,
    goalName,
    onSuccess,
    onCancel,
}: PaymentModalProps) {
    const [step, setStep] = useState<PaymentStep>('select');
    const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('mpesa');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null);

    // M-Pesa form state
    const [mpesaPhone, setMpesaPhone] = useState('');

    // Card form state  
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardName, setCardName] = useState('');

    // Bank form state
    const [bankCode, setBankCode] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');

    const { fee, total } = calculateFee(selectedProvider, amount);

    const resetForm = useCallback(() => {
        setStep('select');
        setSelectedProvider('mpesa');
        setError(null);
        setPaymentResponse(null);
        setMpesaPhone('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setCardName('');
        setBankCode('');
        setAccountNumber('');
        setAccountName('');
        setIsProcessing(false);
    }, []);

    const handleClose = () => {
        if (step === 'processing') return; // Prevent closing during processing
        resetForm();
        onOpenChange(false);
        onCancel?.();
    };

    const handleProviderSelect = (provider: PaymentProvider) => {
        setSelectedProvider(provider);
        setError(null);
    };

    const handleProceedToDetails = () => {
        setStep('details');
    };

    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(' ').substring(0, 19) : '';
    };

    const formatExpiry = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
        }
        return cleaned;
    };

    const handleProcessPayment = async () => {
        setError(null);
        setIsProcessing(true);
        setStep('processing');

        try {
            let response: PaymentResponse;

            switch (selectedProvider) {
                case 'mpesa': {
                    const phoneValidation = validateKenyanPhone(mpesaPhone);
                    if (!phoneValidation.valid) {
                        throw new Error('Please enter a valid Kenyan phone number (e.g., 0712345678)');
                    }
                    response = await processPayment(
                        {
                            provider: 'mpesa',
                            amount: total,
                            currency: 'KES',
                            reference: `GOAL-${Date.now()}`,
                            description,
                        },
                        { phoneNumber: mpesaPhone }
                    );
                    break;
                }

                case 'card': {
                    const [expMonth, expYear] = cardExpiry.split('/');
                    response = await processPayment(
                        {
                            provider: 'card',
                            amount: total,
                            currency: 'KES',
                            reference: `GOAL-${Date.now()}`,
                            description,
                        },
                        {
                            cardNumber,
                            expiryMonth: expMonth,
                            expiryYear: expYear,
                            cvv: cardCvv,
                            cardholderName: cardName,
                        }
                    );
                    break;
                }

                case 'bank':
                    response = await processPayment(
                        {
                            provider: 'bank',
                            amount: total,
                            currency: 'KES',
                            reference: `GOAL-${Date.now()}`,
                            description,
                        },
                        {
                            bankCode,
                            accountNumber,
                            accountName,
                        }
                    );
                    break;

                default:
                    throw new Error('Invalid payment method');
            }

            setPaymentResponse(response);
            setStep('result');

            if (response.success) {
                // For M-Pesa and Bank, status might be pending
                // For cards, it's typically completed immediately
                if (response.status === 'completed' || response.status === 'pending') {
                    onSuccess(response, amount);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
            setStep('details');
        } finally {
            setIsProcessing(false);
        }
    };

    const renderProviderIcon = (provider: PaymentProvider, size = 'h-6 w-6') => {
        switch (provider) {
            case 'mpesa':
                return <Smartphone className={size} />;
            case 'card':
                return <CreditCard className={size} />;
            case 'bank':
                return <Building className={size} />;
        }
    };

    const renderSelectStep = () => (
        <div className="space-y-4">
            <div className="text-center py-2">
                <div className="text-3xl font-bold text-primary">{formatKES(amount)}</div>
                {goalName && (
                    <p className="text-sm text-muted-foreground mt-1">
                        For: {goalName}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium">Select Payment Method</Label>
                <div className="grid gap-3">
                    {([
                        { id: 'mpesa', name: 'M-Pesa', desc: 'Pay instantly via M-Pesa', color: 'bg-green-500' },
                        { id: 'card', name: 'Card', desc: 'Visa, Mastercard accepted', color: 'bg-blue-500' },
                        { id: 'bank', name: 'Bank Transfer', desc: 'Direct bank payment', color: 'bg-purple-500' },
                    ] as const).map((method) => (
                        <Card
                            key={method.id}
                            className={`p-4 cursor-pointer transition-all border-2 ${selectedProvider === method.id
                                ? 'border-primary bg-primary/5'
                                : 'border-transparent hover:border-primary/30'
                                }`}
                            onClick={() => handleProviderSelect(method.id)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${method.color} text-white`}>
                                    {renderProviderIcon(method.id)}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold">{method.name}</div>
                                    <div className="text-xs text-muted-foreground">{method.desc}</div>
                                </div>
                                {selectedProvider === method.id && (
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span>{formatKES(amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span>{formatKES(fee)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">{formatKES(total)}</span>
                </div>
            </div>
        </div>
    );

    const renderDetailsStep = () => (
        <div className="space-y-4">
            <Tabs value={selectedProvider} onValueChange={(v) => setSelectedProvider(v as PaymentProvider)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="mpesa" className="text-xs">
                        <Smartphone className="h-4 w-4 mr-1" />
                        M-Pesa
                    </TabsTrigger>
                    <TabsTrigger value="card" className="text-xs">
                        <CreditCard className="h-4 w-4 mr-1" />
                        Card
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="text-xs">
                        <Building className="h-4 w-4 mr-1" />
                        Bank
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="mpesa" className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="mpesa-phone" className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            M-Pesa Phone Number
                        </Label>
                        <Input
                            id="mpesa-phone"
                            type="tel"
                            placeholder="0712 345 678"
                            value={mpesaPhone}
                            onChange={(e) => setMpesaPhone(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            You'll receive an STK push to enter your M-Pesa PIN
                        </p>
                    </div>
                </TabsContent>

                <TabsContent value="card" className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="card-name">Cardholder Name</Label>
                        <Input
                            id="card-name"
                            placeholder="John Doe"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="card-number" className="flex items-center gap-2">
                            <CreditCard className="h-3 w-3" />
                            Card Number
                        </Label>
                        <Input
                            id="card-number"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            maxLength={19}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="card-expiry">Expiry</Label>
                            <Input
                                id="card-expiry"
                                placeholder="MM/YY"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                maxLength={5}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="card-cvv" className="flex items-center gap-2">
                                <Lock className="h-3 w-3" />
                                CVV
                            </Label>
                            <Input
                                id="card-cvv"
                                type="password"
                                placeholder="123"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                                maxLength={4}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="bank" className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="bank-select">Select Bank</Label>
                        <Select value={bankCode} onValueChange={setBankCode}>
                            <SelectTrigger id="bank-select">
                                <SelectValue placeholder="Choose your bank" />
                            </SelectTrigger>
                            <SelectContent>
                                {KENYAN_BANKS.map((bank) => (
                                    <SelectItem key={bank.code} value={bank.code}>
                                        {bank.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="account-number">Account Number</Label>
                        <Input
                            id="account-number"
                            placeholder="Enter account number"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="account-name">Account Name</Label>
                        <Input
                            id="account-name"
                            placeholder="Enter account holder name"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                        />
                    </div>
                </TabsContent>
            </Tabs>

            {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex justify-between font-bold">
                    <span>Total to Pay</span>
                    <span className="text-primary">{formatKES(total)}</span>
                </div>
            </div>
        </div>
    );

    const renderProcessingStep = () => (
        <div className="py-12 text-center space-y-4">
            <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div className="relative flex items-center justify-center w-full h-full bg-primary/10 rounded-full">
                    {renderProviderIcon(selectedProvider, 'h-10 w-10 text-primary')}
                </div>
            </div>
            <div className="space-y-1">
                <h3 className="text-lg font-semibold">Processing Payment...</h3>
                <p className="text-sm text-muted-foreground">
                    {selectedProvider === 'mpesa' && 'Check your phone for M-Pesa prompt'}
                    {selectedProvider === 'card' && 'Processing your card payment'}
                    {selectedProvider === 'bank' && 'Initiating bank transfer'}
                </p>
            </div>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
    );

    const renderResultStep = () => (
        <div className="py-8 text-center space-y-4">
            {paymentResponse?.success ? (
                <>
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-green-600">
                            {paymentResponse.status === 'completed' ? 'Payment Successful!' : 'Payment Initiated!'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {paymentResponse.message}
                        </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-left space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Amount</span>
                            <span className="font-medium">{formatKES(amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Transaction ID</span>
                            <span className="font-mono text-xs">{paymentResponse.transactionId}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant={paymentResponse.status === 'completed' ? 'default' : 'secondary'}>
                                {paymentResponse.status}
                            </Badge>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-red-600">Payment Failed</h3>
                        <p className="text-sm text-muted-foreground">
                            {paymentResponse?.message || 'Something went wrong. Please try again.'}
                        </p>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step === 'select' && (
                            <>
                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                </div>
                                Make Payment
                            </>
                        )}
                        {step === 'details' && (
                            <>
                                {renderProviderIcon(selectedProvider, 'h-5 w-5')}
                                {selectedProvider === 'mpesa' && 'M-Pesa Payment'}
                                {selectedProvider === 'card' && 'Card Payment'}
                                {selectedProvider === 'bank' && 'Bank Transfer'}
                            </>
                        )}
                        {step === 'processing' && 'Processing...'}
                        {step === 'result' && (paymentResponse?.success ? 'Payment Complete' : 'Payment Failed')}
                    </DialogTitle>
                    {step === 'select' && (
                        <DialogDescription>
                            Choose your preferred payment method to add funds
                        </DialogDescription>
                    )}
                </DialogHeader>

                {step === 'select' && renderSelectStep()}
                {step === 'details' && renderDetailsStep()}
                {step === 'processing' && renderProcessingStep()}
                {step === 'result' && renderResultStep()}

                <DialogFooter className="gap-2">
                    {step === 'select' && (
                        <>
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleProceedToDetails}>
                                Continue
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </>
                    )}
                    {step === 'details' && (
                        <>
                            <Button variant="outline" onClick={() => setStep('select')}>
                                Back
                            </Button>
                            <Button onClick={handleProcessPayment} disabled={isProcessing}>
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Pay {formatKES(total)}
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                    {step === 'result' && (
                        <Button
                            onClick={handleClose}
                            variant={paymentResponse?.success ? 'default' : 'outline'}
                            className="w-full"
                        >
                            {paymentResponse?.success ? 'Done' : 'Try Again'}
                        </Button>
                    )}
                </DialogFooter>

                {(step === 'select' || step === 'details') && (
                    <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        <span>Secured by T-Save</span>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
