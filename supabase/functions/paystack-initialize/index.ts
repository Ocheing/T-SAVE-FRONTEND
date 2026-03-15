/// <reference path="../deno.d.ts" />
// @ts-nocheck — Deno runtime (not Node.js); type-checked by Deno, not tsc
// Paystack Payment Initialization Edge Function
// This runs on the server side - secret keys are safe here
// Deploy with: supabase functions deploy paystack-initialize

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface InitializeRequest {
  amount: number        // Amount in KES (will be converted to kobo)
  email: string
  tripId?: string       // For savings goals
  bookingId?: string    // For bookings
  paymentType: 'savings_deposit' | 'booking_payment'
  description?: string
  callbackUrl: string   // Frontend URL to redirect after payment
  metadata?: Record<string, unknown>
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's JWT to verify identity
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: InitializeRequest = await req.json()

    // Validate required fields
    if (!body.amount || body.amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!body.email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!body.callbackUrl) {
      return new Response(
        JSON.stringify({ error: 'Callback URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique reference for idempotency
    const reference = `TSAVE_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`

    // Amount in kobo (smallest currency unit) - KES uses cents
    const amountInSmallestUnit = Math.round(body.amount * 100)

    // Create Supabase admin client to insert payment record
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Create pending payment record in DB first (for idempotency tracking)
    const { error: insertError } = await supabaseAdmin
      .from('paystack_payments')
      .insert({
        user_id: user.id,
        paystack_reference: reference,
        amount: amountInSmallestUnit,
        currency: 'KES',
        email: body.email,
        status: 'pending',
        trip_id: body.tripId || null,
        booking_id: body.bookingId || null,
        payment_type: body.paymentType || 'savings_deposit',
        description: body.description || null,
        metadata: body.metadata || {},
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || null,
      })

    if (insertError) {
      console.error('DB insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create payment record', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize payment with Paystack API
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        amount: amountInSmallestUnit,
        currency: 'KES',
        reference,
        callback_url: body.callbackUrl,
        metadata: {
          user_id: user.id,
          trip_id: body.tripId || null,
          booking_id: body.bookingId || null,
          payment_type: body.paymentType,
          custom_fields: [
            {
              display_name: 'Customer',
              variable_name: 'customer',
              value: body.email,
            },
            ...(body.description ? [{
              display_name: 'Description',
              variable_name: 'description',
              value: body.description,
            }] : []),
          ],
        },
        channels: ['card', 'bank', 'mobile_money', 'bank_transfer'],
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      // Update payment record as failed
      await supabaseAdmin
        .from('paystack_payments')
        .update({ status: 'failed', metadata: paystackData })
        .eq('paystack_reference', reference)

      return new Response(
        JSON.stringify({ error: paystackData.message || 'Paystack initialization failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update payment record with Paystack response
    await supabaseAdmin
      .from('paystack_payments')
      .update({
        paystack_access_code: paystackData.data.access_code,
        paystack_authorization_url: paystackData.data.authorization_url,
      })
      .eq('paystack_reference', reference)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          authorization_url: paystackData.data.authorization_url,
          access_code: paystackData.data.access_code,
          reference,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Initialize error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
