import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, ProfileUpdate } from '@/types/database.types';

export function useProfile() {
    const { user, refreshProfile } = useAuth();

    return useQuery<Profile | null>({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                // If profile doesn't exist, try to ensure it's created
                if (error.code === 'PGRST116') {
                    // No rows found - try to create profile via the ensure function
                    await supabase.rpc('ensure_profile_exists');

                    // Retry fetching
                    const { data: retryData, error: retryError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (retryError) {
                        console.error('Profile still not found after ensure:', retryError);
                        throw retryError;
                    }
                    return retryData;
                }
                throw error;
            }
            return data;
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: (failureCount, error: Error & { code?: string }) => {
            // Retry up to 2 times for profile not found errors
            if (error.code === 'PGRST116' && failureCount < 2) {
                return true;
            }
            return false;
        },
    });
}

export function useUpdateProfile() {
    const { user, refreshProfile } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: ProfileUpdate) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await (supabase
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .from('profiles') as any)
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: async () => {
            // Invalidate the profile query cache
            queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
            // Also refresh the profile in AuthContext to keep it in sync
            if (refreshProfile) {
                await refreshProfile();
            }
        },
    });
}

/**
 * Hook to ensure the user's profile exists
 * Useful for handling edge cases where the profile might not have been created
 */
export function useEnsureProfile() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            if (!user) throw new Error('Not authenticated');

            // Call the database function to ensure profile exists
            const { error } = await supabase.rpc('ensure_profile_exists');

            if (error) {
                console.error('Error ensuring profile exists:', error);
                throw error;
            }

            return true;
        },
        onSuccess: () => {
            // Invalidate profile cache to refetch
            queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
        },
    });
}
