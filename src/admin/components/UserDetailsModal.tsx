import { useEffect, useState, useCallback } from "react";
import { X, Mail, Phone, MapPin, Calendar, CreditCard, Plane, Heart, TrendingUp, Clock, User as UserIcon, BadgeCheck, IdCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

interface UserDetailsModalProps {
    userId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

interface UserProfile {
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
    id_number: string;
    created_at: string;
    updated_at: string;
}

interface Trip {
    id: string;
    destination: string;
    target_amount: number;
    saved_amount: number;
    target_date: string;
    status: string;
    category: string;
    created_at: string;
}

interface Transaction {
    id: string;
    type: string;
    amount: number;
    description: string;
    status: string;
    created_at: string;
}

interface WishlistItem {
    id: string;
    destination: string;
    estimated_cost: number;
    category: string;
    created_at: string;
}

export function UserDetailsModal({ userId, isOpen, onClose }: UserDetailsModalProps) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserDetails = useCallback(async () => {
        if (!userId) return;

        setIsLoading(true);

        try {
            // Fetch user profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;
            setUser(profileData);

            // Fetch user's trips
            const { data: tripsData } = await supabase
                .from('trips')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);
            setTrips(tripsData || []);

            // Fetch user's transactions
            const { data: transactionsData } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);
            setTransactions(transactionsData || []);

            // Fetch user's wishlist
            const { data: wishlistData } = await supabase
                .from('wishlist')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);
            setWishlist(wishlistData || []);

        } catch (error) {
            console.error("Error fetching user details:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId && isOpen) {
            fetchUserDetails();
        }
    }, [userId, isOpen, fetchUserDetails]);

    // Subscribe to real-time updates for this specific user
    useEffect(() => {
        if (!userId || !isOpen) return;

        const profileChannel = supabase
            .channel(`user-profile-${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        setUser(payload.new as UserProfile);
                    }
                }
            )
            .subscribe();

        const tripsChannel = supabase
            .channel(`user-trips-${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'trips', filter: `user_id=eq.${userId}` },
                () => {
                    // Refetch trips on any change
                    supabase
                        .from('trips')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false })
                        .limit(10)
                        .then(({ data }) => setTrips(data || []));
                }
            )
            .subscribe();

        const transactionsChannel = supabase
            .channel(`user-transactions-${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
                () => {
                    supabase
                        .from('transactions')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false })
                        .limit(10)
                        .then(({ data }) => setTransactions(data || []));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(profileChannel);
            supabase.removeChannel(tripsChannel);
            supabase.removeChannel(transactionsChannel);
        };
    }, [userId, isOpen]);

    const totalSavings = trips.reduce((sum, trip) => sum + (trip.saved_amount || 0), 0);
    const activeTrips = trips.filter(t => t.status === 'active').length;
    const completedTrips = trips.filter(t => t.status === 'completed').length;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0 border-b border-border/50">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold">User Profile Details</DialogTitle>
                        <Badge variant="outline" className="gap-1.5 py-1 px-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            Live Updates
                        </Badge>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-80px)]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : user ? (
                        <div className="p-6 space-y-6">
                            {/* User Header */}
                            <div className="flex items-start gap-6 p-6 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-border/50">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-primary/20">
                                    {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <h3 className="text-2xl font-bold">{user.full_name || 'No Name Set'}</h3>
                                        <p className="text-muted-foreground">{user.email}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {user.phone && (
                                            <Badge variant="secondary" className="gap-1.5 py-1">
                                                <Phone className="h-3 w-3" />
                                                {user.phone}
                                            </Badge>
                                        )}
                                        {user.location && (
                                            <Badge variant="secondary" className="gap-1.5 py-1">
                                                <MapPin className="h-3 w-3" />
                                                {user.location}
                                            </Badge>
                                        )}
                                        {user.id_number && (
                                            <Badge variant="secondary" className="gap-1.5 py-1">
                                                <IdCard className="h-3 w-3" />
                                                ID: {user.id_number}
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="gap-1.5 py-1">
                                            <Calendar className="h-3 w-3" />
                                            Joined {new Date(user.created_at).toLocaleDateString()}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-transparent">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-500/20">
                                                <TrendingUp className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Savings</p>
                                                <p className="text-xl font-bold">KES {totalSavings.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500/10 to-transparent">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-emerald-500/20">
                                                <Plane className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Active Trips</p>
                                                <p className="text-xl font-bold">{activeTrips}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500/10 to-transparent">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-amber-500/20">
                                                <BadgeCheck className="h-5 w-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Completed</p>
                                                <p className="text-xl font-bold">{completedTrips}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-sm bg-gradient-to-br from-rose-500/10 to-transparent">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-rose-500/20">
                                                <Heart className="h-5 w-5 text-rose-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Wishlist</p>
                                                <p className="text-xl font-bold">{wishlist.length}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Tabbed Content */}
                            <Tabs defaultValue="trips" className="w-full">
                                <TabsList className="w-full grid grid-cols-4 h-12">
                                    <TabsTrigger value="trips" className="gap-2">
                                        <Plane className="h-4 w-4" /> Trips
                                    </TabsTrigger>
                                    <TabsTrigger value="transactions" className="gap-2">
                                        <CreditCard className="h-4 w-4" /> Transactions
                                    </TabsTrigger>
                                    <TabsTrigger value="wishlist" className="gap-2">
                                        <Heart className="h-4 w-4" /> Wishlist
                                    </TabsTrigger>
                                    <TabsTrigger value="settings" className="gap-2">
                                        <UserIcon className="h-4 w-4" /> Settings
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="trips" className="mt-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Savings Goals ({trips.length})</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {trips.length === 0 ? (
                                                <p className="text-center text-muted-foreground py-8">No trips created yet</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {trips.map((trip) => (
                                                        <div key={trip.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg bg-primary/10">
                                                                    <Plane className="h-4 w-4 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium">{trip.destination}</p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Target: {new Date(trip.target_date).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-semibold">
                                                                    KES {trip.saved_amount.toLocaleString()} / {trip.target_amount.toLocaleString()}
                                                                </p>
                                                                <Badge variant={trip.status === 'completed' ? 'default' : trip.status === 'active' ? 'secondary' : 'destructive'}>
                                                                    {trip.status}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="transactions" className="mt-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Recent Transactions ({transactions.length})</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {transactions.length === 0 ? (
                                                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {transactions.map((tx) => (
                                                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-lg ${tx.type === 'deposit' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                                                                    <CreditCard className={`h-4 w-4 ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-amber-600'}`} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium capitalize">{tx.type}</p>
                                                                    <p className="text-sm text-muted-foreground">{tx.description || 'No description'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className={`font-semibold ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                    {tx.type === 'deposit' ? '+' : '-'} KES {tx.amount.toLocaleString()}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {new Date(tx.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="wishlist" className="mt-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Wishlist Items ({wishlist.length})</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {wishlist.length === 0 ? (
                                                <p className="text-center text-muted-foreground py-8">No wishlist items</p>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {wishlist.map((item) => (
                                                        <div key={item.id} className="p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <Heart className="h-5 w-5 text-rose-500" />
                                                                <div>
                                                                    <p className="font-medium">{item.destination}</p>
                                                                    {item.estimated_cost && (
                                                                        <p className="text-sm text-muted-foreground">
                                                                            Est. KES {item.estimated_cost.toLocaleString()}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="settings" className="mt-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">User Preferences</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 rounded-lg bg-muted/30">
                                                    <p className="text-sm text-muted-foreground">Language</p>
                                                    <p className="font-medium uppercase">{user.language || 'en'}</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-muted/30">
                                                    <p className="text-sm text-muted-foreground">Currency</p>
                                                    <p className="font-medium uppercase">{user.currency || 'KES'}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="font-medium">Notification Preferences</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant={user.email_notifications ? 'default' : 'outline'}>
                                                        {user.email_notifications ? '✓' : '✗'} Email Notifications
                                                    </Badge>
                                                    <Badge variant={user.trip_reminders ? 'default' : 'outline'}>
                                                        {user.trip_reminders ? '✓' : '✗'} Trip Reminders
                                                    </Badge>
                                                    <Badge variant={user.savings_milestones ? 'default' : 'outline'}>
                                                        {user.savings_milestones ? '✓' : '✗'} Savings Milestones
                                                    </Badge>
                                                </div>
                                            </div>
                                            {user.travel_preferences && user.travel_preferences.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="font-medium">Travel Preferences</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {user.travel_preferences.map((pref, i) => (
                                                            <Badge key={i} variant="secondary">{pref}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="pt-4 border-t">
                                                <p className="text-sm text-muted-foreground">
                                                    Last updated: {new Date(user.updated_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-20 text-muted-foreground">
                            User not found
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
