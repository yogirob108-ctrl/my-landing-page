import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL('../supabase/migrations/0006_inquiry_system.sql', import.meta.url);

async function readMigration() {
  return readFile(migrationUrl, 'utf8');
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
  assert.match(sql, /unique \(gmail_account_email, gmail_thread_id\)/i);
  assert.match(sql, /idempotency_key text not null unique/i);
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

  assert.match(sql, /create table public\.inquiry_messages\s*\([\s\S]*inquiry_id uuid not null,[\s\S]*foreign key \(inquiry_id, gmail_account_email, gmail_thread_id\)/i);
  assert.match(sql, /gmail_message_id text not null/i);
  assert.match(sql, /unique \(gmail_account_email, gmail_message_id\)/i);
  assert.match(sql, /create unique index inquiry_messages_idempotency_key_idx[\s\S]*\(idempotency_key\)/i);
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
  assert.match(sql, /create unique index inquiry_drafts_gmail_draft_idx[\s\S]*\(gmail_account_email, gmail_draft_id\)/i);
  assert.match(sql, /create unique index inquiry_drafts_gmail_message_idx[\s\S]*\(gmail_account_email, gmail_message_id\)/i);
  assert.match(sql, /constraint inquiry_drafts_sent_requires_approval[\s\S]*sent_at is null[\s\S]*approved_at is not null[\s\S]*reviewer is not null/i);
  assert.match(sql, /create unique index inquiry_drafts_idempotency_key_idx[\s\S]*\(idempotency_key\)/i);
});

test('import runs support resumable idempotent Gmail synchronization', async () => {
  const sql = await readMigration();

  assert.match(sql, /create table public\.inquiry_import_runs\s*\([\s\S]*gmail_account_email text not null/i);
  assert.match(sql, /gmail_history_id_from text/i);
  assert.match(sql, /gmail_history_id_to text/i);
  assert.match(sql, /idempotency_key text not null unique/i);
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
  assert.match(sql, /create or replace function public\.claim_inquiry_draft_send\s*\(\s*p_draft_id uuid\s*\)/i);
  assert.match(sql, /for update/i);
  assert.match(sql, /state\s*=\s*'sending'/i);
  assert.match(sql, /gen_random_uuid\(\)/i);
  assert.match(sql, /create or replace function public\.record_inquiry_draft_send_failure/i);
  assert.match(sql, /state\s*=\s*'send_failed'/i);
  assert.match(sql, /create or replace function public\.finalize_inquiry_draft_send/i);
  assert.match(sql, /insert into public\.inquiry_messages/i);
  assert.match(sql, /direction[\s\S]*'outbound'/i);
  assert.match(sql, /status\s*=\s*'contacted'/i);
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
  assert.match(sql, /old\.state in \('approved', 'sending', 'send_failed', 'sent'\)/i);
  for (const field of ['subject', 'body_text', 'to_emails', 'cc_emails', 'gmail_account_email', 'gmail_thread_id', 'in_reply_to', 'reference_message_ids']) {
    assert.match(sql, new RegExp(`new\\.${field} is distinct from old\\.${field}`, 'i'));
  }
  assert.match(sql, /before update on public\.inquiry_drafts/i);
});

test('mailbox sync uses an exclusive lease and monotonic cursor RPCs', async () => {
  const sql = await readMigration();

  assert.match(sql, /create table public\.inquiry_sync_state/i);
  assert.match(sql, /primary key \(provider, gmail_account_email\)/i);
  assert.match(sql, /lease_token uuid/i);
  assert.match(sql, /lease_expires_at timestamptz/i);
  assert.match(sql, /create or replace function public\.claim_inquiry_sync/i);
  assert.match(sql, /on conflict \(provider, gmail_account_email\) do update/i);
  assert.match(sql, /lease_expires_at < clock_timestamp\(\)/i);
  assert.match(sql, /create or replace function public\.finish_inquiry_sync/i);
  assert.match(sql, /gmail_history_id = p_gmail_history_id/i);
});

test('messages and drafts cannot cross Gmail account or thread boundaries', async () => {
  const sql = await readMigration();

  assert.match(sql, /unique \(id, gmail_account_email, gmail_thread_id\)/i);
  assert.match(sql, /foreign key \(inquiry_id, gmail_account_email, gmail_thread_id\)[\s\S]*references public\.inquiries\(id, gmail_account_email, gmail_thread_id\)/i);
  assert.match(sql, /provider, gmail_account_email, provider_message_id/i);
});

test('booking conversion is explicit, unique, consistent and project-safe', async () => {
  const sql = await readMigration();

  assert.match(sql, /converted_booking_id uuid references public\.bookings\(id\) on delete restrict/i);
  assert.match(sql, /unique \(converted_booking_id\)/i);
  assert.match(sql, /status = 'converted'[\s\S]*converted_booking_id is not null[\s\S]*converted_at is not null/i);
  assert.match(sql, /status <> 'converted'[\s\S]*converted_booking_id is null[\s\S]*converted_at is null/i);
  assert.match(sql, /create or replace function public\.convert_inquiry/i);
  assert.match(sql, /v_booking\.project_id <> v_inquiry\.project_id/i);
  assert.match(sql, /v_booking\.customer_id <> v_inquiry\.customer_id/i);
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

test('inquiry tables have operational indexes and stay private behind service-role access', async () => {
  const sql = await readMigration();

  assert.match(sql, /create index inquiries_status_follow_up_idx on public\.inquiries \(status, next_follow_up_at\)/i);
  assert.match(sql, /create index inquiries_owner_status_idx on public\.inquiries \(owner, status\)/i);
  assert.match(sql, /create index inquiry_messages_inquiry_occurred_idx\s+on public\.inquiry_messages \(inquiry_id, occurred_at desc\)/i);
  assert.match(sql, /create index inquiry_drafts_review_queue_idx\s+on public\.inquiry_drafts \(state, created_at\)/i);

  for (const table of ['inquiries', 'inquiry_messages', 'inquiry_drafts', 'inquiry_import_runs', 'inquiry_sync_state']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
  }
  assert.match(sql, /revoke all on table public\.inquiries,[\s\S]*public\.inquiry_sync_state from public, anon, authenticated/i);
  assert.match(sql, /grant select, insert, update, delete on public\.inquiries,[\s\S]*public\.inquiry_sync_state to service_role/i);
});
