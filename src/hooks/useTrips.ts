import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Trip, TripInsert, TripUpdate } from '@/types/database.types';

// Cache configuration constants
const CACHE_CONFIG = {
    staleTime: 1000 * 60 * 2, // Data considered fresh for 2 minutes
    gcTime: 1000 * 60 * 30,   // Keep in cache for 30 minutes
};

export function useTrips(status?: 'active' | 'completed' | 'cancelled') {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['trips', user?.id, status],
        queryFn: async () => {
            if (!user) return [];

            let query = supabase
                .from('trips')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as Trip[];
        },
        enabled: !!user,
        staleTime: CACHE_CONFIG.staleTime,
        gcTime: CACHE_CONFIG.gcTime,
        refetchOnWindowFocus: false,
    });
}

export function useTrip(id: string | undefined) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['trip', id],
        queryFn: async () => {
            if (!user || !id) return null;

            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Trip;
        },
        enabled: !!user && !!id,
    });
}

export function useCreateTrip() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (trip: Omit<TripInsert, 'user_id'>) => {
            if (!user) throw new Error('Not authenticated');

            const tripData = { ...trip, user_id: user.id };
            const { data, error } = await supabase
                .from('trips')
                // @ts-expect-error - Supabase type generation mismatch with actual schema
                .insert(tripData)
                .select()
                .single();

            if (error) throw error;
            return data as Trip;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
    });
}

export function useUpdateTrip() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: TripUpdate }) => {
            const { data, error } = await supabase
                .from('trips')
                // @ts-expect-error - Supabase type generation mismatch with actual schema
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Trip;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            queryClient.invalidateQueries({ queryKey: ['trip', data.id] });
        },
    });
}

export function useDeleteTrip() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('trips')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
    });
}

// Utility hook for trip statistics
export function useTripStats() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['tripStats', user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data: trips, error } = await supabase
                .from('trips')
                .select('target_amount, saved_amount, status')
                .eq('user_id', user.id);

            if (error) throw error;

            // Type-safe mapping of the selected columns
            type TripStatsRow = Pick<Trip, 'target_amount' | 'saved_amount' | 'status'>;
            const typedTrips = (trips || []) as TripStatsRow[];

            const activeTrips = typedTrips.filter(t => t.status === 'active');
            const totalSaved = typedTrips.reduce((sum, t) => sum + (t.saved_amount || 0), 0);
            const totalTarget = activeTrips.reduce((sum, t) => sum + (t.target_amount || 0), 0);

            return {
                totalSaved,
                totalTarget,
                activeGoals: activeTrips.length,
                completedGoals: typedTrips.filter(t => t.status === 'completed').length,
            };
        },
        enabled: !!user,
    });
}
