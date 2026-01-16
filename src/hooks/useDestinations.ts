import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Destination } from '@/types/database.types';

export function useDestinations() {
    return useQuery({
        queryKey: ['destinations'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('destinations')
                .select('*')
                .order('name');

            if (error) throw error;
            return data as Destination[];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

export function useFeaturedDestinations() {
    return useQuery({
        queryKey: ['destinations', 'featured'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('destinations')
                .select('*')
                .eq('is_featured', true)
                .order('rating', { ascending: false });

            if (error) throw error;
            return data as Destination[];
        },
        staleTime: 1000 * 60 * 60,
    });
}

export function usePopularDestinations() {
    return useQuery({
        queryKey: ['destinations', 'popular'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('destinations')
                .select('*')
                .eq('is_popular', true)
                .order('reviews_count', { ascending: false });

            if (error) throw error;
            return data as Destination[];
        },
        staleTime: 1000 * 60 * 60,
    });
}
