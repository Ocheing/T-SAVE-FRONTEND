import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

/**
 * useAdminAuth - Hook for admin components
 * 
 * Provides:
 * - Admin role information
 * - Automatic redirect for non-admins
 * - Loading state that won't cause flicker
 */
export function useAdminAuth() {
    const { user, profile, adminRole, isAdmin, isSuperAdmin, isLoading, isInitialized, signOut, getRedirectPath } = useAuth();
    const navigate = useNavigate();
    const hasRedirected = useRef(false);

    useEffect(() => {
        // Only redirect after initialization and if not already redirected
        if (isInitialized && !isLoading && !hasRedirected.current) {
            const isAdminRoute = window.location.pathname.startsWith('/admin');

            // If on admin route and not admin, redirect
            if (isAdminRoute && !isAdmin) {
                hasRedirected.current = true;
                const redirectTo = user ? getRedirectPath() : '/auth';
                console.log('[useAdminAuth] Non-admin accessing admin route, redirecting to:', redirectTo);
                navigate(redirectTo, { replace: true });
            }
        }
    }, [isAdmin, isLoading, isInitialized, navigate, user, getRedirectPath]);

    return {
        user,
        profile,
        adminRole,
        isAdmin,
        isSuperAdmin,
        // Only show loading during initial check, not after
        isLoading: !isInitialized,
        signOut
    };
}
