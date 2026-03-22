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

// Use stable module-level state but with proper cleanup support
// NOTE: These are module-scoped so they survive HMR — that's intentional.
// The ref counting ensures we only create 1 channel even with multiple hook instances.
let realtimeSubscriberCount = 0;
let globalChannel: RealtimeChannel | null = null;
let globalQueryClient: import('@tanstack/react-query').QueryClient | null = null;

/**
 * Hook for real-time destination synchronization
 * Uses a singleton pattern to prevent multiple subscriptions
 */
export function useDestinationsRealtime() {
    const queryClient = useQueryClient();
    const mountedRef = useRef(false);

    useEffect(() => {
        // Prevent double-registration in React Strict Mode
        if (mountedRef.current) return;
        mountedRef.current = true;

        // Always keep queryClient reference up to date
        globalQueryClient = queryClient;
        realtimeSubscriberCount++;

        // Only create the channel when this is the first subscriber
        if (realtimeSubscriberCount === 1 && !globalChannel) {
            console.log('[Realtime] Setting up destinations channel');

            globalChannel = supabase
                .channel(`destinations-realtime-${Date.now()}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'destinations' },
                    () => {
                        // Debounce invalidation to prevent rapid-fire updates
                        setTimeout(() => {
                            if (!globalQueryClient) return;
                            globalQueryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.all });
                            globalQueryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.featured });
                            globalQueryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.popular });
                            globalQueryClient.invalidateQueries({ queryKey: DESTINATIONS_QUERY_KEYS.published });
                        }, 150);
                    }
                )
                .subscribe((status) => {
                    console.log('[Realtime] Destinations subscription status:', status);
                });
        }

        return () => {
            mountedRef.current = false;
            realtimeSubscriberCount = Math.max(0, realtimeSubscriberCount - 1);

            if (realtimeSubscriberCount === 0 && globalChannel) {
                console.log('[Realtime] Cleaning up destinations channel');
                supabase.removeChannel(globalChannel);
                globalChannel = null;
                globalQueryClient = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
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
