# Paystack Payment Integration - Setup Guide

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│   Frontend      │────▶│   Supabase Edge      │────▶│  Paystack    │
│   (React)       │     │   Functions           │     │  API         │
│                 │◀────│   (Deno)              │◀────│              │
│   Public key    │     │   Secret key          │     │              │
│   only          │     │   (server-side)       │     │              │
└─────────────────┘     └─────────────────────┘     └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Supabase    │
                        │  Database    │
                        │  (PostgreSQL)│
                        └──────────────┘
```

## Payment Flow

1. **User clicks "Pay"** → `PaystackPaymentModal` opens
2. **Frontend calls Edge Function** → `paystack-initialize` creates a pending DB record & calls Paystack API
3. **User is redirected** → Paystack's hosted checkout page
4. **User completes payment** → Redirected back to `/payment/callback?reference=xxx`
5. **Frontend calls Edge Function** → `paystack-verify` verifies with Paystack API
6. **Edge Function processes payment** → DB function updates payment status + creates transaction + updates savings
7. **Webhook (backup)** → `paystack-webhook` receives Paystack event for redundant verification

## Setup Steps

### 1. Get Paystack API Keys

1. Sign up at [dashboard.paystack.com](https://dashboard.paystack.com)
2. Go to **Settings → API Keys & Webhooks**
3. Copy your **Public Key** and **Secret Key**
4. For testing, use **Test Keys** (start with `pk_test_` and `sk_test_`)

### 2. Set Frontend Environment Variables

Add to your `.env` file:

```env
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
```

### 3. Set Supabase Edge Function Secrets

```bash
# Using Supabase CLI
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
```

Or set via **Supabase Dashboard → Edge Functions → Secrets**.

### 4. Run Database Migration

Run the SQL in `supabase/migrations/paystack_payments.sql` in your Supabase SQL Editor:
- Creates `paystack_payments` table
- Sets up Row Level Security policies
- Creates `process_paystack_payment()` function for idempotent payment processing

### 5. Deploy Edge Functions

```bash
# Deploy all Paystack Edge Functions
supabase functions deploy paystack-initialize
supabase functions deploy paystack-verify
supabase functions deploy paystack-webhook
```

### 6. Configure Paystack Webhook

1. Go to Paystack Dashboard → **Settings → API Keys & Webhooks**
2. Set webhook URL to: `https://<your-supabase-project>.supabase.co/functions/v1/paystack-webhook`
3. Ensure **charge.success** and **charge.failed** events are enabled

## File Structure

```
src/
├── lib/
│   └── paystackService.ts         # Frontend Paystack API client
├── hooks/
│   └── usePaystack.ts             # React Query hooks for payments
├── components/
│   └── PaystackPaymentModal.tsx    # Payment UI modal
├── pages/
│   └── PaymentCallback.tsx         # Handles Paystack redirect + verification
└── types/
    └── database.types.ts           # Updated with PaystackPayment types

supabase/
├── migrations/
│   └── paystack_payments.sql       # Database migration
└── functions/
    ├── paystack-initialize/
    │   └── index.ts                # Initialize payment (server-side)
    ├── paystack-verify/
    │   └── index.ts                # Verify payment (server-side)
    └── paystack-webhook/
        └── index.ts                # Handle Paystack webhooks
```

## Security Features

| Feature | Implementation |
|---------|---------------|
| **Secret key protection** | Only in Edge Functions (never in frontend) |
| **Payment verification** | Server-side only via Paystack API |
| **Amount validation** | Edge Function verifies amount matches DB record |
| **Webhook signature** | HMAC SHA-512 verification |
| **Idempotency** | Unique reference per payment + DB-level check |
| **Duplicate prevention** | `process_paystack_payment()` won't double-process |
| **Row Level Security** | Users can only see their own payments |
| **CORS** | Properly configured on Edge Functions |

## Testing

1. Use Paystack test keys (`pk_test_` / `sk_test_`)
2. Use Paystack test card numbers:
   - **Success**: `4084 0840 8408 4081` (any future expiry, any CVV)
   - **Failed**: `4084 0840 8408 4060`
   - **PIN**: `4084 0840 8408 4048`
3. Monitor payments in Paystack Dashboard → Transactions
4. Check `paystack_payments` table in Supabase for record tracking

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Not authenticated" | Ensure user is logged in before payment |
| "Payment initialization failed" | Check Edge Function logs + Paystack secret key |
| Amount mismatch | Don't modify amount between init and verify |
| Webhook not received | Verify webhook URL in Paystack dashboard |
| Payment stuck on "pending" | Call verify endpoint again or check webhook logs |
