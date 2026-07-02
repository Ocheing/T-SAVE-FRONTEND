import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, AdminRole } from '@/types/database.types';

// Role-based redirect targets
export type UserRole = 'user' | 'admin' | 'super_admin';

export interface SignInResult {
    error: AuthError | null;
    role: UserRole;
    redirectTo: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    adminRole: AdminRole | null;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    signUp: (email: string, password: string, fullName?: string, phone?: string, idNumber?: string) => Promise<{ error: AuthError | null; user: User | null; session: Session | null }>;
    signIn: (email: string, password: string) => Promise<SignInResult>;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    getRedirectPath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Determines the redirect path based on user role
 */
function getRedirectPathForRole(role: AdminRole | null): string {
    if (role === 'super_admin') return '/admin';
    if (role === 'admin') return '/admin';
    // Mapping requested '/user' concept to the actual '/dashboard' route
    return '/dashboard';
}

/**
 * Determines the UserRole from AdminRole
 */
function getRoleType(adminRole: AdminRole | null): UserRole {
    if (adminRole === 'super_admin') return 'super_admin';
    if (adminRole === 'admin') return 'admin';
    return 'user';
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Use ref to prevent race conditions
    const fetchingRef = useRef(false);
    // Tracks whether signIn() already fetched user data so onAuthStateChange SIGNED_IN skips re-fetching
    const manualSignInRef = useRef(false);

    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('[AuthContext] Error fetching profile:', error);
                return null;
            }
            return data;
        } catch (error) {
            console.error('[AuthContext] Error fetching profile:', error);
            return null;
        }
    }, []);

    const fetchAdminRole = useCallback(async (userId: string): Promise<AdminRole | null> => {
        try {
            const { data, error } = await supabase
                .from('admin_users')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error('[AuthContext] Error fetching admin role:', error);
                return null;
            }
            if (!data) return null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (data as any).role ?? null;
        } catch (error: unknown) {
            console.error('[AuthContext] Error fetching admin role:', error);
            return null;
        }
    }, []);

    const fetchUserData = useCallback(async (userId: string, force = false) => {
        // Prevent concurrent fetches unless forced
        if (fetchingRef.current && !force) return;
        fetchingRef.current = true;

        try {
            // Fetch profile and role sequentially to prevent Web Lock timeouts
            const profileData = await fetchProfile(userId);
            const role = await fetchAdminRole(userId);

            setProfile(profileData);
            setAdminRole(role);
            console.log('[AuthContext] User data fetched:', { hasProfile: !!profileData, adminRole: role });
        } catch (error) {
            console.error('[AuthContext] Error fetching user data:', error);
            // Always reset the ref - even on error - so future fetches aren't permanently blocked
            fetchingRef.current = false;
            return;
        }
        // Reset outside catch so it reliably runs after await
        fetchingRef.current = false;
    }, [fetchProfile, fetchAdminRole]);

    const refreshProfile = useCallback(async () => {
        if (user) {
            // Force refresh: reset the guard so it always runs
            fetchingRef.current = false;
            await fetchUserData(user.id);
        }
    }, [user, fetchUserData]);

    /**
     * Get the appropriate redirect path for the current user
     */
    const getRedirectPath = useCallback((): string => {
        return getRedirectPathForRole(adminRole);
    }, [adminRole]);

    // Initialize auth state
    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // Check session from cookies/storage
                const { data, error } = await supabase.auth.getSession();
                let session = data?.session;

                if (error) {
                    console.warn('[AuthContext] Session error, attempting recovery:', error);
                    try {
                        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                        if (refreshError) throw refreshError;
                        session = refreshData?.session ?? null;
                    } catch (e) {
                         console.error('[AuthContext] Session recovery failed:', e);
                         session = null;
                         // We don't throw here, we just start as unauthenticated gracefully
                    }
                }

                if (!mounted) return;

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchUserData(session.user.id);
                }

                setIsLoading(false);
                setIsInitialized(true);
            } catch (err) {
                // Ignore AbortError as it's common during development with Strict Mode and cleanup
                if (err instanceof Error && err.name === 'AbortError') {
                    console.log('[AuthContext] Auth initialization aborted (harmless during dev/cleanup)');
                } else {
                    console.error('[AuthContext] Failed to initialize auth:', err);
                }

                if (mounted) {
                    setIsLoading(false);
                    setIsInitialized(true);
                }
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (!mounted) return;

                if (event === 'SIGNED_OUT') {
                    // Clear everything immediately on sign out
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setAdminRole(null);
                    fetchingRef.current = false; // Unblock any pending fetches
                } else {
                    setSession(newSession);
                    setUser(newSession?.user ?? null);

                    if (newSession?.user && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                        if (event === 'SIGNED_IN' && manualSignInRef.current) {
                            // signIn() already fetched profile+role — skip the redundant re-fetch
                            manualSignInRef.current = false;
                        } else {
                            // Normal auth change (e.g., Google OAuth callback, token refresh, initial session)
                            await fetchUserData(newSession.user.id, true);
                        }
                    }
                }

                setIsLoading(false);
            }
        );

        return () => {
            mounted = false;
            fetchingRef.current = false; // Reset on unmount so remount works cleanly
            subscription.unsubscribe();
        };
    }, [fetchUserData]);

    const signUp = async (email: string, password: string, fullName?: string, phone?: string, idNumber?: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    phone: phone,
                    id_number: idNumber,
                },
            },
        });

        if (!error && data?.user && data?.session) {
            // Auto-login succeeded (email confirmation disabled or auto-confirm enabled)
            // Immediately set session + user so the profile is available without refresh
            setSession(data.session);
            setUser(data.user);

            // The DB trigger handle_new_user() has already created the profile row.
            // Fetch it now so the profile state is populated immediately.
            const profileData = await fetchProfile(data.user.id);
            const role = await fetchAdminRole(data.user.id);
            setProfile(profileData);
            setAdminRole(role);

            // Signal that we already populated user data
            manualSignInRef.current = true;
        }

        return { error, user: data?.user ?? null, session: data?.session ?? null };
    };

    /**
     * Sign in with email/password
     * Returns role and redirect path immediately for instant navigation
     */
    const signIn = async (email: string, password: string): Promise<SignInResult> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { error, role: 'user', redirectTo: '/auth' };
            }

            if (!data || !data.user) {
                return { error: null, role: 'user', redirectTo: '/auth' };
            }

            // Set session first so all subsequent Supabase calls use the fresh JWT
            setSession(data.session);
            setUser(data.user);

            // Fetch profile and role sequentially to prevent Web Lock timeouts
            const profileData = await fetchProfile(data.user.id);
            const role = await fetchAdminRole(data.user.id);

            // Update all state at once so the dashboard has everything on first render
            setProfile(profileData);
            setAdminRole(role);
            // Signal that signIn() already fully populated user data
            // so onAuthStateChange SIGNED_IN does not re-fetch unnecessarily
            manualSignInRef.current = true;

            // Determine redirect path based on role
            const redirectTo = getRedirectPathForRole(role);
            const userRole = getRoleType(role);

            return { error: null, role: userRole, redirectTo };
        } catch (err) {
            console.error('[AuthContext] Sign in error:', err);
            return { error: err as AuthError, role: 'user', redirectTo: '/auth' };
        }
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        return { error };
    };

    const signOut = async () => {
        try {
            // Tell Supabase to invalidate the server session BEFORE clearing local state.
            // If we clear local state first, the app re-renders instantly, dropping protected routes,
            // which fires all sort of unmounts (e.g. Realtime channel.unsubscribe), stealing the lock!
            await supabase.auth.signOut();
        } catch (error) {
            // Non-fatal: local state will still be cleared in finally block
            console.error('[AuthContext] Error calling supabase.auth.signOut():', error);
        } finally {
            // Clear local state so UI updates
            setUser(null);
            setSession(null);
            setProfile(null);
            setAdminRole(null);
            fetchingRef.current = false;
        }
    };

    const value = {
        user,
        session,
        profile,
        adminRole,
        isAdmin: adminRole !== null,
        isSuperAdmin: adminRole === 'super_admin',
        isLoading,
        isInitialized,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
        getRedirectPath,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
