# Environment variables

Copy the relevant values into `.env.local` for local development and into Vercel project settings for production/preview deployments.

## Required for protected `/ops`

The live v0 uses a server-side PIN cookie first, so the dashboard is protected even before Supabase Auth is fully configured.

```bash
OPS_PIN=2909
OPS_SESSION_SECRET=use-a-long-random-string
```

## Required for Supabase-backed `/ops`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://izomzgseckrweydevsff.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPS_ALLOWED_EMAILS=henry@example.com,rob@example.com
```

Notes:

- The Supabase project is the organisation-level `adventure therapy` project, not only 8 Lakes Tours.
- 8 Lakes Tours is the first `tour_projects` row in that database.
- Do not commit `.env.local`; it is intentionally ignored by git.
- The anon key is designed for client/server app config, but still keep it out of committed source.
- The committed code has a temporary `2909` PIN fallback because Henry explicitly asked for it for the live v0; set `OPS_PIN` in Vercel so future PIN changes do not require a commit.

## Later integrations

```bash
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ALLOWED_USER_IDS=
```

Never expose these in browser code or public docs with real values.
