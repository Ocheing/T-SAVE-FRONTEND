export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    phone: string | null
                    location: string | null
                    avatar_url: string | null
                    language: string | null
                    currency: string | null
                    travel_preferences: string[] | null
                    email_notifications: boolean | null
                    trip_reminders: boolean | null
                    savings_milestones: boolean | null
                    id_number: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    phone?: string | null
                    location?: string | null
                    avatar_url?: string | null
                    language?: string | null
                    currency?: string | null
                    travel_preferences?: string[] | null
                    email_notifications?: boolean | null
                    trip_reminders?: boolean | null
                    savings_milestones?: boolean | null
                    id_number?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    phone?: string | null
                    location?: string | null
                    avatar_url?: string | null
                    language?: string | null
                    currency?: string | null
                    travel_preferences?: string[] | null
                    email_notifications?: boolean | null
                    trip_reminders?: boolean | null
                    savings_milestones?: boolean | null
                    id_number?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            payment_methods: {
                Row: {
                    id: string
                    user_id: string
                    type: 'mpesa' | 'card' | 'bank'
                    name: string
                    details: Json
                    is_default: boolean | null
                    is_verified: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: 'mpesa' | 'card' | 'bank'
                    name: string
                    details?: Json
                    is_default?: boolean | null
                    is_verified?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: 'mpesa' | 'card' | 'bank'
                    name?: string
                    details?: Json
                    is_default?: boolean | null
                    is_verified?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            trips: {
                Row: {
                    id: string
                    user_id: string
                    destination: string
                    description: string | null
                    category: 'beach' | 'mountain' | 'city' | 'adventure' | 'cultural' | 'event' | null
                    goal_type: 'flexible' | 'locked' | null
                    event_type: 'concert' | 'festival' | 'sports' | 'conference' | 'other' | null
                    ticket_type: string | null
                    event_organizer: string | null
                    image_url: string | null
                    target_amount: number
                    saved_amount: number
                    target_date: string
                    status: 'active' | 'completed' | 'cancelled' | null
                    reviews_count: number | null
                    created_at: string | null
                    updated_at: string | null
                    // Savings goal enhancements
                    destination_id: string | null
                    is_custom_goal: boolean | null
                    savings_frequency: 'daily' | 'weekly' | 'monthly' | null
                    daily_target: number | null
                    weekly_target: number | null
                    monthly_target: number | null
                    location: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    destination: string
                    description?: string | null
                    category?: 'beach' | 'mountain' | 'city' | 'adventure' | 'cultural' | 'event' | null
                    goal_type?: 'flexible' | 'locked' | null
                    event_type?: 'concert' | 'festival' | 'sports' | 'conference' | 'other' | null
                    ticket_type?: string | null
                    event_organizer?: string | null
                    image_url?: string | null
                    target_amount: number
                    saved_amount?: number
                    target_date: string
                    status?: 'active' | 'completed' | 'cancelled' | null
                    reviews_count?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                    // Savings goal enhancements
                    destination_id?: string | null
                    is_custom_goal?: boolean | null
                    savings_frequency?: 'daily' | 'weekly' | 'monthly' | null
                    daily_target?: number | null
                    weekly_target?: number | null
                    monthly_target?: number | null
                    location?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    destination?: string
                    description?: string | null
                    category?: 'beach' | 'mountain' | 'city' | 'adventure' | 'cultural' | 'event' | null
                    goal_type?: 'flexible' | 'locked' | null
                    event_type?: 'concert' | 'festival' | 'sports' | 'conference' | 'other' | null
                    ticket_type?: string | null
                    event_organizer?: string | null
                    image_url?: string | null
                    target_amount?: number
                    saved_amount?: number
                    target_date?: string
                    status?: 'active' | 'completed' | 'cancelled' | null
                    reviews_count?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                    // Savings goal enhancements
                    destination_id?: string | null
                    is_custom_goal?: boolean | null
                    savings_frequency?: 'daily' | 'weekly' | 'monthly' | null
                    daily_target?: number | null
                    weekly_target?: number | null
                    monthly_target?: number | null
                    location?: string | null
                }
            }
            wishlist: {
                Row: {
                    id: string
                    user_id: string
                    destination: string
                    description: string | null
                    category: 'beach' | 'mountain' | 'city' | 'adventure' | 'cultural' | 'event' | null
                    estimated_cost: number | null
                    duration: string | null
                    image_url: string | null
                    notes: string | null
                    reviews_count: number | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    destination: string
                    description?: string | null
                    category?: 'beach' | 'mountain' | 'city' | 'adventure' | 'cultural' | 'event' | null
                    estimated_cost?: number | null
                    duration?: string | null
                    image_url?: string | null
                    notes?: string | null
                    reviews_count?: number | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    destination?: string
                    description?: string | null
                    category?: 'beach' | 'mountain' | 'city' | 'adventure' | 'cultural' | 'event' | null
                    estimated_cost?: number | null
                    duration?: string | null
                    image_url?: string | null
                    notes?: string | null
                    reviews_count?: number | null
                    created_at?: string | null
                }
            }
            transactions: {
                Row: {
                    id: string
                    user_id: string
                    trip_id: string | null
                    payment_method_id: string | null
                    type: 'deposit' | 'withdrawal' | 'booking_payment' | 'refund'
                    amount: number
                    description: string | null
                    status: 'pending' | 'completed' | 'failed' | 'cancelled' | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    trip_id?: string | null
                    payment_method_id?: string | null
                    type: 'deposit' | 'withdrawal' | 'booking_payment' | 'refund'
                    amount: number
                    description?: string | null
                    status?: 'pending' | 'completed' | 'failed' | 'cancelled' | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    trip_id?: string | null
                    payment_method_id?: string | null
                    type?: 'deposit' | 'withdrawal' | 'booking_payment' | 'refund'
                    amount?: number
                    description?: string | null
                    status?: 'pending' | 'completed' | 'failed' | 'cancelled' | null
                    created_at?: string | null
                }
            }
            destinations: {
                Row: {
                    id: string
                    name: string
                    location: string | null
                    description: string | null
                    categories: string[] | null
                    estimated_cost: number
                    duration: string | null
                    image_url: string | null
                    rating: number | null
                    reviews_count: number | null
                    is_featured: boolean | null
                    is_popular: boolean | null
                    popularity_badge: string | null
                    status: 'draft' | 'published' | 'archived' | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    location?: string | null
                    description?: string | null
                    categories?: string[] | null
                    estimated_cost: number
                    duration?: string | null
                    image_url?: string | null
                    rating?: number | null
                    reviews_count?: number | null
                    is_featured?: boolean | null
                    is_popular?: boolean | null
                    popularity_badge?: string | null
                    status?: 'draft' | 'published' | 'archived' | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    location?: string | null
                    description?: string | null
                    categories?: string[] | null
                    estimated_cost?: number
                    duration?: string | null
                    image_url?: string | null
                    rating?: number | null
                    reviews_count?: number | null
                    is_featured?: boolean | null
                    is_popular?: boolean | null
                    popularity_badge?: string | null
                    status?: 'draft' | 'published' | 'archived' | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            events: {
                Row: {
                    id: string
                    name: string
                    location: string
                    description: string | null
                    categories: string[] | null
                    event_date: string
                    price: number
                    image_url: string | null
                    is_featured: boolean | null
                    is_trending: boolean | null
                    is_seasonal: boolean | null
                    engagement_score: number | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    location: string
                    description?: string | null
                    categories?: string[] | null
                    event_date: string
                    price: number
                    image_url?: string | null
                    is_featured?: boolean | null
                    is_trending?: boolean | null
                    is_seasonal?: boolean | null
                    engagement_score?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    location?: string
                    description?: string | null
                    categories?: string[] | null
                    event_date?: string
                    price?: number
                    image_url?: string | null
                    is_featured?: boolean | null
                    is_trending?: boolean | null
                    is_seasonal?: boolean | null
                    engagement_score?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            admin_users: {
                Row: {
                    id: string
                    role: 'admin' | 'super_admin'
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    role?: 'admin' | 'super_admin'
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    role?: 'admin' | 'super_admin'
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            paystack_payments: {
                Row: {
                    id: string
                    user_id: string
                    paystack_reference: string
                    paystack_access_code: string | null
                    paystack_authorization_url: string | null
                    paystack_trx_ref: string | null
                    amount: number
                    currency: string
                    email: string
                    status: 'pending' | 'success' | 'failed' | 'abandoned' | 'reversed'
                    channel: string | null
                    card_type: string | null
                    card_last4: string | null
                    bank: string | null
                    trip_id: string | null
                    booking_id: string | null
                    payment_type: 'savings_deposit' | 'booking_payment'
                    description: string | null
                    metadata: Json
                    paystack_response: Json
                    webhook_received_at: string | null
                    webhook_event: string | null
                    ip_address: string | null
                    paid_at: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    paystack_reference: string
                    paystack_access_code?: string | null
                    paystack_authorization_url?: string | null
                    paystack_trx_ref?: string | null
                    amount: number
                    currency?: string
                    email: string
                    status?: 'pending' | 'success' | 'failed' | 'abandoned' | 'reversed'
                    channel?: string | null
                    card_type?: string | null
                    card_last4?: string | null
                    bank?: string | null
                    trip_id?: string | null
                    booking_id?: string | null
                    payment_type?: 'savings_deposit' | 'booking_payment'
                    description?: string | null
                    metadata?: Json
                    paystack_response?: Json
                    webhook_received_at?: string | null
                    webhook_event?: string | null
                    ip_address?: string | null
                    paid_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    paystack_reference?: string
                    paystack_access_code?: string | null
                    paystack_authorization_url?: string | null
                    paystack_trx_ref?: string | null
                    amount?: number
                    currency?: string
                    email?: string
                    status?: 'pending' | 'success' | 'failed' | 'abandoned' | 'reversed'
                    channel?: string | null
                    card_type?: string | null
                    card_last4?: string | null
                    bank?: string | null
                    trip_id?: string | null
                    booking_id?: string | null
                    payment_type?: 'savings_deposit' | 'booking_payment'
                    description?: string | null
                    metadata?: Json
                    paystack_response?: Json
                    webhook_received_at?: string | null
                    webhook_event?: string | null
                    ip_address?: string | null
                    paid_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            admin_role: 'admin' | 'super_admin'
        }
    }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type PaymentMethod = Database['public']['Tables']['payment_methods']['Row']
export type PaymentMethodInsert = Database['public']['Tables']['payment_methods']['Insert']
export type PaymentMethodUpdate = Database['public']['Tables']['payment_methods']['Update']

export type Trip = Database['public']['Tables']['trips']['Row']
export type TripInsert = Database['public']['Tables']['trips']['Insert']
export type TripUpdate = Database['public']['Tables']['trips']['Update']

export type WishlistItem = Database['public']['Tables']['wishlist']['Row']
export type WishlistItemInsert = Database['public']['Tables']['wishlist']['Insert']
export type WishlistItemUpdate = Database['public']['Tables']['wishlist']['Update']

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export type Destination = Database['public']['Tables']['destinations']['Row']
export type DestinationInsert = Database['public']['Tables']['destinations']['Insert']
export type DestinationUpdate = Database['public']['Tables']['destinations']['Update']

export type AppEvent = Database['public']['Tables']['events']['Row']
export type AppEventInsert = Database['public']['Tables']['events']['Insert']
export type AppEventUpdate = Database['public']['Tables']['events']['Update']

// Paystack payment types
export type PaystackPayment = Database['public']['Tables']['paystack_payments']['Row']
export type PaystackPaymentInsert = Database['public']['Tables']['paystack_payments']['Insert']
export type PaystackPaymentUpdate = Database['public']['Tables']['paystack_payments']['Update']
export type PaystackPaymentStatus = 'pending' | 'success' | 'failed' | 'abandoned' | 'reversed'
export type PaystackPaymentType = 'savings_deposit' | 'booking_payment'

// Enum types
export type TripCategory = 'beach' | 'mountain' | 'city' | 'adventure' | 'cultural' | 'event'
export type GoalType = 'flexible' | 'locked'
export type EventType = 'concert' | 'festival' | 'sports' | 'conference' | 'other'
export type TripStatus = 'active' | 'completed' | 'cancelled'
export type TransactionType = 'deposit' | 'withdrawal' | 'booking_payment' | 'refund'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'
export type PaymentMethodType = 'mpesa' | 'card' | 'bank'
export type SavingsFrequency = 'daily' | 'weekly' | 'monthly'
export type AdminUser = Database['public']['Tables']['admin_users']['Row']
export type AdminRole = Database['public']['Enums']['admin_role']
