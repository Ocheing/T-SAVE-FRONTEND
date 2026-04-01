import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface Currency {
    code: string;
    name: string;
    symbol: string;
    flag: string;
}

// Comprehensive currency list
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

/**
 * Exchange rates relative to KES (the app's base currency).
 * All financial data in the database is stored in KES.
 * To convert: multiply KES amount by the rate for the target currency.
 * 
 * E.g., 1 KES = 0.00772 USD, so USD rate = 0.00772
 *       1 KES = 1 KES, so KES rate = 1
 */
const KES_TO_CURRENCY_RATES: Record<string, number> = {
    KES: 1,
    USD: 0.00772,    // 1 KES ≈ 0.00772 USD (rate: ~129.5 KES/USD)
    EUR: 0.00710,    // 1 KES ≈ 0.00710 EUR
    GBP: 0.00602,    // 1 KES ≈ 0.00602 GBP
    JPY: 1.1599,     // 1 KES ≈ 1.16 JPY
    CAD: 0.01043,    // 1 KES ≈ 0.01043 CAD
    AUD: 0.01174,    // 1 KES ≈ 0.01174 AUD
    CHF: 0.00679,    // 1 KES ≈ 0.00679 CHF
    CNY: 0.05590,    // 1 KES ≈ 0.0559 CNY
    INR: 0.64169,    // 1 KES ≈ 0.642 INR
    ZAR: 0.14517,    // 1 KES ≈ 0.145 ZAR
    AED: 0.02835,    // 1 KES ≈ 0.0284 AED
    SAR: 0.02896,    // 1 KES ≈ 0.029 SAR
    NGN: 11.200,     // 1 KES ≈ 11.2 NGN
    GHS: 0.09652,    // 1 KES ≈ 0.097 GHS
    TZS: 19.691,     // 1 KES ≈ 19.7 TZS
    UGX: 29.344,     // 1 KES ≈ 29.3 UGX
    RWF: 9.884,      // 1 KES ≈ 9.88 RWF
    ETB: 0.43630,    // 1 KES ≈ 0.436 ETB
    EGP: 0.23868,    // 1 KES ≈ 0.239 EGP
    MAD: 0.07801,    // 1 KES ≈ 0.078 MAD
    BRL: 0.03836,    // 1 KES ≈ 0.0384 BRL
    MXN: 0.13244,    // 1 KES ≈ 0.132 MXN
    KRW: 10.193,     // 1 KES ≈ 10.2 KRW
    SGD: 0.01035,    // 1 KES ≈ 0.0103 SGD
    HKD: 0.06037,    // 1 KES ≈ 0.060 HKD
    THB: 0.27412,    // 1 KES ≈ 0.274 THB
    MYR: 0.03645,    // 1 KES ≈ 0.0365 MYR
    IDR: 120.85,     // 1 KES ≈ 120.85 IDR
    PHP: 0.43398,    // 1 KES ≈ 0.434 PHP
    VND: 187.64,     // 1 KES ≈ 187.6 VND
    RUB: 0.70657,    // 1 KES ≈ 0.707 RUB
    TRY: 0.24786,    // 1 KES ≈ 0.248 TRY
    PLN: 0.03072,    // 1 KES ≈ 0.0307 PLN
    SEK: 0.08069,    // 1 KES ≈ 0.0807 SEK
    NOK: 0.08246,    // 1 KES ≈ 0.0825 NOK
    DKK: 0.05298,    // 1 KES ≈ 0.053 DKK
    NZD: 0.01267,    // 1 KES ≈ 0.0127 NZD
    ILS: 0.02865,    // 1 KES ≈ 0.0286 ILS
};

/** Zero-decimal currencies (no cents) */
const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND', 'IDR', 'UGX', 'RWF', 'TZS', 'NGN']);

interface CurrencyContextType {
    currency: string;
    setCurrency: (code: string) => Promise<void>;
    currencies: Currency[];
    currentCurrency: Currency;
    /**
     * Format a KES amount in the user's selected currency.
     * All financial data in the app is stored in KES, so this is the primary format function.
     * Use for: saved_amount, target_amount, transaction amounts, event prices, destination costs, etc.
     */
    formatPrice: (amountInKES: number) => string;
    /**
     * Convert a KES amount to the user's selected currency (returns raw number, no formatting).
     */
    convertPrice: (amountInKES: number) => number;
    /**
     * Alias for formatPrice — both accept KES amounts.
     * Kept for backward compatibility with components that explicitly receive KES values.
     */
    formatPriceFromKES: (amountInKES: number) => string;
    convertFromKES: (amountInKES: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    // Default to KES — the app's base currency
    const [currency, setCurrencyState] = useState("KES");

    // Load saved currency on mount (localStorage → fallback KES)
    useEffect(() => {
        const savedCurrency = localStorage.getItem('tembea_currency');
        if (savedCurrency && KES_TO_CURRENCY_RATES[savedCurrency]) {
            setCurrencyState(savedCurrency);
        }
        // If nothing saved, stay as KES (already the default)
    }, []);

    // Sync with user profile currency when logged in
    useEffect(() => {
        const loadUserCurrency = async () => {
            if (!user) return;
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('currency')
                    .eq('id', user.id)
                    .single();

                const profileData = data as { currency: string | null } | null;
                const profileCurrency = profileData?.currency?.toUpperCase();
                if (profileCurrency && profileCurrency !== currency && KES_TO_CURRENCY_RATES[profileCurrency]) {
                    setCurrencyState(profileCurrency);
                    localStorage.setItem('tembea_currency', profileCurrency);
                }
            } catch (error) {
                console.error('Error loading user currency:', error);
            }
        };
        loadUserCurrency();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const setCurrency = useCallback(async (code: string) => {
        setCurrencyState(code);
        localStorage.setItem('tembea_currency', code);

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

    /**
     * Convert a KES amount to the selected currency.
     * KES is the canonical base currency for all stored values.
     */
    const convertPrice = useCallback((amountInKES: number): number => {
        const rate = KES_TO_CURRENCY_RATES[currency] ?? 1;
        return amountInKES * rate;
    }, [currency]);

    // convertFromKES is the same as convertPrice — alias for clarity
    const convertFromKES = convertPrice;

    /**
     * Format a KES amount in the user's selected display currency.
     * This is the primary formatting function for all monetary values in the app.
     */
    const formatPrice = useCallback((amountInKES: number): string => {
        const converted = convertPrice(amountInKES);
        const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency);
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                maximumFractionDigits: isZeroDecimal ? 0 : 2,
                minimumFractionDigits: 0,
            }).format(converted);
        } catch {
            // Fallback for any currency code not supported by Intl
            const curr = CURRENCIES.find(c => c.code === currency);
            return `${curr?.symbol ?? currency} ${converted.toLocaleString()}`;
        }
    }, [currency, convertPrice]);

    // formatPriceFromKES is an exact alias for formatPrice (same KES-based logic)
    const formatPriceFromKES = formatPrice;

    const currentCurrency = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0];

    return (
        <CurrencyContext.Provider value={{
            currency,
            setCurrency,
            currencies: CURRENCIES,
            currentCurrency,
            formatPrice,
            convertPrice,
            formatPriceFromKES,
            convertFromKES,
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
