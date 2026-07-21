/**
 * Resolve an existing Stripe payment deterministically. Operator-created checkout
 * rows exist before Stripe assigns a Payment Intent, so the Checkout Session ID
 * is always the primary key and Payment Intent is only a fallback.
 */
export async function findExistingStripePayment({ sessionId, paymentIntentId, lookup }) {
  const bySession = sessionId ? await lookup('stripe_checkout_session_id', sessionId) : null;
  if (bySession) return bySession;
  if (!paymentIntentId) return null;
  return lookup('stripe_payment_intent_id', paymentIntentId);
}
