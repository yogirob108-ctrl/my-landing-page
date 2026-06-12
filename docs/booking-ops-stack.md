# 8 Lakes Tours Booking Ops Stack

## Goal

Build a small owned operating system for the wider Adventure Therapy organisation instead of adopting a heavyweight CRM. 8 Lakes Tours is the first tour project in the system, but the database should support future tours/retreats around the world. The system should answer five questions reliably:

1. Who booked or applied?
2. Did they pay the online reservation amount?
3. Which emails have they received?
4. What preparation items are still missing?
5. How much money is online revenue vs. host-family cash?

## Current reality

- Supabase project name: `adventure therapy`, used for the whole organisation.
- 8 Lakes Tours is the first tour/project in that shared ops database.
- The public booking form currently submits to Formspree.
- Stripe payment is currently a payment link flow.
- Customers pay the online/operator share online and bring the local host-family share in cash.
- Rob is the human point of contact for tour operations.
- The website promises confirmation and practical preparation notes after payment.

## Recommended stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Public site | Existing Next.js app | Keep the marketing site and booking entry point in one repo for now. |
| Intake | Formspree bridge first, direct API later | Do not rip out the working form until the ops workflow is proven. |
| Database | Supabase Postgres | Own customers, bookings, payments, email logs, and task records. |
| Auth | Supabase Auth | Protect `/ops` before any real customer data is displayed. |
| Email | Resend | Send transactional templates from `info@8lakestours.com`; store provider IDs and body snapshots. |
| Payments | Stripe | Payment success/failure/refund webhooks update booking and payment rows. |
| Scheduling | Vercel Cron or Supabase scheduled jobs | Only after manual click-send templates are trusted. |
| Telegram bot | Telegram Bot API + protected ops API endpoints | Mobile command layer for customer lookups, status reports, logs, and draft decision support. |
| Internal alerts | Email first, Telegram later | Rob should get clear internal notifications; Telegram bot can become the on-the-go command interface. |

## Data model

### tour_projects

```sql
create table tour_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand_name text,
  contact_email text,
  default_online_due_usd integer,
  default_family_cash_due_usd integer,
  default_total_trip_value_usd integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### customers

```sql
create table customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  whatsapp text,
  nationality text,
  emergency_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index customers_email_unique on customers (lower(email));
```

### bookings

```sql
create type booking_status as enum (
  'application_received',
  'awaiting_payment',
  'confirmed',
  'prep_sent',
  'ready_for_departure',
  'completed',
  'cancelled'
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique,
  project_id uuid not null references tour_projects(id),
  customer_id uuid not null references customers(id),
  tour_date text not null,
  guest_count integer not null default 1,
  status booking_status not null default 'application_received',
  riding_experience text,
  dietary_notes text,
  notes text,
  form_source text not null default 'formspree',
  formspree_submission_id text,
  total_trip_value_usd integer not null default 2099,
  online_due_usd integer not null default 959,
  online_paid_usd integer not null default 0,
  family_cash_due_usd integer not null default 1140,
  submitted_at timestamptz not null default now(),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### payments

```sql
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  provider text not null default 'stripe',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  amount_usd integer not null,
  status payment_status not null,
  paid_at timestamptz,
  refunded_at timestamptz,
  raw_event jsonb,
  created_at timestamptz not null default now()
);
```

### email_templates

```sql
create table email_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  subject text not null,
  body_markdown text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### email_events

```sql
create type email_event_status as enum ('queued', 'sent', 'delivered', 'bounced', 'failed');

create table email_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  customer_id uuid references customers(id),
  template_key text not null,
  to_email text not null,
  subject text not null,
  body_snapshot text not null,
  provider text not null default 'resend',
  provider_message_id text,
  sent_by text not null,
  status email_event_status not null default 'sent',
  sent_at timestamptz not null default now(),
  raw_response jsonb
);
```

### booking_tasks

```sql
create table booking_tasks (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  title text not null,
  task_type text not null,
  due_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
```

## Email template set

Minimum templates:

1. Application received — form landed, payment may still be pending.
2. Booking confirmed — online reservation payment matched.
3. Packing list — immediate practical preparation.
4. Insurance reminder — before departure if insurance is not confirmed.
5. Arrival details — meeting point, Rob contact, timing, transfer notes.
6. Final checklist — cash, passport, insurance, warm clothing, WhatsApp contact.
7. Post-trip follow-up — feedback, photos, testimonial permission.

## Status machine

```txt
application_received
  -> awaiting_payment
  -> confirmed
  -> prep_sent
  -> ready_for_departure
  -> completed
```

Exception states:

```txt
cancelled
```

Rules:

- Form submission without payment: `application_received` or `awaiting_payment`.
- Stripe payment matched: `confirmed`.
- Booking confirmed email + packing list sent: `prep_sent`.
- Insurance, arrival details, Rob WhatsApp, and cash reminder completed: `ready_for_departure`.
- Trip finished: `completed`.

## Financial rules

Track three different numbers:

- Gross customer trip value: currently `$2,099` per person.
- Online revenue collected: currently `$959` per person.
- Cash due directly to host family: currently `$1,140` per person.

Do **not** treat host-family cash as Stripe revenue. It is operationally tracked so guests know what to bring and Rob knows what is expected locally.

## Telegram bot command layer

The Telegram bot should sit on top of the same database as `/ops`; it must not become a second source of truth. Its job is to let Rob/Henry ask operational questions from a phone and get compact reports without opening the dashboard.

Early bot capabilities:

```txt
/customer maya
/status 8LT-2026-001
/logs 8LT-2026-001
/today
/draft packing 8LT-2026-001
/report july
```

Expected answers:

- Customer lookup by name, email, phone, or booking reference.
- Current booking status, tour date, guest count, online payment state, host-family cash due, missing emails, and open tasks.
- Email log, payment log, internal notes, and major status changes.
- Daily attention report: unpaid applications, overdue prep tasks, upcoming departures, customers missing insurance/arrival details.
- Drafted email replies from approved templates for review.
- Tour-date financial and readiness report.

Safety rules:

- First version should be read-only plus draft generation.
- Sending customer emails from Telegram should require an explicit confirmation step.
- Refunds, payment edits, and booking-status changes should stay in the protected dashboard until the audit trail is solid.
- Bot access must be allow-listed to Rob/Henry Telegram IDs.
- Never expose private customer records in a broad group chat; use a private bot chat or tightly controlled ops group.

## Build phases

### Phase 0 — Prototype dashboard

Implemented as `/ops` with sample data only:

- Metrics.
- Booking cards.
- Email history.
- Missing email indicators.
- Prep tasks.
- Financial split.
- Stack decisions.

### Phase 1 — Protected database-backed dashboard

- Add Supabase client/server helpers.
- Add Supabase Auth and allow-list Rob/Henry emails.
- Move sample data into tables, with 8 Lakes Tours as the first `tour_projects` row.
- Render `/ops` from Supabase.

### Phase 2 — Manual email sending

- Add Resend API key.
- Add server action: send template for booking.
- Store email_events rows with full body snapshot.
- Keep buttons manual until copy and timing are trusted.

### Phase 3 — Intake/payment integrations

- Connect Formspree webhook or replace Formspree with `/api/bookings`.
- Add Stripe webhook route.
- Match payment by booking reference/email and amount.
- Update booking status and payment rows.

### Phase 4 — Automation

- Cron checks upcoming bookings daily.
- Queue insurance reminders, arrival details, final checklist.
- Notify Rob before sending anything that needs human confirmation.

### Phase 5 — Telegram command layer

- Add Telegram bot webhook endpoint.
- Allow-list Rob/Henry Telegram user IDs.
- Implement read-only customer lookup, status, logs, and daily reports.
- Add draft-only message generation from approved templates.
- Add confirmation-gated actions only after audit logging is proven.

## Environment variables for real implementation

```txt
NEXT_PUBLIC_SUPABASE_URL=https://izomzgseckrweydevsff.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
FORMSPREE_WEBHOOK_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ALLOWED_USER_IDS=
OPS_ALLOWED_EMAILS=rob@example.com,henry@example.com
```

## Security notes

- `/ops` must stay `noindex` and must be protected before live data is used.
- Never expose Supabase service role keys to the browser.
- Email event logs store full body snapshots; treat them as customer data.
- Stripe webhooks must verify signatures.
- Formspree webhook ingestion must verify a shared secret or move to direct API submission.
