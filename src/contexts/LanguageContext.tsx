import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface Language {
    code: string;
    name: string;
    native: string;
    flag: string;
}

// Comprehensive language list
export const LANGUAGES: Language[] = [
    { code: "en", name: "English", native: "English", flag: "🇬🇧" },
    { code: "sw", name: "Swahili", native: "Kiswahili", flag: "🇰🇪" },
    { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
    { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
    { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
    { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹" },
    { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
    { code: "zh", name: "Chinese", native: "中文", flag: "🇨🇳" },
    { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵" },
    { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷" },
    { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦" },
    { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
    { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺" },
    { code: "tr", name: "Turkish", native: "Türkçe", flag: "🇹🇷" },
    { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
    { code: "pl", name: "Polish", native: "Polski", flag: "🇵🇱" },
];

interface LanguageContextType {
    language: string;
    setLanguage: (code: string) => Promise<void>;
    languages: Language[];
    currentLanguage: Language;
    t: TFunction<'translation', undefined>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { i18n, t } = useTranslation();
    const { user } = useAuth();
    const [language, setLanguageState] = useState(i18n.language || 'en');

    // Load saved language on mount
    useEffect(() => {
        const savedLang = localStorage.getItem('tembea_language');
        if (savedLang && savedLang !== language) {
            i18n.changeLanguage(savedLang);
            setLanguageState(savedLang);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync with user profile language if logged in
    useEffect(() => {
        const loadUserLanguage = async () => {
            if (user) {
                try {
                    const { data } = await supabase
                        .from('profiles')
                        .select('language')
                        .eq('id', user.id)
                        .single();

                    const profileData = data as { language: string | null } | null;
                    if (profileData?.language && profileData.language !== language) {
                        i18n.changeLanguage(profileData.language);
                        setLanguageState(profileData.language);
                        localStorage.setItem('tembea_language', profileData.language);
                    }
                } catch (error) {
                    console.error('Error loading user language:', error);
                }
            }
        };
        loadUserLanguage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const setLanguage = useCallback(async (code: string) => {
        // Instant UI update
        i18n.changeLanguage(code);
        setLanguageState(code);
        localStorage.setItem('tembea_language', code);

        // Persist to database if user is logged in
        if (user) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase.from('profiles') as any)
                    .update({ language: code })
                    .eq('id', user.id);
            } catch (error) {
                console.error('Error saving language preference:', error);
            }
        }
    }, [i18n, user]);

    const currentLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    return (
        <LanguageContext.Provider value={{
            language,
            setLanguage,
            languages: LANGUAGES,
            currentLanguage,
            t
        }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
