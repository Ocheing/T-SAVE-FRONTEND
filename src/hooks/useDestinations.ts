import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Destination, DestinationInsert, DestinationUpdate } from '@/types/database.types';
import { useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

// Query key constants for consistency
export const DESTINATIONS_QUERY_KEYS = {
    all: ['destinations'] as const,
    featured: ['destinations', 'featured'] as const,
    popular: ['destinations', 'popular'] as const,
    published: ['destinations', 'published'] as const,
};

// Global flag to track if realtime is already set up
let realtimeSetupCount = 0;
let globalChannel: RealtimeChannel | null = null;

/**
 * Hook for real-time destination synchronization
 * Uses a singleton pattern to prevent multiple subscriptions
 */
export function useDestinationsRealtime() {
    const queryClient = useQueryClient();
    const hasSetupRef = useRef(false);

    useEffect(() => {
        // Prevent duplicate subscriptions
        if (hasSetupRef.current) return;
        hasSetupRef.current = true;
        realtimeSetupCount++;

        // Only create channel if this is the first subscriber
        if (realtimeSetupCount === 1 && !globalChannel) {
            console.log('[Realtime] Setting up destinations channel (first subscriber)');

            globalChannel = supabase
                .channel('destinations-realtime-global')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'destinations',
                    },
                    (payload) => {
                        console.log('[Realtime] Destination change detected:', payload.eventType);

                        // Debounce invalidation to prevent rapid-fire updates
                        setTimeout(() => {
                            queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.all });
                            queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.featured });
                            queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.popular });
                            queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.published });
                        }, 100);
                    }
                )
                .subscribe((status) => {
                    console.log('[Realtime] Global subscription status:', status);
                });
        }

        return () => {
            hasSetupRef.current = false;
            realtimeSetupCount--;

            // Only cleanup when last subscriber leaves
            if (realtimeSetupCount === 0 && globalChannel) {
                console.log('[Realtime] Cleaning up destinations channel (last subscriber)');
                supabase.removeChannel(globalChannel);
                globalChannel = null;
            }
        };
    }, [queryClient]);
}

/**
 * Fetch all destinations (for admin use)
 */
export function useDestinations() {
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
        staleTime: 1000 * 60, // 1 minute
        gcTime: 1000 * 60 * 5, // 5 minutes cache
        refetchOnWindowFocus: false, // Realtime handles updates
    });
}

/**
 * Fetch only published destinations (for user-facing pages)
 */
export function usePublishedDestinations() {
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
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
}

/**
 * Fetch featured destinations with real-time updates
 */
export function useFeaturedDestinations() {
    useDestinationsRealtime();

    return useQuery({
        queryKey: DESTINATIONS_QUERY_KEYS.featured,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('destinations')
                .select('*')
                .eq('is_featured', true)
                .eq('status', 'published')
                .order('rating', { ascending: false });

            if (error) throw error;
            return data as Destination[];
        },
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
}

/**
 * Fetch popular destinations with real-time updates
 */
export function usePopularDestinations() {
    useDestinationsRealtime();

    return useQuery({
        queryKey: DESTINATIONS_QUERY_KEYS.popular,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('destinations')
                .select('*')
                .eq('is_popular', true)
                .eq('status', 'published')
                .order('reviews_count', { ascending: false });

            if (error) throw error;
            return data as Destination[];
        },
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
}

/**
 * Hook for destination CRUD operations with optimistic updates
 */
export function useDestinationMutations() {
    const queryClient = useQueryClient();

    const invalidateAll = useCallback(() => {
        // Use Promise.all for parallel invalidation
        return Promise.all([
            queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.all }),
            queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.featured }),
            queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.popular }),
            queryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.published }),
        ]);
    }, [queryClient]);

    // Create destination mutation with optimistic update
    const createMutation = useMutation({
        mutationFn: async (destination: Omit<Destination, 'id' | 'created_at' | 'updated_at'>) => {
            const { data, error } = await supabase
                .from('destinations')
                .insert(destination as unknown as never)
                .select()
                .single();

            if (error) throw error;
            return data as Destination;
        },
        onSuccess: () => {
            invalidateAll();
        },
    });

    // Update destination mutation with optimistic update
    const updateMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Destination> }) => {
            const { data, error } = await supabase
                .from('destinations')
                .update(updates as unknown as never)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Destination;
        },
        onMutate: async ({ id, updates }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: DESTINATIONS_QUERY_KEYS.all });

            // Snapshot current value
            const previousDestinations = queryClient.getQueryData(DESTINATIONS_QUERY_KEYS.all);

            // Optimistically update
            queryClient.setQueryData(DESTINATIONS_QUERY_KEYS.all, (old: Destination[] | undefined) => {
                if (!old) return old;
                return old.map(d => d.id === id ? { ...d, ...updates } : d);
            });

            return { previousDestinations };
        },
        onError: (_err, _variables, context) => {
            // Rollback on error
            if (context?.previousDestinations) {
                queryClient.setQueryData(DESTINATIONS_QUERY_KEYS.all, context.previousDestinations);
            }
        },
        onSettled: () => {
            invalidateAll();
        },
    });

    // Delete destination mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('destinations')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: DESTINATIONS_QUERY_KEYS.all });
            const previousDestinations = queryClient.getQueryData(DESTINATIONS_QUERY_KEYS.all);

            // Optimistically remove
            queryClient.setQueryData(DESTINATIONS_QUERY_KEYS.all, (old: Destination[] | undefined) => {
                if (!old) return old;
                return old.filter(d => d.id !== id);
            });

            return { previousDestinations };
        },
        onError: (_err, _id, context) => {
            if (context?.previousDestinations) {
                queryClient.setQueryData(DESTINATIONS_QUERY_KEYS.all, context.previousDestinations);
            }
        },
        onSettled: () => {
            invalidateAll();
        },
    });

    // Legacy function wrappers for backward compatibility
    const createDestination = useCallback(async (destination: Omit<Destination, 'id' | 'created_at' | 'updated_at'>) => {
        return createMutation.mutateAsync(destination);
    }, [createMutation]);

    const updateDestination = useCallback(async (id: string, updates: Partial<Destination>) => {
        return updateMutation.mutateAsync({ id, updates });
    }, [updateMutation]);

    const deleteDestination = useCallback(async (id: string) => {
        return deleteMutation.mutateAsync(id);
    }, [deleteMutation]);

    const updateStatus = useCallback(async (id: string, status: 'draft' | 'published' | 'archived') => {
        return updateDestination(id, { status });
    }, [updateDestination]);

    return {
        createDestination,
        updateDestination,
        deleteDestination,
        updateStatus,
        invalidateAll,
        // Expose mutation states for UI feedback
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
