import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTrips } from '@/hooks/useTrips';
import type { AppEvent } from '@/types/database.types';
import { useEffect, useCallback, useMemo } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

// Query key constants
export const EVENTS_QUERY_KEYS = {
    all: ['events'] as const,
    published: ['events', 'published'] as const,
    recommended: ['events', 'recommended'] as const,
    dashboard: ['events', 'dashboard'] as const,
};

// ============================================================================
// Realtime subscription (singleton pattern — same as useDestinationsRealtime)
// ============================================================================
let eventsRealtimeSubscriberCount = 0;
let eventsGlobalChannel: RealtimeChannel | null = null;
let eventsGlobalQueryClient: import('@tanstack/react-query').QueryClient | null = null;

export function useEventsRealtime() {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Always keep queryClient reference up to date
        eventsGlobalQueryClient = queryClient;
        eventsRealtimeSubscriberCount++;

        // Only create the channel when this is the first subscriber
        if (eventsRealtimeSubscriberCount === 1 && !eventsGlobalChannel) {
            console.log('[Realtime] Setting up events channel');

            eventsGlobalChannel = supabase
                .channel(`events-realtime-${Date.now()}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'events' },
                    () => {
                        // Debounce invalidation to prevent rapid-fire updates
                        setTimeout(() => {
                            if (!eventsGlobalQueryClient) return;
                            eventsGlobalQueryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all });
                            eventsGlobalQueryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.published });
                            eventsGlobalQueryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.recommended });
                            eventsGlobalQueryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.dashboard });
                        }, 150);
                    }
                )
                .subscribe((status) => {
                    console.log('[Realtime] Events subscription status:', status);
                });
        }

        return () => {
            eventsRealtimeSubscriberCount = Math.max(0, eventsRealtimeSubscriberCount - 1);

            if (eventsRealtimeSubscriberCount === 0 && eventsGlobalChannel) {
                console.log('[Realtime] Cleaning up events channel');
                supabase.removeChannel(eventsGlobalChannel);
                eventsGlobalChannel = null;
                eventsGlobalQueryClient = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

// ============================================================================
// Fetch ALL events (for admin use — includes draft, published, archived)
// ============================================================================
export function useAllEvents() {
    useEventsRealtime();

    return useQuery({
        queryKey: EVENTS_QUERY_KEYS.all,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('event_date', { ascending: true });

            if (error) throw error;
            return data as AppEvent[];
        },
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 5,
        refetchOnWindowFocus: true,
        refetchOnMount: 'always',
    });
}

// ============================================================================
// Fetch only published upcoming events (event_date >= today, status = published)
// ============================================================================
export function useEvents() {
    useEventsRealtime();

    return useQuery({
        queryKey: EVENTS_QUERY_KEYS.published,
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('status', 'published')
                .gte('event_date', today)
                .order('event_date', { ascending: true });

            if (error) throw error;
            return data as AppEvent[];
        },
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 5,
        refetchOnWindowFocus: true,
        refetchOnMount: 'always',
    });
}

// ============================================================================
// Lightweight hook for Dashboard events
// ============================================================================
export function useDashboardEvents(limit = 5) {
    useEventsRealtime();

    return useQuery({
        queryKey: [...EVENTS_QUERY_KEYS.dashboard, limit],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('status', 'published')
                .gte('event_date', today)
                .order('event_date', { ascending: true })
                .limit(limit);

            if (error) throw error;
            return data as AppEvent[];
        },
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: true,
        refetchOnMount: 'always',
    });
}

// ============================================================================
// Personalized event recommendations
// ============================================================================
export function useRecommendedEvents() {
    const { profile } = useAuth();
    const { data: trips } = useTrips();
    const { data: allEvents, isLoading, error: eventsError } = useEvents();

    const data = useMemo(() => {
        if (!allEvents) return [];

        const userPrefs = profile?.travel_preferences || [];
        const userLocation = profile?.location || '';

        // Calculate realistic budget based on user's trip target amounts
        const avgTripBudget = trips && trips.length > 0
            ? trips.reduce((sum, t) => sum + Number(t.target_amount), 0) / trips.length
            : 2000;

        const affordabilityLimit = avgTripBudget * 1.5;

        return [...allEvents]
            .map(event => {
                let score = 0;

                // 1. Travel Style / Category Match
                const categoryMatchCount = (event.categories || []).filter(cat => userPrefs.includes(cat)).length;
                score += categoryMatchCount * 10;

                // 2. Proximity
                if (userLocation && event.location.toLowerCase().includes(userLocation.toLowerCase())) {
                    score += 25;
                }

                // 3. Affordability
                const eventPrice = Number(event.price);
                if (eventPrice <= avgTripBudget) {
                    score += 15;
                } else if (eventPrice <= affordabilityLimit) {
                    score += 5;
                } else {
                    score -= 10;
                }

                // 4. Boosts
                if (event.is_featured) score += 15;
                if (event.is_trending) score += 10;
                if (event.is_seasonal) score += 5;

                return { ...event, recommendationScore: score };
            })
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, 5);
    }, [allEvents, profile?.travel_preferences, profile?.location, trips]);

    return {
        data,
        isLoading,
        error: eventsError,
    };
}

// ============================================================================
// Categorized events helper
// ============================================================================
export function useCategorizedEvents() {
    const { data: allEvents, isLoading } = useEvents();

    const { featured, trending, seasonal } = useMemo(() => {
        const events = allEvents || [];
        return {
            featured: events.filter(e => e.is_featured),
            trending: events.filter(e => e.is_trending),
            seasonal: events.filter(e => e.is_seasonal)
        };
    }, [allEvents]);

    return { featured, trending, seasonal, isLoading };
}

// ============================================================================
// Event CRUD mutations (mirrors useDestinationMutations)
// ============================================================================
export function useEventMutations() {
    const queryClient = useQueryClient();

    const invalidateAll = useCallback(() => {
        return Promise.all([
            queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all }),
            queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.published }),
            queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.recommended }),
            queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.dashboard }),
        ]);
    }, [queryClient]);

    const createMutation = useMutation({
        mutationFn: async (event: Omit<AppEvent, 'id' | 'created_at' | 'updated_at'>) => {
            const { data, error } = await supabase
                .from('events')
                .insert(event as unknown as never)
                .select()
                .single();

            if (error) throw error;
            return data as AppEvent;
        },
        onSuccess: () => {
            invalidateAll();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<AppEvent> }) => {
            const { data, error } = await supabase
                .from('events')
                .update(updates as unknown as never)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as AppEvent;
        },
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: EVENTS_QUERY_KEYS.all });
            const previousEvents = queryClient.getQueryData(EVENTS_QUERY_KEYS.all);

            queryClient.setQueryData(EVENTS_QUERY_KEYS.all, (old: AppEvent[] | undefined) => {
                if (!old) return old;
                return old.map(e => e.id === id ? { ...e, ...updates } : e);
            });

            return { previousEvents };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousEvents) {
                queryClient.setQueryData(EVENTS_QUERY_KEYS.all, context.previousEvents);
            }
        },
        onSettled: () => {
            invalidateAll();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: EVENTS_QUERY_KEYS.all });
            const previousEvents = queryClient.getQueryData(EVENTS_QUERY_KEYS.all);

            queryClient.setQueryData(EVENTS_QUERY_KEYS.all, (old: AppEvent[] | undefined) => {
                if (!old) return old;
                return old.filter(e => e.id !== id);
            });

            return { previousEvents };
        },
        onError: (_err, _id, context) => {
            if (context?.previousEvents) {
                queryClient.setQueryData(EVENTS_QUERY_KEYS.all, context.previousEvents);
            }
        },
        onSettled: () => {
            invalidateAll();
        },
    });

    // Legacy function wrappers for backward compatibility
    const createEvent = useCallback(async (event: Omit<AppEvent, 'id' | 'created_at' | 'updated_at'>) => {
        return createMutation.mutateAsync(event);
    }, [createMutation]);

    const updateEvent = useCallback(async (id: string, updates: Partial<AppEvent>) => {
        return updateMutation.mutateAsync({ id, updates });
    }, [updateMutation]);

    const deleteEvent = useCallback(async (id: string) => {
        return deleteMutation.mutateAsync(id);
    }, [deleteMutation]);

    const updateStatus = useCallback(async (id: string, status: 'draft' | 'published' | 'archived') => {
        return updateEvent(id, { status });
    }, [updateEvent]);

    return {
        createEvent,
        updateEvent,
        deleteEvent,
        updateStatus,
        invalidateAll,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
