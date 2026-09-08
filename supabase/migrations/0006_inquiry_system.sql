-- Gmail-first inquiry pipeline with human review before outbound sends.
-- This migration is additive so existing booking and public-site clients remain compatible.

create type public.inquiry_status as enum (
  'new',
  'needs_review',
  'drafted',
  'contacted',
  'replied',
  'qualified',
  'converted',
  'lost',
  'ignored'
);

create type public.inquiry_draft_state as enum (
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'sending',
  'send_failed',
  'sent',
  'cancelled'
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.tour_projects(id),
  customer_id uuid references public.customers(id) on delete set null,
  converted_booking_id uuid references public.bookings(id) on delete restrict,
  status public.inquiry_status not null default 'new',
  gmail_account_email text not null,
  gmail_thread_id text not null,
  idempotency_key text not null unique,
  contact_name text,
  contact_email text not null,
  owner text,
  source text not null default 'gmail',
  campaign text,
  request_type text,
  lost_reason text,
  first_inbound_at timestamptz,
  last_inbound_at timestamptz,
  first_outbound_at timestamptz,
  last_outbound_at timestamptz,
  next_follow_up_at timestamptz,
  qualified_at timestamptz,
  converted_at timestamptz,
  lost_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gmail_account_email, gmail_thread_id),
  unique (id, gmail_account_email, gmail_thread_id),
  unique (converted_booking_id),
  constraint inquiries_mailbox_normalized check (
    gmail_account_email = lower(btrim(gmail_account_email)) and gmail_account_email <> ''
  ),
  constraint inquiries_conversion_consistent check (
    (status = 'converted' and converted_booking_id is not null and converted_at is not null)
    or (status <> 'converted' and converted_booking_id is null and converted_at is null)
  ),
  constraint inquiries_lost_reason_required check (
    status <> 'lost' or lost_reason is not null
  ),
  constraint inquiries_inbound_range check (
    first_inbound_at is null or last_inbound_at is null or first_inbound_at <= last_inbound_at
  ),
  constraint inquiries_outbound_range check (
    first_outbound_at is null or last_outbound_at is null or first_outbound_at <= last_outbound_at
  )
);

create index inquiries_status_follow_up_idx on public.inquiries (status, next_follow_up_at);
create index inquiries_owner_status_idx on public.inquiries (owner, status);
create index inquiries_customer_idx on public.inquiries (customer_id);
create index inquiries_converted_booking_idx on public.inquiries (converted_booking_id)
  where converted_booking_id is not null;
create index inquiries_project_created_idx on public.inquiries (project_id, created_at desc);

create table public.inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  gmail_account_email text not null,
  gmail_thread_id text not null,
  gmail_message_id text not null,
  provider text not null default 'gmail',
  provider_message_id text,
  idempotency_key text not null,
  from_email text not null,
  to_emails text[] not null default '{}',
  cc_emails text[] not null default '{}',
  subject text not null,
  body_text text not null,
  body_html text,
  raw_headers jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (gmail_account_email, gmail_message_id),
  constraint inquiry_messages_mailbox_normalized check (
    gmail_account_email = lower(btrim(gmail_account_email)) and gmail_account_email <> ''
  ),
  constraint inquiry_messages_inquiry_thread_fkey
    foreign key (inquiry_id, gmail_account_email, gmail_thread_id)
    references public.inquiries(id, gmail_account_email, gmail_thread_id)
    on delete cascade
);

create unique index inquiry_messages_idempotency_key_idx
  on public.inquiry_messages (idempotency_key);
create unique index inquiry_messages_provider_message_idx
  on public.inquiry_messages (provider, gmail_account_email, provider_message_id)
  where provider_message_id is not null;
create index inquiry_messages_inquiry_occurred_idx
  on public.inquiry_messages (inquiry_id, occurred_at desc);
create index inquiry_messages_gmail_thread_idx
  on public.inquiry_messages (gmail_account_email, gmail_thread_id, occurred_at);

create table public.inquiry_drafts (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null,
  version integer not null check (version > 0),
  state public.inquiry_draft_state not null default 'draft',
  subject text not null,
  body_text text not null,
  body_html text,
  to_emails text[] not null,
  cc_emails text[] not null default '{}',
  created_by text not null default 'ops',
  reviewer text,
  review_notes text,
  submitted_for_review_at timestamptz,
  reviewed_at timestamptz,
  approved_at timestamptz,
  send_claimed_at timestamptz,
  claim_token uuid,
  send_error text,
  sent_subject text,
  sent_body_text text,
  sent_at timestamptz,
  provider text not null default 'gmail',
  provider_message_id text,
  gmail_account_email text not null,
  gmail_draft_id text,
  gmail_message_id text,
  gmail_thread_id text not null,
  in_reply_to text,
  reference_message_ids text[] not null default '{}',
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inquiry_id, version),
  constraint inquiry_drafts_has_recipient check (cardinality(to_emails) > 0),
  constraint inquiry_drafts_mailbox_normalized check (
    gmail_account_email = lower(btrim(gmail_account_email)) and gmail_account_email <> ''
  ),
  constraint inquiry_drafts_inquiry_thread_fkey
    foreign key (inquiry_id, gmail_account_email, gmail_thread_id)
    references public.inquiries(id, gmail_account_email, gmail_thread_id)
    on delete cascade,
  constraint inquiry_drafts_reviewed_at_requires_reviewer check (
    reviewed_at is null or reviewer is not null
  ),
  constraint inquiry_drafts_approved_state_requires_review check (
    state not in ('approved', 'sending', 'send_failed', 'sent')
    or (approved_at is not null and reviewer is not null)
  ),
  constraint inquiry_drafts_sending_claim_consistent check (
    (state = 'sending' and claim_token is not null and send_claimed_at is not null
      and sent_subject is not null and sent_body_text is not null)
    or (state <> 'sending' and claim_token is null)
  ),
  constraint inquiry_drafts_sent_requires_approval check (
    sent_at is null or (approved_at is not null and reviewer is not null)
  ),
  constraint inquiry_drafts_sent_state_consistent check (
    (state = 'sent') = (sent_at is not null)
  )
);

create unique index inquiry_drafts_idempotency_key_idx
  on public.inquiry_drafts (idempotency_key);
create unique index inquiry_drafts_provider_message_idx
  on public.inquiry_drafts (provider, gmail_account_email, provider_message_id)
  where provider_message_id is not null;
create unique index inquiry_drafts_gmail_draft_idx
  on public.inquiry_drafts (gmail_account_email, gmail_draft_id)
  where gmail_draft_id is not null;
create unique index inquiry_drafts_gmail_message_idx
  on public.inquiry_drafts (gmail_account_email, gmail_message_id)
  where gmail_message_id is not null;
create index inquiry_drafts_review_queue_idx
  on public.inquiry_drafts (state, created_at);
create index inquiry_drafts_inquiry_updated_idx
  on public.inquiry_drafts (inquiry_id, updated_at desc);

create table public.inquiry_import_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'gmail',
  gmail_account_email text not null,
  gmail_history_id_from text,
  gmail_history_id_to text,
  idempotency_key text not null unique,
  dry_run boolean not null default false,
  status text not null check (status in ('running', 'completed', 'failed')) default 'running',
  messages_scanned integer not null default 0 check (messages_scanned >= 0),
  messages_imported integer not null default 0 check (messages_imported >= 0),
  inquiries_reviewed integer not null default 0 check (inquiries_reviewed >= 0),
  messages_ignored integer not null default 0 check (messages_ignored >= 0),
  duplicates_skipped integer not null default 0 check (duplicates_skipped >= 0),
  errors_count integer not null default 0 check (errors_count >= 0),
  inquiries_created integer not null default 0 check (inquiries_created >= 0),
  error_code text,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiry_import_runs_completion_consistent check (
    (status = 'running' and completed_at is null)
    or (status in ('completed', 'failed') and completed_at is not null)
  ),
  constraint inquiry_import_runs_mailbox_normalized check (
    gmail_account_email = lower(btrim(gmail_account_email)) and gmail_account_email <> ''
  )
);

create index inquiry_import_runs_account_started_idx
  on public.inquiry_import_runs (gmail_account_email, started_at desc);
create index inquiry_import_runs_status_started_idx
  on public.inquiry_import_runs (status, started_at desc);

create table public.inquiry_sync_state (
  provider text not null,
  gmail_account_email text not null,
  gmail_history_id text,
  lease_token uuid,
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (provider, gmail_account_email),
  constraint inquiry_sync_state_mailbox_normalized check (
    gmail_account_email = lower(btrim(gmail_account_email)) and gmail_account_email <> ''
  ),
  constraint inquiry_sync_state_lease_consistent check (
    (lease_token is null and lease_expires_at is null)
    or (lease_token is not null and lease_expires_at is not null)
  )
);

create or replace function public.set_inquiry_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create or replace function public.guard_inquiry_draft_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.state <> 'draft' then
      raise exception 'Inquiry drafts must be created in draft state' using errcode = '23514';
    end if;
    return new;
  end if;

  if old.state in ('approved', 'sending', 'send_failed', 'sent') and (
    new.subject is distinct from old.subject
    or new.body_text is distinct from old.body_text
    or new.to_emails is distinct from old.to_emails
    or new.cc_emails is distinct from old.cc_emails
    or new.gmail_account_email is distinct from old.gmail_account_email
    or new.gmail_thread_id is distinct from old.gmail_thread_id
    or new.in_reply_to is distinct from old.in_reply_to
    or new.reference_message_ids is distinct from old.reference_message_ids
  ) then
    raise exception 'Reviewed draft content and recipients are immutable; create a new version' using errcode = '23514';
  end if;

  if new.state is distinct from old.state and not (
    (old.state = 'draft' and new.state in ('pending_review', 'cancelled'))
    or (old.state = 'pending_review' and new.state in ('draft', 'approved', 'rejected', 'cancelled'))
    or (old.state = 'approved' and new.state in ('sending', 'rejected', 'cancelled'))
    or (old.state = 'sending' and new.state in ('send_failed', 'sent'))
    or (old.state = 'rejected' and new.state in ('draft', 'cancelled'))
  ) then
    raise exception 'Invalid inquiry draft state transition: % -> %', old.state, new.state using errcode = '23514';
  end if;

  if new.state = 'sending' and (
    new.claim_token is null
    or new.send_claimed_at is null
    or new.sent_subject is null
    or new.sent_body_text is null
  ) then
    raise exception 'Sending draft requires an owned immutable claim' using errcode = '23514';
  end if;

  if old.state = 'sent' and (
    new.provider is distinct from old.provider
    or new.provider_message_id is distinct from old.provider_message_id
    or new.gmail_message_id is distinct from old.gmail_message_id
    or new.sent_at is distinct from old.sent_at
  ) then
    raise exception 'Sent provider evidence is immutable' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger inquiries_set_updated_at
before update on public.inquiries
for each row execute function public.set_inquiry_updated_at();

create trigger inquiry_drafts_set_updated_at
before update on public.inquiry_drafts
for each row execute function public.set_inquiry_updated_at();

create trigger inquiry_drafts_guard_transition
before update on public.inquiry_drafts
for each row execute function public.guard_inquiry_draft_transition();

create trigger inquiry_drafts_guard_insert
before insert on public.inquiry_drafts
for each row execute function public.guard_inquiry_draft_transition();

create trigger inquiry_import_runs_set_updated_at
before update on public.inquiry_import_runs
for each row execute function public.set_inquiry_updated_at();

create trigger inquiry_sync_state_set_updated_at
before update on public.inquiry_sync_state
for each row execute function public.set_inquiry_updated_at();

create or replace function public.claim_inquiry_sync(
  p_provider text,
  p_gmail_account_email text,
  p_lease_token uuid
)
returns table (
  provider text,
  gmail_account_email text,
  gmail_history_id text,
  lease_token uuid,
  lease_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_lease_token is null then
    raise exception 'Lease token is required' using errcode = '22023';
  end if;

  return query
  insert into public.inquiry_sync_state as sync (
    provider,
    gmail_account_email,
    lease_token,
    lease_expires_at
  ) values (
    lower(btrim(p_provider)),
    lower(btrim(p_gmail_account_email)),
    p_lease_token,
    clock_timestamp() + interval '15 minutes'
  )
  on conflict (provider, gmail_account_email) do update
  set lease_token = excluded.lease_token,
      lease_expires_at = excluded.lease_expires_at,
      updated_at = clock_timestamp()
  where sync.lease_token is null or sync.lease_expires_at < clock_timestamp()
  returning sync.provider, sync.gmail_account_email, sync.gmail_history_id, sync.lease_token, sync.lease_expires_at;
end;
$$;

create or replace function public.finish_inquiry_sync(
  p_provider text,
  p_gmail_account_email text,
  p_lease_token uuid,
  p_gmail_history_id text
)
returns table (provider text, gmail_account_email text, gmail_history_id text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_gmail_history_id is null or p_gmail_history_id !~ '^[0-9]+$' then
    raise exception 'A numeric Gmail history ID is required' using errcode = '22023';
  end if;

  return query
  update public.inquiry_sync_state sync
  set gmail_history_id = p_gmail_history_id,
      lease_token = null,
      lease_expires_at = null,
      updated_at = clock_timestamp()
  where sync.provider = lower(btrim(p_provider))
    and sync.gmail_account_email = lower(btrim(p_gmail_account_email))
    and sync.lease_token = p_lease_token
    and (sync.gmail_history_id is null or p_gmail_history_id::numeric >= sync.gmail_history_id::numeric)
  returning sync.provider, sync.gmail_account_email, sync.gmail_history_id;
end;
$$;

create or replace function public.release_inquiry_sync_failure(
  p_provider text,
  p_gmail_account_email text,
  p_lease_token uuid
)
returns table (provider text, gmail_account_email text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.inquiry_sync_state sync
  set lease_token = null,
      lease_expires_at = null,
      updated_at = clock_timestamp()
  where sync.provider = lower(btrim(p_provider))
    and sync.gmail_account_email = lower(btrim(p_gmail_account_email))
    and sync.lease_token = p_lease_token
  returning sync.provider, sync.gmail_account_email;
end;
$$;

create or replace function public.claim_inquiry_draft_send(p_draft_id uuid)
returns table (
  id uuid,
  inquiry_id uuid,
  claim_token uuid,
  state text,
  to_email text,
  from_email text,
  subject text,
  body text,
  gmail_thread_id text,
  in_reply_to text,
  "references" text[]
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_draft public.inquiry_drafts%rowtype;
  v_inquiry public.inquiries%rowtype;
  v_claim_token uuid := gen_random_uuid();
begin
  select d, i
  into v_draft, v_inquiry
  from public.inquiry_drafts d
  join public.inquiries i on i.id = d.inquiry_id
  where d.id = p_draft_id
    and d.state = 'approved'
    and d.approved_at is not null
    and d.reviewer is not null
    and length(trim(d.subject)) > 0
    and length(trim(d.body_text)) > 0
    and cardinality(d.to_emails) > 0
    and length(trim(d.gmail_account_email)) > 0
    and length(trim(coalesce(d.gmail_thread_id, i.gmail_thread_id))) > 0
    and length(trim(coalesce(d.in_reply_to, ''))) > 0
    and cardinality(d.reference_message_ids) > 0
  for update of d;

  if not found then
    return;
  end if;

  update public.inquiry_drafts d
  set state = 'sending',
      claim_token = v_claim_token,
      send_claimed_at = now(),
      sent_subject = v_draft.subject,
      sent_body_text = v_draft.body_text,
      send_error = null,
      updated_at = now()
  where d.id = v_draft.id;

  return query select
    v_draft.id,
    v_draft.inquiry_id,
    v_claim_token,
    'sending'::text,
    v_draft.to_emails[1],
    v_draft.gmail_account_email,
    v_draft.subject,
    v_draft.body_text,
    coalesce(v_draft.gmail_thread_id, v_inquiry.gmail_thread_id),
    v_draft.in_reply_to,
    v_draft.reference_message_ids;
end;
$$;

create or replace function public.record_inquiry_draft_send_failure(
  p_draft_id uuid,
  p_claim_token uuid,
  p_error text,
  p_sent_subject text,
  p_sent_body text
)
returns table (draft_id uuid, inquiry_id uuid, state text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.inquiry_drafts d
  set state = 'send_failed',
      claim_token = null,
      send_error = left(coalesce(nullif(trim(p_error), ''), 'Gmail send failed'), 1000),
      updated_at = now()
  where d.id = p_draft_id
    and d.state = 'sending'
    and d.claim_token = p_claim_token
    and d.sent_subject = p_sent_subject
    and d.sent_body_text = p_sent_body
  returning d.id, d.inquiry_id, d.state::text;
end;
$$;

create or replace function public.finalize_inquiry_draft_send(
  p_draft_id uuid,
  p_claim_token uuid,
  p_provider text,
  p_provider_message_id text,
  p_provider_thread_id text,
  p_sent_subject text,
  p_sent_body text
)
returns table (draft_id uuid, inquiry_id uuid, state text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_draft public.inquiry_drafts%rowtype;
  v_inquiry public.inquiries%rowtype;
begin
  if length(trim(coalesce(p_provider, ''))) = 0
    or length(trim(coalesce(p_provider_message_id, ''))) = 0
    or length(trim(coalesce(p_provider_thread_id, ''))) = 0 then
    raise exception 'Provider identifiers are required' using errcode = '22023';
  end if;

  select d, i
  into v_draft, v_inquiry
  from public.inquiry_drafts d
  join public.inquiries i on i.id = d.inquiry_id
  where d.id = p_draft_id
    and d.state = 'sending'
    and d.claim_token = p_claim_token
    and d.sent_subject = p_sent_subject
    and d.sent_body_text = p_sent_body
    and p_provider_thread_id = coalesce(d.gmail_thread_id, i.gmail_thread_id)
  for update of d, i;

  if not found then
    return;
  end if;

  update public.inquiry_drafts d
  set state = 'sent',
      claim_token = null,
      provider = p_provider,
      provider_message_id = p_provider_message_id,
      gmail_message_id = p_provider_message_id,
      gmail_thread_id = p_provider_thread_id,
      sent_at = now(),
      send_error = null,
      updated_at = now()
  where d.id = v_draft.id;

  insert into public.inquiry_messages (
    inquiry_id,
    direction,
    gmail_account_email,
    gmail_thread_id,
    gmail_message_id,
    provider,
    provider_message_id,
    idempotency_key,
    from_email,
    to_emails,
    cc_emails,
    subject,
    body_text,
    raw_headers,
    occurred_at
  ) values (
    v_inquiry.id,
    'outbound',
    v_draft.gmail_account_email,
    p_provider_thread_id,
    p_provider_message_id,
    p_provider,
    p_provider_message_id,
    p_provider || ':' || v_draft.gmail_account_email || ':' || p_provider_message_id,
    v_draft.gmail_account_email,
    v_draft.to_emails,
    v_draft.cc_emails,
    p_sent_subject,
    p_sent_body,
    jsonb_build_object('in-reply-to', v_draft.in_reply_to, 'references', v_draft.reference_message_ids),
    now()
  );

  update public.inquiries i
  set status = 'contacted',
      first_outbound_at = coalesce(i.first_outbound_at, now()),
      last_outbound_at = now(),
      next_follow_up_at = coalesce(i.next_follow_up_at, now() + interval '3 days'),
      updated_at = now()
  where i.id = v_inquiry.id;

  return query select v_draft.id, v_inquiry.id, 'sent'::text;
end;
$$;

create or replace function public.convert_inquiry(
  p_inquiry_id uuid,
  p_booking_id uuid
)
returns table (inquiry_id uuid, booking_id uuid, status text, converted_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inquiry public.inquiries%rowtype;
  v_booking public.bookings%rowtype;
begin
  select * into v_inquiry
  from public.inquiries
  where id = p_inquiry_id
  for update;

  if not found then
    raise exception 'Inquiry not found' using errcode = 'P0002';
  end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found' using errcode = 'P0002';
  end if;

  if v_inquiry.status not in ('contacted', 'replied', 'qualified') then
    raise exception 'Inquiry must be contacted, replied, or qualified before conversion' using errcode = '23514';
  end if;
  if v_booking.project_id <> v_inquiry.project_id then
    raise exception 'Booking belongs to another project' using errcode = '23514';
  end if;
  if v_inquiry.customer_id is null or v_booking.customer_id <> v_inquiry.customer_id then
    raise exception 'Booking customer does not match inquiry customer' using errcode = '23514';
  end if;

  return query
  update public.inquiries i
  set status = 'converted',
      converted_booking_id = v_booking.id,
      converted_at = clock_timestamp(),
      next_follow_up_at = null,
      updated_at = clock_timestamp()
  where i.id = v_inquiry.id
  returning i.id, i.converted_booking_id, i.status::text, i.converted_at;
end;
$$;

revoke all on function public.set_inquiry_updated_at() from public, anon, authenticated;
revoke all on function public.guard_inquiry_draft_transition() from public, anon, authenticated;
revoke all on function public.claim_inquiry_sync(text, text, uuid) from public, anon, authenticated;
grant execute on function public.claim_inquiry_sync(text, text, uuid) to service_role;
revoke all on function public.finish_inquiry_sync(text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.finish_inquiry_sync(text, text, uuid, text) to service_role;
revoke all on function public.release_inquiry_sync_failure(text, text, uuid) from public, anon, authenticated;
grant execute on function public.release_inquiry_sync_failure(text, text, uuid) to service_role;
revoke all on function public.convert_inquiry(uuid, uuid) from public, anon, authenticated;
grant execute on function public.convert_inquiry(uuid, uuid) to service_role;

revoke all on function public.claim_inquiry_draft_send(uuid) from public, anon, authenticated;
grant execute on function public.claim_inquiry_draft_send(uuid) to service_role;
revoke all on function public.record_inquiry_draft_send_failure(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.record_inquiry_draft_send_failure(uuid, uuid, text, text, text) to service_role;
revoke all on function public.finalize_inquiry_draft_send(uuid, uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.finalize_inquiry_draft_send(uuid, uuid, text, text, text, text, text) to service_role;

alter table public.inquiries enable row level security;
alter table public.inquiry_messages enable row level security;
alter table public.inquiry_drafts enable row level security;
alter table public.inquiry_import_runs enable row level security;
alter table public.inquiry_sync_state enable row level security;

-- Inquiry data is private. Dashboard and automation routes use server-side service-role clients.
revoke all on table public.inquiries, public.inquiry_messages, public.inquiry_drafts,
  public.inquiry_import_runs, public.inquiry_sync_state from public, anon, authenticated;
grant select, insert, update, delete on public.inquiries, public.inquiry_messages,
  public.inquiry_drafts, public.inquiry_import_runs, public.inquiry_sync_state to service_role;
