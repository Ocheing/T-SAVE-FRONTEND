import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect, Suspense, lazy } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute, { AdminRoute } from "@/components/ProtectedRoute";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Eager load critical pages
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";

// Lazy load other pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const Trips = lazy(() => import("./pages/Trips"));
const Profile = lazy(() => import("./pages/Profile"));
const ChatAssistant = lazy(() => import("./pages/ChatAssistant"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const TripBooking = lazy(() => import("./pages/TripBooking"));
const PopularDestinations = lazy(() => import("./pages/PopularDestinations"));
const FeaturedDestinations = lazy(() => import("./pages/FeaturedDestinations"));
const TravelGoals = lazy(() => import("./pages/TravelGoals"));
const Transactions = lazy(() => import("./pages/Transactions"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ReviewDialog = lazy(() => import("./components/ReviewDialog"));

// Admin Imports - Lazy loaded
const AdminLayout = lazy(() => import("./admin/components/AdminLayout"));
const AdminDashboard = lazy(() => import("./admin/pages/Dashboard"));
const UsersManagement = lazy(() => import("./admin/pages/Users"));
const DestinationsManagement = lazy(() => import("./admin/pages/Destinations"));
const Analytics = lazy(() => import("./admin/pages/Analytics"));
const AdminSettings = lazy(() => import("./admin/pages/Settings"));
const AdminSetup = lazy(() => import("./admin/pages/AdminSetup"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
      <Suspense fallback={null}>
        <ReviewDialog />
      </Suspense>
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
