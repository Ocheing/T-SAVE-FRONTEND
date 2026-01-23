import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { WishlistItem, WishlistItemInsert, WishlistItemUpdate } from '@/types/database.types';

export function useWishlist() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['wishlist', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('wishlist')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as WishlistItem[];
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useAddToWishlist() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (item: Omit<WishlistItemInsert, 'user_id'>) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await (supabase
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .from('wishlist') as any)
                .insert({ ...item, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return data as WishlistItem;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        },
    });
}

export function useUpdateWishlistItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: WishlistItemUpdate }) => {
            const { data, error } = await (supabase
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .from('wishlist') as any)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as WishlistItem;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        },
    });
}

export function useRemoveFromWishlist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('wishlist')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        },
    });
}

// Check if a destination is in the wishlist
export function useIsInWishlist(destination: string) {
    const { data: wishlist } = useWishlist();
    return wishlist?.some(item => item.destination.toLowerCase() === destination.toLowerCase()) ?? false;
}
