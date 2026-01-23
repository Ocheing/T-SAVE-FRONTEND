import { Outlet, Navigate } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { useAuth } from "@/contexts/AuthContext";

/**
 * AdminLayout - Layout wrapper for all admin routes
 * 
 * Features:
 * - Instant access check with no loading flicker
 * - Redirects non-admins to their appropriate dashboard
 * - Renders nothing during auth initialization to prevent flicker
 */
export default function AdminLayout() {
    const { user, isAdmin, isInitialized, isLoading, getRedirectPath } = useAuth();

    // During initialization, render nothing to prevent flicker
    if (!isInitialized || isLoading) {
        return null;
    }

    // Not authenticated - redirect to login
    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    // Not an admin - redirect to user dashboard
    if (!isAdmin) {
        const userPath = getRedirectPath();
        return <Navigate to={userPath} replace />;
    }

    // User is authenticated and is admin - render admin layout
    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <AdminSidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <AdminHeader />
                <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20 p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
