import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Transaction, TransactionInsert } from '@/types/database.types';

export function useTransactions(tripId?: string) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['transactions', user?.id, tripId],
        queryFn: async () => {
            if (!user) return [];

            let query = supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (tripId) {
                query = query.eq('trip_id', tripId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as Transaction[];
        },
        enabled: !!user,
    });
}

export function useRecentTransactions(limit: number = 5) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['recentTransactions', user?.id, limit],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('transactions')
                .select('*, trips(destination)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });
}

export function useCreateTransaction() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (transaction: Omit<TransactionInsert, 'user_id'>) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('transactions')
                .insert({ ...transaction, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return data as Transaction;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
            // Also invalidate trips since saved_amount might have changed
            if (data.trip_id) {
                queryClient.invalidateQueries({ queryKey: ['trips'] });
                queryClient.invalidateQueries({ queryKey: ['trip', data.trip_id] });
                queryClient.invalidateQueries({ queryKey: ['tripStats'] });
            }
        },
    });
}

// Utility hook for transaction statistics
export function useTransactionStats() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['transactionStats', user?.id],
        queryFn: async () => {
            if (!user) return null;

            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
            const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

            // Get this month's transactions
            const { data: thisMonthData, error: thisMonthError } = await supabase
                .from('transactions')
                .select('amount, type')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .gte('created_at', firstDayOfMonth);

            if (thisMonthError) throw thisMonthError;

            // Get last month's transactions
            const { data: lastMonthData, error: lastMonthError } = await supabase
                .from('transactions')
                .select('amount, type')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .gte('created_at', firstDayOfLastMonth)
                .lte('created_at', lastDayOfLastMonth);

            if (lastMonthError) throw lastMonthError;

            const calculateNetSavings = (transactions: typeof thisMonthData) => {
                return transactions?.reduce((sum, t) => {
                    if (t.type === 'deposit' || t.type === 'refund') {
                        return sum + t.amount;
                    } else {
                        return sum - t.amount;
                    }
                }, 0) || 0;
            };

            const thisMonthSavings = calculateNetSavings(thisMonthData);
            const lastMonthSavings = calculateNetSavings(lastMonthData);

            const percentChange = lastMonthSavings > 0
                ? ((thisMonthSavings - lastMonthSavings) / lastMonthSavings) * 100
                : 0;

            return {
                thisMonthSavings,
                lastMonthSavings,
                percentChange: Math.round(percentChange),
            };
        },
        enabled: !!user,
    });
}
