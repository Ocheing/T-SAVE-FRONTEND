/// <reference path="../deno.d.ts" />
// @ts-nocheck — Deno runtime (not Node.js); type-checked by Deno, not tsc
// Paystack Payment Verification Edge Function
// Called after user returns from Paystack checkout
// Verifies the payment on the server side - NEVER trust client-side verification
// Deploy with: supabase functions deploy paystack-verify

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
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

        // Parse request
        const { reference } = await req.json()
        if (!reference) {
            return new Response(
                JSON.stringify({ error: 'Reference is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Check that this payment belongs to the user
        const { data: payment, error: lookupError } = await supabaseAdmin
            .from('paystack_payments')
            .select('*')
            .eq('paystack_reference', reference)
            .eq('user_id', user.id)
            .single()

        if (lookupError || !payment) {
            return new Response(
                JSON.stringify({ error: 'Payment not found or access denied' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Idempotency: already verified
        if (payment.status === 'success') {
            return new Response(
                JSON.stringify({
                    success: true,
                    data: {
                        status: 'success',
                        amount: payment.amount / 100, // Convert back to KES
                        reference: payment.paystack_reference,
                        channel: payment.channel,
                        paid_at: payment.paid_at,
                        already_verified: true,
                    },
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Verify with Paystack API (server-side only!)
        const verifyResponse = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            {
                headers: {
                    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            }
        )

        const verifyData = await verifyResponse.json()

        if (!verifyData.status) {
            return new Response(
                JSON.stringify({ error: verifyData.message || 'Verification failed' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const txnData = verifyData.data

        // Verify amount matches (prevent tampering)
        if (txnData.amount !== payment.amount) {
            console.error('Amount mismatch!', { expected: payment.amount, got: txnData.amount })

            await supabaseAdmin
                .from('paystack_payments')
                .update({
                    status: 'failed',
                    metadata: { error: 'Amount mismatch', paystack_response: verifyData }
                })
                .eq('paystack_reference', reference)

            return new Response(
                JSON.stringify({ error: 'Amount verification failed' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Map Paystack status to our status
        let mappedStatus: string
        switch (txnData.status) {
            case 'success':
                mappedStatus = 'success'
                break
            case 'failed':
                mappedStatus = 'failed'
                break
            case 'abandoned':
                mappedStatus = 'abandoned'
                break
            case 'reversed':
                mappedStatus = 'reversed'
                break
            default:
                mappedStatus = 'pending'
        }

        // Use the DB function to process the payment (handles idempotency + savings update)
        const { data: processResult, error: processError } = await supabaseAdmin
            .rpc('process_paystack_payment', {
                p_reference: reference,
                p_status: mappedStatus,
                p_channel: txnData.channel || null,
                p_card_type: txnData.authorization?.card_type || null,
                p_card_last4: txnData.authorization?.last4 || null,
                p_bank: txnData.authorization?.bank || null,
                p_paystack_trx_ref: txnData.id?.toString() || null,
                p_paid_at: txnData.paid_at || null,
                p_metadata: verifyData,
            })

        if (processError) {
            console.error('Process error:', processError)
            return new Response(
                JSON.stringify({ error: 'Failed to process payment' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    status: mappedStatus,
                    amount: txnData.amount / 100,
                    currency: txnData.currency,
                    reference: reference,
                    channel: txnData.channel,
                    card_type: txnData.authorization?.card_type,
                    card_last4: txnData.authorization?.last4,
                    bank: txnData.authorization?.bank,
                    paid_at: txnData.paid_at,
                    processing_result: processResult,
                },
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Verify error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
