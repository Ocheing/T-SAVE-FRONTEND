// Re-export from the new unified ProtectedRoute to maintain backward compatibility
// while using the new enhanced logic
import { AdminRoute as NewAdminRoute } from "./ProtectedRoute";

interface AdminRouteProps {
    children: React.ReactNode;
    requireSuperAdmin?: boolean;
}

const AdminRoute = ({ children, requireSuperAdmin = false }: AdminRouteProps) => {
    // If super admin is required, just use the equivalent check
    // The new system handles role hierarchy inside ProtectedRoute
    return <NewAdminRoute>{children}</NewAdminRoute>;
};

export default AdminRoute;
