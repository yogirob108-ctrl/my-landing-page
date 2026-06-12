-- General booking timeline for manual notes, calls, WhatsApp, emails, payments, and status changes.

create table if not exists booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  event_type text not null check (event_type in ('note','email','whatsapp','phone','payment','status','task','system')),
  direction text not null check (direction in ('inbound','outbound','internal','system')),
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_by text not null default 'ops',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists booking_events_booking_occurred_idx on booking_events (booking_id, occurred_at desc);

alter table booking_events enable row level security;

-- No public anon policies. The protected ops server actions use service-role access.
