import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Trips from "./pages/Trips";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ChatAssistant from "./pages/ChatAssistant";
import Wishlist from "./pages/Wishlist";
import TripBooking from "./pages/TripBooking";
import PopularDestinations from "./pages/PopularDestinations";
import FeaturedDestinations from "./pages/FeaturedDestinations";
import TravelGoals from "./pages/TravelGoals";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = ({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) => {
  const location = useLocation();
  const hideNavbar = location.pathname === "/auth";
  const isHomePage = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {!hideNavbar && <Navbar onThemeToggle={toggleTheme} isDark={isDark} isHomePage={isHomePage} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/chat" element={<ChatAssistant />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/booking" element={<TripBooking />} />
        <Route path="/booking/:id" element={<TripBooking />} />
        <Route path="/popular-destinations" element={<PopularDestinations />} />
        <Route path="/featured-destinations" element={<FeaturedDestinations />} />
        <Route path="/travel-goals" element={<TravelGoals />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </div>
  );
};

const App = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (theme === "dark" || (!theme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent isDark={isDark} toggleTheme={toggleTheme} />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
