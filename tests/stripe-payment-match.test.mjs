import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRefundState,
  claimPaymentAsPaid,
  findExistingStripePayment,
  isSupportedPaymentCurrency,
  paymentProcessingDecision,
  resolveStripePaymentBooking,
  shouldProcessRefundStatus,
} from '../lib/stripe-payment-match.mjs';

test('matches an operator-created pending payment by checkout session before payment intent', async () => {
  const lookups = [];
  const pendingPayment = { id: 'pending-row', booking_id: 'booking-a', status: 'pending' };
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

test('existing payment row authoritatively resolves its booking without a Stripe reference', async () => {
  const payment = { id: 'payment-a', booking_id: 'booking-a', status: 'pending' };
  const booking = { id: 'booking-a', public_reference: '8LT-A' };
  const calls = [];
  const result = await resolveStripePaymentBooking({
    existingPayment: payment,
    stripeReference: '',
    lookupBookingById: async id => { calls.push(['id', id]); return booking; },
    lookupBookingByReference: async reference => { calls.push(['reference', reference]); return null; },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.booking, booking);
  assert.deepEqual(calls, [['id', 'booking-a']]);
});

test('rejects a Stripe reference that conflicts with the payment row booking', async () => {
  const result = await resolveStripePaymentBooking({
    existingPayment: { id: 'payment-a', booking_id: 'booking-a', status: 'pending' },
    stripeReference: '8LT-B',
    lookupBookingById: async () => ({ id: 'booking-a', public_reference: '8LT-A' }),
    lookupBookingByReference: async () => ({ id: 'booking-b', public_reference: '8LT-B' }),
  });

  assert.deepEqual(result, { ok: false, reason: 'booking_reference_conflict' });
});

test('new payments still require and resolve a valid Stripe booking reference', async () => {
  const missing = await resolveStripePaymentBooking({
    existingPayment: null,
    stripeReference: '',
    lookupBookingById: async () => null,
    lookupBookingByReference: async () => null,
  });
  assert.deepEqual(missing, { ok: false, reason: 'missing_reference' });

  const booking = { id: 'booking-b', public_reference: '8LT-B' };
  const resolved = await resolveStripePaymentBooking({
    existingPayment: null,
    stripeReference: '8LT-B',
    lookupBookingById: async () => null,
    lookupBookingByReference: async () => booking,
  });
  assert.equal(resolved.ok, true);
  assert.deepEqual(resolved.booking, booking);
});

test('checkout payment currency is strictly USD-only', () => {
  assert.equal(isSupportedPaymentCurrency('usd'), true);
  assert.equal(isSupportedPaymentCurrency('USD'), true);
  assert.equal(isSupportedPaymentCurrency('eur'), false);
  assert.equal(isSupportedPaymentCurrency(''), false);
  assert.equal(isSupportedPaymentCurrency(null), false);
});

test('refund states stay monotonic while paid replays recover incomplete side effects', () => {
  assert.deepEqual(paymentProcessingDecision({ status: 'refunded', amountUsd: 999, processingComplete: true }), { process: false, reason: 'payment_already_refunded', needsClaim: false });
  assert.deepEqual(paymentProcessingDecision({ status: 'partially_refunded', amountUsd: 999, processingComplete: true }), { process: false, reason: 'payment_already_refunded', needsClaim: false });
  assert.deepEqual(paymentProcessingDecision({ status: 'refunded', amountUsd: 999, processingComplete: false }), { process: true, reason: 'recover_incomplete_processing', needsClaim: false });
  assert.deepEqual(paymentProcessingDecision({ status: 'partially_refunded', amountUsd: 999, processingComplete: false }), { process: true, reason: 'recover_incomplete_processing', needsClaim: false });
  assert.deepEqual(paymentProcessingDecision({ status: 'paid', amountUsd: 999, processingComplete: true }), { process: false, reason: 'payment_already_recorded', needsClaim: false });
  assert.deepEqual(paymentProcessingDecision({ status: 'paid', amountUsd: 999, processingComplete: false }), { process: true, reason: 'recover_incomplete_processing', needsClaim: false });
});

test('only succeeded refund objects alter payment balances', () => {
  assert.equal(shouldProcessRefundStatus('succeeded'), true);
  assert.equal(shouldProcessRefundStatus('pending'), false);
  assert.equal(shouldProcessRefundStatus('requires_action'), false);
  assert.equal(shouldProcessRefundStatus('failed'), false);
  assert.equal(shouldProcessRefundStatus('canceled'), false);
  assert.equal(shouldProcessRefundStatus(null), false);
});

test('cumulative refunds combine individual refund IDs without double counting updates', () => {
  const first = calculateRefundState({
    originalAmountUsd: 999,
    previousRawEvent: {},
    refundId: 're_1',
    individualRefundUsd: 200,
    chargeCumulativeRefundedUsd: 0,
  });
  assert.equal(first.cumulativeRefundedUsd, 200);
  assert.equal(first.remainingPaidUsd, 799);
  assert.equal(first.status, 'partially_refunded');

  const duplicateUpdate = calculateRefundState({
    originalAmountUsd: 999,
    previousRawEvent: first.rawEvent,
    refundId: 're_1',
    individualRefundUsd: 200,
    chargeCumulativeRefundedUsd: 0,
  });
  assert.equal(duplicateUpdate.cumulativeRefundedUsd, 200);
  assert.equal(duplicateUpdate.changed, false);

  const second = calculateRefundState({
    originalAmountUsd: 999,
    previousRawEvent: duplicateUpdate.rawEvent,
    refundId: 're_2',
    individualRefundUsd: 300,
    chargeCumulativeRefundedUsd: 0,
  });
  assert.equal(second.cumulativeRefundedUsd, 500);
  assert.equal(second.remainingPaidUsd, 499);
});

test('legacy individual refunds seed the cumulative map before a second refund', () => {
  const result = calculateRefundState({
    originalAmountUsd: 999,
    previousRawEvent: {
      latest_refund_event: { refund_id: 're_legacy', refunded_usd: 200 },
      cumulative_refunded_usd: 200,
    },
    refundId: 're_new',
    individualRefundUsd: 300,
    chargeCumulativeRefundedUsd: 0,
  });

  assert.equal(result.cumulativeRefundedUsd, 500);
  assert.deepEqual(result.rawEvent.refunds_by_id, { re_legacy: 200, re_new: 300 });
});

test('late individual refund events cannot regress a cumulative full refund', () => {
  const full = calculateRefundState({
    originalAmountUsd: 999,
    previousRawEvent: {},
    refundId: null,
    individualRefundUsd: 0,
    chargeCumulativeRefundedUsd: 999,
  });
  assert.equal(full.status, 'refunded');

  const latePartial = calculateRefundState({
    originalAmountUsd: 999,
    previousRawEvent: full.rawEvent,
    refundId: 're_old',
    individualRefundUsd: 100,
    chargeCumulativeRefundedUsd: 0,
  });
  assert.equal(latePartial.cumulativeRefundedUsd, 999);
  assert.equal(latePartial.remainingPaidUsd, 0);
  assert.equal(latePartial.status, 'refunded');
});

test('missing or zero Stripe amount is rejected rather than synthesized', () => {
  assert.deepEqual(paymentProcessingDecision({ status: null, amountUsd: 0, processingComplete: false }), { process: false, reason: 'invalid_payment_amount', needsClaim: false });
  assert.deepEqual(paymentProcessingDecision({ status: 'pending', amountUsd: 0, processingComplete: false }), { process: false, reason: 'invalid_payment_amount', needsClaim: false });
  assert.deepEqual(paymentProcessingDecision({ status: 'pending', amountUsd: 999, processingComplete: false }), { process: true, reason: 'ready', needsClaim: true });
});

test('only one simultaneous pending-to-paid transition may claim side effects', async () => {
  let status = 'pending';
  const updateExisting = async payment => {
    await Promise.resolve();
    if (status !== payment.status) return null;
    status = 'paid';
    return { id: payment.id };
  };
  const attempt = () => claimPaymentAsPaid({
    existingPayment: { id: 'payment-a', status: 'pending' },
    updateExisting,
    insertNew: async () => { throw new Error('should not insert'); },
  });

  const results = await Promise.all([attempt(), attempt()]);
  assert.equal(results.filter(result => result.claimed).length, 1);
  assert.equal(results.filter(result => !result.claimed && result.reason === 'concurrent_or_duplicate').length, 1);
  assert.equal(status, 'paid');
});

test('competing new-payment insert is treated as a duplicate claim', async () => {
  const result = await claimPaymentAsPaid({
    existingPayment: null,
    updateExisting: async () => null,
    insertNew: async () => { const error = new Error('duplicate'); error.code = '23505'; throw error; },
  });
  assert.deepEqual(result, { claimed: false, reason: 'concurrent_or_duplicate' });
});
