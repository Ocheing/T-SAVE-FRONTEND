import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, ProfileUpdate } from '@/types/database.types';

export function useProfile() {
    const { user } = useAuth();

    return useQuery<Profile | null>({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useUpdateProfile() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: ProfileUpdate) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await (supabase
                .from('profiles') as any)
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
        },
    });
}
