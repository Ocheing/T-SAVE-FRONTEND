import { useEffect, useState, useCallback } from "react";
import {
    Users,
    MapPin,
    TrendingUp,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Wifi,
    WifiOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
    totalUsers: number;
    totalTrips: number;
    totalRevenue: number;
    activeTrips: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalTrips: 0,
        totalRevenue: 0,
        activeTrips: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
    const [recentUsers, setRecentUsers] = useState<{ id: string; email: string; full_name: string; created_at: string }[]>([]);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const [usersRes, tripsRes, transactionsRes, recentUsersRes] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact' }),
                supabase.from('trips').select('id', { count: 'exact' }),
                supabase.from('transactions').select('amount'),
                supabase.from('profiles').select('id, email, full_name, created_at').order('created_at', { ascending: false }).limit(5)
            ]);

            const totalRevenue = (transactionsRes.data as { amount: number }[] | null)?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

            const { count: activeCount } = await supabase
                .from('trips')
                .select('id', { count: 'exact' })
                .eq('status', 'active');

            setStats({
                totalUsers: usersRes.count || 0,
                totalTrips: tripsRes.count || 0,
                totalRevenue: totalRevenue,
                activeTrips: activeCount || 0
            });

            setRecentUsers(recentUsersRes.data || []);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();

        // Subscribe to real-time changes for dashboard updates
        const channel = supabase
            .channel('admin-dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                console.log('[Dashboard Realtime] Profiles changed, refreshing stats...');
                fetchStats();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
                console.log('[Dashboard Realtime] Trips changed, refreshing stats...');
                fetchStats();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
                console.log('[Dashboard Realtime] Transactions changed, refreshing stats...');
                fetchStats();
            })
            .subscribe((status) => {
                console.log('[Dashboard Realtime] Subscription status:', status);
                setIsRealtimeConnected(status === 'SUBSCRIBED');
            });

        return () => {
            console.log('[Dashboard Realtime] Unsubscribing from dashboard channel');
            supabase.removeChannel(channel);
        };
    }, [fetchStats]);

    const statCards = [
        {
            title: "Total Users",
            value: stats.totalUsers,
            icon: Users,
            trend: "+12%",
            trendUp: true,
            color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
        },
        {
            title: "Total Trips",
            value: stats.totalTrips,
            icon: MapPin,
            trend: "+8%",
            trendUp: true,
            color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        },
        {
            title: "Total Revenue",
            value: `KES ${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            trend: "+24%",
            trendUp: true,
            color: "bg-orange-500/10 text-orange-600 dark:text-orange-400"
        },
        {
            title: "Active Savings",
            value: stats.activeTrips,
            icon: TrendingUp,
            trend: "-2%",
            trendUp: false,
            color: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Dashboard Overview</h2>
                    <p className="text-muted-foreground mt-1">Monitor your system performance and user metrics in real-time.</p>
                </div>
                <Badge
                    variant={isRealtimeConnected ? "default" : "destructive"}
                    className={`h-8 px-3 text-sm gap-2 ${isRealtimeConnected ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30' : ''}`}
                >
                    {isRealtimeConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                    {isRealtimeConnected ? 'Live Updates Active' : 'Connecting...'}
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="border-none shadow-md shadow-slate-200/50 dark:shadow-none hover:shadow-lg transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${stat.color}`}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{isLoading ? "---" : stat.value}</div>
                            <div className="flex items-center mt-1">
                                {stat.trendUp ? (
                                    <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                                ) : (
                                    <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
                                )}
                                <p className={`text-xs font-semibold ${stat.trendUp ? "text-emerald-500" : "text-destructive"}`}>
                                    {stat.trend}
                                </p>
                                <span className="text-xs text-muted-foreground ml-2">from last month</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                <Card className="md:col-span-4 border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Platform Activity
                        </CardTitle>
                        <CardDescription>Visualizing user engagement and savings growth.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center bg-accent/20 rounded-lg m-4 border-2 border-dashed border-border">
                        <div className="text-center">
                            <p className="text-muted-foreground font-medium italic">Chart integration coming soon...</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Using React-Query and Chart.js</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3 border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Recent Users
                        </CardTitle>
                        <CardDescription>Recently registered accounts - updates in real-time.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-muted animate-pulse"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                                            <div className="h-3 bg-muted animate-pulse rounded w-32"></div>
                                        </div>
                                    </div>
                                ))
                            ) : recentUsers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>No users registered yet</p>
                                </div>
                            ) : (
                                recentUsers.map((user) => {
                                    const timeAgo = getTimeAgo(new Date(user.created_at));
                                    return (
                                        <div key={user.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-sm text-primary">
                                                {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{user.full_name || 'No Name'}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs shrink-0">{timeAgo}</Badge>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}
