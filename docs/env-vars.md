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
- `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and future Stripe secrets must never be exposed in browser code.

## Later public-site integrations

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

The standalone ops dashboard has its own env docs in `kokosthief/adventure-therapy-ops`.
