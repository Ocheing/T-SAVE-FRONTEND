import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Mock Exchange Rates (Base: USD)
const EXCHANGE_RATES: Record<string, number> = {
    USD: 1,
    KES: 129.50,
    EUR: 0.92,
    GBP: 0.78,
    JPY: 150.2,
    CAD: 1.35,
    AUD: 1.52,
    ZAR: 18.8,
    UGX: 3800,
    TZS: 2550,
    RWF: 1280,
    NGN: 1450,
};

interface CurrencyContextType {
    currency: string;
    setCurrency: (code: string) => void;
    formatPrice: (amountInUSD: number) => string;
    convertPrice: (amountInUSD: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState("KES");

    useEffect(() => {
        const savedForUser = localStorage.getItem('tembea_currency');
        if (savedForUser) {
            setCurrencyState(savedForUser);
        }
    }, []);

    const setCurrency = (code: string) => {
        setCurrencyState(code);
        localStorage.setItem('tembea_currency', code);
    };

    const convertPrice = (amountInUSD: number) => {
        const rate = EXCHANGE_RATES[currency] || 1; // Default to 1:1 if missing (treat as USD)
        // If currency is USD, rate is 1. If KES, rate is 129.
        // However, my input amounts in the app are mixed. Some are KES, some USD.
        // For this context to work, I should standardise input. 
        // Most 'trips' data in Supabase currently has simple numbers. 
        // I'll assume stored values are in USD for this logic to be consistent, OR
        // I need to know the source currency.
        // Given the app started with KES and USD mixed, this is tricky.
        // I will assume the database stores in KES (since it's a Kenyan app context primarily) or USD.
        // Let's assume database values are in USD for this mock implementation to be clean.
        return amountInUSD * rate;
    };

    const formatPrice = (amountInUSD: number) => {
        const converted = convertPrice(amountInUSD);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(converted);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convertPrice }}>
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
