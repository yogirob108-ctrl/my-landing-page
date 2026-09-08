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
  'delivery_unknown',
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
  idempotency_key text not null,
  contact_name text,
  contact_email text not null,
  owner text,
  source text not null default 'gmail',
  sync_provider text not null default 'gmail',
  sync_lease_token uuid not null,
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
  unique (project_id, gmail_account_email, gmail_thread_id),
  unique (id, project_id, gmail_account_email, gmail_thread_id),
  unique (converted_booking_id),
  constraint inquiries_mailbox_normalized check (
    gmail_account_email = lower(btrim(gmail_account_email)) and gmail_account_email <> ''
  ),
  constraint inquiries_sync_provider_normalized check (
    sync_provider = lower(btrim(sync_provider)) and sync_provider <> ''
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
create unique index inquiries_project_idempotency_key_idx
  on public.inquiries (project_id, idempotency_key);

create table public.inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.tour_projects(id),
  inquiry_id uuid not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  gmail_account_email text not null,
  gmail_thread_id text not null,
  gmail_message_id text not null,
  provider text not null default 'gmail',
  provider_message_id text,
  sync_lease_token uuid,
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
  unique (project_id, gmail_account_email, gmail_message_id),
  constraint inquiry_messages_provider_account_message_key
    unique (provider, project_id, gmail_account_email, provider_message_id),
  constraint inquiry_messages_sync_lease_direction check (
    (direction = 'inbound' and sync_lease_token is not null)
    or (direction = 'outbound' and sync_lease_token is null)
  ),
  constraint inquiry_messages_mailbox_normalized check (
    gmail_account_email = lower(btrim(gmail_account_email)) and gmail_account_email <> ''
  ),
  constraint inquiry_messages_inquiry_thread_fkey
    foreign key (inquiry_id, project_id, gmail_account_email, gmail_thread_id)
    references public.inquiries(id, project_id, gmail_account_email, gmail_thread_id)
    on delete cascade
);

create unique index inquiry_messages_idempotency_key_idx
  on public.inquiry_messages (project_id, idempotency_key);
create index inquiry_messages_inquiry_occurred_idx
  on public.inquiry_messages (project_id, inquiry_id, occurred_at desc);
create index inquiry_messages_gmail_thread_idx
  on public.inquiry_messages (project_id, gmail_account_email, gmail_thread_id, occurred_at);

create table public.inquiry_drafts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.tour_projects(id),
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
  send_claim_expires_at timestamptz,
  claim_token uuid,
  send_attempt_id uuid,
  rfc_message_id text,
  send_error text,
  last_failure_kind text check (last_failure_kind in ('pre_provider', 'delivery_unknown')),
  failure_recorded_at timestamptz,
  retry_authorized_by text,
  retry_authorized_at timestamptz,
  retry_reason text,
  sent_subject text,
  sent_body_text text,
  sent_at timestamptz,
  provider text not null default 'gmail',
  provider_message_id text,
  gmail_account_email text not null,
  gmail_draft_id text,
  gmail_message_id text,
  gmail_thread_id text not null,
  reconciled_by text,
  reconciled_at timestamptz,
  reconciliation_evidence jsonb,
  reconciliation_checked_at timestamptz,
  reconciliation_match_count integer check (reconciliation_match_count is null or reconciliation_match_count >= 0),
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
    foreign key (inquiry_id, project_id, gmail_account_email, gmail_thread_id)
    references public.inquiries(id, project_id, gmail_account_email, gmail_thread_id)
    on delete cascade,
  constraint inquiry_drafts_reviewed_at_requires_reviewer check (
    reviewed_at is null or reviewer is not null
  ),
  constraint inquiry_drafts_approved_state_requires_review check (
    state not in ('approved', 'sending', 'delivery_unknown', 'send_failed', 'sent')
    or (approved_at is not null and reviewer is not null)
  ),
  constraint inquiry_drafts_sending_claim_consistent check (
    (state in ('sending', 'delivery_unknown', 'sent') and claim_token is not null and send_claimed_at is not null
      and send_claim_expires_at is not null
      and send_attempt_id is not null and rfc_message_id is not null
      and sent_subject is not null and sent_body_text is not null)
    or (state not in ('sending', 'delivery_unknown', 'sent') and claim_token is null)
  ),
  constraint inquiry_drafts_sent_requires_approval check (
    sent_at is null or (approved_at is not null and reviewer is not null)
  ),
  constraint inquiry_drafts_sent_state_consistent check (
    (state = 'sent') = (sent_at is not null)
  )
);

create unique index inquiry_drafts_idempotency_key_idx
  on public.inquiry_drafts (project_id, idempotency_key);
create unique index inquiry_drafts_provider_message_idx
  on public.inquiry_drafts (provider, project_id, gmail_account_email, provider_message_id)
  where provider_message_id is not null;
create unique index inquiry_drafts_gmail_draft_idx
  on public.inquiry_drafts (project_id, gmail_account_email, gmail_draft_id)
  where gmail_draft_id is not null;
create unique index inquiry_drafts_gmail_message_idx
  on public.inquiry_drafts (project_id, gmail_account_email, gmail_message_id)
  where gmail_message_id is not null;
create index inquiry_drafts_review_queue_idx
  on public.inquiry_drafts (project_id, state, created_at);
create index inquiry_drafts_inquiry_updated_idx
  on public.inquiry_drafts (inquiry_id, updated_at desc);

create table public.inquiry_import_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.tour_projects(id),
  provider text not null default 'gmail',
  gmail_account_email text not null,
  gmail_history_id_from text,
  gmail_history_id_to text,
  idempotency_key text not null,
  lease_token uuid,
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
  on public.inquiry_import_runs (project_id, gmail_account_email, started_at desc);
create unique index inquiry_import_runs_project_idempotency_key_idx
  on public.inquiry_import_runs (project_id, idempotency_key);
create index inquiry_import_runs_status_started_idx
  on public.inquiry_import_runs (status, started_at desc);

create table public.inquiry_sync_state (
  provider text not null,
  project_id uuid not null references public.tour_projects(id),
  gmail_account_email text not null,
  gmail_history_id text,
  lease_token uuid,
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiry_sync_state_pkey primary key (provider, project_id, gmail_account_email),
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

create or replace function public.require_inquiry_sync_lease(
  p_provider text,
  p_project_id uuid,
  p_gmail_account_email text,
  p_lease_token uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_lease_token is null or not exists (
    select 1
    from public.inquiry_sync_state sync
    where sync.provider = lower(btrim(p_provider))
      and sync.project_id = p_project_id
      and sync.gmail_account_email = lower(btrim(p_gmail_account_email))
      and sync.lease_token = p_lease_token
      and sync.lease_expires_at > clock_timestamp()
  ) then
    raise exception 'An unexpired inquiry sync lease owned by this worker is required' using errcode = '55000';
  end if;
end;
$$;

create or replace function public.guard_inquiry_sync_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new jsonb := to_jsonb(new);
  v_old jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
begin
  if tg_table_name = 'inquiries' then
    if tg_op = 'INSERT' or (
      v_new -> 'gmail_account_email' is distinct from v_old -> 'gmail_account_email'
      or v_new -> 'gmail_thread_id' is distinct from v_old -> 'gmail_thread_id'
      or v_new -> 'contact_name' is distinct from v_old -> 'contact_name'
      or v_new -> 'contact_email' is distinct from v_old -> 'contact_email'
      or v_new -> 'first_inbound_at' is distinct from v_old -> 'first_inbound_at'
      or v_new -> 'last_inbound_at' is distinct from v_old -> 'last_inbound_at'
      or v_new -> 'source' is distinct from v_old -> 'source'
      or v_new -> 'campaign' is distinct from v_old -> 'campaign'
      or v_new -> 'request_type' is distinct from v_old -> 'request_type'
      or v_new -> 'project_id' is distinct from v_old -> 'project_id'
      or v_new -> 'customer_id' is distinct from v_old -> 'customer_id'
      or v_new -> 'idempotency_key' is distinct from v_old -> 'idempotency_key'
      or v_new -> 'sync_provider' is distinct from v_old -> 'sync_provider'
      or v_new -> 'sync_lease_token' is distinct from v_old -> 'sync_lease_token'
    ) then
      perform public.require_inquiry_sync_lease(
        v_new ->> 'sync_provider',
        (v_new ->> 'project_id')::uuid,
        v_new ->> 'gmail_account_email',
        (v_new ->> 'sync_lease_token')::uuid
      );
    end if;
  elsif tg_table_name = 'inquiry_messages' then
    if v_new ->> 'direction' = 'inbound' then
      perform public.require_inquiry_sync_lease(
        v_new ->> 'provider',
        (v_new ->> 'project_id')::uuid,
        v_new ->> 'gmail_account_email',
        (v_new ->> 'sync_lease_token')::uuid
      );
    end if;
  elsif tg_table_name = 'inquiry_import_runs' then
    if tg_op = 'UPDATE' then
      select sync.lease_token into new.lease_token
      from public.inquiry_sync_state sync
      where sync.provider = lower(btrim(new.provider))
        and sync.project_id = new.project_id
        and sync.gmail_account_email = lower(btrim(new.gmail_account_email))
        and sync.lease_expires_at > clock_timestamp();
      perform public.require_inquiry_sync_lease(new.provider, new.project_id, new.gmail_account_email, new.lease_token);
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.guard_inquiry_message_evidence()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Inquiry message provider evidence is immutable' using errcode = '23514';
  end if;

  if new.inquiry_id is distinct from old.inquiry_id
    or new.project_id is distinct from old.project_id
    or new.direction is distinct from old.direction
    or new.gmail_account_email is distinct from old.gmail_account_email
    or new.gmail_thread_id is distinct from old.gmail_thread_id
    or new.gmail_message_id is distinct from old.gmail_message_id
    or new.provider is distinct from old.provider
    or new.provider_message_id is distinct from old.provider_message_id
    or new.sync_lease_token is distinct from old.sync_lease_token
    or new.idempotency_key is distinct from old.idempotency_key
    or new.from_email is distinct from old.from_email
    or new.to_emails is distinct from old.to_emails
    or new.cc_emails is distinct from old.cc_emails
    or new.subject is distinct from old.subject
    or new.body_text is distinct from old.body_text
    or new.body_html is distinct from old.body_html
    or new.raw_headers is distinct from old.raw_headers
    or new.occurred_at is distinct from old.occurred_at
  then
    raise exception 'Inquiry message provider evidence is immutable' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.guard_inquiry_draft_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.state in ('approved', 'sending', 'delivery_unknown', 'send_failed', 'sent') then
      raise exception 'Approved and sent draft evidence cannot be deleted' using errcode = '23514';
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    if new.state <> 'draft' then
      raise exception 'Inquiry drafts must be created in draft state' using errcode = '23514';
    end if;
    return new;
  end if;

  if old.state in ('approved', 'sending', 'delivery_unknown', 'send_failed', 'sent') and (
    new.project_id is distinct from old.project_id
    or new.inquiry_id is distinct from old.inquiry_id
    or new.version is distinct from old.version
    or new.subject is distinct from old.subject
    or new.body_text is distinct from old.body_text
    or new.body_html is distinct from old.body_html
    or new.to_emails is distinct from old.to_emails
    or new.cc_emails is distinct from old.cc_emails
    or new.created_by is distinct from old.created_by
    or new.gmail_account_email is distinct from old.gmail_account_email
    or new.gmail_thread_id is distinct from old.gmail_thread_id
    or new.gmail_draft_id is distinct from old.gmail_draft_id
    or new.in_reply_to is distinct from old.in_reply_to
    or new.reference_message_ids is distinct from old.reference_message_ids
    or new.idempotency_key is distinct from old.idempotency_key
  ) then
    raise exception 'Reviewed draft content, recipients, and source evidence are immutable; create a new version' using errcode = '23514';
  end if;

  if old.state in ('approved', 'sending', 'delivery_unknown', 'send_failed', 'sent') and (
    new.reviewer is distinct from old.reviewer
    or new.review_notes is distinct from old.review_notes
    or new.submitted_for_review_at is distinct from old.submitted_for_review_at
    or new.reviewed_at is distinct from old.reviewed_at
    or new.approved_at is distinct from old.approved_at
  ) then
    raise exception 'Approved review evidence is immutable' using errcode = '23514';
  end if;

  if new.state is distinct from old.state and not (
    (old.state = 'draft' and new.state in ('pending_review', 'cancelled'))
    or (old.state = 'pending_review' and new.state in ('draft', 'approved', 'rejected', 'cancelled'))
    or (old.state = 'approved' and new.state in ('sending', 'rejected', 'cancelled'))
    or (old.state = 'sending' and new.state in ('delivery_unknown', 'send_failed', 'sent'))
    or (old.state = 'delivery_unknown' and new.state in ('send_failed', 'sent'))
    or (old.state = 'send_failed' and new.state = 'approved')
    or (old.state = 'rejected' and new.state in ('draft', 'cancelled'))
  ) then
    raise exception 'Invalid inquiry draft state transition: % -> %', old.state, new.state using errcode = '23514';
  end if;

  if old.state = 'delivery_unknown' and new.state = 'send_failed' and (
    length(trim(coalesce(new.reconciled_by, ''))) = 0
    or new.reconciled_at is null
    or coalesce(new.reconciliation_evidence ->> 'outcome', '') <> 'not_found'
  ) then
    raise exception 'Unknown delivery requires verified negative Gmail reconciliation before retry' using errcode = '23514';
  end if;

  if old.state = 'send_failed' and new.state = 'approved' and (
    length(trim(coalesce(new.retry_authorized_by, ''))) = 0
    or new.retry_authorized_at is null
    or length(trim(coalesce(new.retry_reason, ''))) = 0
  ) then
    raise exception 'Retry requires explicit operator authorization' using errcode = '23514';
  end if;

  if new.state = 'sending' and (
    new.claim_token is null
    or new.send_claimed_at is null
    or new.send_claim_expires_at is null
    or new.send_claim_expires_at <= new.send_claimed_at
    or new.sent_subject is null
    or new.sent_body_text is null
  ) then
    raise exception 'Sending draft requires an owned immutable claim' using errcode = '23514';
  end if;

  if old.state = 'sent' and (
    new.claim_token is distinct from old.claim_token
    or new.send_attempt_id is distinct from old.send_attempt_id
    or new.rfc_message_id is distinct from old.rfc_message_id
    or new.send_claimed_at is distinct from old.send_claimed_at
    or new.send_claim_expires_at is distinct from old.send_claim_expires_at
    or new.provider is distinct from old.provider
    or new.provider_message_id is distinct from old.provider_message_id
    or new.gmail_message_id is distinct from old.gmail_message_id
    or new.gmail_thread_id is distinct from old.gmail_thread_id
    or new.sent_subject is distinct from old.sent_subject
    or new.sent_body_text is distinct from old.sent_body_text
    or new.sent_at is distinct from old.sent_at
    or new.reconciled_by is distinct from old.reconciled_by
    or new.reconciled_at is distinct from old.reconciled_at
    or new.reconciliation_evidence is distinct from old.reconciliation_evidence
  ) then
    raise exception 'Sent provider evidence is immutable' using errcode = '23514';
  end if;

  if old.reconciled_at is not null and (
    new.reconciled_by is distinct from old.reconciled_by
    or new.reconciled_at is distinct from old.reconciled_at
    or new.reconciliation_evidence is distinct from old.reconciliation_evidence
  ) then
    raise exception 'Reconciliation evidence is immutable' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.guard_inquiry_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.project_id is distinct from old.project_id
    or new.gmail_account_email is distinct from old.gmail_account_email
    or new.gmail_thread_id is distinct from old.gmail_thread_id then
    raise exception 'Inquiry scope is immutable' using errcode = '23514';
  end if;
  if new.status is distinct from old.status and not (
    (old.status = 'new' and new.status in ('needs_review', 'drafted', 'contacted', 'replied', 'qualified', 'converted', 'lost', 'ignored'))
    or (old.status = 'needs_review' and new.status in ('drafted', 'contacted', 'replied', 'qualified', 'converted', 'lost', 'ignored'))
    or (old.status = 'drafted' and new.status in ('contacted', 'replied', 'qualified', 'converted', 'lost', 'ignored'))
    or (old.status = 'contacted' and new.status in ('replied', 'qualified', 'converted', 'lost', 'ignored'))
    or (old.status = 'replied' and new.status in ('qualified', 'converted', 'lost', 'ignored'))
    or (old.status = 'qualified' and new.status in ('converted', 'lost', 'ignored'))
  ) then
    raise exception 'Inquiry status regression is not allowed: % -> %', old.status, new.status using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger inquiries_guard_sync_write
before insert or update on public.inquiries
for each row execute function public.guard_inquiry_sync_write();

create trigger inquiries_set_updated_at
before update on public.inquiries
for each row execute function public.set_inquiry_updated_at();

create trigger inquiries_guard_status_transition
before update on public.inquiries
for each row execute function public.guard_inquiry_status_transition();

create trigger inquiry_messages_guard_sync_write
before insert or update on public.inquiry_messages
for each row execute function public.guard_inquiry_sync_write();

create trigger inquiry_messages_guard_evidence
before update or delete on public.inquiry_messages
for each row execute function public.guard_inquiry_message_evidence();

create trigger inquiry_drafts_set_updated_at
before update on public.inquiry_drafts
for each row execute function public.set_inquiry_updated_at();

create trigger inquiry_drafts_guard_transition
before update on public.inquiry_drafts
for each row execute function public.guard_inquiry_draft_transition();

create trigger inquiry_drafts_guard_evidence_delete
before delete on public.inquiry_drafts
for each row execute function public.guard_inquiry_draft_transition();

create trigger inquiry_drafts_guard_insert
before insert on public.inquiry_drafts
for each row execute function public.guard_inquiry_draft_transition();

create trigger inquiry_import_runs_guard_sync_write
before insert or update on public.inquiry_import_runs
for each row execute function public.guard_inquiry_sync_write();

create trigger inquiry_import_runs_set_updated_at
before update on public.inquiry_import_runs
for each row execute function public.set_inquiry_updated_at();

create trigger inquiry_sync_state_set_updated_at
before update on public.inquiry_sync_state
for each row execute function public.set_inquiry_updated_at();

create or replace function public.claim_inquiry_sync(
  p_provider text, p_project_id uuid, p_gmail_account_email text, p_lease_token uuid
)
returns table (provider text, project_id uuid, gmail_account_email text, gmail_history_id text, lease_token uuid, lease_expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if p_project_id is null or p_lease_token is null or length(btrim(coalesce(p_provider, ''))) = 0
    or length(btrim(coalesce(p_gmail_account_email, ''))) = 0 then
    raise exception 'Project, provider, mailbox, and lease token are required' using errcode = '22023';
  end if;
  return query
  insert into public.inquiry_sync_state as sync(provider, project_id, gmail_account_email, lease_token, lease_expires_at)
  values (lower(btrim(p_provider)), p_project_id, lower(btrim(p_gmail_account_email)), p_lease_token, clock_timestamp() + interval '15 minutes')
  on conflict on constraint inquiry_sync_state_pkey do update
    set lease_token = excluded.lease_token, lease_expires_at = excluded.lease_expires_at, updated_at = clock_timestamp()
    where sync.lease_token is null or sync.lease_expires_at < clock_timestamp()
  returning sync.provider, sync.project_id, sync.gmail_account_email, sync.gmail_history_id, sync.lease_token, sync.lease_expires_at;
end;
$$;

create or replace function public.renew_inquiry_sync(
  p_provider text, p_project_id uuid, p_gmail_account_email text, p_lease_token uuid, p_lease_seconds integer
)
returns table (provider text, project_id uuid, gmail_account_email text, gmail_history_id text, lease_token uuid, lease_expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if p_lease_seconds < 30 or p_lease_seconds > 1800 then
    raise exception 'Lease duration must be between 30 and 1800 seconds' using errcode = '22023';
  end if;
  return query update public.inquiry_sync_state sync
  set lease_expires_at = clock_timestamp() + make_interval(secs => p_lease_seconds), updated_at = clock_timestamp()
  where sync.provider = lower(btrim(p_provider)) and sync.project_id = p_project_id
    and sync.gmail_account_email = lower(btrim(p_gmail_account_email))
    and sync.lease_token = p_lease_token and sync.lease_expires_at > clock_timestamp()
  returning sync.provider, sync.project_id, sync.gmail_account_email, sync.gmail_history_id, sync.lease_token, sync.lease_expires_at;
end;
$$;

create or replace function public.finish_inquiry_sync(
  p_provider text, p_project_id uuid, p_gmail_account_email text, p_lease_token uuid, p_gmail_history_id text
)
returns table (provider text, project_id uuid, gmail_account_email text, gmail_history_id text)
language plpgsql security definer set search_path = '' as $$
begin
  if p_gmail_history_id is null or p_gmail_history_id !~ '^[0-9]+$' then
    raise exception 'A numeric Gmail history ID is required' using errcode = '22023';
  end if;
  return query update public.inquiry_sync_state sync
  set gmail_history_id = p_gmail_history_id, lease_token = null, lease_expires_at = null, updated_at = clock_timestamp()
  where sync.provider = lower(btrim(p_provider)) and sync.project_id = p_project_id
    and sync.gmail_account_email = lower(btrim(p_gmail_account_email))
    and sync.lease_token = p_lease_token and sync.lease_expires_at > clock_timestamp()
    and (sync.gmail_history_id is null or p_gmail_history_id::numeric >= sync.gmail_history_id::numeric)
  returning sync.provider, sync.project_id, sync.gmail_account_email, sync.gmail_history_id;
end;
$$;

create or replace function public.release_inquiry_sync_failure(
  p_provider text, p_project_id uuid, p_gmail_account_email text, p_lease_token uuid
)
returns table (provider text, project_id uuid, gmail_account_email text)
language plpgsql security definer set search_path = '' as $$
begin
  return query update public.inquiry_sync_state sync
  set lease_token = null, lease_expires_at = null, updated_at = clock_timestamp()
  where sync.provider = lower(btrim(p_provider)) and sync.project_id = p_project_id
    and sync.gmail_account_email = lower(btrim(p_gmail_account_email))
    and sync.lease_token = p_lease_token and sync.lease_expires_at > clock_timestamp()
  returning sync.provider, sync.project_id, sync.gmail_account_email;
end;
$$;

create or replace function public.reconcile_inbound_inquiry_message(
  p_project_id uuid,
  p_gmail_account_email text,
  p_gmail_thread_id text,
  p_gmail_message_id text,
  p_contact_name text,
  p_contact_email text,
  p_to_emails text[],
  p_cc_emails text[],
  p_subject text,
  p_body_text text,
  p_raw_headers jsonb,
  p_occurred_at timestamptz,
  p_decision text,
  p_request_type text,
  p_inquiry_idempotency_key text,
  p_message_idempotency_key text
)
returns table (inquiry_id uuid, duplicate boolean, message_imported boolean, inquiry_created boolean, terminal_label text)
language plpgsql security definer set search_path = '' as $$
declare
  v_mailbox text := lower(btrim(coalesce(p_gmail_account_email, '')));
  v_inquiry public.inquiries%rowtype;
  v_message public.inquiry_messages%rowtype;
  v_lease uuid;
  v_created boolean := false;
  v_imported boolean := false;
  v_terminal text;
begin
  if p_project_id is null or v_mailbox = '' or length(btrim(coalesce(p_gmail_thread_id, ''))) = 0
    or length(btrim(coalesce(p_gmail_message_id, ''))) = 0 or p_decision not in ('import', 'review')
    or p_occurred_at is null then
    raise exception 'Valid scoped inbound message input is required' using errcode = '22023';
  end if;
  select sync.lease_token into v_lease from public.inquiry_sync_state sync
  where sync.provider = 'gmail' and sync.project_id = p_project_id and sync.gmail_account_email = v_mailbox
    and sync.lease_token is not null and sync.lease_expires_at > clock_timestamp()
  for update;
  if v_lease is null then
    raise exception 'An active scoped Gmail sync lease is required' using errcode = '55000';
  end if;

  select i.* into v_inquiry from public.inquiries i
  where i.project_id = p_project_id and i.gmail_account_email = v_mailbox and i.gmail_thread_id = btrim(p_gmail_thread_id)
  for update;
  if not found then
    insert into public.inquiries(project_id, customer_id, status, gmail_account_email, gmail_thread_id, idempotency_key,
      contact_name, contact_email, source, sync_provider, sync_lease_token, request_type, first_inbound_at, last_inbound_at)
    values (p_project_id, (select c.id from public.customers c where lower(c.email) = lower(btrim(p_contact_email)) order by c.created_at limit 1),
      case when p_decision = 'review' then 'needs_review'::public.inquiry_status else 'new'::public.inquiry_status end,
      v_mailbox, btrim(p_gmail_thread_id), p_inquiry_idempotency_key, nullif(btrim(p_contact_name), ''), lower(btrim(p_contact_email)),
      'gmail', 'gmail', v_lease, nullif(btrim(p_request_type), ''), p_occurred_at, p_occurred_at)
    returning * into v_inquiry;
    v_created := true;
  end if;

  select m.* into v_message from public.inquiry_messages m
  where m.project_id = p_project_id and m.gmail_account_email = v_mailbox and m.gmail_message_id = btrim(p_gmail_message_id);
  if not found then
    v_terminal := case when p_decision = 'review' then 'review' else 'imported' end;
    insert into public.inquiry_messages(project_id, inquiry_id, direction, gmail_account_email, gmail_thread_id, gmail_message_id,
      provider, sync_lease_token, idempotency_key, from_email, to_emails, cc_emails, subject, body_text, raw_headers, occurred_at)
    values (p_project_id, v_inquiry.id, 'inbound', v_mailbox, v_inquiry.gmail_thread_id, btrim(p_gmail_message_id), 'gmail', v_lease,
      p_message_idempotency_key, lower(btrim(p_contact_email)), coalesce(p_to_emails, '{}'::text[]), coalesce(p_cc_emails, '{}'::text[]),
      coalesce(p_subject, ''), coalesce(p_body_text, ''), coalesce(p_raw_headers, '{}'::jsonb) || jsonb_build_object('_terminal_label', v_terminal), p_occurred_at)
    returning * into v_message;
    v_imported := true;
  elsif v_message.inquiry_id <> v_inquiry.id or v_message.gmail_thread_id <> v_inquiry.gmail_thread_id then
    return;
  else
    v_terminal := coalesce(v_message.raw_headers ->> '_terminal_label', case when v_inquiry.status = 'needs_review' then 'review' else 'imported' end);
  end if;

  update public.inquiries i set
    sync_provider = 'gmail', sync_lease_token = v_lease,
    first_inbound_at = (select min(m.occurred_at) from public.inquiry_messages m where m.inquiry_id = i.id and m.direction = 'inbound'),
    last_inbound_at = (select max(m.occurred_at) from public.inquiry_messages m where m.inquiry_id = i.id and m.direction = 'inbound'),
    status = case when i.status in ('new', 'needs_review', 'drafted', 'contacted') and i.last_outbound_at is not null
      and (select max(m.occurred_at) from public.inquiry_messages m where m.inquiry_id = i.id and m.direction = 'inbound') > i.last_outbound_at
      then 'replied'::public.inquiry_status else i.status end,
    updated_at = clock_timestamp()
  where i.id = v_inquiry.id and i.project_id = p_project_id and i.gmail_account_email = v_mailbox
  returning * into v_inquiry;
  return query select v_inquiry.id, not v_imported, v_imported, v_created, v_terminal;
end;
$$;

create or replace function public.create_inquiry_draft(
  p_project_id uuid, p_gmail_account_email text, p_inquiry_id uuid, p_expected_status public.inquiry_status,
  p_subject text, p_body_text text, p_to_email text, p_created_by text, p_in_reply_to text,
  p_reference_message_ids text[], p_idempotency_key text
)
returns table (id uuid, inquiry_id uuid, version integer, state text, subject text, body_text text, to_emails text[])
language plpgsql security definer set search_path = '' as $$
declare v_inquiry public.inquiries%rowtype; v_draft public.inquiry_drafts%rowtype; v_mailbox text := lower(btrim(p_gmail_account_email));
begin
  select d.* into v_draft from public.inquiry_drafts d where d.project_id=p_project_id and d.gmail_account_email=v_mailbox
    and d.inquiry_id=p_inquiry_id and d.idempotency_key=p_idempotency_key;
  if found then
    if v_draft.subject=p_subject and v_draft.body_text=p_body_text and v_draft.to_emails=array[lower(btrim(p_to_email))]
      and v_draft.in_reply_to=p_in_reply_to and v_draft.reference_message_ids=coalesce(p_reference_message_ids,'{}'::text[]) then
      return query select v_draft.id,v_draft.inquiry_id,v_draft.version,v_draft.state::text,v_draft.subject,v_draft.body_text,v_draft.to_emails;
    end if;
    return;
  end if;
  if length(btrim(coalesce(p_subject,'')))=0 or length(btrim(coalesce(p_body_text,'')))=0
    or length(btrim(coalesce(p_to_email,'')))=0 or length(btrim(coalesce(p_created_by,'')))=0
    or length(btrim(coalesce(p_in_reply_to,'')))=0 or cardinality(coalesce(p_reference_message_ids,'{}'::text[]))=0 then
    raise exception 'Complete draft content and reply evidence are required' using errcode='22023';
  end if;
  select i.* into v_inquiry from public.inquiries i where i.id=p_inquiry_id and i.project_id=p_project_id
    and i.gmail_account_email=v_mailbox and i.status=p_expected_status for update;
  if not found or v_inquiry.status not in ('new','needs_review','drafted') then return; end if;
  insert into public.inquiry_drafts(project_id,inquiry_id,version,state,subject,body_text,to_emails,created_by,gmail_account_email,
    gmail_thread_id,in_reply_to,reference_message_ids,idempotency_key)
  values(p_project_id,p_inquiry_id,(select coalesce(max(d.version),0)+1 from public.inquiry_drafts d where d.inquiry_id=p_inquiry_id),
    'draft',btrim(p_subject),p_body_text,array[lower(btrim(p_to_email))],btrim(p_created_by),v_mailbox,v_inquiry.gmail_thread_id,
    btrim(p_in_reply_to),p_reference_message_ids,p_idempotency_key) returning * into v_draft;
  update public.inquiries i set status='drafted',updated_at=clock_timestamp() where i.id=v_inquiry.id and i.status in ('new','needs_review','drafted');
  return query select v_draft.id,v_draft.inquiry_id,v_draft.version,v_draft.state::text,v_draft.subject,v_draft.body_text,v_draft.to_emails;
end;
$$;

create or replace function public.save_inquiry_draft(
  p_project_id uuid, p_gmail_account_email text, p_inquiry_id uuid, p_draft_id uuid, p_expected_version integer,
  p_subject text, p_body_text text, p_to_email text
)
returns table (id uuid, inquiry_id uuid, version integer, state text)
language sql security definer set search_path = '' as $$
  update public.inquiry_drafts d set subject=btrim(p_subject), body_text=p_body_text, to_emails=array[lower(btrim(p_to_email))], updated_at=clock_timestamp()
  where d.id=p_draft_id and d.inquiry_id=p_inquiry_id and d.project_id=p_project_id
    and d.gmail_account_email=lower(btrim(p_gmail_account_email)) and d.version=p_expected_version and d.state='draft'
    and length(btrim(coalesce(p_subject,'')))>0 and length(btrim(coalesce(p_body_text,'')))>0 and length(btrim(coalesce(p_to_email,'')))>0
  returning d.id,d.inquiry_id,d.version,d.state::text;
$$;

create or replace function public.submit_inquiry_draft_for_review(
  p_project_id uuid, p_gmail_account_email text, p_inquiry_id uuid, p_draft_id uuid, p_expected_version integer
)
returns table (id uuid, inquiry_id uuid, version integer, state text)
language sql security definer set search_path = '' as $$
  update public.inquiry_drafts d set state='pending_review',submitted_for_review_at=clock_timestamp(),updated_at=clock_timestamp()
  where d.id=p_draft_id and d.inquiry_id=p_inquiry_id and d.project_id=p_project_id
    and d.gmail_account_email=lower(btrim(p_gmail_account_email)) and d.version=p_expected_version and d.state='draft'
  returning d.id,d.inquiry_id,d.version,d.state::text;
$$;

create or replace function public.approve_inquiry_draft(
  p_project_id uuid, p_gmail_account_email text, p_inquiry_id uuid, p_draft_id uuid, p_expected_version integer, p_reviewer text
)
returns table (id uuid, inquiry_id uuid, version integer, state text)
language sql security definer set search_path = '' as $$
  update public.inquiry_drafts d set state='approved',reviewer=btrim(p_reviewer),reviewed_at=clock_timestamp(),approved_at=clock_timestamp(),updated_at=clock_timestamp()
  where d.id=p_draft_id and d.inquiry_id=p_inquiry_id and d.project_id=p_project_id
    and d.gmail_account_email=lower(btrim(p_gmail_account_email)) and d.version=p_expected_version and d.state='pending_review'
    and length(btrim(coalesce(p_reviewer,'')))>0
  returning d.id,d.inquiry_id,d.version,d.state::text;
$$;

create or replace function public.update_inquiry_pipeline(
  p_project_id uuid, p_gmail_account_email text, p_inquiry_id uuid, p_expected_status public.inquiry_status,
  p_status public.inquiry_status, p_lost_reason text, p_follow_up_at timestamptz
)
returns table (inquiry_id uuid, status text, lost_reason text, next_follow_up_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if p_status='converted' or (p_status='lost' and length(btrim(coalesce(p_lost_reason,'')))=0)
    or (p_status<>'lost' and p_lost_reason is not null) then return; end if;
  if not (p_status=p_expected_status or
    (p_expected_status='new' and p_status in ('needs_review','drafted','contacted','ignored','lost')) or
    (p_expected_status='needs_review' and p_status in ('drafted','contacted','ignored','lost')) or
    (p_expected_status='drafted' and p_status in ('contacted','replied','qualified','ignored','lost')) or
    (p_expected_status='contacted' and p_status in ('replied','qualified','ignored','lost')) or
    (p_expected_status='replied' and p_status in ('qualified','ignored','lost')) or
    (p_expected_status='qualified' and p_status in ('ignored','lost'))) then return; end if;
  return query update public.inquiries i set status=p_status,lost_reason=case when p_status='lost' then btrim(p_lost_reason) else null end,
    lost_at=case when p_status='lost' then coalesce(i.lost_at,clock_timestamp()) else null end,
    qualified_at=case when p_status='qualified' then coalesce(i.qualified_at,clock_timestamp()) else i.qualified_at end,
    next_follow_up_at=case when p_status in ('lost','ignored') then null else p_follow_up_at end,updated_at=clock_timestamp()
  where i.id=p_inquiry_id and i.project_id=p_project_id and i.gmail_account_email=lower(btrim(p_gmail_account_email)) and i.status=p_expected_status
  returning i.id,i.status::text,i.lost_reason,i.next_follow_up_at;
end;
$$;

create or replace function public.claim_inquiry_draft_send(
  p_project_id uuid, p_gmail_account_email text, p_draft_id uuid
)
returns table (id uuid, inquiry_id uuid, to_email text, from_email text, subject text, body text, in_reply_to text,
  "references" text[], gmail_thread_id text, claim_token uuid, send_attempt_id uuid, rfc_message_id text, state text)
language plpgsql security definer set search_path = '' as $$
declare v_draft public.inquiry_drafts%rowtype; v_inquiry public.inquiries%rowtype; v_claim uuid:=gen_random_uuid(); v_attempt uuid:=gen_random_uuid();
begin
  select d.* into v_draft from public.inquiry_drafts d where d.id=p_draft_id and d.project_id=p_project_id
    and d.gmail_account_email=lower(btrim(p_gmail_account_email)) and d.state='approved' and d.approved_at is not null and d.reviewer is not null
    and length(btrim(d.subject))>0 and length(btrim(d.body_text))>0 and cardinality(d.to_emails)>0
    and length(btrim(coalesce(d.in_reply_to,'')))>0 and cardinality(d.reference_message_ids)>0 for update of d;
  if not found then return; end if;
  select i.* into v_inquiry from public.inquiries i where i.id=v_draft.inquiry_id and i.project_id=p_project_id
    and i.gmail_account_email=lower(btrim(p_gmail_account_email)) and i.status not in ('converted','lost','ignored') for update of i;
  if not found then return; end if;
  update public.inquiry_drafts d set state='sending',claim_token=v_claim,send_attempt_id=v_attempt,
    rfc_message_id='<inquiry-'||v_attempt::text||'@ops.8lakestours.com>',send_claimed_at=clock_timestamp(),
    send_claim_expires_at=clock_timestamp()+interval '15 minutes',sent_subject=v_draft.subject,sent_body_text=v_draft.body_text,updated_at=clock_timestamp()
  where d.id=v_draft.id returning * into v_draft;
  return query select v_draft.id,v_draft.inquiry_id,v_draft.to_emails[1],v_draft.gmail_account_email,v_draft.sent_subject,
    v_draft.sent_body_text,v_draft.in_reply_to,v_draft.reference_message_ids,v_draft.gmail_thread_id,v_draft.claim_token,
    v_draft.send_attempt_id,v_draft.rfc_message_id,v_draft.state::text;
end;
$$;

create or replace function public.record_inquiry_draft_send_failure(
  p_project_id uuid, p_gmail_account_email text, p_draft_id uuid, p_claim_token uuid, p_error_code text,
  p_sent_subject text, p_sent_body text
)
returns table (draft_id uuid, inquiry_id uuid, state text)
language sql security definer set search_path = '' as $$
  update public.inquiry_drafts d set state='send_failed',claim_token=null,send_claim_expires_at=null,
    send_error=left(coalesce(nullif(btrim(p_error_code),''),'gmail_pre_send_failed'),100),last_failure_kind='pre_provider',
    failure_recorded_at=clock_timestamp(),updated_at=clock_timestamp()
  where d.id=p_draft_id and d.project_id=p_project_id and d.gmail_account_email=lower(btrim(p_gmail_account_email))
    and d.state='sending' and d.claim_token=p_claim_token and d.send_claim_expires_at>clock_timestamp()
    and d.sent_subject=p_sent_subject and d.sent_body_text=p_sent_body
  returning d.id,d.inquiry_id,d.state::text;
$$;

create or replace function public.record_inquiry_draft_delivery_unknown(
  p_project_id uuid, p_gmail_account_email text, p_draft_id uuid, p_claim_token uuid, p_send_attempt_id uuid,
  p_rfc_message_id text, p_provider_message_id text, p_provider_thread_id text
)
returns table (draft_id uuid, inquiry_id uuid, state text)
language sql security definer set search_path = '' as $$
  update public.inquiry_drafts d set state='delivery_unknown',send_error='Provider delivery outcome is unknown',
    last_failure_kind='delivery_unknown',failure_recorded_at=clock_timestamp(),
    provider_message_id=coalesce(d.provider_message_id,nullif(btrim(p_provider_message_id),'')),
    reconciliation_evidence=coalesce(d.reconciliation_evidence,'{}'::jsonb)||jsonb_strip_nulls(jsonb_build_object('provider_message_id',nullif(btrim(p_provider_message_id),''),'provider_thread_id',nullif(btrim(p_provider_thread_id),''))),
    updated_at=clock_timestamp()
  where d.id=p_draft_id and d.project_id=p_project_id and d.gmail_account_email=lower(btrim(p_gmail_account_email))
    and d.state='sending' and d.claim_token=p_claim_token and d.send_attempt_id=p_send_attempt_id and d.rfc_message_id=p_rfc_message_id
  returning d.id,d.inquiry_id,d.state::text;
$$;

create or replace function public.get_inquiry_draft_send_reconciliation(
  p_project_id uuid, p_gmail_account_email text, p_draft_id uuid
)
returns table (draft_id uuid, inquiry_id uuid, state text, claim_token uuid, send_attempt_id uuid, rfc_message_id text,
  gmail_thread_id text, sent_subject text, sent_body text)
language sql security definer set search_path = '' as $$
  select d.id,d.inquiry_id,d.state::text,d.claim_token,d.send_attempt_id,d.rfc_message_id,d.gmail_thread_id,d.sent_subject,d.sent_body_text
  from public.inquiry_drafts d where d.id=p_draft_id and d.project_id=p_project_id
    and d.gmail_account_email=lower(btrim(p_gmail_account_email)) and d.state in ('sending','delivery_unknown');
$$;

create or replace function public.record_inquiry_draft_reconciliation_check(
  p_project_id uuid, p_gmail_account_email text, p_draft_id uuid, p_claim_token uuid, p_send_attempt_id uuid,
  p_rfc_message_id text, p_match_count integer
)
returns table (draft_id uuid, inquiry_id uuid, state text)
language plpgsql security definer set search_path = '' as $$
declare v_draft public.inquiry_drafts%rowtype;
begin
  if p_match_count<>0 then raise exception 'Only a zero-match reconciliation check may be recorded' using errcode='22023'; end if;
  select d.* into v_draft from public.inquiry_drafts d where d.id=p_draft_id and d.project_id=p_project_id
    and d.gmail_account_email=lower(btrim(p_gmail_account_email)) and d.state in ('sending','delivery_unknown')
    and d.claim_token=p_claim_token and d.send_attempt_id=p_send_attempt_id and d.rfc_message_id=p_rfc_message_id for update;
  if not found then return; end if;
  if v_draft.reconciliation_checked_at is null then
    update public.inquiry_drafts d set state='delivery_unknown',reconciliation_checked_at=clock_timestamp(),reconciliation_match_count=0,
      reconciliation_evidence=coalesce(d.reconciliation_evidence,'{}'::jsonb)||jsonb_build_object('last_match_count',0),updated_at=clock_timestamp()
    where d.id=v_draft.id returning * into v_draft;
  elsif v_draft.reconciliation_match_count<>0 then return; end if;
  return query select v_draft.id,v_draft.inquiry_id,v_draft.state::text;
end;
$$;

create or replace function public.complete_inquiry_draft_send(
  p_project_id uuid, p_gmail_account_email text, p_draft_id uuid, p_claim_token uuid, p_send_attempt_id uuid,
  p_rfc_message_id text, p_provider text, p_provider_message_id text, p_provider_thread_id text,
  p_sent_subject text, p_sent_body text, p_reconcile boolean
)
returns table (draft_id uuid, inquiry_id uuid, state text)
language plpgsql security definer set search_path = '' as $$
declare v_draft public.inquiry_drafts%rowtype; v_inquiry public.inquiries%rowtype; v_message public.inquiry_messages%rowtype;
  v_provider text:=lower(btrim(coalesce(p_provider,''))); v_mailbox text:=lower(btrim(p_gmail_account_email)); v_now timestamptz:=clock_timestamp();
begin
  if v_provider='' or length(btrim(coalesce(p_provider_message_id,'')))=0 or length(btrim(coalesce(p_provider_thread_id,'')))=0 then
    raise exception 'Provider identifiers are required' using errcode='22023'; end if;
  select d.* into v_draft from public.inquiry_drafts d where d.id=p_draft_id and d.project_id=p_project_id and d.gmail_account_email=v_mailbox for update;
  if not found then return; end if;
  select i.* into v_inquiry from public.inquiries i where i.id=v_draft.inquiry_id and i.project_id=p_project_id and i.gmail_account_email=v_mailbox for update;
  if not found then return; end if;
  if v_draft.state='sent' then
    if v_draft.claim_token is distinct from p_claim_token or v_draft.provider is distinct from v_provider
      or v_draft.provider_message_id is distinct from p_provider_message_id or v_draft.gmail_message_id is distinct from p_provider_message_id
      or v_draft.gmail_thread_id is distinct from p_provider_thread_id or v_draft.sent_subject is distinct from p_sent_subject
      or v_draft.sent_body_text is distinct from p_sent_body
      or (p_reconcile and (v_draft.send_attempt_id is distinct from p_send_attempt_id or v_draft.rfc_message_id is distinct from p_rfc_message_id)) then
      raise exception 'Conflicting provider evidence for finalized inquiry draft' using errcode='23514'; end if;
    if not exists(select 1 from public.inquiry_messages m where m.project_id=p_project_id and m.provider=v_provider
      and m.gmail_account_email=v_mailbox and m.provider_message_id=p_provider_message_id and m.inquiry_id=v_draft.inquiry_id
      and m.direction='outbound' and m.gmail_thread_id=p_provider_thread_id and m.subject=p_sent_subject and m.body_text=p_sent_body) then
      raise exception 'Finalized draft is missing matching outbound evidence' using errcode='23514'; end if;
    return query select v_draft.id,v_draft.inquiry_id,'sent'::text; return;
  end if;
  if v_draft.claim_token is distinct from p_claim_token then return; end if;
  if p_reconcile then
    if v_draft.state not in ('sending','delivery_unknown') or v_draft.send_attempt_id is distinct from p_send_attempt_id
      or v_draft.rfc_message_id is distinct from p_rfc_message_id then return; end if;
  elsif v_draft.state<>'sending' or v_draft.send_claim_expires_at<=clock_timestamp() then return; end if;
  if v_draft.sent_subject is distinct from p_sent_subject or v_draft.sent_body_text is distinct from p_sent_body
    or v_draft.gmail_thread_id is distinct from p_provider_thread_id then
    raise exception 'Conflicting provider evidence for inquiry draft' using errcode='23514'; end if;
  insert into public.inquiry_messages(project_id,inquiry_id,direction,gmail_account_email,gmail_thread_id,gmail_message_id,provider,
    provider_message_id,sync_lease_token,idempotency_key,from_email,to_emails,cc_emails,subject,body_text,raw_headers,occurred_at)
  values(p_project_id,v_inquiry.id,'outbound',v_mailbox,p_provider_thread_id,p_provider_message_id,v_provider,p_provider_message_id,null,
    v_provider||':'||p_project_id::text||':'||v_mailbox||':'||p_provider_message_id,v_mailbox,v_draft.to_emails,v_draft.cc_emails,
    p_sent_subject,p_sent_body,jsonb_build_object('in-reply-to',v_draft.in_reply_to,'references',v_draft.reference_message_ids,
      'rfc_message_id',v_draft.rfc_message_id,'send_attempt_id',v_draft.send_attempt_id),v_now)
  on conflict on constraint inquiry_messages_provider_account_message_key do nothing;
  select m.* into v_message from public.inquiry_messages m where m.project_id=p_project_id and m.provider=v_provider
    and m.gmail_account_email=v_mailbox and m.provider_message_id=p_provider_message_id;
  if not found or v_message.inquiry_id<>v_draft.inquiry_id or v_message.direction<>'outbound' or v_message.gmail_thread_id<>p_provider_thread_id
    or v_message.subject<>p_sent_subject or v_message.body_text<>p_sent_body then
    raise exception 'Conflicting provider evidence already exists' using errcode='23514'; end if;
  update public.inquiry_drafts d set state='sent',provider=v_provider,provider_message_id=p_provider_message_id,gmail_message_id=p_provider_message_id,
    sent_at=v_now,send_error=null,reconciled_by=case when p_reconcile then coalesce(d.reconciled_by,'gmail-reconciliation') else d.reconciled_by end,
    reconciled_at=case when p_reconcile then coalesce(d.reconciled_at,v_now) else d.reconciled_at end,
    reconciliation_evidence=case when p_reconcile then coalesce(d.reconciliation_evidence,'{}'::jsonb)||jsonb_build_object('outcome','found','provider_message_id',p_provider_message_id,'provider_thread_id',p_provider_thread_id) else d.reconciliation_evidence end,
    updated_at=v_now where d.id=v_draft.id;
  update public.inquiries i set status=case when i.status in ('new','needs_review','drafted') then 'contacted' else i.status end,
    first_outbound_at=coalesce(i.first_outbound_at,v_now),last_outbound_at=greatest(coalesce(i.last_outbound_at,v_now),v_now),
    next_follow_up_at=case when i.status in ('converted','lost','ignored') then null else coalesce(i.next_follow_up_at,v_now+interval '3 days') end,
    updated_at=v_now where i.id=v_inquiry.id;
  return query select v_draft.id,v_inquiry.id,'sent'::text;
end;
$$;

create or replace function public.finalize_inquiry_draft_send(
  p_project_id uuid, p_gmail_account_email text, p_draft_id uuid, p_claim_token uuid, p_provider text,
  p_provider_message_id text, p_provider_thread_id text, p_sent_subject text, p_sent_body text
)
returns table (draft_id uuid, inquiry_id uuid, state text)
language sql security definer set search_path = '' as $$
  select * from public.complete_inquiry_draft_send(p_project_id,p_gmail_account_email,p_draft_id,p_claim_token,null,null,p_provider,
    p_provider_message_id,p_provider_thread_id,p_sent_subject,p_sent_body,false);
$$;

create or replace function public.reconcile_inquiry_draft_send_acceptance(
  p_project_id uuid, p_gmail_account_email text, p_draft_id uuid, p_claim_token uuid, p_send_attempt_id uuid,
  p_rfc_message_id text, p_provider text, p_provider_message_id text, p_provider_thread_id text, p_sent_subject text, p_sent_body text
)
returns table (draft_id uuid, inquiry_id uuid, state text)
language sql security definer set search_path = '' as $$
  select * from public.complete_inquiry_draft_send(p_project_id,p_gmail_account_email,p_draft_id,p_claim_token,p_send_attempt_id,
    p_rfc_message_id,p_provider,p_provider_message_id,p_provider_thread_id,p_sent_subject,p_sent_body,true);
$$;

create or replace function public.reconcile_inquiry_draft_send(
  p_project_id uuid, p_gmail_account_email text, p_draft_id uuid, p_provider text, p_provider_message_id text,
  p_provider_thread_id text, p_sent_subject text, p_sent_body text, p_verified_by text, p_gmail_evidence jsonb
)
returns table (draft_id uuid, inquiry_id uuid, state text)
language plpgsql security definer set search_path = '' as $$
declare v_draft public.inquiry_drafts%rowtype;
begin
  select d.* into v_draft from public.inquiry_drafts d where d.id=p_draft_id and d.project_id=p_project_id
    and d.gmail_account_email=lower(btrim(p_gmail_account_email));
  if not found then return; end if;
  if length(btrim(coalesce(p_verified_by,'')))=0 or p_gmail_evidence->>'source'<>'gmail_api'
    or lower(p_gmail_evidence->>'gmail_account_email')<>v_draft.gmail_account_email
    or p_gmail_evidence->>'gmail_message_id'<>p_provider_message_id or p_gmail_evidence->>'gmail_thread_id'<>p_provider_thread_id then
    raise exception 'Verified Gmail evidence does not match the draft and provider identifiers' using errcode='23514'; end if;
  return query select * from public.complete_inquiry_draft_send(p_project_id,p_gmail_account_email,p_draft_id,v_draft.claim_token,
    v_draft.send_attempt_id,v_draft.rfc_message_id,p_provider,p_provider_message_id,p_provider_thread_id,p_sent_subject,p_sent_body,true);
end;
$$;

create or replace function public.reconcile_inquiry_draft_not_delivered(
  p_project_id uuid, p_gmail_account_email text, p_draft_id uuid, p_verified_by text, p_gmail_evidence jsonb
)
returns table (draft_id uuid, inquiry_id uuid, state text)
language plpgsql security definer set search_path = '' as $$
begin
  if length(btrim(coalesce(p_verified_by,'')))=0 or p_gmail_evidence->>'source'<>'gmail_api'
    or p_gmail_evidence->>'outcome'<>'not_found' or lower(p_gmail_evidence->>'gmail_account_email')<>lower(btrim(p_gmail_account_email)) then
    raise exception 'Verified negative Gmail API evidence and operator identity are required' using errcode='22023'; end if;
  return query update public.inquiry_drafts d set state='send_failed',claim_token=null,send_claim_expires_at=null,
    reconciled_by=btrim(p_verified_by),reconciled_at=clock_timestamp(),reconciliation_evidence=p_gmail_evidence,
    send_error='Verified by Gmail API as not delivered; operator may authorize retry',updated_at=clock_timestamp()
  where d.id=p_draft_id and d.project_id=p_project_id and d.gmail_account_email=lower(btrim(p_gmail_account_email))
    and (d.state='delivery_unknown' or (d.state='sending' and d.send_claim_expires_at<=clock_timestamp()))
  returning d.id,d.inquiry_id,d.state::text;
end;
$$;

create or replace function public.authorize_inquiry_draft_retry(
  p_project_id uuid, p_gmail_account_email text, p_draft_id uuid, p_authorized_by text, p_reason text
)
returns table (draft_id uuid, inquiry_id uuid, state text)
language plpgsql security definer set search_path = '' as $$
begin
  if length(btrim(coalesce(p_authorized_by,'')))=0 or length(btrim(coalesce(p_reason,'')))=0 then
    raise exception 'Retry authorizer and reason are required' using errcode='22023'; end if;
  return query update public.inquiry_drafts d set state='approved',retry_authorized_by=btrim(p_authorized_by),
    retry_authorized_at=clock_timestamp(),retry_reason=left(btrim(p_reason),1000),send_attempt_id=null,rfc_message_id=null,updated_at=clock_timestamp()
  where d.state='send_failed' and d.id=p_draft_id and d.project_id=p_project_id and d.gmail_account_email=lower(btrim(p_gmail_account_email))
  returning d.id,d.inquiry_id,d.state::text;
end;
$$;

create or replace function public.convert_inquiry(
  p_project_id uuid, p_gmail_account_email text, p_inquiry_id uuid, p_booking_id uuid, p_expected_status public.inquiry_status
)
returns table (inquiry_id uuid, booking_id uuid, status text, converted_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_inquiry public.inquiries%rowtype; v_booking public.bookings%rowtype;
begin
  select i.* into v_inquiry from public.inquiries i where i.id=p_inquiry_id and i.project_id=p_project_id
    and i.gmail_account_email=lower(btrim(p_gmail_account_email)) and i.status=p_expected_status for update;
  if not found or v_inquiry.status not in ('contacted','replied','qualified') then return; end if;
  select b.* into v_booking from public.bookings b where b.id=p_booking_id and b.project_id=p_project_id for update;
  if not found or v_inquiry.customer_id is null or v_booking.customer_id<>v_inquiry.customer_id then return; end if;
  return query update public.inquiries i set status='converted',converted_booking_id=v_booking.id,converted_at=clock_timestamp(),
    next_follow_up_at=null,updated_at=clock_timestamp() where i.id=v_inquiry.id and i.status=p_expected_status
  returning i.id,i.converted_booking_id,i.status::text,i.converted_at;
end;
$$;

revoke all on function public.set_inquiry_updated_at() from public, anon, authenticated;
revoke all on function public.guard_inquiry_draft_transition() from public, anon, authenticated;
revoke all on function public.guard_inquiry_message_evidence() from public, anon, authenticated;
revoke all on function public.guard_inquiry_sync_write() from public, anon, authenticated;
revoke all on function public.guard_inquiry_status_transition() from public, anon, authenticated;
revoke all on function public.require_inquiry_sync_lease(text, uuid, text, uuid) from public, anon, authenticated, service_role;
revoke all on function public.complete_inquiry_draft_send(uuid,text,uuid,uuid,uuid,text,text,text,text,text,text,boolean) from public,anon,authenticated,service_role;

revoke all on function public.claim_inquiry_sync(text,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.claim_inquiry_sync(text,uuid,text,uuid) to service_role;
revoke all on function public.renew_inquiry_sync(text,uuid,text,uuid,integer) from public,anon,authenticated;
grant execute on function public.renew_inquiry_sync(text,uuid,text,uuid,integer) to service_role;
revoke all on function public.finish_inquiry_sync(text,uuid,text,uuid,text) from public,anon,authenticated;
grant execute on function public.finish_inquiry_sync(text,uuid,text,uuid,text) to service_role;
revoke all on function public.release_inquiry_sync_failure(text,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.release_inquiry_sync_failure(text,uuid,text,uuid) to service_role;
revoke all on function public.reconcile_inbound_inquiry_message(uuid,text,text,text,text,text,text[],text[],text,text,jsonb,timestamptz,text,text,text,text) from public,anon,authenticated;
grant execute on function public.reconcile_inbound_inquiry_message(uuid,text,text,text,text,text,text[],text[],text,text,jsonb,timestamptz,text,text,text,text) to service_role;
revoke all on function public.create_inquiry_draft(uuid,text,uuid,public.inquiry_status,text,text,text,text,text,text[],text) from public,anon,authenticated;
grant execute on function public.create_inquiry_draft(uuid,text,uuid,public.inquiry_status,text,text,text,text,text,text[],text) to service_role;
revoke all on function public.save_inquiry_draft(uuid,text,uuid,uuid,integer,text,text,text) from public,anon,authenticated;
grant execute on function public.save_inquiry_draft(uuid,text,uuid,uuid,integer,text,text,text) to service_role;
revoke all on function public.submit_inquiry_draft_for_review(uuid,text,uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.submit_inquiry_draft_for_review(uuid,text,uuid,uuid,integer) to service_role;
revoke all on function public.approve_inquiry_draft(uuid,text,uuid,uuid,integer,text) from public,anon,authenticated;
grant execute on function public.approve_inquiry_draft(uuid,text,uuid,uuid,integer,text) to service_role;
revoke all on function public.update_inquiry_pipeline(uuid,text,uuid,public.inquiry_status,public.inquiry_status,text,timestamptz) from public,anon,authenticated;
grant execute on function public.update_inquiry_pipeline(uuid,text,uuid,public.inquiry_status,public.inquiry_status,text,timestamptz) to service_role;
revoke all on function public.convert_inquiry(uuid,text,uuid,uuid,public.inquiry_status) from public,anon,authenticated;
grant execute on function public.convert_inquiry(uuid,text,uuid,uuid,public.inquiry_status) to service_role;
revoke all on function public.claim_inquiry_draft_send(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.claim_inquiry_draft_send(uuid,text,uuid) to service_role;
revoke all on function public.record_inquiry_draft_send_failure(uuid,text,uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.record_inquiry_draft_send_failure(uuid,text,uuid,uuid,text,text,text) to service_role;
revoke all on function public.record_inquiry_draft_delivery_unknown(uuid,text,uuid,uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.record_inquiry_draft_delivery_unknown(uuid,text,uuid,uuid,uuid,text,text,text) to service_role;
revoke all on function public.get_inquiry_draft_send_reconciliation(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.get_inquiry_draft_send_reconciliation(uuid,text,uuid) to service_role;
revoke all on function public.record_inquiry_draft_reconciliation_check(uuid,text,uuid,uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.record_inquiry_draft_reconciliation_check(uuid,text,uuid,uuid,uuid,text,integer) to service_role;
revoke all on function public.finalize_inquiry_draft_send(uuid,text,uuid,uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.finalize_inquiry_draft_send(uuid,text,uuid,uuid,text,text,text,text,text) to service_role;
revoke all on function public.reconcile_inquiry_draft_send_acceptance(uuid,text,uuid,uuid,uuid,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.reconcile_inquiry_draft_send_acceptance(uuid,text,uuid,uuid,uuid,text,text,text,text,text,text) to service_role;
revoke all on function public.reconcile_inquiry_draft_send(uuid,text,uuid,text,text,text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.reconcile_inquiry_draft_send(uuid,text,uuid,text,text,text,text,text,text,jsonb) to service_role;
revoke all on function public.reconcile_inquiry_draft_not_delivered(uuid,text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.reconcile_inquiry_draft_not_delivered(uuid,text,uuid,text,jsonb) to service_role;
revoke all on function public.authorize_inquiry_draft_retry(uuid,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.authorize_inquiry_draft_retry(uuid,text,uuid,text,text) to service_role;

alter table public.inquiries enable row level security;
alter table public.inquiry_messages enable row level security;
alter table public.inquiry_drafts enable row level security;
alter table public.inquiry_import_runs enable row level security;
alter table public.inquiry_sync_state enable row level security;
revoke all on table public.inquiries, public.inquiry_messages, public.inquiry_drafts,
  public.inquiry_import_runs, public.inquiry_sync_state from public, anon, authenticated;
grant select, insert, update, delete on public.inquiries, public.inquiry_messages,
  public.inquiry_drafts, public.inquiry_import_runs, public.inquiry_sync_state to service_role;
revoke insert, update, delete on public.inquiry_sync_state from service_role;
