-- =============================================================================
-- Paystack Payments - Production-Ready Payment Table & Functions
-- Run this SQL in your Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- 1. PAYSTACK PAYMENTS TABLE
-- Tracks all Paystack payment transactions with full audit trail
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.paystack_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Paystack-specific fields
  paystack_reference text UNIQUE NOT NULL,   -- Our generated unique reference (idempotency key)
  paystack_access_code text,                 -- Returned by Paystack init
  paystack_authorization_url text,           -- Redirect URL for payment
  paystack_trx_ref text,                     -- Paystack's own transaction reference
  
  -- Payment details
  amount integer NOT NULL CHECK (amount > 0), -- Amount in kobo/cents (Paystack uses smallest unit)
  currency text NOT NULL DEFAULT 'KES',
  email text NOT NULL,
  
  -- Status tracking
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'success', 'failed', 'abandoned', 'reversed')),
  
  -- Payment channel info (populated after verification)
  channel text,                               -- e.g., 'card', 'bank', 'mobile_money', 'ussd'
  card_type text,                             -- e.g., 'visa', 'mastercard'
  card_last4 text,                            -- Last 4 digits of card
  bank text,                                  -- Bank name
  
  -- Linked entities (one or the other)
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,       -- For savings goal payments
  booking_id uuid,                                                    -- For booking payments (future)
  
  -- Purpose tracking
  payment_type text NOT NULL DEFAULT 'savings_deposit'
    CHECK (payment_type IN ('savings_deposit', 'booking_payment')),
  
  -- Metadata
  description text,
  metadata jsonb DEFAULT '{}',                -- Store any extra Paystack response data
  paystack_response jsonb DEFAULT '{}',       -- Full Paystack verification response
  
  -- Webhook tracking
  webhook_received_at timestamptz,
  webhook_event text,
  
  -- IP tracking for fraud prevention
  ip_address text,
  
  -- Timestamps
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_paystack_payments_user_id ON public.paystack_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_paystack_payments_reference ON public.paystack_payments(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_paystack_payments_status ON public.paystack_payments(status);
CREATE INDEX IF NOT EXISTS idx_paystack_payments_trip_id ON public.paystack_payments(trip_id);
CREATE INDEX IF NOT EXISTS idx_paystack_payments_created_at ON public.paystack_payments(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER on_paystack_payments_updated
  BEFORE UPDATE ON public.paystack_payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 2. ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.paystack_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON public.paystack_payments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Users can insert their own payments (initial pending record)
CREATE POLICY "Users can insert own payments"
  ON public.paystack_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only service role (Edge Functions) can update payment status
-- Users should NOT be able to update payment status directly
-- The Edge Function uses the service_role key which bypasses RLS
-- But we allow users to update their own abandoned payments
CREATE POLICY "Users can update own pending payments"
  ON public.paystack_payments FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- =============================================================================
-- 3. FUNCTION: Process successful payment
-- Called by Edge Function after Paystack verification succeeds
-- Handles idempotency - won't double-process already successful payments
-- =============================================================================
CREATE OR REPLACE FUNCTION public.process_paystack_payment(
  p_reference text,
  p_status text,
  p_channel text DEFAULT NULL,
  p_card_type text DEFAULT NULL,
  p_card_last4 text DEFAULT NULL,
  p_bank text DEFAULT NULL,
  p_paystack_trx_ref text DEFAULT NULL,
  p_paid_at timestamptz DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS jsonb AS $$
DECLARE
  v_payment record;
  v_result jsonb;
  v_amount_kes numeric;
BEGIN
  -- Get the payment record
  SELECT * INTO v_payment
  FROM public.paystack_payments
  WHERE paystack_reference = p_reference;
  
  -- Payment not found
  IF v_payment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment not found');
  END IF;
  
  -- Idempotency check: already processed
  IF v_payment.status = 'success' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already processed', 'idempotent', true);
  END IF;
  
  -- Update payment record
  UPDATE public.paystack_payments
  SET 
    status = p_status,
    channel = COALESCE(p_channel, channel),
    card_type = COALESCE(p_card_type, card_type),
    card_last4 = COALESCE(p_card_last4, card_last4),
    bank = COALESCE(p_bank, bank),
    paystack_trx_ref = COALESCE(p_paystack_trx_ref, paystack_trx_ref),
    paid_at = COALESCE(p_paid_at, now()),
    paystack_response = p_metadata,
    updated_at = now()
  WHERE paystack_reference = p_reference;
  
  -- If payment succeeded, create transaction and update savings
  IF p_status = 'success' THEN
    -- Convert from kobo to KES (amount is stored in smallest unit)
    v_amount_kes := v_payment.amount::numeric / 100;
    
    -- Create a transaction record
    INSERT INTO public.transactions (user_id, trip_id, type, amount, description, status)
    VALUES (
      v_payment.user_id,
      v_payment.trip_id,
      CASE 
        WHEN v_payment.payment_type = 'savings_deposit' THEN 'deposit'
        WHEN v_payment.payment_type = 'booking_payment' THEN 'booking_payment'
        ELSE 'deposit'
      END,
      v_amount_kes,
      COALESCE(v_payment.description, 'Paystack payment'),
      'completed'
    );
    -- Note: The existing trigger on_transaction_created will auto-update trip saved_amount
    
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Payment processed successfully',
      'amount_kes', v_amount_kes
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Payment status updated to ' || p_status
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. REALTIME (optional - for live payment status updates)
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE paystack_payments;
