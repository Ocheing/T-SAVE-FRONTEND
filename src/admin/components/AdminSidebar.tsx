import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    MapPin,
    BarChart3,
    Settings,
    LogOut,
    ShieldCheck,
    Plane
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
    { icon: LayoutDashboard, labelKey: "nav.dashboard", href: "/admin/dashboard" },
    { icon: Users, labelKey: "admin.usersManagement", href: "/admin/users" },
    { icon: MapPin, labelKey: "admin.destinationsManagement", href: "/admin/destinations" },
    { icon: BarChart3, labelKey: "admin.analytics", href: "/admin/analytics" },
    { icon: Settings, labelKey: "common.settings", href: "/admin/settings" },
];

export function AdminSidebar() {
    const { signOut, user, adminRole } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/auth');
    };

    return (
        <div className="flex flex-col h-full w-64 bg-card border-r border-border">
            <div className="p-6 flex items-center gap-2">
                <div className="bg-primary p-2 rounded-lg">
                    <Plane className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                    <h1 className="font-bold text-xl tracking-tight">T-SAVE</h1>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('nav.adminPanel')}</p>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 py-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{t(item.labelKey)}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 px-3 py-4 mb-2">
                    <div className="bg-secondary p-2 rounded-full">
                        <ShieldCheck className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold truncate">{user?.email}</span>
                        <span className="text-xs text-muted-foreground capitalize">{adminRole?.replace('_', ' ')}</span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">{t('nav.logout')}</span>
                </button>
            </div>
        </div>
    );
}
