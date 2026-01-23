import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute, { AdminRoute } from "@/components/ProtectedRoute";
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
import AuthCallback from "./pages/AuthCallback";
import ChatAssistant from "./pages/ChatAssistant";
import Wishlist from "./pages/Wishlist";
import TripBooking from "./pages/TripBooking";
import PopularDestinations from "./pages/PopularDestinations";
import FeaturedDestinations from "./pages/FeaturedDestinations";
import TravelGoals from "./pages/TravelGoals";
import Transactions from "./pages/Transactions";
import NotFound from "./pages/NotFound";

// Admin Imports
import AdminLayout from "./admin/components/AdminLayout";
import AdminDashboard from "./admin/pages/Dashboard";
import UsersManagement from "./admin/pages/Users";
import DestinationsManagement from "./admin/pages/Destinations";
import Analytics from "./admin/pages/Analytics";
import AdminSettings from "./admin/pages/Settings";
import AdminSetup from "./admin/pages/AdminSetup";

// Note: AdminLogin removed - using unified /auth for all users

const queryClient = new QueryClient();

const AppContent = ({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute = location.pathname === "/auth" || location.pathname === "/auth/callback";
  const hideNavbar = isAuthRoute || isAdminRoute;
  const hideFooter = isAdminRoute || isAuthRoute;
  const isHomePage = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {!hideNavbar && <Navbar onThemeToggle={toggleTheme} isDark={isDark} isHomePage={isHomePage} />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/popular-destinations" element={<PopularDestinations />} />
        <Route path="/featured-destinations" element={<FeaturedDestinations />} />

        {/* Auth Routes - Unified login for all users */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Legacy admin login redirects to unified auth */}
        <Route path="/admin/login" element={<Navigate to="/auth" replace />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />

        {/* Protected User Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatAssistant /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/booking" element={<ProtectedRoute><TripBooking /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><TripBooking /></ProtectedRoute>} />
        <Route path="/booking/:id" element={<ProtectedRoute><TripBooking /></ProtectedRoute>} />
        <Route path="/travel-goals" element={<ProtectedRoute><TravelGoals /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />

        {/* Admin Routes - Protected by AdminLayout which checks admin role */}
        <Route path="/admin/setup" element={<AdminRoute><AdminSetup /></AdminRoute>} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="destinations" element={<DestinationsManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Catch-all - 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ReviewDialog />
      {!hideFooter && <Footer />}
    </div>
  );
};

const App = () => {
  // Always use dark theme - no toggle needed
  const [isDark] = useState(true);

  useEffect(() => {
    // Force dark mode on mount
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

  // Theme toggle is kept for potential future use but always returns dark
  const toggleTheme = () => {
    // Dark theme is enforced - no toggle
    document.documentElement.classList.add("dark");
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
