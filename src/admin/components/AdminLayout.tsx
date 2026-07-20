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

    // During initialization, render the skeleton to prevent flicker and create a perception of instant load
    if (!isInitialized || isLoading) {
        return <AdminLayoutSkeleton />;
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

function AdminLayoutSkeleton() {
    return (
        <div className="flex h-screen bg-background overflow-hidden animate-in fade-in duration-300">
            {/* Sidebar Skeleton */}
            <div className="flex flex-col h-full w-64 bg-card border-r border-border">
                <div className="p-6 flex items-center gap-2">
                    <div className="bg-primary/20 w-10 h-10 rounded-lg animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                    </div>
                </div>
                <nav className="flex-1 px-4 space-y-3 py-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2">
                            <div className="w-5 h-5 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                        </div>
                    ))}
                </nav>
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 px-3 py-4 mb-2">
                        <div className="w-9 h-9 bg-muted rounded-full animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header Skeleton */}
                <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
                    <div className="h-10 w-64 bg-muted rounded-md animate-pulse" />
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 bg-muted rounded-full animate-pulse" />
                        <div className="h-8 w-px bg-border mx-2" />
                        <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                    </div>
                </header>

                {/* Dashboard Skeleton Area */}
                <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20 p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
                        
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-32 bg-card rounded-xl border border-border animate-pulse" />
                            ))}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <div className="col-span-4 h-[400px] bg-card rounded-xl border border-border animate-pulse" />
                            <div className="col-span-3 h-[400px] bg-card rounded-xl border border-border animate-pulse" />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

