import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Destination } from '@/types/database.types';
import { useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

// Query key constants for consistency
export const DESTINATIONS_QUERY_KEYS = {
    all: ['destinations'] as const,
    featured: ['destinations', 'featured'] as const,
    popular: ['destinations', 'popular'] as const,
    published: ['destinations', 'published'] as const,
};

/**
 * Hook for real-time destination synchronization
 * Automatically invalidates queries when destinations change in the database
 */
export function useDestinationsRealtime() {
    const queryClient = useQueryClient();

    useEffect(() => {
        let channel: RealtimeChannel | null = null;

        const setupRealtimeSubscription = () => {
            channel = supabase
                .channel('destinations-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: '*', // Listen to all events: INSERT, UPDATE, DELETE
                        schema: 'public',
                        table: 'destinations',
                    },
                    (payload) => {
                        console.log('[Realtime] Destination change detected:', payload.eventType);

                        // Invalidate all destination-related queries for instant sync
                        queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.all });
                        queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.featured });
                        queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.popular });
                        queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.published });
                    }
                )
                .subscribe((status) => {
                    console.log('[Realtime] Subscription status:', status);
                });
        };

        setupRealtimeSubscription();

        return () => {
            if (channel) {
                console.log('[Realtime] Unsubscribing from destinations channel');
                supabase.removeChannel(channel);
            }
        };
    }, [queryClient]);
}

/**
 * Fetch all destinations (for admin use)
 */
export function useDestinations() {
    // Enable real-time sync
    useDestinationsRealtime();

    return useQuery({
        queryKey: DESTINATIONS_QUERY_KEYS.all,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('destinations')
                .select('*')
                .order('name');

            if (error) throw error;
            return data as Destination[];
        },
        staleTime: 1000 * 30, // 30 seconds - reduced for faster updates
        refetchOnWindowFocus: true,
    });
}

/**
 * Fetch only published destinations (for user-facing pages)
 */
export function usePublishedDestinations() {
    // Enable real-time sync
    useDestinationsRealtime();

    return useQuery({
        queryKey: DESTINATIONS_QUERY_KEYS.published,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('destinations')
                .select('*')
                .eq('status', 'published')
                .order('name');

            if (error) throw error;
            return data as Destination[];
        },
        staleTime: 1000 * 30,
        refetchOnWindowFocus: true,
    });
}

/**
 * Fetch featured destinations with real-time updates
 */
export function useFeaturedDestinations() {
    // Enable real-time sync
    useDestinationsRealtime();

    return useQuery({
        queryKey: DESTINATIONS_QUERY_KEYS.featured,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('destinations')
                .select('*')
                .eq('is_featured', true)
                .eq('status', 'published') // Only show published destinations
                .order('rating', { ascending: false });

            if (error) throw error;
            return data as Destination[];
        },
        staleTime: 1000 * 30,
        refetchOnWindowFocus: true,
    });
}

/**
 * Fetch popular destinations with real-time updates
 */
export function usePopularDestinations() {
    // Enable real-time sync
    useDestinationsRealtime();

    return useQuery({
        queryKey: DESTINATIONS_QUERY_KEYS.popular,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('destinations')
                .select('*')
                .eq('is_popular', true)
                .eq('status', 'published') // Only show published destinations
                .order('reviews_count', { ascending: false });

            if (error) throw error;
            return data as Destination[];
        },
        staleTime: 1000 * 30,
        refetchOnWindowFocus: true,
    });
}

/**
 * Hook for destination CRUD operations
 * Returns mutation functions for creating, updating, and deleting destinations
 */
export function useDestinationMutations() {
    const queryClient = useQueryClient();

    const invalidateAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.all });
        queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.featured });
        queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.popular });
        queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.published });
    }, [queryClient]);

    const createDestination = useCallback(async (destination: Omit<Destination, 'id' | 'created_at' | 'updated_at'>) => {
        const { data, error } = await supabase
            .from('destinations')
            .insert(destination)
            .select()
            .single();

        if (error) throw error;

        // Immediately invalidate queries for instant UI update
        invalidateAll();

        return data as Destination;
    }, [invalidateAll]);

    const updateDestination = useCallback(async (id: string, updates: Partial<Destination>) => {
        const { data, error } = await supabase
            .from('destinations')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Immediately invalidate queries for instant UI update
        invalidateAll();

        return data as Destination;
    }, [invalidateAll]);

    const deleteDestination = useCallback(async (id: string) => {
        const { error } = await supabase
            .from('destinations')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Immediately invalidate queries for instant UI update
        invalidateAll();
    }, [invalidateAll]);

    const updateStatus = useCallback(async (id: string, status: 'draft' | 'published' | 'archived') => {
        return updateDestination(id, { status });
    }, [updateDestination]);

    return {
        createDestination,
        updateDestination,
        deleteDestination,
        updateStatus,
        invalidateAll,
    };
}
