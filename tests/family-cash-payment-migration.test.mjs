import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL('../supabase/migrations/0005_family_cash_payment.sql', import.meta.url);

async function readMigration() {
  return readFile(migrationUrl, 'utf8');
}

test('migration stores agreed cash separately from delivered cash', async () => {
  const sql = await readMigration();
  assert.match(sql, /family_cash_paid_usd integer not null default 0/);
  assert.match(sql, /family_cash_paid_at timestamptz/);
  assert.match(sql, /set_family_cash_payment/);
});

test('cash RPC serializes the booking update and timeline event atomically', async () => {
  const sql = await readMigration();
  assert.match(sql, /for update/);
  assert.match(sql, /update public\.bookings/);
  assert.match(sql, /insert into public\.booking_events/);
  assert.match(sql, /'payment'/);
  assert.match(sql, /if p_mark_paid is null/);
  assert.match(sql, /p_mark_paid and greatest\(0, coalesce\(v_booking\.family_cash_due_usd, 0\)\) = 0/);
  assert.match(sql, /p_mark_paid and v_previous_paid > greatest\(0, coalesce\(v_booking\.family_cash_due_usd, 0\)\)/);
  assert.match(sql, /v_delivered_now := greatest\(0, v_new_paid - v_previous_paid\)/);
  assert.match(sql, /p_mark_paid and v_previous_paid = v_new_paid/);
  assert.match(sql, /additional cash recorded as delivered directly to the family/);
});

test('cash RPC execution is restricted to the service role', async () => {
  const sql = await readMigration();
  assert.match(sql, /revoke all on function public\.set_family_cash_payment\(text, boolean\) from public/);
  assert.match(sql, /revoke all on function public\.set_family_cash_payment\(text, boolean\) from anon/);
  assert.match(sql, /revoke all on function public\.set_family_cash_payment\(text, boolean\) from authenticated/);
  assert.match(sql, /grant execute on function public\.set_family_cash_payment\(text, boolean\) to service_role/);
});
