import { useEffect, useState } from "react";
import {
    Search,
    UserPlus,
    MoreHorizontal,
    Trash2,
    UserCog,
    Shield,
    SearchX,
    RefreshCcw,
    Mail,
    Smartphone,
    Wifi,
    WifiOff,
    Eye,
    IdCard
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserDetailsModal } from "../components/UserDetailsModal";

interface Profile {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    location: string;
    avatar_url: string;
    language: string;
    currency: string;
    travel_preferences: string[];
    email_notifications: boolean;
    trip_reminders: boolean;
    savings_milestones: boolean;
    created_at: string;
    updated_at: string;
}

export default function UsersManagement() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to fetch users");
        } else {
            setUsers(data || []);
            setFilteredUsers(data || []);
        }
        setIsLoading(false);
    };

    // Initial fetch and real-time subscription
    useEffect(() => {
        fetchUsers();

        // Subscribe to real-time changes on the profiles table
        const channel = supabase
            .channel('admin-profiles-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'profiles'
                },
                (payload) => {
                    console.log('[Realtime] Profile change detected:', payload);

                    if (payload.eventType === 'INSERT') {
                        const newUser = payload.new as Profile;
                        setUsers(prev => [newUser, ...prev]);
                        toast.info(`New user registered: ${newUser.email}`);
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedUser = payload.new as Profile;
                        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                    } else if (payload.eventType === 'DELETE') {
                        const deletedUser = payload.old as Profile;
                        setUsers(prev => prev.filter(u => u.id !== deletedUser.id));
                        toast.info(`User removed: ${deletedUser.email}`);
                    }
                }
            )
            .subscribe((status) => {
                console.log('[Realtime] Subscription status:', status);
                setIsRealtimeConnected(status === 'SUBSCRIBED');
            });

        // Cleanup subscription on unmount
        return () => {
            console.log('[Realtime] Unsubscribing from profiles channel');
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        const filtered = users.filter(user =>
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    const handleDeleteUser = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user? This will remove their profile and all associated data.")) return;

        const { error } = await supabase.from('profiles').delete().eq('id', id);

        if (error) {
            toast.error("Error deleting user: " + error.message);
        } else {
            toast.success("User deleted successfully from profiles catalog.");
            // Real-time will handle the update, no need to refetch
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-bold tracking-tight">Users Management</h2>
                        {/* Real-time Status Indicator */}
                        <Badge
                            variant={isRealtimeConnected ? "default" : "destructive"}
                            className={`h-6 px-2 text-xs gap-1.5 ${isRealtimeConnected ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : ''}`}
                        >
                            {isRealtimeConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                            {isRealtimeConnected ? 'Live' : 'Offline'}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">Manage platform users and their roles. Updates in real-time.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={fetchUsers} disabled={isLoading}>
                        <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button className="gap-2 shadow-lg shadow-primary/20">
                        <UserPlus className="h-4 w-4" />
                        Add New User
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-10 h-10 ring-1 ring-border"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="h-10 px-4 rounded-md flex items-center gap-2 text-sm font-medium">
                                <Shield className="h-4 w-4 text-primary" />
                                {users.length} Total Users
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[250px]">User</TableHead>
                                    <TableHead>Contact Info</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Joined Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 5 }).map((_, j) => (
                                                <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded"></div></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <SearchX className="h-12 w-12 mb-4 opacity-20" />
                                                <p className="text-lg font-medium">No users found</p>
                                                <p className="text-sm">Try adjusting your search or refresh the page.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">
                                                        {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-sm">{user.full_name || 'No Name'}</span>
                                                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">{user.id}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground underline cursor-pointer hover:text-primary">
                                                        <Mail className="h-3 w-3" />
                                                        {user.email}
                                                    </div>
                                                    {user.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Smartphone className="h-3 w-3" />
                                                            {user.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal capitalize">
                                                    {user.location || 'Unknown'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            className="gap-2"
                                                            onClick={() => setSelectedUserId(user.id)}
                                                        >
                                                            <Eye className="h-4 w-4" /> View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-2">
                                                            <UserCog className="h-4 w-4" /> Edit Profile
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-2">
                                                            <Mail className="h-4 w-4" /> Send Email
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                            onClick={() => handleDeleteUser(user.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Delete User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* User Details Modal */}
            <UserDetailsModal
                userId={selectedUserId}
                isOpen={selectedUserId !== null}
                onClose={() => setSelectedUserId(null)}
            />
        </div>
    );
}

