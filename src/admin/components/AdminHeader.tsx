import { Bell, Search, User, LogOut, Settings, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminHeader() {
    const { user, signOut, isSuperAdmin } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate("/auth", { replace: true });
    };

    return (
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
            <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    className="pl-10 bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary"
                    placeholder="Search systems..."
                />
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-card shadow-sm"></span>
                </Button>

                <div className="h-8 w-px bg-border mx-2"></div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden ring-2 ring-transparent peer-focus:ring-2 placeholder:ring-primary hover:ring-2 hover:ring-primary/20 transition-all">
                            <div className="w-full h-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-bold text-lg">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.user_metadata?.full_name || 'Admin User'}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                                <div className="flex items-center mt-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isSuperAdmin
                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                        }`}>
                                        {isSuperAdmin ? 'Super Admin' : 'Admin'}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link to="/" className="cursor-pointer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                <span>Go to App</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link to="/profile" className="cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link to="/admin/settings" className="cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
