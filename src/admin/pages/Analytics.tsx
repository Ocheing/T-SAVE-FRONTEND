import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    BarChart3, TrendingUp, Users, MapPin, DollarSign, PieChart,
    LineChart, Download, RefreshCw, Calendar, Target, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPie,
    Pie,
    Cell,
    LineChart as RechartsLine,
    Line,
    Legend,
    Area,
    AreaChart
} from "recharts";
import type { Trip, Transaction } from "@/types/database.types";

interface AnalyticsData {
    totalUsers: number;
    totalTrips: number;
    totalSavings: number;
    totalTransactions: number;
    userGrowth: { month: string; users: number }[];
    savingsGrowth: { month: string; amount: number }[];
    categoryDistribution: { name: string; value: number; color: string }[];
    topDestinations: { name: string; count: number; savings: number }[];
    conversionRate: number;
    avgSavingsPerUser: number;
    activeGoals: number;
    completedGoals: number;
}

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function Analytics() {
    const { t } = useTranslation();
    const { formatPrice } = useCurrency();
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [data, setData] = useState<AnalyticsData>({
        totalUsers: 0,
        totalTrips: 0,
        totalSavings: 0,
        totalTransactions: 0,
        userGrowth: [],
        savingsGrowth: [],
        categoryDistribution: [],
        topDestinations: [],
        conversionRate: 0,
        avgSavingsPerUser: 0,
        activeGoals: 0,
        completedGoals: 0
    });

    const fetchAnalytics = useCallback(async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            // Fetch all data in parallel
            const [
                usersRes,
                tripsRes,
                transactionsRes,
                destinationsRes
            ] = await Promise.all([
                supabase.from('profiles').select('id, created_at'),
                supabase.from('trips').select('id, destination, category, target_amount, saved_amount, status, created_at'),
                supabase.from('transactions').select('id, amount, type, created_at').eq('status', 'completed'),
                supabase.from('destinations').select('id, name, categories')
            ]);

            const users = usersRes.data || [];
            const trips = (tripsRes.data || []) as Trip[];
            const transactions = (transactionsRes.data || []) as Transaction[];


            // Calculate totals
            const totalUsers = users.length;
            const totalTrips = trips.length;
            const totalSavings = trips.reduce((acc, t) => acc + (Number(t.saved_amount) || 0), 0);
            const totalTransactions = transactions.length;

            // User growth by month (last 6 months)
            const userGrowth = getMonthlyGrowth(users, 'created_at', 6);

            // Savings growth by month
            const savingsGrowth = getMonthlySavings(transactions, 6);

            // Category distribution
            const categoryMap = new Map<string, number>();
            trips.forEach(trip => {
                const cat = trip.category || 'other';
                categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
            });
            const categoryDistribution = Array.from(categoryMap.entries()).map(([name, value], i) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value,
                color: CHART_COLORS[i % CHART_COLORS.length]
            }));

            // Top destinations by savings
            const destMap = new Map<string, { count: number; savings: number }>();
            trips.forEach(trip => {
                const dest = trip.destination || 'Unknown';
                const existing = destMap.get(dest) || { count: 0, savings: 0 };
                destMap.set(dest, {
                    count: existing.count + 1,
                    savings: existing.savings + (Number(trip.saved_amount) || 0)
                });
            });
            const topDestinations = Array.from(destMap.entries())
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.savings - a.savings)
                .slice(0, 5);

            // Calculate metrics
            const activeGoals = trips.filter(t => t.status === 'active').length;
            const completedGoals = trips.filter(t => t.status === 'completed').length;
            const conversionRate = totalTrips > 0 ? (completedGoals / totalTrips) * 100 : 0;
            const avgSavingsPerUser = totalUsers > 0 ? totalSavings / totalUsers : 0;

            setData({
                totalUsers,
                totalTrips,
                totalSavings,
                totalTransactions,
                userGrowth,
                savingsGrowth,
                categoryDistribution,
                topDestinations,
                conversionRate,
                avgSavingsPerUser,
                activeGoals,
                completedGoals
            });
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const exportToCSV = () => {
        const csvContent = [
            ['Metric', 'Value'],
            ['Total Users', data.totalUsers],
            ['Total Trips', data.totalTrips],
            ['Total Savings', data.totalSavings],
            ['Total Transactions', data.totalTransactions],
            ['Conversion Rate', `${data.conversionRate.toFixed(1)}%`],
            ['Avg Savings Per User', data.avgSavingsPerUser],
            ['Active Goals', data.activeGoals],
            ['Completed Goals', data.completedGoals],
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    const summaryCards = [
        {
            title: t('analytics.userGrowth'),
            value: data.totalUsers,
            icon: Users,
            change: "+12%",
            color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
        },
        {
            title: t('analytics.savingsGrowth'),
            value: formatPrice(data.totalSavings / 129.5), // Convert from KES to USD for display
            icon: DollarSign,
            change: "+24%",
            color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        },
        {
            title: t('analytics.conversionRate'),
            value: `${data.conversionRate.toFixed(1)}%`,
            icon: Target,
            change: "+5%",
            color: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
        },
        {
            title: t('analytics.avgSavingsPerUser'),
            value: formatPrice(data.avgSavingsPerUser / 129.5),
            icon: TrendingUp,
            change: "+18%",
            color: "bg-orange-500/10 text-orange-600 dark:text-orange-400"
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('analytics.title')}</h2>
                    <p className="text-muted-foreground mt-1">{t('analytics.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => fetchAnalytics(true)}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button className="gap-2" onClick={exportToCSV}>
                        <Download className="w-4 h-4" />
                        {t('admin.exportData')} (CSV)
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {summaryCards.map((card) => (
                    <Card key={card.title} className="border-none shadow-md hover:shadow-lg transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${card.color}`}>
                                <card.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                            <Badge variant="secondary" className="mt-1 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                {card.change} this month
                            </Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* User Growth Chart */}
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            {t('analytics.userGrowth')}
                        </CardTitle>
                        <CardDescription>Monthly user registrations over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {data.userGrowth.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.userGrowth}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="month" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="users"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorUsers)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                {t('analytics.noDataYet')}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Savings Growth Chart */}
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            {t('analytics.savingsGrowth')}
                        </CardTitle>
                        <CardDescription>Monthly savings deposits over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {data.savingsGrowth.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.savingsGrowth}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="month" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                        formatter={(value: number) => [formatPrice(value / 129.5), 'Amount']}
                                    />
                                    <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                {t('analytics.noDataYet')}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Second Row */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Category Distribution */}
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-primary" />
                            {t('analytics.strategicDistribution')}
                        </CardTitle>
                        <CardDescription>Goals by category</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {data.categoryDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie
                                        data={data.categoryDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {data.categoryDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RechartsPie>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                {t('analytics.noDataYet')}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Destinations */}
                <Card className="md:col-span-2 border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            {t('analytics.topDestinations')}
                        </CardTitle>
                        <CardDescription>Most popular savings destinations by amount</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.topDestinations.length > 0 ? (
                            <div className="space-y-4">
                                {data.topDestinations.map((dest, index) => (
                                    <div key={dest.name} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-medium truncate">{dest.name}</p>
                                                <span className="text-sm font-bold text-primary">
                                                    {formatPrice(dest.savings / 129.5)}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min((dest.savings / (data.topDestinations[0]?.savings || 1)) * 100, 100)}%`
                                                    }}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{dest.count} goals</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                {t('analytics.noDataYet')}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Goals Overview */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Goals Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-500/10 rounded-lg">
                                <p className="text-sm text-muted-foreground">Active Goals</p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{data.activeGoals}</p>
                            </div>
                            <div className="p-4 bg-emerald-500/10 rounded-lg">
                                <p className="text-sm text-muted-foreground">Completed Goals</p>
                                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{data.completedGoals}</p>
                            </div>
                            <div className="p-4 bg-purple-500/10 rounded-lg">
                                <p className="text-sm text-muted-foreground">Total Transactions</p>
                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{data.totalTransactions}</p>
                            </div>
                            <div className="p-4 bg-orange-500/10 rounded-lg">
                                <p className="text-sm text-muted-foreground">Total Trips</p>
                                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{data.totalTrips}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            {t('analytics.monthlyTrends')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px]">
                        {data.userGrowth.length > 0 && data.savingsGrowth.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsLine data={mergeGrowthData(data.userGrowth, data.savingsGrowth)}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="month" className="text-xs" />
                                    <YAxis yAxisId="left" className="text-xs" />
                                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                                    <Line yAxisId="right" type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                                </RechartsLine>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                {t('analytics.noDataYet')}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Helper functions
interface DateRecord {
    created_at?: string;
    [key: string]: unknown;
}

interface TransactionRecord {
    id: string;
    amount: number;
    type: string;
    created_at: string;
}

function getMonthlyGrowth(data: DateRecord[], dateField: keyof DateRecord, months: number) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result: { month: string; users: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const count = data.filter(item => {
            const fieldValue = item[dateField];
            if (typeof fieldValue !== 'string') return false;
            const itemDate = new Date(fieldValue);
            return itemDate.getFullYear() === date.getFullYear() &&
                itemDate.getMonth() === date.getMonth();
        }).length;

        result.push({ month: monthNames[date.getMonth()], users: count });
    }

    return result;
}

function getMonthlySavings(transactions: TransactionRecord[], months: number) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result: { month: string; amount: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const amount = transactions
            .filter(t => {
                const tDate = new Date(t.created_at);
                return tDate.getFullYear() === date.getFullYear() &&
                    tDate.getMonth() === date.getMonth() &&
                    t.type === 'deposit';
            })
            .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

        result.push({ month: monthNames[date.getMonth()], amount });
    }

    return result;
}

function mergeGrowthData(userGrowth: { month: string; users: number }[], savingsGrowth: { month: string; amount: number }[]) {
    return userGrowth.map((u, i) => ({
        month: u.month,
        users: u.users,
        savings: savingsGrowth[i]?.amount || 0
    }));
}
