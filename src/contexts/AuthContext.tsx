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
    signUp: (email: string, password: string, fullName?: string, phone?: string, idNumber?: string) => Promise<{ error: AuthError | null }>;
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

    const fetchUserData = useCallback(async (userId: string) => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        try {
            // Fetch profile and role in parallel for speed
            const [profileData, role] = await Promise.all([
                fetchProfile(userId),
                fetchAdminRole(userId)
            ]);

            setProfile(profileData);
            setAdminRole(role);
            console.log('[AuthContext] User data fetched:', { hasProfile: !!profileData, adminRole: role });
        } catch (error) {
            console.error('[AuthContext] Error fetching user data:', error);
        } finally {
            fetchingRef.current = false;
        }
    }, [fetchProfile, fetchAdminRole]);

    const refreshProfile = useCallback(async () => {
        if (user) {
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
                const session = data?.session;

                if (error) throw error;
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

                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (event === 'SIGNED_OUT') {
                    setProfile(null);
                    setAdminRole(null);
                } else if (newSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                    await fetchUserData(newSession.user.id);
                }

                setIsLoading(false);
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchUserData]);

    const signUp = async (email: string, password: string, fullName?: string, phone?: string, idNumber?: string) => {
        const { error } = await supabase.auth.signUp({
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
        return { error };
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

            // Immediately fetch role for instant redirect decision
            // This is crucial for avoiding flicker - we know where to go BEFORE resolving the promise
            const role = await fetchAdminRole(data.user.id);

            // Update state synchronously
            setAdminRole(role);
            setUser(data.user);
            setSession(data.session);

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
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            // Clear local state
            setUser(null);
            setSession(null);
            setProfile(null);
            setAdminRole(null);
        }
        // Let the UI/ProtectRoute handle the redirect or component unmount
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
