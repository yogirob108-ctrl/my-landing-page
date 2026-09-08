import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const migrationsUrl = new URL('../supabase/migrations/', import.meta.url);

async function inquiryMigrationName() {
  const names = (await readdir(migrationsUrl)).filter((name) => name.endsWith('_inquiry_system.sql'));
  assert.equal(names.length, 1, `expected one inquiry migration, found: ${names.join(', ')}`);
  return names[0];
}

async function readMigration() {
  return readFile(new URL(await inquiryMigrationName(), migrationsUrl), 'utf8');
}

test('migration creates the inquiry lifecycle and all inquiry tables', async () => {
  const sql = await readMigration();

  assert.match(sql, /create type public\.inquiry_status as enum\s*\([\s\S]*'new'[\s\S]*'needs_review'[\s\S]*'drafted'[\s\S]*'contacted'[\s\S]*'replied'[\s\S]*'qualified'[\s\S]*'converted'[\s\S]*'lost'[\s\S]*'ignored'[\s\S]*\)/i);
  for (const table of ['inquiries', 'inquiry_messages', 'inquiry_drafts', 'inquiry_import_runs', 'inquiry_sync_state']) {
    assert.match(sql, new RegExp(`create table public\\.${table}\\s*\\(`, 'i'));
  }
});

test('inquiries link customers and conversions without changing existing tables', async () => {
  const sql = await readMigration();

  assert.match(sql, /customer_id uuid references public\.customers\(id\) on delete set null/i);
  assert.match(sql, /converted_booking_id uuid references public\.bookings\(id\) on delete restrict/i);
  assert.match(sql, /gmail_account_email text not null/i);
  assert.match(sql, /gmail_thread_id text not null/i);
  assert.match(sql, /unique \(project_id, gmail_account_email, gmail_thread_id\)/i);
  assert.match(sql, /inquiries_project_idempotency_key_idx[\s\S]*\(project_id, idempotency_key\)/i);
  assert.match(sql, /first_inbound_at timestamptz/i);
  assert.match(sql, /last_inbound_at timestamptz/i);
  assert.match(sql, /first_outbound_at timestamptz/i);
  assert.match(sql, /last_outbound_at timestamptz/i);
  assert.match(sql, /next_follow_up_at timestamptz/i);
  assert.match(sql, /owner text/i);
  assert.match(sql, /source text not null/i);
  assert.match(sql, /campaign text/i);
  assert.match(sql, /request_type text/i);
  assert.match(sql, /lost_reason text/i);
  assert.doesNotMatch(sql, /alter table public\.(customers|bookings)\b/i);
});

test('messages are idempotent Gmail records attached to an inquiry', async () => {
  const sql = await readMigration();

  assert.match(sql, /create table public\.inquiry_messages\s*\([\s\S]*project_id uuid not null[\s\S]*inquiry_id uuid not null,[\s\S]*foreign key \(inquiry_id, project_id, gmail_account_email, gmail_thread_id\)/i);
  assert.match(sql, /gmail_message_id text not null/i);
  assert.match(sql, /unique \(project_id, gmail_account_email, gmail_message_id\)/i);
  assert.match(sql, /create unique index inquiry_messages_idempotency_key_idx[\s\S]*\(project_id, idempotency_key\)/i);
  assert.match(sql, /direction text not null check \(direction in \('inbound', 'outbound'\)\)/i);
  assert.match(sql, /occurred_at timestamptz not null/i);
});

test('drafts preserve editable content and enforce review before send', async () => {
  const sql = await readMigration();

  assert.match(sql, /create type public\.inquiry_draft_state as enum\s*\([\s\S]*'draft'[\s\S]*'pending_review'[\s\S]*'approved'[\s\S]*'rejected'[\s\S]*'sending'[\s\S]*'sent'[\s\S]*'cancelled'[\s\S]*\)/i);
  assert.match(sql, /version integer not null check \(version > 0\)/i);
  assert.match(sql, /subject text not null/i);
  assert.match(sql, /body_text text not null/i);
  assert.match(sql, /reviewer text/i);
  assert.match(sql, /approved_at timestamptz/i);
  assert.match(sql, /sent_at timestamptz/i);
  assert.match(sql, /gmail_account_email text not null/i);
  assert.match(sql, /gmail_draft_id text/i);
  assert.match(sql, /gmail_message_id text/i);
  assert.match(sql, /provider_message_id text/i);
  assert.match(sql, /unique \(inquiry_id, version\)/i);
  assert.match(sql, /create unique index inquiry_drafts_gmail_draft_idx[\s\S]*\(project_id, gmail_account_email, gmail_draft_id\)/i);
  assert.match(sql, /create unique index inquiry_drafts_gmail_message_idx[\s\S]*\(project_id, gmail_account_email, gmail_message_id\)/i);
  assert.match(sql, /constraint inquiry_drafts_sent_requires_approval[\s\S]*sent_at is null[\s\S]*approved_at is not null[\s\S]*reviewer is not null/i);
  assert.match(sql, /create unique index inquiry_drafts_idempotency_key_idx[\s\S]*\(project_id, idempotency_key\)/i);
});

test('import runs support resumable idempotent Gmail synchronization', async () => {
  const sql = await readMigration();

  assert.match(sql, /create table public\.inquiry_import_runs\s*\([\s\S]*gmail_account_email text not null/i);
  assert.match(sql, /gmail_history_id_from text/i);
  assert.match(sql, /gmail_history_id_to text/i);
  assert.match(sql, /inquiry_import_runs_project_idempotency_key_idx[\s\S]*\(project_id, idempotency_key\)/i);
  assert.match(sql, /status text not null check \(status in \('running', 'completed', 'failed'\)\)/i);
  assert.match(sql, /started_at timestamptz not null/i);
  assert.match(sql, /completed_at timestamptz/i);
});

test('draft sends are claimed and finalized transactionally without automatic retries', async () => {
  const sql = await readMigration();

  assert.match(sql, /claim_token uuid/i);
  assert.match(sql, /send_error text/i);
  assert.match(sql, /sent_subject text/i);
  assert.match(sql, /sent_body_text text/i);
  assert.match(sql, /create or replace function public\.claim_inquiry_draft_send\s*\(\s*p_project_id uuid,\s*p_gmail_account_email text,\s*p_draft_id uuid\s*\)/i);
  assert.match(sql, /for update/i);
  assert.match(sql, /state\s*=\s*'sending'/i);
  assert.match(sql, /gen_random_uuid\(\)/i);
  assert.match(sql, /create or replace function public\.record_inquiry_draft_send_failure/i);
  assert.match(sql, /state\s*=\s*'send_failed'/i);
  assert.match(sql, /create or replace function public\.finalize_inquiry_draft_send/i);
  assert.match(sql, /insert into public\.inquiry_messages/i);
  assert.match(sql, /direction[\s\S]*'outbound'/i);
  assert.match(sql, /status = case[\s\S]*then 'contacted'[\s\S]*else i\.status/i);
  assert.match(sql, /security definer/i);
  assert.match(sql, /revoke all on function public\.claim_inquiry_draft_send/i);
  assert.match(sql, /grant execute on function public\.claim_inquiry_draft_send/i);
});

test('import runs expose truthful classification and failure counts', async () => {
  const sql = await readMigration();

  for (const column of ['dry_run', 'inquiries_reviewed', 'messages_ignored', 'duplicates_skipped', 'errors_count']) {
    assert.match(sql, new RegExp(`${column}\\s+`, 'i'));
  }
  assert.match(sql, /error_code text/i);
});

test('draft review freezes recipients and message content after approval', async () => {
  const sql = await readMigration();

  assert.match(sql, /to_emails text\[\] not null/i);
  assert.match(sql, /cc_emails text\[\] not null default '\{\}'/i);
  assert.match(sql, /cardinality\(to_emails\) > 0/i);
  assert.match(sql, /create or replace function public\.guard_inquiry_draft_transition/i);
  assert.match(sql, /old\.state in \('approved', 'sending', 'delivery_unknown', 'send_failed', 'sent'\)/i);
  for (const field of ['subject', 'body_text', 'to_emails', 'cc_emails', 'gmail_account_email', 'gmail_thread_id', 'in_reply_to', 'reference_message_ids']) {
    assert.match(sql, new RegExp(`new\\.${field} is distinct from old\\.${field}`, 'i'));
  }
  assert.match(sql, /before update on public\.inquiry_drafts/i);
});

test('mailbox sync uses an exclusive lease and monotonic cursor RPCs', async () => {
  const sql = await readMigration();

  assert.match(sql, /create table public\.inquiry_sync_state/i);
  assert.match(sql, /primary key \(provider, project_id, gmail_account_email\)/i);
  assert.match(sql, /lease_token uuid/i);
  assert.match(sql, /lease_expires_at timestamptz/i);
  assert.match(sql, /create or replace function public\.claim_inquiry_sync/i);
  assert.match(sql, /on conflict on constraint inquiry_sync_state_pkey do update/i);
  assert.match(sql, /lease_expires_at < clock_timestamp\(\)/i);
  assert.match(sql, /create or replace function public\.finish_inquiry_sync/i);
  assert.match(sql, /gmail_history_id = p_gmail_history_id/i);
});

test('messages and drafts cannot cross Gmail account or thread boundaries', async () => {
  const sql = await readMigration();

  assert.match(sql, /unique \(id, project_id, gmail_account_email, gmail_thread_id\)/i);
  assert.match(sql, /foreign key \(inquiry_id, project_id, gmail_account_email, gmail_thread_id\)[\s\S]*references public\.inquiries\(id, project_id, gmail_account_email, gmail_thread_id\)/i);
  assert.match(sql, /provider, project_id, gmail_account_email, provider_message_id/i);
});

test('booking conversion is explicit, unique, consistent and project-safe', async () => {
  const sql = await readMigration();

  assert.match(sql, /converted_booking_id uuid references public\.bookings\(id\) on delete restrict/i);
  assert.match(sql, /unique \(converted_booking_id\)/i);
  assert.match(sql, /status = 'converted'[\s\S]*converted_booking_id is not null[\s\S]*converted_at is not null/i);
  assert.match(sql, /status <> 'converted'[\s\S]*converted_booking_id is null[\s\S]*converted_at is null/i);
  assert.match(sql, /create or replace function public\.convert_inquiry/i);
  assert.match(sql, /where b\.id=p_booking_id and b\.project_id=p_project_id/i);
  assert.match(sql, /v_booking\.customer_id<>v_inquiry\.customer_id/i);
});

test('updated timestamps and least-privilege grants are enforced centrally', async () => {
  const sql = await readMigration();

  assert.match(sql, /create or replace function public\.set_inquiry_updated_at/i);
  for (const table of ['inquiries', 'inquiry_drafts', 'inquiry_import_runs', 'inquiry_sync_state']) {
    assert.match(sql, new RegExp(`before update on public\\.${table}`, 'i'));
  }
  assert.doesNotMatch(sql, /grant all on table public\.inquir/i);
  assert.match(sql, /grant select, insert, update, delete[\s\S]*to service_role/i);
});

test('draft claim and finalization load row variables with PostgreSQL-valid selects', async () => {
  const sql = await readMigration();

  assert.doesNotMatch(sql, /select\s+d\s*,\s*i\s+into\s+v_draft\s*,\s*v_inquiry/i);
  assert.doesNotMatch(sql, /select\s+d\.\*\s*,\s*i\.\*\s+into\s+v_draft\s*,\s*v_inquiry/i);
  assert.match(sql, /select d\.\*[\s\S]*into v_draft[\s\S]*select i\.\*[\s\S]*into v_inquiry/i);
});

test('inquiry migration has a unique timestamp version and excludes cancellation DDL', async () => {
  const names = await readdir(migrationsUrl);
  const inquiryName = await inquiryMigrationName();

  assert.match(inquiryName, /^\d{14}_inquiry_system\.sql$/);
  assert.ok(inquiryName > '0006_booking_cancellation_decisions.sql');
  assert.ok(!names.includes('0006_inquiry_system.sql'));
  assert.ok(!names.includes('0006_booking_cancellation_decisions.sql'));
  assert.doesNotMatch(await readMigration(), /booking_cancellation|cancellation_decision/i);
});

test('sync claim targets its named primary-key constraint without PLpgSQL ambiguity', async () => {
  const sql = await readMigration();

  assert.match(sql, /constraint inquiry_sync_state_pkey primary key \(provider, project_id, gmail_account_email\)/i);
  assert.match(sql, /on conflict on constraint inquiry_sync_state_pkey do update/i);
  assert.doesNotMatch(sql, /on conflict \(provider, project_id, gmail_account_email\) do update/i);
});

test('send finalization is replay-idempotent and rejects conflicting provider evidence', async () => {
  const sql = await readMigration();

  assert.match(sql, /constraint inquiry_messages_provider_account_message_key\s+unique \(provider, project_id, gmail_account_email, provider_message_id\)/i);
  assert.match(sql, /on conflict on constraint inquiry_messages_provider_account_message_key do nothing/i);
  assert.match(sql, /if v_draft\.state='sent' then[\s\S]*is distinct from[\s\S]*raise exception 'Conflicting provider evidence/i);
  assert.match(sql, /create or replace function public\.reconcile_inquiry_draft_send\s*\(/i);
  assert.match(sql, /p_verified_by text[\s\S]*p_gmail_evidence jsonb/i);
  assert.match(sql, /p_gmail_evidence->>'source'[\s\S]*gmail_api/i);
  assert.match(sql, /p_gmail_evidence->>'gmail_account_email'[\s\S]*p_gmail_evidence->>'gmail_message_id'[\s\S]*p_gmail_evidence->>'gmail_thread_id'/i);
  assert.match(sql, /send_claim_expires_at\s*<=\s*clock_timestamp\(\)/i);
});

test('finalization preserves advanced and terminal inquiry states while recording outbound evidence', async () => {
  const sql = await readMigration();

  assert.match(sql, /insert into public\.inquiry_messages[\s\S]*'outbound'/i);
  assert.match(sql, /status=case[\s\S]*when i\.status in \('new','needs_review','drafted'\) then 'contacted'[\s\S]*else i\.status[\s\S]*end/i);
  for (const status of ['replied', 'qualified', 'converted', 'lost', 'ignored']) {
    assert.match(sql, new RegExp(`else i\\.status`, 'i'), `finalization must preserve ${status}`);
  }
  assert.match(sql, /next_follow_up_at=case[\s\S]*when i\.status in \('converted','lost','ignored'\) then null/i);
});

test('send outcomes distinguish definitive failure from unknown delivery and gate retries', async () => {
  const sql = await readMigration();

  assert.match(sql, /'delivery_unknown'/i);
  assert.match(sql, /create or replace function public\.record_inquiry_draft_send_failure/i);
  assert.match(sql, /last_failure_kind='pre_provider'/i);
  assert.match(sql, /create or replace function public\.record_inquiry_draft_delivery_unknown/i);
  assert.match(sql, /state='delivery_unknown'[\s\S]*last_failure_kind='delivery_unknown'/i);
  assert.match(sql, /create or replace function public\.reconcile_inquiry_draft_not_delivered/i);
  assert.match(sql, /create or replace function public\.authorize_inquiry_draft_retry/i);
  assert.match(sql, /where d\.state='send_failed'/i);
  assert.doesNotMatch(sql, /where d\.state in \('send_failed','delivery_unknown'\)/i);
  assert.match(sql, /p_authorized_by text[\s\S]*p_reason text/i);
});

test('sync RPCs renew leases and reject expired ownership for all material writes and release paths', async () => {
  const sql = await readMigration();

  assert.match(sql, /create or replace function public\.renew_inquiry_sync\s*\(/i);
  assert.match(sql, /p_lease_seconds integer/i);
  assert.match(sql, /sync\.lease_token = p_lease_token[\s\S]*sync\.lease_expires_at > clock_timestamp\(\)/i);
  assert.match(sql, /create or replace function public\.require_inquiry_sync_lease\s*\(/i);
  assert.match(sql, /create or replace function public\.guard_inquiry_sync_write\s*\(/i);
  assert.match(sql, /before insert or update on public\.inquiries[\s\S]*guard_inquiry_sync_write/i);
  assert.match(sql, /before insert or update on public\.inquiry_messages[\s\S]*guard_inquiry_sync_write/i);
  assert.match(sql, /before insert or update on public\.inquiry_import_runs[\s\S]*guard_inquiry_sync_write/i);

  for (const fn of ['finish_inquiry_sync', 'release_inquiry_sync_failure']) {
    const body = sql.match(new RegExp(`create or replace function public\\.${fn}[\\s\\S]*?\\$\\$;`, 'i'))?.[0] ?? '';
    assert.match(body, /lease_expires_at > clock_timestamp\(\)/i, `${fn} must reject expired leases`);
  }
});

test('approved review evidence and sent provider evidence are immutable', async () => {
  const sql = await readMigration();

  for (const field of ['reviewer', 'review_notes', 'submitted_for_review_at', 'reviewed_at', 'approved_at']) {
    assert.match(sql, new RegExp(`new\\.${field} is distinct from old\\.${field}`, 'i'));
  }
  for (const field of ['provider', 'provider_message_id', 'gmail_message_id', 'gmail_thread_id', 'sent_subject', 'sent_body_text', 'sent_at', 'reconciled_by', 'reconciled_at', 'reconciliation_evidence']) {
    assert.match(sql, new RegExp(`new\\.${field} is distinct from old\\.${field}`, 'i'));
  }
  assert.match(sql, /create or replace function public\.guard_inquiry_message_evidence/i);
  assert.match(sql, /before update or delete on public\.inquiry_messages/i);
  assert.match(sql, /create trigger inquiry_drafts_guard_evidence_delete[\s\S]*before delete on public\.inquiry_drafts/i);
});

test('inquiry tables have operational indexes and stay private behind service-role access', async () => {
  const sql = await readMigration();

  assert.match(sql, /create index inquiries_status_follow_up_idx on public\.inquiries \(status, next_follow_up_at\)/i);
  assert.match(sql, /create index inquiries_owner_status_idx on public\.inquiries \(owner, status\)/i);
  assert.match(sql, /create index inquiry_messages_inquiry_occurred_idx\s+on public\.inquiry_messages \(project_id, inquiry_id, occurred_at desc\)/i);
  assert.match(sql, /create index inquiry_drafts_review_queue_idx\s+on public\.inquiry_drafts \(project_id, state, created_at\)/i);

  for (const table of ['inquiries', 'inquiry_messages', 'inquiry_drafts', 'inquiry_import_runs', 'inquiry_sync_state']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
  }
  assert.match(sql, /revoke all on table public\.inquiries,[\s\S]*public\.inquiry_sync_state from public, anon, authenticated/i);
  assert.match(sql, /grant select, insert, update, delete on public\.inquiries,[\s\S]*public\.inquiry_sync_state to service_role/i);
  assert.match(sql, /revoke insert, update, delete on public\.inquiry_sync_state from service_role/i);
});

test('Ops RPCs expose the exact project and normalized mailbox scoped signatures', async () => {
  const sql = await readMigration();
  const signatures = {
    claim_inquiry_sync: 'p_provider text, p_project_id uuid, p_gmail_account_email text, p_lease_token uuid',
    renew_inquiry_sync: 'p_provider text, p_project_id uuid, p_gmail_account_email text, p_lease_token uuid, p_lease_seconds integer',
    finish_inquiry_sync: 'p_provider text, p_project_id uuid, p_gmail_account_email text, p_lease_token uuid, p_gmail_history_id text',
    release_inquiry_sync_failure: 'p_provider text, p_project_id uuid, p_gmail_account_email text, p_lease_token uuid',
    create_inquiry_draft: 'p_project_id uuid, p_gmail_account_email text, p_inquiry_id uuid, p_expected_status public.inquiry_status, p_subject text, p_body_text text, p_to_email text, p_created_by text, p_in_reply_to text, p_reference_message_ids text[], p_idempotency_key text',
    save_inquiry_draft: 'p_project_id uuid, p_gmail_account_email text, p_inquiry_id uuid, p_draft_id uuid, p_expected_version integer, p_subject text, p_body_text text, p_to_email text',
    submit_inquiry_draft_for_review: 'p_project_id uuid, p_gmail_account_email text, p_inquiry_id uuid, p_draft_id uuid, p_expected_version integer',
    approve_inquiry_draft: 'p_project_id uuid, p_gmail_account_email text, p_inquiry_id uuid, p_draft_id uuid, p_expected_version integer, p_reviewer text',
    update_inquiry_pipeline: 'p_project_id uuid, p_gmail_account_email text, p_inquiry_id uuid, p_expected_status public.inquiry_status, p_status public.inquiry_status, p_lost_reason text, p_follow_up_at timestamptz',
    convert_inquiry: 'p_project_id uuid, p_gmail_account_email text, p_inquiry_id uuid, p_booking_id uuid, p_expected_status public.inquiry_status',
    claim_inquiry_draft_send: 'p_project_id uuid, p_gmail_account_email text, p_draft_id uuid',
    record_inquiry_draft_send_failure: 'p_project_id uuid, p_gmail_account_email text, p_draft_id uuid, p_claim_token uuid, p_error_code text, p_sent_subject text, p_sent_body text',
    record_inquiry_draft_delivery_unknown: 'p_project_id uuid, p_gmail_account_email text, p_draft_id uuid, p_claim_token uuid, p_send_attempt_id uuid, p_rfc_message_id text, p_provider_message_id text, p_provider_thread_id text',
    finalize_inquiry_draft_send: 'p_project_id uuid, p_gmail_account_email text, p_draft_id uuid, p_claim_token uuid, p_provider text, p_provider_message_id text, p_provider_thread_id text, p_sent_subject text, p_sent_body text',
    get_inquiry_draft_send_reconciliation: 'p_project_id uuid, p_gmail_account_email text, p_draft_id uuid',
    reconcile_inquiry_draft_send_acceptance: 'p_project_id uuid, p_gmail_account_email text, p_draft_id uuid, p_claim_token uuid, p_send_attempt_id uuid, p_rfc_message_id text, p_provider text, p_provider_message_id text, p_provider_thread_id text, p_sent_subject text, p_sent_body text',
    record_inquiry_draft_reconciliation_check: 'p_project_id uuid, p_gmail_account_email text, p_draft_id uuid, p_claim_token uuid, p_send_attempt_id uuid, p_rfc_message_id text, p_match_count integer',
  };
  for (const [name, parameters] of Object.entries(signatures)) {
    const pattern = parameters.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/, /g, '\\s*,\\s*').replace(/ /g, '\\s+');
    assert.match(sql, new RegExp(`create or replace function public\\.${name}\\s*\\(\\s*${pattern}\\s*\\)`, 'i'), name);
  }
  assert.match(sql, /create or replace function public\.reconcile_inbound_inquiry_message\s*\([\s\S]*p_project_id uuid[\s\S]*p_message_idempotency_key text[\s\S]*\)/i);
});

test('scoped storage and send attempts carry project and immutable reconciliation evidence', async () => {
  const sql = await readMigration();
  for (const table of ['inquiry_messages', 'inquiry_drafts', 'inquiry_import_runs', 'inquiry_sync_state']) {
    assert.match(sql, new RegExp(`create table public\\.${table}\\s*\\([\\s\\S]*project_id uuid not null`, 'i'), table);
  }
  assert.match(sql, /send_attempt_id uuid/i);
  assert.match(sql, /rfc_message_id text/i);
  assert.match(sql, /reconciliation_checked_at timestamptz/i);
  assert.match(sql, /reconciliation_match_count integer/i);
  assert.match(sql, /constraint inquiry_sync_state_pkey primary key \(provider, project_id, gmail_account_email\)/i);
});

test('all public Ops RPCs are service-role only and use a fixed safe search path', async () => {
  const sql = await readMigration();
  const functions = [...sql.matchAll(/create or replace function public\.([a-z0-9_]+)\s*\([\s\S]*?\n\)\nreturns/gi)].map((match) => match[1]);
  for (const name of functions.filter((name) => !name.startsWith('guard_') && name !== 'set_inquiry_updated_at')) {
    const body = sql.match(new RegExp(`create or replace function public\\.${name}[\\s\\S]*?\\$\\$;`, 'i'))?.[0] ?? '';
    assert.match(body, /security definer/i, name);
    assert.match(body, /set search_path = ''/i, name);
    assert.match(sql, new RegExp(`revoke all on function public\\.${name}\\(`, 'i'), `${name} revoke`);
  }
});
