import test from 'node:test';
import assert from 'node:assert/strict';
import { findExistingStripePayment } from '../lib/stripe-payment-match.mjs';

test('matches an operator-created pending payment by checkout session before payment intent', async () => {
  const lookups = [];
  const pendingPayment = { id: 'pending-row' };
  const result = await findExistingStripePayment({
    sessionId: 'cs_ops_123',
    paymentIntentId: 'pi_123',
    lookup: async (column, value) => {
      lookups.push([column, value]);
      return column === 'stripe_checkout_session_id' ? pendingPayment : null;
    },
  });

  assert.deepEqual(result, pendingPayment);
  assert.deepEqual(lookups, [['stripe_checkout_session_id', 'cs_ops_123']]);
});

test('falls back to payment intent when no checkout-session row exists', async () => {
  const lookups = [];
  const paidPayment = { id: 'paid-row' };
  const result = await findExistingStripePayment({
    sessionId: 'cs_public_456',
    paymentIntentId: 'pi_456',
    lookup: async (column, value) => {
      lookups.push([column, value]);
      return column === 'stripe_payment_intent_id' ? paidPayment : null;
    },
  });

  assert.deepEqual(result, paidPayment);
  assert.deepEqual(lookups, [
    ['stripe_checkout_session_id', 'cs_public_456'],
    ['stripe_payment_intent_id', 'pi_456'],
  ]);
});

test('returns null without looking up an absent payment intent', async () => {
  const lookups = [];
  const result = await findExistingStripePayment({
    sessionId: 'cs_789',
    paymentIntentId: '',
    lookup: async (column, value) => {
      lookups.push([column, value]);
      return null;
    },
  });

  assert.equal(result, null);
  assert.deepEqual(lookups, [['stripe_checkout_session_id', 'cs_789']]);
});
