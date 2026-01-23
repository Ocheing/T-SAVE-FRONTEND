import { Moon, Sun, Menu, Home, LayoutDashboard, Plane, Heart, User, MessageCircle, LogOut, Globe, ChevronDown, Search, Calendar, Bot, Receipt, Languages, Banknote, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/tembeasave-logo.png";

// Comprehensive currency list
const CURRENCIES = [
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
  { code: "ARS", name: "Argentine Peso", symbol: "AR$", flag: "🇦🇷" },
  { code: "COP", name: "Colombian Peso", symbol: "COL$", flag: "🇨🇴" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨", flag: "🇵🇰" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", flag: "🇷🇺" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪", flag: "🇮🇱" },
];

// Comprehensive language list
const LANGUAGES = [
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
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇧🇩" },
  { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺" },
  { code: "tr", name: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polish", native: "Polski", flag: "🇵🇱" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "Thai", native: "ไทย", flag: "🇹🇭" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "am", name: "Amharic", native: "አማርኛ", flag: "🇪🇹" },
  { code: "ha", name: "Hausa", native: "Hausa", flag: "🇳🇬" },
  { code: "yo", name: "Yoruba", native: "Yorùbá", flag: "🇳🇬" },
  { code: "zu", name: "Zulu", native: "isiZulu", flag: "🇿🇦" },
  { code: "af", name: "Afrikaans", native: "Afrikaans", flag: "🇿🇦" },
  { code: "he", name: "Hebrew", native: "עברית", flag: "🇮🇱" },
  { code: "fa", name: "Persian", native: "فارسی", flag: "🇮🇷" },
  { code: "ur", name: "Urdu", native: "اردو", flag: "🇵🇰" },
  { code: "uk", name: "Ukrainian", native: "Українська", flag: "🇺🇦" },
  { code: "el", name: "Greek", native: "Ελληνικά", flag: "🇬🇷" },
  { code: "sv", name: "Swedish", native: "Svenska", flag: "🇸🇪" },
  { code: "no", name: "Norwegian", native: "Norsk", flag: "🇳🇴" },
  { code: "da", name: "Danish", native: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Finnish", native: "Suomi", flag: "🇫🇮" },
];

interface NavbarProps {
  onThemeToggle: () => void;
  isDark: boolean;
  isHomePage?: boolean;
}

import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";

import { supabase } from "@/lib/supabase";

const Navbar = ({ onThemeToggle, isDark, isHomePage = false }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { currency, setCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load preferences from profile or localStorage
  useEffect(() => {
    if (profile?.language) {
      i18n.changeLanguage(profile.language);
    }
    if (profile?.currency) {
      setCurrency(profile.currency.toUpperCase());
    } else if (!profile) {
      // Check localStorage for non-logged-in users
      const savedLang = localStorage.getItem('tembea_language');
      const savedCurr = localStorage.getItem('tembea_currency');
      if (savedLang) i18n.changeLanguage(savedLang);
      if (savedCurr) setCurrency(savedCurr);
    }
  }, [profile, i18n, setCurrency]);

  const handleLanguageChange = async (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('tembea_language', code);

    if (user) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('profiles') as any).update({ language: code }).eq('id', user.id);
      } catch (error) {
        console.error('Error updating language preference:', error);
      }
    }

    const langName = LANGUAGES.find(l => l.code === code)?.name || code;
    toast({
      title: "Language Updated",
      description: `Language set to ${langName}`,
    });
  };

  const handleCurrencyChange = async (code: string) => {
    setCurrency(code);
    localStorage.setItem('tembea_currency', code);

    if (user) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('profiles') as any).update({ currency: code }).eq('id', user.id);
      } catch (error) {
        console.error('Error updating currency preference:', error);
      }
    }

    const currName = CURRENCIES.find(c => c.code === code)?.name || code;
    toast({
      title: "Currency Updated",
      description: `Currency set to ${currName} (${code})`,
    });
  };

  // Get user display name from profile or fallback to email
  const getUserDisplayName = () => {
    if (profile?.full_name) {
      const names = profile.full_name.split(' ');
      return { firstName: names[0] || 'User', lastName: names[1] || '' };
    }
    return { firstName: user?.email?.split('@')[0] || 'User', lastName: '' };
  };

  const displayUser = getUserDisplayName();
  const userInitials = displayUser.lastName
    ? `${displayUser.firstName[0]}${displayUser.lastName[0]}`.toUpperCase()
    : displayUser.firstName.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  const selectedLanguage = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];
  const selectedCurrency = CURRENCIES.find(c => c.code === currency);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center">
              <img
                src={logo}
                alt="TembeaSave Logo"
                className="h-8 w-auto rounded-lg"
              />
              <span className="font-bold text-lg tracking-tight">TEMBEASAVE</span>
            </Link>


          </div>

          <div className="flex items-center gap-2">
            {/* Language & Currency Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="hidden md:flex">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1">
                  <Globe className="h-3 w-3" />
                  <span>{selectedLanguage?.flag} {i18n.language.toUpperCase()}</span>
                  <span className="text-[10px] text-muted-foreground mx-1">|</span>
                  <span>{selectedCurrency?.flag} {currency}</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-0">
                <div className="p-2">
                  <DropdownMenuLabel className="text-xs font-semibold flex items-center gap-2">
                    <Languages className="h-3 w-3 text-primary" /> Select Language
                  </DropdownMenuLabel>
                  <ScrollArea className="h-[200px]">
                    <div className="grid grid-cols-2 gap-1 p-1">
                      {LANGUAGES.map((lang) => (
                        <DropdownMenuItem
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`text-xs cursor-pointer ${i18n.language === lang.code ? 'bg-primary/10' : ''}`}
                        >
                          <span className="mr-2">{lang.flag}</span>
                          <span>{lang.native}</span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </ScrollArea>

                  <DropdownMenuSeparator className="my-2" />

                  <DropdownMenuLabel className="text-xs font-semibold flex items-center gap-2">
                    <Banknote className="h-3 w-3 text-primary" /> Select Currency
                  </DropdownMenuLabel>
                  <ScrollArea className="h-[200px]">
                    <div className="grid grid-cols-2 gap-1 p-1">
                      {CURRENCIES.map((curr) => (
                        <DropdownMenuItem
                          key={curr.code}
                          onClick={() => handleCurrencyChange(curr.code)}
                          className={`text-xs cursor-pointer ${currency === curr.code ? 'bg-primary/10' : ''}`}
                        >
                          <span className="mr-2">{curr.flag}</span>
                          <span>{curr.code}</span>
                          <span className="text-muted-foreground ml-1">({curr.symbol})</span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle Removed - Enforced Dark Mode */}
            {/* <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onThemeToggle}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button> */}

            <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-4 w-4" />
            </Button>

            {isHomePage || !user ? (
              <Link to="/auth" className="hidden md:block">
                <Button variant="hero" size="sm">{user ? 'Dashboard' : 'Get Started'}</Button>
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="hidden md:flex">
                  <Button variant="outline" size="sm" className="h-8 px-2 gap-1">
                    <span className="text-xs font-semibold">{userInitials}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">
                    <div className="font-normal text-muted-foreground">Signed in as</div>
                    <div className="font-semibold">{displayUser.firstName} {displayUser.lastName}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin/dashboard" className="cursor-pointer text-xs font-semibold text-primary">
                        <ShieldCheck className="h-3 w-3 mr-2" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/" className="cursor-pointer text-xs">
                      <Home className="h-3 w-3 mr-2" />
                      Home
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer text-xs">
                      <LayoutDashboard className="h-3 w-3 mr-2" />
                      {t('nav.dashboard')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/trips" className="cursor-pointer text-xs">
                      <Plane className="h-3 w-3 mr-2" />
                      {t('nav.trips')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wishlist" className="cursor-pointer text-xs">
                      <Heart className="h-3 w-3 mr-2" />
                      {t('nav.wishlist')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/bookings" className="cursor-pointer text-xs">
                      <Calendar className="h-3 w-3 mr-2" />
                      {t('nav.bookings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/transactions" className="cursor-pointer text-xs">
                      <Receipt className="h-3 w-3 mr-2" />
                      Transactions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/chat" className="cursor-pointer text-xs">
                      <Bot className="h-3 w-3 mr-2" />
                      {t('nav.chat')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer text-xs">
                      <User className="h-3 w-3 mr-2" />
                      {t('nav.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer text-xs">
                    <LogOut className="h-3 w-3 mr-2" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden pb-3 animate-fade-in">
            <div className="flex flex-col gap-1">
              {/* Mobile Language/Currency Selector */}
              <div className="flex gap-2 px-2 py-2 border-b mb-2">
                <select
                  value={i18n.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="flex-1 text-xs bg-background border rounded px-2 py-1"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.native}
                    </option>
                  ))}
                </select>
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="flex-1 text-xs bg-background border rounded px-2 py-1"
                >
                  {CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.flag} {curr.code}
                    </option>
                  ))}
                </select>
              </div>

              <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  <LayoutDashboard className="h-3 w-3 mr-2" />
                  {t('nav.dashboard')}
                </Button>
              </Link>
              <Link to="/trips" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  <Plane className="h-3 w-3 mr-2" />
                  {t('nav.trips')}
                </Button>
              </Link>
              <Link to="/wishlist" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  <Heart className="h-3 w-3 mr-2" />
                  {t('nav.wishlist')}
                </Button>
              </Link>
              <Link to="/bookings" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  <Calendar className="h-3 w-3 mr-2" />
                  {t('nav.bookings')}
                </Button>
              </Link>
              <Link to="/chat" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  <Bot className="h-3 w-3 mr-2" />
                  {t('nav.chat')}
                </Button>
              </Link>
              <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  <User className="h-3 w-3 mr-2" />
                  {t('nav.profile')}
                </Button>
              </Link>
              {user && (
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-destructive" onClick={handleLogout}>
                  <LogOut className="h-3 w-3 mr-2" />
                  {t('nav.logout')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav >
  );
};

export default Navbar;
