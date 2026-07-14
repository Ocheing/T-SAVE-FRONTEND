import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse, faGaugeHigh, faPlane, faHeart, faUser, faRobot,
  faArrowRightFromBracket, faGlobe, faChevronDown, faCalendar,
  faReceipt, faLanguage, faMoneyBill, faShieldHalved, faLocationDot, faBars,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from "./ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import ReviewDialog, { shouldPromptForReview } from "@/components/ReviewDialog";
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

// Removed local CURRENCIES and LANGUAGES, now imported from context

interface NavbarProps {
  onThemeToggle: () => void;
  isDark: boolean;
}

import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { LANGUAGES } from "@/contexts/LanguageContext";

const Navbar = ({ onThemeToggle, isDark }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const { t, i18n } = useTranslation();
  const { currency, setCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [pendingLogout, setPendingLogout] = useState(false);

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
    await setCurrency(code); // handles localStorage + DB persistence via CurrencyContext
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

  const doSignOut = async () => {
    setPendingLogout(false);
    try {
      await signOut();
    } finally {
      navigate('/', { replace: true });
    }
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);

    if (!user) {
      await doSignOut();
      return;
    }

    // Check if user should see the review prompt:
    // - Has NOT already submitted a review
    // - Account is old enough (has navigated the platform)
    const shouldPrompt = await shouldPromptForReview(user.id, profile?.created_at);
    if (shouldPrompt) {
      // Show review popup; actual logout happens after user submits/skips (onDone)
      setPendingLogout(true);
      setShowReviewDialog(true);
    } else {
      await doSignOut();
    }
  };

  const selectedLanguage = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];
  const selectedCurrency = CURRENCIES.find(c => c.code === currency);

  return (
    <>
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[hsl(222,47%,7%)] backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={logo}
                alt="TembeaSave Logo"
                className="h-8 w-8 rounded-full object-cover shadow-md shadow-primary/20"
              />
              <span className="font-extrabold text-base tracking-wide text-white">TEMBEASAVE</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/how-it-works">
              <Button variant="ghost" size="sm" className={`text-xs ${isActive('/how-it-works') ? 'text-primary font-semibold bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}>
                How It Works
              </Button>
            </Link>
            <Link to="/destinations">
              <Button variant="ghost" size="sm" className={`text-xs ${isActive('/destinations') ? 'text-primary font-semibold bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}>
                Destinations
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="ghost" size="sm" className={`text-xs ${isActive('/events') ? 'text-primary font-semibold bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}>
                Events
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost" size="sm" className={`text-xs ${isActive('/about') ? 'text-primary font-semibold bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}>
                About
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Language & Currency Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="hidden md:flex">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1">
                  <FontAwesomeIcon icon={faGlobe} className="h-3 w-3" />
                  <span>{selectedLanguage?.flag} {i18n.language.toUpperCase()}</span>
                  <span className="text-[10px] text-muted-foreground mx-1">|</span>
                  <span>{selectedCurrency?.flag} {currency}</span>
                  <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-0">
                <div className="p-2">
                  <DropdownMenuLabel className="text-xs font-semibold flex items-center gap-2">
                    <FontAwesomeIcon icon={faLanguage} className="h-3 w-3 text-primary" /> Select Language
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
                    <FontAwesomeIcon icon={faMoneyBill} className="h-3 w-3 text-primary" /> Select Currency
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
              <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
            </Button>

            {/* CTA Button + User Menu */}
            {user ? (
              <>
                <Link to="/dashboard" className="hidden md:block">
                  <Button variant="hero" size="sm" className="rounded-full px-5 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40">Dashboard</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="hidden md:flex">
                    <Button variant="outline" size="sm" className="h-8 px-2 gap-1">
                      <FontAwesomeIcon icon={faUser} className="h-3 w-3 mr-1" />
                      <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3" />
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
                          <FontAwesomeIcon icon={faShieldHalved} className="h-3 w-3 mr-2" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/" className="cursor-pointer text-xs">
                        <FontAwesomeIcon icon={faHouse} className="h-3 w-3 mr-2" />
                        Home
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer text-xs">
                        <FontAwesomeIcon icon={faGaugeHigh} className="h-3 w-3 mr-2" />
                        {t('nav.dashboard')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/trips" className="cursor-pointer text-xs">
                        <FontAwesomeIcon icon={faPlane} className="h-3 w-3 mr-2" />
                        {t('nav.trips')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist" className="cursor-pointer text-xs">
                        <FontAwesomeIcon icon={faHeart} className="h-3 w-3 mr-2" />
                        {t('nav.wishlist')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/bookings" className="cursor-pointer text-xs">
                        <FontAwesomeIcon icon={faCalendar} className="h-3 w-3 mr-2" />
                        {t('nav.bookings')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/transactions" className="cursor-pointer text-xs">
                        <FontAwesomeIcon icon={faReceipt} className="h-3 w-3 mr-2" />
                        Transactions
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/chat" className="cursor-pointer text-xs">
                        <FontAwesomeIcon icon={faRobot} className="h-3 w-3 mr-2" />
                        {t('nav.chat')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer text-xs">
                        <FontAwesomeIcon icon={faUser} className="h-3 w-3 mr-2" />
                        {t('nav.profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer text-xs">
                      <FontAwesomeIcon icon={faArrowRightFromBracket} className="h-3 w-3 mr-2" />
                      {t('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth" className="hidden md:block">
                <Button variant="hero" size="sm" className="rounded-full px-5 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40">Get Started</Button>
              </Link>
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

              {/* Public Nav Links */}
              <Link to="/how-it-works" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className={`w-full justify-start text-xs ${isActive('/how-it-works') ? 'text-primary font-semibold bg-primary/10' : ''}`}>
                  How It Works
                </Button>
              </Link>
              <Link to="/destinations" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className={`w-full justify-start text-xs ${isActive('/destinations') ? 'text-primary font-semibold bg-primary/10' : ''}`}>
                  <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3 mr-2" />
                  Destinations
                </Button>
              </Link>
              <Link to="/events" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className={`w-full justify-start text-xs ${isActive('/events') ? 'text-primary font-semibold bg-primary/10' : ''}`}>
                  <FontAwesomeIcon icon={faCalendar} className="h-3 w-3 mr-2" />
                  Events
                </Button>
              </Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className={`w-full justify-start text-xs ${isActive('/about') ? 'text-primary font-semibold bg-primary/10' : ''}`}>
                  About
                </Button>
              </Link>

              <div className="border-t border-white/5 my-1" />

              <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className={`w-full justify-start text-xs ${isActive('/dashboard') ? 'text-primary font-semibold bg-primary/10' : ''}`}>
                  <FontAwesomeIcon icon={faGaugeHigh} className="h-3 w-3 mr-2" />
                  {t('nav.dashboard')}
                </Button>
              </Link>
              <Link to="/trips" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className={`w-full justify-start text-xs ${isActive('/trips') ? 'text-primary font-semibold bg-primary/10' : ''}`}>
                  <FontAwesomeIcon icon={faPlane} className="h-3 w-3 mr-2" />
                  {t('nav.trips')}
                </Button>
              </Link>
              <Link to="/wishlist" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className={`w-full justify-start text-xs ${isActive('/wishlist') ? 'text-primary font-semibold bg-primary/10' : ''}`}>
                  <FontAwesomeIcon icon={faHeart} className="h-3 w-3 mr-2" />
                  {t('nav.wishlist')}
                </Button>
              </Link>
              <Link to="/bookings" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className={`w-full justify-start text-xs ${isActive('/bookings') ? 'text-primary font-semibold bg-primary/10' : ''}`}>
                  <FontAwesomeIcon icon={faCalendar} className="h-3 w-3 mr-2" />
                  {t('nav.bookings')}
                </Button>
              </Link>
              <Link to="/chat" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className={`w-full justify-start text-xs ${isActive('/chat') ? 'text-primary font-semibold bg-primary/10' : ''}`}>
                  <FontAwesomeIcon icon={faRobot} className="h-3 w-3 mr-2" />
                  {t('nav.chat')}
                </Button>
              </Link>
              <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className={`w-full justify-start text-xs ${isActive('/profile') ? 'text-primary font-semibold bg-primary/10' : ''}`}>
                  <FontAwesomeIcon icon={faUser} className="h-3 w-3 mr-2" />
                  {t('nav.profile')}
                </Button>
              </Link>
              {user && (
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-destructive" onClick={handleLogout}>
                  <FontAwesomeIcon icon={faArrowRightFromBracket} className="h-3 w-3 mr-2" />
                  {t('nav.logout')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>

      {/* Review Dialog — shown once on first logout, before signing out */}
      <ReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        onDone={() => {
          if (pendingLogout) doSignOut();
        }}
      />
    </>
  );
};

export default Navbar;
