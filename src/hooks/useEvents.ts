import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTrips } from '@/hooks/useTrips';
import type { AppEvent } from '@/types/database.types';
import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

// Query key constants
export const EVENTS_QUERY_KEYS = {
    all: ['events'] as const,
    recommended: ['events', 'recommended'] as const,
};

// ============================================================================
// Realtime subscription (singleton pattern — same as useDestinationsRealtime)
// ============================================================================
let eventsRealtimeSubscriberCount = 0;
let eventsGlobalChannel: RealtimeChannel | null = null;
let eventsGlobalQueryClient: import('@tanstack/react-query').QueryClient | null = null;

export function useEventsRealtime() {
    const queryClient = useQueryClient();
    const mountedRef = useRef(false);

    useEffect(() => {
        if (mountedRef.current) return;
        mountedRef.current = true;

        eventsGlobalQueryClient = queryClient;
        eventsRealtimeSubscriberCount++;

        if (eventsRealtimeSubscriberCount === 1 && !eventsGlobalChannel) {
            console.log('[Realtime] Setting up events channel');

            eventsGlobalChannel = supabase
                .channel(`events-realtime-${Date.now()}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'events' },
                    () => {
                        setTimeout(() => {
                            if (!eventsGlobalQueryClient) return;
                            eventsGlobalQueryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all });
                            eventsGlobalQueryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.recommended });
                        }, 150);
                    }
                )
                .subscribe((status) => {
                    console.log('[Realtime] Events subscription status:', status);
                });
        }

        return () => {
            mountedRef.current = false;
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
// Fetch upcoming events only (event_date >= today)
// ============================================================================
export function useEvents() {
    useEventsRealtime();

    return useQuery({
        queryKey: EVENTS_QUERY_KEYS.all,
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            const { data, error } = await supabase
                .from('events')
                .select('*')
                .gte('event_date', today)
                .order('event_date', { ascending: true });

            if (error) throw error;
            return data as AppEvent[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes — events rarely change mid-session
        gcTime: 1000 * 60 * 30,   // 30 minutes cache
        refetchOnWindowFocus: false, // Realtime handles updates
    });
}

// ============================================================================
// Personalized event recommendations
// ============================================================================
export function useRecommendedEvents() {
    const { profile } = useAuth();
    const { data: trips } = useTrips();
    const { data: allEvents, isLoading, error: eventsError } = useEvents();

    const query = useQuery({
        queryKey: [...EVENTS_QUERY_KEYS.recommended, profile?.id, profile?.travel_preferences, profile?.location, trips?.length],
        queryFn: async () => {
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
        },
        enabled: !!allEvents,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
    });

    return {
        ...query,
        isLoading: isLoading || query.isLoading,
        error: eventsError || query.error,
    };
}

// ============================================================================
// Categorized events helper
// ============================================================================
export function useCategorizedEvents() {
    const { data: allEvents, isLoading } = useEvents();

    const featured = (allEvents || []).filter(e => e.is_featured);
    const trending = (allEvents || []).filter(e => e.is_trending);
    const seasonal = (allEvents || []).filter(e => e.is_seasonal);

    return { featured, trending, seasonal, isLoading };
}
