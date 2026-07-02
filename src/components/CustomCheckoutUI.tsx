import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatKES } from '@/lib/paystackService';
import {
    Smartphone,
    CreditCard,
    Building2,
    Shield,
    FileText,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    Lock,
} from 'lucide-react';

export interface CustomCheckoutProps {
    amount: number;
    goalName?: string;
    onClose: () => void;
    onPay: (method: string, details: Record<string, string>) => void;
    isProcessing?: boolean;
}

type PaymentMethod = 'mpesa' | 'mpesa_till' | 'airtel' | 'card';

// Custom Signal Icon for Airtel
function SignalIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 20h.01" />
            <path d="M7 20v-4" />
            <path d="M12 20v-8" />
            <path d="M17 20V8" />
            <path d="M22 4v16" />
        </svg>
    )
}

export default function CustomCheckoutUI({
    amount,
    goalName = "Savings Goal",
    onClose,
    onPay,
    isProcessing = false
}: CustomCheckoutProps) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mpesa');
    const [phoneNumber, setPhoneNumber] = useState('0710000000');
    const [isSimulating, setIsSimulating] = useState(false);
    const [success, setSuccess] = useState(false);

    // Methods available in the sidebar
    const methods = [
        { id: 'mpesa', label: 'M-PESA', icon: Smartphone, color: 'text-green-500', activeBg: 'bg-green-500/10' },
        { id: 'mpesa_till', label: 'M-PESA Till', icon: FileText, color: 'text-green-600', activeBg: 'bg-green-600/10' },
        { id: 'airtel', label: 'Airtel Money', icon: SignalIcon, color: 'text-red-500', activeBg: 'bg-red-500/10' },
        { id: 'card', label: 'Card', icon: CreditCard, color: 'text-blue-500', activeBg: 'bg-blue-500/10' },
    ];

    const handlePaymentSubmit = () => {
        setIsSimulating(true);
        // Simulate a delay to show the beautiful loader
        setTimeout(() => {
            setIsSimulating(false);
            setSuccess(true);
            setTimeout(() => {
                onPay(selectedMethod, { phone: phoneNumber });
            }, 1000);
        }, 2000);
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-500 animate-in bounce-in duration-700 delay-200" />
                </div>
                <h2 className="text-2xl font-bold text-green-500">Payment Initiated!</h2>
                <p className="text-sm text-muted-foreground text-center">Checking your phone for the M-PESA prompt...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden flex shadow-2xl border border-border/50 bg-background/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
            
            {/* Sidebar: Payment Methods */}
            <div className="w-64 bg-muted/30 border-r border-border/40 flex flex-col pt-6 pb-4">
                <div className="px-6 mb-6">
                    <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                        Pay With
                    </p>
                </div>
                
                <div className="flex-1 px-3 space-y-1">
                    {methods.map((m) => {
                        const Icon = m.icon;
                        const isActive = selectedMethod === m.id;
                        return (
                            <button
                                key={m.id}
                                onClick={() => setSelectedMethod(m.id as PaymentMethod)}
                                className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                    isActive
                                        ? `bg-background shadow-sm border border-border/50 ${m.color.replace('text', 'text')}` 
                                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                            >
                                <Icon className={`h-4 w-4 mr-3 ${isActive ? m.color : 'opacity-70'}`} />
                                {m.label}
                                {isActive && (
                                    <div className={`ml-auto w-1.5 h-1.5 rounded-full ${m.color.replace('text-', 'bg-')}`} />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-auto px-6 pt-8">
                    <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50" onClick={onClose}>
                        <ArrowLeft className="h-3 w-3 mr-2" />
                        Cancel Payment
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8 flex flex-col relative bg-card/50">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2.5 py-0.5 text-[9px] tracking-widest font-bold">
                                TEST
                            </Badge>
                        </div>
                        <h2 className="text-sm font-medium text-muted-foreground">
                            Savings for <span className="font-bold text-foreground text-base truncate block max-w-[250px]">{goalName}</span>
                        </h2>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">Total to Pay</p>
                        <p className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent tracking-tight">
                            {formatKES(amount)}
                        </p>
                    </div>
                </div>

                {/* Dynamic Payment Details Area */}
                <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full mb-8">
                    
                    {/* Illustration Icon */}
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-primary/20 blur-[32px] rounded-full scale-150" />
                        <div className="relative w-20 h-20 bg-gradient-to-br from-background to-muted rounded-2xl border border-primary/20 shadow-2xl flex items-center justify-center text-primary transform transition-all duration-500 hover:scale-110 hover:rotate-3">
                            {selectedMethod === 'mpesa' ? <Smartphone className="h-10 w-10" /> :
                             selectedMethod === 'card' ? <CreditCard className="h-10 w-10" /> :
                             <Building2 className="h-10 w-10" />}
                        </div>
                    </div>

                    <p className="text-center text-sm font-medium text-foreground mb-6 max-w-xs">
                        {selectedMethod === 'mpesa' || selectedMethod === 'mpesa_till'
                            ? "Please enter your mobile money number to begin this payment"
                            : selectedMethod === 'card'
                            ? "Enter your card details to securely complete your payment"
                            : "Follow the prompt on your device to complete payment"}
                    </p>

                    {/* Dynamic Input Form */}
                    <div className="w-full space-y-5">
                        {(selectedMethod === 'mpesa' || selectedMethod === 'mpesa_till' || selectedMethod === 'airtel') && (
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pr-3 border-r border-border/50">
                                    <span className="text-sm font-medium mr-1.5 opacity-90">🇰🇪</span>
                                </div>
                                <Input 
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="pl-14 py-6 text-xl tracking-wider font-semibold bg-background/80 backdrop-blur-sm border-border/50 focus-visible:ring-primary/40 focus-visible:border-primary shadow-inner"
                                    placeholder="0710 000 000"
                                />
                            </div>
                        )}

                        {selectedMethod === 'card' && (
                            <div className="p-4 border border-border/50 bg-background/50 rounded-xl flex items-center justify-center text-muted-foreground text-sm h-[68px] shadow-inner">
                                Card interface goes here
                            </div>
                        )}

                        <Button 
                            className="w-full h-14 text-[15px] font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 rounded-xl relative overflow-hidden group"
                            onClick={handlePaymentSubmit}
                            disabled={isSimulating || isProcessing}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                            <span className="relative flex items-center justify-center">
                                {isSimulating || isProcessing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    `Pay ${formatKES(amount)}`
                                )}
                            </span>
                        </Button>

                        {(selectedMethod === 'mpesa' || selectedMethod === 'mpesa_till') && (
                            <div className="text-center pt-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1.5">Prefer a different method?</p>
                                <button className="text-[11px] text-primary hover:text-primary/80 font-bold tracking-wide uppercase underline decoration-primary/30 underline-offset-4 transition-colors">
                                    Switch to M-PESA Paybill
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Security Badge */}
                <div className="mt-auto flex items-center justify-center pt-5 border-t border-border/40">
                    <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-default bg-muted/40 px-3 py-1.5 rounded-full">
                        <Shield className="h-3 w-3 text-green-500" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                            Secured by <span className="text-foreground">Paystack</span>
                        </span>
                        <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                    </div>
                </div>
            </div>
        </div>
    );
}
