import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTrips } from '@/hooks/useTrips';
import type { AppEvent } from '@/types/database.types';

export function useEvents() {
    return useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('event_date', { ascending: true });

            if (error) throw error;
            return data as AppEvent[];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

export function useRecommendedEvents() {
    const { profile } = useAuth();
    const { data: trips } = useTrips();
    const { data: allEvents, isLoading } = useEvents();

    return useQuery({
        queryKey: ['events', 'recommended', profile?.id, profile?.travel_preferences, profile?.location, trips?.length],
        queryFn: async () => {
            if (!allEvents) return [];

            const userPrefs = profile?.travel_preferences || [];
            const userLocation = profile?.location || '';

            // Calculate realistic budget based on user's trip target amounts
            const avgTripBudget = trips && trips.length > 0
                ? trips.reduce((sum, t) => sum + Number(t.target_amount), 0) / trips.length
                : 2000; // Default fallback budget

            const affordabilityLimit = avgTripBudget * 1.5; // Users might stretch up to 50% more for a special event

            return [...allEvents]
                .map(event => {
                    let score = 0;

                    // 1. Travel Style / Category Match (Quiz Preferences)
                    const categoryMatchCount = (event.categories || []).filter(cat => userPrefs.includes(cat)).length;
                    score += categoryMatchCount * 10;

                    // 2. Proximity (User Location)
                    if (userLocation && event.location.toLowerCase().includes(userLocation.toLowerCase())) {
                        score += 25;
                    }

                    // 3. Affordability (Budget Behavior)
                    const eventPrice = Number(event.price);
                    if (eventPrice <= avgTripBudget) {
                        score += 15;
                    } else if (eventPrice <= affordabilityLimit) {
                        score += 5;
                    } else {
                        score -= 10; // Penalize way outside budget
                    }

                    // 4. Manual/Global Boosts (Featured/Trending/Seasonal)
                    if (event.is_featured) score += 15;
                    if (event.is_trending) score += 10;
                    if (event.is_seasonal) score += 5;

                    return { ...event, recommendationScore: score };
                })
                .sort((a, b) => b.recommendationScore - a.recommendationScore)
                .slice(0, 5); // Return top 5 recommendations
        },
        enabled: !!allEvents,
    });
}

export function useCategorizedEvents() {
    const { data: allEvents, isLoading } = useEvents();

    const featured = (allEvents || []).filter(e => e.is_featured);
    const trending = (allEvents || []).filter(e => e.is_trending);
    const seasonal = (allEvents || []).filter(e => e.is_seasonal);

    return { featured, trending, seasonal, isLoading };
}
