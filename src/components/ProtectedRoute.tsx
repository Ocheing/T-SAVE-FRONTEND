import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    /** Allowed roles for this route. If not specified, any authenticated user is allowed */
    allowedRoles?: UserRole[];
    /** Custom redirect path on failure */
    redirectTo?: string;
}

/**
 * ProtectedRoute - Single SPA Route Guard
 * 
 * Features:
 * - Blocks unauthenticated users → redirects to /auth
 * - Role-based access control
 * - Preserves location state for post-login redirect
 * - Zero-flicker: returns null while initializing
 */
export default function ProtectedRoute({
    children,
    allowedRoles,
    redirectTo
}: ProtectedRouteProps) {
    const { user, adminRole, isLoading, isInitialized, getRedirectPath } = useAuth();
    const location = useLocation();

    // 1. Initialization Check: Render nothing while checking session
    // This prevents the "login screen flash"
    if (!isInitialized || isLoading) {
        return null;
    }

    // 2. Auth Check: If no user, redirect to login
    if (!user) {
        return <Navigate to={redirectTo || "/auth"} state={{ from: location }} replace />;
    }

    // 3. Role Check: If roles are restricted, verify access
    if (allowedRoles && allowedRoles.length > 0) {
        const userRole: UserRole = adminRole === 'super_admin'
            ? 'super_admin'
            : adminRole === 'admin'
                ? 'admin'
                : 'user';

        const hasAccess = allowedRoles.includes(userRole);

        if (!hasAccess) {
            // User is authenticated but doesn't have permission
            // Redirect them to their "home" based on their role
            const properPath = getRedirectPath();

            // Prevent infinite redirect loops if we are already at the target
            if (location.pathname === properPath) {
                return null; // or show "Unauthorized" page
            }

            return <Navigate to={properPath} replace />;
        }
    }

    // 4. Authorized
    return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            {children}
        </ProtectedRoute>
    );
}

export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={['super_admin']}>
            {children}
        </ProtectedRoute>
    );
}

export function UserOnlyRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={['user']}>
            {children}
        </ProtectedRoute>
    );
}
