-- Adventure Therapy booking operations schema
-- 8 Lakes Tours is the first tour project, but this schema supports multiple tours/retreats.

create extension if not exists pgcrypto;

create type booking_status as enum (
  'application_received',
  'awaiting_payment',
  'confirmed',
  'prep_sent',
  'ready_for_departure',
  'completed',
  'cancelled'
);

create type payment_status as enum (
  'pending',
  'paid',
  'failed',
  'refunded',
  'partially_refunded'
);

create type email_event_status as enum (
  'queued',
  'sent',
  'delivered',
  'bounced',
  'failed'
);

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

create table customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  whatsapp text,
  nationality text,
  emergency_contact text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index customers_email_unique on customers (lower(email));

create table bookings (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique,
  project_id uuid not null references tour_projects(id),
  customer_id uuid not null references customers(id),
  tour_date text not null,
  guest_count integer not null default 1 check (guest_count > 0),
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

create index bookings_project_status_idx on bookings (project_id, status);
create index bookings_customer_idx on bookings (customer_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  provider text not null default 'stripe',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  amount_usd integer not null check (amount_usd >= 0),
  status payment_status not null,
  paid_at timestamptz,
  refunded_at timestamptz,
  raw_event jsonb,
  created_at timestamptz not null default now()
);

create index payments_booking_idx on payments (booking_id);
create unique index payments_stripe_checkout_session_unique on payments (stripe_checkout_session_id) where stripe_checkout_session_id is not null;
create unique index payments_stripe_payment_intent_unique on payments (stripe_payment_intent_id) where stripe_payment_intent_id is not null;

create table email_templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references tour_projects(id) on delete cascade,
  key text not null,
  name text not null,
  subject text not null,
  body_markdown text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, key)
);

create table email_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
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

create index email_events_booking_idx on email_events (booking_id, sent_at desc);
create index email_events_customer_idx on email_events (customer_id, sent_at desc);

create table booking_tasks (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  title text not null,
  task_type text not null,
  due_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index booking_tasks_booking_idx on booking_tasks (booking_id, completed_at, due_at);

insert into tour_projects (
  slug,
  name,
  brand_name,
  contact_email,
  default_online_due_usd,
  default_family_cash_due_usd,
  default_total_trip_value_usd
) values (
  '8-lakes-tours',
  '8 Lakes Tours',
  '8 Lakes Tours',
  'info@8lakestours.com',
  959,
  1140,
  2099
) on conflict (slug) do nothing;

alter table tour_projects enable row level security;
alter table customers enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table email_templates enable row level security;
alter table email_events enable row level security;
alter table booking_tasks enable row level security;

-- RLS policies are intentionally not opened to the public anon role.
-- The dashboard should read/write through authenticated allow-listed admins,
-- and webhook/admin routes should use service-role server-side clients.
