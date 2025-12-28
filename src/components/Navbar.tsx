import { Moon, Sun, Menu, Home, LayoutDashboard, Plane, Heart, User, MessageCircle, LogOut, Globe, ChevronDown, Search, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
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
import logo from "@/assets/tembeasave-logo.png";

interface NavbarProps {
  onThemeToggle: () => void;
  isDark: boolean;
  isHomePage?: boolean;
}

const Navbar = ({ onThemeToggle, isDark, isHomePage = false }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("KES");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock user - in real app, this would come from auth context
  const user = { firstName: "Millicent", lastName: "Wanjiku" };
  const userInitials = `${user.firstName[0]}${user.lastName[0]}`;

  const languageNames: Record<string, string> = {
    en: "EN",
    zh: "ZH",
    ja: "JA",
    sw: "SW",
    fr: "FR",
    de: "DE",
    es: "ES",
    it: "IT",
    ar: "AR",
    am: "AM",
    pt: "PT"
  };

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
            
            {!isHomePage && (
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search trips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 w-64 text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="hidden md:flex">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1">
                  <Globe className="h-3 w-3" />
                  <span>{languageNames[language]}</span>
                  <span className="text-[10px] text-muted-foreground mx-1">|</span>
                  <span>{currency}</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-0">
                <div className="p-1">
                  <div className="px-2 py-1.5">
                    <div 
                      className="text-xs font-medium cursor-pointer hover:text-primary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Language
                    </div>
                  </div>
                  
                  <ScrollArea className="h-48 border-b">
                    <div className="p-1">
                      <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground">
                        ASIA PACIFIC
                      </DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setLanguage("en")} className="text-xs cursor-pointer">
                        English (EN)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLanguage("zh")} className="text-xs cursor-pointer">
                        中文 (ZH)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLanguage("ja")} className="text-xs cursor-pointer">
                        日本語 (JA)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLanguage("sw")} className="text-xs cursor-pointer">
                        Kiswahili (SW)
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground">
                        EUROPE
                      </DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setLanguage("fr")} className="text-xs cursor-pointer">
                        Français (FR)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLanguage("de")} className="text-xs cursor-pointer">
                        Deutsch (DE)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLanguage("es")} className="text-xs cursor-pointer">
                        Español (ES)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLanguage("it")} className="text-xs cursor-pointer">
                        Italiano (IT)
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground">
                        AFRICA & THE MIDDLE EAST
                      </DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setLanguage("ar")} className="text-xs cursor-pointer">
                        العربية (AR)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLanguage("am")} className="text-xs cursor-pointer">
                        አማርኛ (AM)
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground">
                        THE AMERICAS
                      </DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setLanguage("pt")} className="text-xs cursor-pointer">
                        Português (PT)
                      </DropdownMenuItem>
                    </div>
                  </ScrollArea>
                  
                  <div className="px-2 py-1.5 mt-2">
                    <div 
                      className="text-xs font-medium cursor-pointer hover:text-primary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Currency
                    </div>
                  </div>
                  
                  <ScrollArea className="h-48">
                    <div className="p-1">
                      <DropdownMenuItem onClick={() => setCurrency("KES")} className="text-xs cursor-pointer">
                        🇰🇪 Kenyan Shilling (KES)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency("USD")} className="text-xs cursor-pointer">
                        🇺🇸 US Dollar (USD)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency("EUR")} className="text-xs cursor-pointer">
                        🇪🇺 Euro (EUR)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency("GBP")} className="text-xs cursor-pointer">
                        🇬🇧 British Pound (GBP)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency("JPY")} className="text-xs cursor-pointer">
                        🇯🇵 Japanese Yen (JPY)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency("AUD")} className="text-xs cursor-pointer">
                        🇦🇺 Australian Dollar (AUD)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency("CAD")} className="text-xs cursor-pointer">
                        🇨🇦 Canadian Dollar (CAD)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency("CHF")} className="text-xs cursor-pointer">
                        🇨🇭 Swiss Franc (CHF)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency("CNY")} className="text-xs cursor-pointer">
                        🇨🇳 Chinese Yuan (CNY)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency("ZAR")} className="text-xs cursor-pointer">
                        🇿🇦 South African Rand (ZAR)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency("AED")} className="text-xs cursor-pointer">
                        🇦🇪 UAE Dirham (AED)
                      </DropdownMenuItem>
                    </div>
                  </ScrollArea>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onThemeToggle}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-4 w-4" />
            </Button>

            {isHomePage ? (
              <Link to="/auth" className="hidden md:block">
                <Button variant="hero" size="sm">Get Started</Button>
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
                    <div className="font-semibold">{user.firstName} {user.lastName}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/" className="cursor-pointer text-xs">
                      <Home className="h-3 w-3 mr-2" />
                      Home
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer text-xs">
                      <LayoutDashboard className="h-3 w-3 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/trips" className="cursor-pointer text-xs">
                      <Plane className="h-3 w-3 mr-2" />
                      Browse Trips
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wishlist" className="cursor-pointer text-xs">
                      <Heart className="h-3 w-3 mr-2" />
                      My Wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/bookings" className="cursor-pointer text-xs">
                      <Calendar className="h-3 w-3 mr-2" />
                      My Bookings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/chat" className="cursor-pointer text-xs">
                      <MessageCircle className="h-3 w-3 mr-2" />
                      AI Assistant
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer text-xs">
                      <User className="h-3 w-3 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive cursor-pointer text-xs">
                    <LogOut className="h-3 w-3 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden pb-3 animate-fade-in">
            <div className="flex flex-col gap-1">
              <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  <LayoutDashboard className="h-3 w-3 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/trips" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  <Plane className="h-3 w-3 mr-2" />
                  Browse Trips
                </Button>
              </Link>
              <Link to="/wishlist" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  <Heart className="h-3 w-3 mr-2" />
                  Wishlist
                </Button>
              </Link>
              <Link to="/bookings" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  <Calendar className="h-3 w-3 mr-2" />
                  My Bookings
                </Button>
              </Link>
              <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  <User className="h-3 w-3 mr-2" />
                  Profile
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-destructive">
                <LogOut className="h-3 w-3 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
