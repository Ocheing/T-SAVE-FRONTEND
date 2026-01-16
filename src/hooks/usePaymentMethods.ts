import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { PaymentMethod, PaymentMethodInsert, PaymentMethodUpdate } from '@/types/database.types';

export function usePaymentMethods() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['paymentMethods', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('user_id', user.id)
                .order('is_default', { ascending: false });

            if (error) throw error;
            return data as PaymentMethod[];
        },
        enabled: !!user,
    });
}

export function useAddPaymentMethod() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (method: Omit<PaymentMethodInsert, 'user_id'>) => {
            if (!user) throw new Error('Not authenticated');

            // If this is set as default, unset other defaults first
            if (method.is_default) {
                await supabase
                    .from('payment_methods')
                    .update({ is_default: false })
                    .eq('user_id', user.id);
            }

            const { data, error } = await supabase
                .from('payment_methods')
                .insert({ ...method, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return data as PaymentMethod;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
        },
    });
}

export function useUpdatePaymentMethod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: PaymentMethodUpdate }) => {
            const { data, error } = await supabase
                .from('payment_methods')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as PaymentMethod;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
        },
    });
}

export function useDeletePaymentMethod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('payment_methods')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
        },
    });
}

export function useSetDefaultPaymentMethod() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!user) throw new Error('Not authenticated');

            // Unset all defaults first
            await supabase
                .from('payment_methods')
                .update({ is_default: false })
                .eq('user_id', user.id);

            // Set the new default
            const { data, error } = await supabase
                .from('payment_methods')
                .update({ is_default: true })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as PaymentMethod;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
        },
    });
}
