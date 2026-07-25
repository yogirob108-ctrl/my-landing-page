import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const siteRoot = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, siteRoot), 'utf8');

test('schema defines the shared booking confirmation lease', () => {
  const migration = read('supabase/migrations/0004_booking_confirmation_lease.sql');
  assert.match(migration, /payment_confirmation_token text/);
  assert.match(migration, /payment_confirmation_claimed_at timestamptz/);
});

test('webhook holds the booking lease across both confirmation sends', () => {
  const source = read('app/api/stripe/webhook/route.ts');
  const claim = source.indexOf('bookingConfirmationToken = await claimBookingConfirmationLease');
  const customerSend = source.indexOf('idempotencyKey: `stripe-${session.id}-customer-payment`');
  const internalSend = source.indexOf('idempotencyKey: `stripe-${session.id}-internal-payment`');
  const release = source.indexOf('await releaseBookingConfirmationLease', internalSend);
  assert.match(source, /export const maxDuration = 60/);
  assert.match(source, /BOOKING_CONFIRMATION_LEASE_MS = 5 \* 60 \* 1000/);
  assert.ok(claim >= 0 && claim < customerSend);
  assert.ok(customerSend < internalSend);
  assert.ok(internalSend < release);
  assert.match(source, /finally \{[\s\S]*releaseBookingConfirmationLease/);
});
