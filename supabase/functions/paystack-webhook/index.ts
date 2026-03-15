/// <reference path="../deno.d.ts" />
// @ts-nocheck — Deno runtime (not Node.js); type-checked by Deno, not tsc
// Paystack Webhook Handler Edge Function
// Receives webhook events from Paystack for real-time payment status updates
// Deploy with: supabase functions deploy paystack-webhook
// Set webhook URL in Paystack dashboard: https://<project>.supabase.co/functions/v1/paystack-webhook

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
    // Webhooks only accept POST
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
    }

    try {
        // Read the raw body for signature verification
        const rawBody = await req.text()

        // Verify webhook signature using HMAC SHA512
        const signature = req.headers.get('x-paystack-signature')
        if (!signature) {
            console.error('Missing Paystack signature header')
            return new Response('Invalid signature', { status: 401 })
        }

        const hash = createHmac('sha512', PAYSTACK_SECRET_KEY)
            .update(rawBody)
            .digest('hex')

        if (hash !== signature) {
            console.error('Webhook signature mismatch')
            return new Response('Invalid signature', { status: 401 })
        }

        // Parse the verified payload
        const payload = JSON.parse(rawBody)
        const event = payload.event
        const data = payload.data

        console.log(`Webhook received: ${event}`, { reference: data?.reference })

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Handle different event types
        switch (event) {
            case 'charge.success': {
                // Payment was successful
                const reference = data.reference

                // Update webhook tracking
                await supabaseAdmin
                    .from('paystack_payments')
                    .update({
                        webhook_received_at: new Date().toISOString(),
                        webhook_event: event,
                    })
                    .eq('paystack_reference', reference)

                // Process the payment using our DB function
                const { data: result, error } = await supabaseAdmin
                    .rpc('process_paystack_payment', {
                        p_reference: reference,
                        p_status: 'success',
                        p_channel: data.channel || null,
                        p_card_type: data.authorization?.card_type || null,
                        p_card_last4: data.authorization?.last4 || null,
                        p_bank: data.authorization?.bank || null,
                        p_paystack_trx_ref: data.id?.toString() || null,
                        p_paid_at: data.paid_at || null,
                        p_metadata: payload,
                    })

                if (error) {
                    console.error('Failed to process webhook payment:', error)
                } else {
                    console.log('Webhook payment processed:', result)
                }
                break
            }

            case 'charge.failed': {
                const reference = data.reference

                await supabaseAdmin
                    .from('paystack_payments')
                    .update({
                        status: 'failed',
                        webhook_received_at: new Date().toISOString(),
                        webhook_event: event,
                        paystack_response: payload,
                    })
                    .eq('paystack_reference', reference)

                console.log('Payment failed via webhook:', reference)
                break
            }

            case 'transfer.success':
            case 'transfer.failed':
            case 'transfer.reversed': {
                // Handle transfer events if needed
                console.log(`Transfer event: ${event}`, data?.reference)
                break
            }

            default:
                console.log(`Unhandled webhook event: ${event}`)
        }

        // Always respond 200 to Paystack (even if processing fails)
        // This prevents Paystack from retrying unnecessarily
        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Webhook processing error:', error)
        // Still return 200 to prevent retries that might cause duplicates
        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})
