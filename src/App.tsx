import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ReviewDialog from "./components/ReviewDialog";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import QuizPage from "./pages/QuizPage";
import Trips from "./pages/Trips";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ChatAssistant from "./pages/ChatAssistant";
import Wishlist from "./pages/Wishlist";
import TripBooking from "./pages/TripBooking";
import PopularDestinations from "./pages/PopularDestinations";
import FeaturedDestinations from "./pages/FeaturedDestinations";
import TravelGoals from "./pages/TravelGoals";
import Transactions from "./pages/Transactions";
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
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/chat" element={<ProtectedRoute><ChatAssistant /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/booking" element={<ProtectedRoute><TripBooking /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><TripBooking /></ProtectedRoute>} />
        <Route path="/booking/:id" element={<ProtectedRoute><TripBooking /></ProtectedRoute>} />
        <Route path="/popular-destinations" element={<PopularDestinations />} />
        <Route path="/featured-destinations" element={<FeaturedDestinations />} />
        <Route path="/travel-goals" element={<ProtectedRoute><TravelGoals /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ReviewDialog />
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
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CurrencyProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AppContent isDark={isDark} toggleTheme={toggleTheme} />
            </BrowserRouter>
          </CurrencyProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
