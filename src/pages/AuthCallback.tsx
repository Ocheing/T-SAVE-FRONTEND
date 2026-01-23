import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from "@/assets/tembeasave-logo.png";

/**
 * AuthCallback - Handles OAuth redirects (Google, etc.)
 * 
 * After OAuth provider redirects back:
 * 1. Supabase client process the auth tokens (managed by Supabase lib)
 * 2. This component waits for user state to populate
 * 3. Then redirects to the correct app route based on role
 */
export default function AuthCallback() {
    const { user, adminRole, isInitialized, getRedirectPath } = useAuth();
    const navigate = useNavigate();
    const hasRedirected = useRef(false);

    useEffect(() => {
        // Prevent double redirects
        if (hasRedirected.current) return;

        if (isInitialized) {
            // Check if we're still processing OAuth tokens
            const hasAuthHash = window.location.hash.includes('access_token') ||
                window.location.hash.includes('error_description');

            if (!user && hasAuthHash) {
                // Supabase is still processing the tokens
                // Wait for next auth state change
                return;
            }

            if (user) {
                hasRedirected.current = true;

                // Get redirect path
                const redirectTo = getRedirectPath();

                console.log('[AuthCallback] Redirecting to:', redirectTo);
                navigate(redirectTo, { replace: true });
            } else {
                hasRedirected.current = true;
                // No user and no pending auth - redirect to login
                navigate('/auth', { replace: true });
            }
        }
    }, [user, adminRole, isInitialized, getRedirectPath, navigate]);

    // Minimal loading UI - just the logo, no spinners or text
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <img
                src={logo}
                alt="TembeaSave"
                className="h-12 w-auto rounded-lg animate-pulse"
            />
        </div>
    );
}
