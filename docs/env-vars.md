# Environment variables

Copy the relevant values into `.env.local` for local development and into Vercel project settings for production/preview deployments.

## Required for public booking and lead capture

The 8 Lakes public site still writes reservation applications and trip-update leads into the shared Adventure Therapy Supabase project. The internal dashboard itself now lives in the separate `adventure-therapy-ops` repo/app.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://izomzgseckrweydevsff.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM=
INTERNAL_NOTIFICATION_EMAILS=
```

Notes:

- The Supabase project is the organisation-level `adventure therapy` project, not only 8 Lakes Tours.
- 8 Lakes Tours is the first `tour_projects` row in that database.
- Do not commit `.env.local`; it is intentionally ignored by git.
- `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and Stripe secrets must never be exposed in browser code.

## Required for Stripe payment tracking

The public booking form saves a booking with `status = awaiting_payment`. Stripe webhooks then mark that booking paid in Supabase when Checkout completes.

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

Production webhook endpoint:

```txt
https://www.8lakestours.com/api/stripe/webhook
```

Configure this endpoint in Stripe Dashboard → Developers → Webhooks with these events:

```txt
checkout.session.completed
checkout.session.async_payment_succeeded
charge.refunded
refund.created
refund.updated
```

The site passes the generated booking reference into the Stripe Buy Button as `client-reference-id`. The webhook matches Stripe `checkout.session.client_reference_id` back to `bookings.public_reference`, then updates:

```txt
bookings.status = confirmed
bookings.online_paid_usd = Stripe amount_total / 100
booking_events += Stripe payment confirmed
```

If a Stripe session has no booking reference or cannot be matched, the webhook returns success so Stripe does not retry forever, but logs the mismatch server-side for investigation.

The standalone ops dashboard has its own env docs in `kokosthief/adventure-therapy-ops`.
