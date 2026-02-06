import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface Currency {
    code: string;
    name: string;
    symbol: string;
    flag: string;
}

// Comprehensive currency list with exchange rates (Base: USD)
export const CURRENCIES: Currency[] = [
    { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪" },
    { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
    { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
    { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
    { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
    { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
    { code: "SAR", name: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦" },
    { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
    { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", flag: "🇬🇭" },
    { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", flag: "🇹🇿" },
    { code: "UGX", name: "Ugandan Shilling", symbol: "USh", flag: "🇺🇬" },
    { code: "RWF", name: "Rwandan Franc", symbol: "FRw", flag: "🇷🇼" },
    { code: "ETB", name: "Ethiopian Birr", symbol: "Br", flag: "🇪🇹" },
    { code: "EGP", name: "Egyptian Pound", symbol: "E£", flag: "🇪🇬" },
    { code: "MAD", name: "Moroccan Dirham", symbol: "MAD", flag: "🇲🇦" },
    { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
    { code: "MXN", name: "Mexican Peso", symbol: "Mex$", flag: "🇲🇽" },
    { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
    { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
    { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
    { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
    { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
    { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
    { code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳" },
    { code: "RUB", name: "Russian Ruble", symbol: "₽", flag: "🇷🇺" },
    { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
    { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱" },
    { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },
    { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴" },
    { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰" },
    { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
    { code: "ILS", name: "Israeli Shekel", symbol: "₪", flag: "🇮🇱" },
];

// Exchange rates relative to USD (approximations)
const EXCHANGE_RATES: Record<string, number> = {
    USD: 1,
    KES: 129.50,
    EUR: 0.92,
    GBP: 0.78,
    JPY: 150.2,
    CAD: 1.35,
    AUD: 1.52,
    CHF: 0.88,
    CNY: 7.24,
    INR: 83.12,
    ZAR: 18.8,
    AED: 3.67,
    SAR: 3.75,
    NGN: 1450,
    GHS: 12.5,
    TZS: 2550,
    UGX: 3800,
    RWF: 1280,
    ETB: 56.5,
    EGP: 30.9,
    MAD: 10.1,
    BRL: 4.97,
    MXN: 17.15,
    KRW: 1320,
    SGD: 1.34,
    HKD: 7.82,
    THB: 35.5,
    MYR: 4.72,
    IDR: 15650,
    PHP: 56.2,
    VND: 24300,
    RUB: 91.5,
    TRY: 32.1,
    PLN: 3.98,
    SEK: 10.45,
    NOK: 10.68,
    DKK: 6.86,
    NZD: 1.64,
    ILS: 3.71,
};

interface CurrencyContextType {
    currency: string;
    setCurrency: (code: string) => Promise<void>;
    currencies: Currency[];
    currentCurrency: Currency;
    formatPrice: (amountInUSD: number) => string;
    convertPrice: (amountInUSD: number) => number;
    formatPriceFromKES: (amountInKES: number) => string;
    convertFromKES: (amountInKES: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [currency, setCurrencyState] = useState("KES");

    // Load saved currency on mount
    useEffect(() => {
        const savedCurrency = localStorage.getItem('tembea_currency');
        if (savedCurrency) {
            setCurrencyState(savedCurrency);
        }
    }, []);

    // Sync with user profile currency if logged in
    useEffect(() => {
        const loadUserCurrency = async () => {
            if (user) {
                try {
                    const { data } = await supabase
                        .from('profiles')
                        .select('currency')
                        .eq('id', user.id)
                        .single();

                    const profileData = data as { currency: string | null } | null;
                    if (profileData?.currency && profileData.currency !== currency) {
                        setCurrencyState(profileData.currency.toUpperCase());
                        localStorage.setItem('tembea_currency', profileData.currency.toUpperCase());
                    }
                } catch (error) {
                    console.error('Error loading user currency:', error);
                }
            }
        };
        loadUserCurrency();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const setCurrency = useCallback(async (code: string) => {
        // Instant UI update
        setCurrencyState(code);
        localStorage.setItem('tembea_currency', code);

        // Persist to database if user is logged in
        if (user) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase.from('profiles') as any)
                    .update({ currency: code })
                    .eq('id', user.id);
            } catch (error) {
                console.error('Error saving currency preference:', error);
            }
        }
    }, [user]);

    // Convert from USD to selected currency
    const convertPrice = useCallback((amountInUSD: number): number => {
        const rate = EXCHANGE_RATES[currency] || 1;
        return amountInUSD * rate;
    }, [currency]);

    // Format price from USD
    const formatPrice = useCallback((amountInUSD: number): string => {
        const converted = convertPrice(amountInUSD);
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                maximumFractionDigits: currency === 'JPY' || currency === 'KRW' || currency === 'VND' ? 0 : 2,
                minimumFractionDigits: 0
            }).format(converted);
        } catch {
            // Fallback for unsupported currencies
            const curr = CURRENCIES.find(c => c.code === currency);
            return `${curr?.symbol || currency} ${converted.toLocaleString()}`;
        }
    }, [currency, convertPrice]);

    // Convert from KES to selected currency (many prices in app are in KES)
    const convertFromKES = useCallback((amountInKES: number): number => {
        // First convert KES to USD, then to target currency
        const kesRate = EXCHANGE_RATES['KES'] || 129.50;
        const amountInUSD = amountInKES / kesRate;
        return convertPrice(amountInUSD);
    }, [convertPrice]);

    // Format price from KES
    const formatPriceFromKES = useCallback((amountInKES: number): string => {
        // If target is KES, just format directly
        if (currency === 'KES') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'KES',
                maximumFractionDigits: 0
            }).format(amountInKES);
        }

        const converted = convertFromKES(amountInKES);
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                maximumFractionDigits: currency === 'JPY' || currency === 'KRW' || currency === 'VND' ? 0 : 2,
                minimumFractionDigits: 0
            }).format(converted);
        } catch {
            const curr = CURRENCIES.find(c => c.code === currency);
            return `${curr?.symbol || currency} ${converted.toLocaleString()}`;
        }
    }, [currency, convertFromKES]);

    const currentCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

    return (
        <CurrencyContext.Provider value={{
            currency,
            setCurrency,
            currencies: CURRENCIES,
            currentCurrency,
            formatPrice,
            convertPrice,
            formatPriceFromKES,
            convertFromKES
        }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
