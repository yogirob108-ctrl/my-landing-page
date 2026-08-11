import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { isSupabaseAdminConfigured } from '@/lib/ops-config';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { getInternalEmailRecipients, paymentConfirmedCustomerEmail, paymentReceivedInternalEmail, sendEmail } from '@/lib/email';
import {
  calculateRefundState,
  claimPaymentAsPaid,
  findExistingStripePayment,
  isSupportedPaymentCurrency,
  paymentProcessingDecision,
  resolveStripePaymentBooking,
  shouldProcessRefundStatus,
} from '@/lib/stripe-payment-match.mjs';
import { canAutomaticallyConfirmBooking } from '@/lib/tour-booking.mjs';

// Keep the provider side-effect window well inside the five-minute booking lease.
// Vercel terminates this invocation before an operator may reclaim a stale lease.
export const maxDuration = 60;

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const ga4MeasurementId = process.env.GA4_MEASUREMENT_ID || 'G-E9PW7T08LZ';
const ga4ApiSecret = process.env.GA4_MEASUREMENT_API_SECRET;
const stripe = new Stripe('sk_tes...only');

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function usdFromCents(amount: number | null | undefined) {
  if (!amount || amount <= 0) return 0;
  return Math.round(amount) / 100;
}

function eventTimestamp(event: Stripe.Event) {
  return new Date(event.created * 1000).toISOString();
}

function getCheckoutReference(session: Stripe.Checkout.Session) {
  return (
    session.client_reference_id ||
    session.metadata?.booking_reference ||
    session.metadata?.public_reference ||
    ''
  ).trim();
}

function getPaymentIntentId(value: Stripe.PaymentIntent | string | null) {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

function extractGaClientId(notes: unknown) {
  if (typeof notes !== 'string') return '';
  const match = notes.match(/^GA client ID:\s*(.+)$/im);
  return match?.[1]?.trim() || '';
}

async function sendGa4PaymentReceived(input: {
  clientId: string;
  reference: string;
  amountUsd: number;
  currency: string;
  tourDate: string;
  eventId: string;
}) {
  if (!ga4ApiSecret || !ga4MeasurementId || !input.clientId) {
    return { sent: false as const, reason: 'missing_ga4_config_or_client_id' };
  }

  const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(ga4MeasurementId)}&api_secret=${encodeURIComponent(ga4ApiSecret)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: input.clientId,
      events: [
        {
          name: 'payment_received',
          params: {
            event_id: input.eventId,
            event_category: 'booking_funnel',
            currency: input.currency,
            value: input.amountUsd,
            reference: input.reference,
            tour_date: input.tourDate || 'TBC',
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    return { sent: false as const, reason: `ga4_http_${response.status}` };
  }

  return { sent: true as const };
}

const PAYMENT_PROCESSING_LEASE_MS = 10 * 60 * 1000;

async function claimPaymentProcessingLease(paymentId: string) {
  const supabase = createSupabaseAdminClient();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('id, status, raw_event, refunded_at')
      .eq('id', paymentId)
      .single();
    if (error) throw new Error(`Payment processing lease lookup failed: ${error.message}`);

    const rawEvent = typeof payment.raw_event === 'object' && payment.raw_event
      ? payment.raw_event as Record<string, unknown>
      : {};
    if (rawEvent.processing_complete === true) {
      return { acquired: false as const, complete: true as const, token: null };
    }

    const existingToken = typeof rawEvent.processing_token === 'string' ? rawEvent.processing_token : '';
    const claimedAtMs = typeof rawEvent.processing_claimed_at === 'string'
      ? Date.parse(rawEvent.processing_claimed_at)
      : 0;
    if (existingToken && Number.isFinite(claimedAtMs) && Date.now() - claimedAtMs < PAYMENT_PROCESSING_LEASE_MS) {
      return { acquired: false as const, complete: false as const, token: null };
    }

    const token = crypto.randomUUID();
    const claimedAt = new Date().toISOString();
    let leaseUpdate = supabase
      .from('payments')
      .update({
        raw_event: {
          ...rawEvent,
          processing_token: token,
          processing_claimed_at: claimedAt,
          processing_complete: false,
        },
      })
      .eq('id', payment.id)
      .eq('status', payment.status);
    leaseUpdate = payment.refunded_at
      ? leaseUpdate.eq('refunded_at', payment.refunded_at)
      : leaseUpdate.is('refunded_at', null);
    leaseUpdate = existingToken
      ? leaseUpdate.eq('raw_event->>processing_token', existingToken)
      : leaseUpdate.is('raw_event->>processing_token', null);

    const { data: leasedPayment, error: leaseError } = await leaseUpdate.select('id').maybeSingle();
    if (leaseError) throw new Error(`Payment processing lease claim failed: ${leaseError.message}`);
    if (leasedPayment) return { acquired: true as const, complete: false as const, token };
  }

  return { acquired: false as const, complete: false as const, token: null };
}

async function reconcileBookingPaymentBalance({
  paymentId,
  bookingId,
  processingToken,
}: {
  paymentId: string;
  bookingId: string;
  processingToken?: string;
}) {
  const supabase = createSupabaseAdminClient();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, amount_usd, status, raw_event, refunded_at')
      .eq('id', paymentId)
      .single();
    if (paymentError) throw new Error(`Payment reconciliation lookup failed: ${paymentError.message}`);

    const rawEvent = typeof payment.raw_event === 'object' && payment.raw_event
      ? payment.raw_event as Record<string, unknown>
      : {};
    const originalAmountUsd = Number(payment.amount_usd ?? 0);
    const latestRefundEvent = rawEvent.latest_refund_event as { cumulative_refunded_usd?: unknown; refunded_usd?: unknown } | undefined;
    const cumulativeRefundedUsd = payment.status === 'refunded'
      ? originalAmountUsd
      : Math.max(
        Number(rawEvent.cumulative_refunded_usd ?? 0) || 0,
        Number(latestRefundEvent?.cumulative_refunded_usd ?? latestRefundEvent?.refunded_usd ?? 0) || 0,
      );
    const onlinePaidUsd = Math.max(0, originalAmountUsd - cumulativeRefundedUsd);
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ online_paid_usd: onlinePaidUsd, updated_at: new Date().toISOString() })
      .eq('id', bookingId);
    if (bookingError) throw new Error(`Booking payment reconciliation failed: ${bookingError.message}`);

    if (processingToken) {
      let completionUpdate = supabase
        .from('payments')
        .update({
          raw_event: {
            ...rawEvent,
            processing_token: null,
            processing_claimed_at: null,
            processing_complete: true,
            processing_completed_at: new Date().toISOString(),
          },
        })
        .eq('id', payment.id)
        .eq('status', payment.status)
        .eq('raw_event->>processing_token', processingToken);
      completionUpdate = payment.refunded_at
        ? completionUpdate.eq('refunded_at', payment.refunded_at)
        : completionUpdate.is('refunded_at', null);
      const { data: completedPayment, error: completionError } = await completionUpdate.select('id').maybeSingle();
      if (completionError) throw new Error(`Payment completion marker failed: ${completionError.message}`);
      if (completedPayment) return { onlinePaidUsd, status: payment.status };
      continue;
    }

    let verifyQuery = supabase
      .from('payments')
      .select('id')
      .eq('id', payment.id)
      .eq('status', payment.status);
    verifyQuery = payment.refunded_at
      ? verifyQuery.eq('refunded_at', payment.refunded_at)
      : verifyQuery.is('refunded_at', null);
    const { data: verifiedPayment, error: verifyError } = await verifyQuery.maybeSingle();
    if (verifyError) throw new Error(`Payment reconciliation verification failed: ${verifyError.message}`);
    if (verifiedPayment) return { onlinePaidUsd, status: payment.status };
  }

  throw new Error('Payment/booking reconciliation conflicted repeatedly; retry the Stripe event.');
}

async function transitionBookingAfterPaymentClaim(bookingId: string, confirmedAt: string) {
  const supabase = createSupabaseAdminClient();
  const confirmableStatuses = ['application_received', 'awaiting_payment'];

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data: booking, error: lookupError } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single();
    if (lookupError) throw new Error(`Claimed booking status lookup failed: ${lookupError.message}`);
    if (!confirmableStatuses.includes(booking.status)) return booking.status;

    const { data: confirmedBooking, error: confirmError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed', confirmed_at: confirmedAt, updated_at: confirmedAt })
      .eq('id', bookingId)
      .eq('status', booking.status)
      .select('status')
      .maybeSingle();
    if (confirmError) throw new Error(`Claimed booking confirmation failed: ${confirmError.message}`);
    if (confirmedBooking) return confirmedBooking.status;
  }

  throw new Error('Booking status changed repeatedly during payment confirmation; retry the Stripe event.');
}

async function readBookingStatus(bookingId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from('bookings').select('status').eq('id', bookingId).single();
  if (error) throw new Error(`Booking status verification failed: ${error.message}`);
  return data.status;
}

const BOOKING_CONFIRMATION_LEASE_MS = 5 * 60 * 1000;

async function claimBookingConfirmationLease(bookingId: string) {
  const supabase = createSupabaseAdminClient();
  const token = crypto.randomUUID();
  const claimedAt = new Date().toISOString();
  const staleBefore = new Date(Date.now() - BOOKING_CONFIRMATION_LEASE_MS).toISOString();
  const { data, error } = await supabase
    .from('bookings')
    .update({ payment_confirmation_token: token, payment_confirmation_claimed_at: claimedAt })
    .eq('id', bookingId)
    .neq('status', 'cancelled')
    .or(`payment_confirmation_token.is.null,payment_confirmation_claimed_at.lt.${staleBefore}`)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(`Booking confirmation lease claim failed: ${error.message}`);
  return data ? token : null;
}

async function releaseBookingConfirmationLease(bookingId: string, token: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('bookings')
    .update({ payment_confirmation_token: null, payment_confirmation_claimed_at: null })
    .eq('id', bookingId)
    .eq('payment_confirmation_token', token);
  if (error) throw new Error(`Booking confirmation lease release failed: ${error.message}`);
}

async function handleCheckoutSessionPaid(session: Stripe.Checkout.Session) {
  if (!isSupabaseAdminConfigured) {
    throw new Error('Supabase admin is not configured.');
  }

  const stripeReference = getCheckoutReference(session);

  if (session.payment_status && session.payment_status !== 'paid') {
    console.info('Ignoring checkout session that is not paid', {
      sessionId: session.id,
      reference: stripeReference,
      paymentStatus: session.payment_status,
    });
    return { matched: false, reason: 'not_paid' };
  }

  const amountToRecord = usdFromCents(session.amount_total);
  const currency = session.currency?.toUpperCase() || '';
  if (!isSupportedPaymentCurrency(currency)) {
    console.warn('Ignoring Stripe checkout session with unsupported currency', { sessionId: session.id, currency: currency || null });
    return { matched: false, reason: 'unsupported_currency', currency: currency || null };
  }
  const paymentIntentId = getPaymentIntentId(session.payment_intent);
  const supabase = createSupabaseAdminClient();
  const bookingSelect = 'id, public_reference, status, online_paid_usd, online_due_usd, tour_date, guest_count, notes, customer_id, customer:customers(first_name, last_name, email)';

  const existingPayment = await findExistingStripePayment({
    sessionId: session.id,
    paymentIntentId,
    lookup: async (column: string, value: string) => {
      const { data, error } = await supabase
        .from('payments')
        .select('id, booking_id, status, amount_usd, raw_event, paid_at, refunded_at')
        .eq(column, value)
        .maybeSingle();
      if (error) throw new Error(`Payment lookup failed: ${error.message}`);
      return data;
    },
  });

  const bookingResolution = await resolveStripePaymentBooking({
    existingPayment,
    stripeReference,
    lookupBookingById: async (bookingId: string) => {
      const { data, error } = await supabase.from('bookings').select(bookingSelect).eq('id', bookingId).maybeSingle();
      if (error) throw new Error(`Payment booking lookup failed: ${error.message}`);
      return data;
    },
    lookupBookingByReference: async (reference: string) => {
      const { data, error } = await supabase.from('bookings').select(bookingSelect).eq('public_reference', reference).maybeSingle();
      if (error) throw new Error(`Booking reference lookup failed: ${error.message}`);
      return data;
    },
  });

  if (!bookingResolution.ok) {
    console.warn('Stripe payment could not be safely matched to a booking', {
      sessionId: session.id,
      stripeReference,
      existingPaymentId: existingPayment?.id ?? null,
      reason: bookingResolution.reason,
    });
    return { matched: false, reason: bookingResolution.reason };
  }

  const booking = bookingResolution.booking;
  const reference = booking.public_reference;
  const existingRawEvent = typeof existingPayment?.raw_event === 'object' && existingPayment.raw_event
    ? existingPayment.raw_event as Record<string, unknown>
    : {};
  const decision = paymentProcessingDecision({
    status: existingPayment?.status ?? null,
    amountUsd: amountToRecord,
    processingComplete: existingRawEvent.processing_complete === true,
  });

  if (!decision.process) {
    const matched = decision.reason !== 'invalid_payment_amount';
    console.info('Ignoring Stripe checkout payment without side effects', {
      sessionId: session.id,
      reference,
      paymentId: existingPayment?.id ?? null,
      reason: decision.reason,
    });
    return { matched, reason: decision.reason, reference, bookingId: booking.id, alreadyRecorded: matched };
  }

  const now = new Date().toISOString();

  const checkoutEvent = {
    checkout_session_id: session.id,
    payment_intent_id: paymentIntentId || null,
    event_source: 'checkout.session.completed',
    amount_total: session.amount_total,
    currency: session.currency,
  };
  let processingToken = crypto.randomUUID();
  const paymentPayload = {
    provider: 'stripe',
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId || null,
    amount_usd: amountToRecord,
    status: 'paid',
    paid_at: now,
    raw_event: {
      ...existingRawEvent,
      latest_checkout_event: checkoutEvent,
      processing_token: processingToken,
      processing_claimed_at: now,
      processing_complete: false,
    },
  };

  let paymentId = existingPayment?.id ?? '';
  if (decision.needsClaim) {
    const claim = await claimPaymentAsPaid({
      existingPayment,
      updateExisting: async (payment: { id: string; status: string }) => {
        const { data, error } = await supabase
          .from('payments')
          .update(paymentPayload)
          .eq('id', payment.id)
          .eq('status', payment.status)
          .select('id')
          .maybeSingle();
        if (error) throw new Error(`Payment claim update failed: ${error.message}`);
        return data;
      },
      insertNew: async () => {
        const { data, error } = await supabase
          .from('payments')
          .insert({ ...paymentPayload, booking_id: booking.id })
          .select('id')
          .single();
        if (error) {
          const claimError = new Error(`Payment claim insert failed: ${error.message}`) as Error & { code?: string };
          claimError.code = error.code;
          throw claimError;
        }
        return data;
      },
    });

    if (!claim.claimed) {
      throw new Error('Payment processing was claimed concurrently; retry the Stripe event.');
    }
    paymentId = claim.paymentId;
  } else {
    if (!paymentId) throw new Error('Recoverable payment is missing its database id.');
    const lease = await claimPaymentProcessingLease(paymentId);
    if (lease.complete) {
      return {
        matched: true,
        reason: 'payment_already_recorded',
        reference,
        bookingId: booking.id,
        paymentIntentId,
        alreadyRecorded: true,
      };
    }
    if (!lease.acquired || !lease.token) {
      throw new Error('Payment recovery lease is active; retry the Stripe event.');
    }
    processingToken = lease.token;
  }

  await reconcileBookingPaymentBalance({ paymentId, bookingId: booking.id });
  let currentBookingStatus = await readBookingStatus(booking.id);
  const alreadyRecorded = decision.reason === 'recover_incomplete_processing';
  let bookingConfirmationToken: string | null = null;

  const finishCancelledPayment = async () => {
    const { data: existingCancelledEvent, error: cancelledEventLookupError } = await supabase
      .from('booking_events')
      .select('id')
      .eq('booking_id', booking.id)
      .eq('title', 'Stripe payment received for cancelled booking')
      .contains('metadata', { stripe_checkout_session_id: session.id })
      .limit(1)
      .maybeSingle();
    if (cancelledEventLookupError) throw new Error(`Cancelled payment event lookup failed: ${cancelledEventLookupError.message}`);
    if (!existingCancelledEvent) {
      const { error: cancelledEventError } = await supabase.from('booking_events').insert({
        booking_id: booking.id,
        event_type: 'payment',
        direction: 'system',
        title: 'Stripe payment received for cancelled booking',
        body: `Stripe checkout session ${session.id} paid ${amountToRecord} ${currency}. Booking remains cancelled and requires operator review; confirmation processing stopped when cancellation was observed.`,
        metadata: { stripe_checkout_session_id: session.id, stripe_payment_intent_id: paymentIntentId },
        created_by: 'stripe-webhook',
      });
      if (cancelledEventError) throw new Error(`Cancelled payment event insert failed: ${cancelledEventError.message}`);
    }
    if (bookingConfirmationToken) {
      await releaseBookingConfirmationLease(booking.id, bookingConfirmationToken);
      bookingConfirmationToken = null;
    }
    await reconcileBookingPaymentBalance({ paymentId, bookingId: booking.id, processingToken });
    return {
      matched: true,
      reason: 'cancelled_booking_requires_review',
      reference,
      bookingId: booking.id,
      paymentIntentId,
      alreadyRecorded,
    };
  };

  if (currentBookingStatus === 'cancelled') return finishCancelledPayment();

  const automaticConfirmationAllowed = canAutomaticallyConfirmBooking(booking.tour_date, booking.guest_count);
  if (!automaticConfirmationAllowed) {
    const { data: existingManualReviewEvent, error: manualReviewLookupError } = await supabase
      .from('booking_events')
      .select('id')
      .eq('booking_id', booking.id)
      .eq('title', 'Stripe payment received — manual confirmation required')
      .contains('metadata', { stripe_checkout_session_id: session.id })
      .limit(1)
      .maybeSingle();
    if (manualReviewLookupError) throw new Error(`Manual-review payment event lookup failed: ${manualReviewLookupError.message}`);

    if (!existingManualReviewEvent) {
      const { error: manualReviewEventError } = await supabase.from('booking_events').insert({
        booking_id: booking.id,
        event_type: 'payment',
        direction: 'system',
        title: 'Stripe payment received — manual confirmation required',
        body: `Stripe checkout session ${session.id} paid ${amountToRecord} ${currency}. Booking remains ${currentBookingStatus}; request-only, group, expired, or invalid inventory is never confirmed automatically. An operator must verify the booking and payment before confirmation.`,
        metadata: {
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId,
          automatic_confirmation_allowed: false,
        },
        created_by: 'stripe-webhook',
      });
      if (manualReviewEventError) throw new Error(`Manual-review payment event insert failed: ${manualReviewEventError.message}`);
    }

    await reconcileBookingPaymentBalance({ paymentId, bookingId: booking.id, processingToken });
    return {
      matched: true,
      reason: 'manual_confirmation_required',
      reference,
      bookingId: booking.id,
      paymentIntentId,
      alreadyRecorded,
    };
  }

  await transitionBookingAfterPaymentClaim(booking.id, now);
  currentBookingStatus = await readBookingStatus(booking.id);
  if (currentBookingStatus === 'cancelled') return finishCancelledPayment();

  {
    const { data: existingPaymentEvent, error: existingPaymentEventError } = await supabase
      .from('booking_events')
      .select('id')
      .eq('booking_id', booking.id)
      .eq('title', 'Stripe payment confirmed')
      .contains('metadata', { stripe_checkout_session_id: session.id })
      .limit(1)
      .maybeSingle();

    if (existingPaymentEventError) {
      throw new Error(`Payment event lookup failed: ${existingPaymentEventError.message}`);
    }

    const paymentEventWrite = existingPaymentEvent
      ? { error: null }
      : await supabase.from('booking_events').insert({
      booking_id: booking.id,
      event_type: 'payment',
      direction: 'system',
      title: 'Stripe payment confirmed',
      body: [
        `Stripe checkout session ${session.id} completed.`,
        `Payment intent: ${paymentIntentId ?? 'unknown'}.`,
        `Amount recorded: ${amountToRecord} ${currency}.`,
      ].join('\n'),
      metadata: {
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
      },
      created_by: 'stripe-webhook',
    });

    if (paymentEventWrite.error) {
      throw new Error(`Payment event insert failed: ${paymentEventWrite.error.message}`);
    }

    const { data: existingGaEvent, error: existingGaEventError } = await supabase
      .from('booking_events')
      .select('id')
      .eq('booking_id', booking.id)
      .in('title', ['GA4 payment_received event sent', 'GA4 payment_received event skipped'])
      .contains('metadata', { stripe_checkout_session_id: session.id })
      .limit(1)
      .maybeSingle();
    if (existingGaEventError) {
      throw new Error(`GA4 event lookup failed: ${existingGaEventError.message}`);
    }

    if (!existingGaEvent) {
      const gaResult = await sendGa4PaymentReceived({
        clientId: extractGaClientId(booking.notes),
        reference: booking.public_reference,
        amountUsd: amountToRecord,
        currency,
        tourDate: booking.tour_date || 'TBC',
        eventId: `stripe_${session.id}`,
      });

      const { error: gaEventError } = await supabase.from('booking_events').insert({
        booking_id: booking.id,
        event_type: 'system',
        direction: 'system',
        title: gaResult.sent ? 'GA4 payment_received event sent' : 'GA4 payment_received event skipped',
        body: gaResult.sent ? 'Server-side GA4 Measurement Protocol event sent for confirmed Stripe payment.' : `Reason: ${gaResult.reason}`,
        metadata: { stripe_checkout_session_id: session.id },
        created_by: 'stripe-webhook',
      });
      if (gaEventError) throw new Error(`GA4 event record failed: ${gaEventError.message}`);
    }

    bookingConfirmationToken = await claimBookingConfirmationLease(booking.id);
    if (!bookingConfirmationToken) {
      currentBookingStatus = await readBookingStatus(booking.id);
      if (currentBookingStatus === 'cancelled') return finishCancelledPayment();
      throw new Error('Booking confirmation email lease is active; retry the Stripe event.');
    }

    try {
      const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
    const customerEmail = typeof customer?.email === 'string' ? customer.email : '';
    const firstName = typeof customer?.first_name === 'string' ? customer.first_name : 'there';
    const lastName = typeof customer?.last_name === 'string' ? customer.last_name : '';
    const customerName = `${firstName === 'there' ? '' : firstName} ${lastName}`.trim() || customerEmail || booking.public_reference;
    const internalRecipients = getInternalEmailRecipients();

    currentBookingStatus = await readBookingStatus(booking.id);
    if (currentBookingStatus === 'cancelled') return finishCancelledPayment();

    if (customerEmail) {
      const { data: existingCustomerEmail, error: existingCustomerEmailError } = await supabase
        .from('email_events')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('template_key', 'payment_confirmed')
        .eq('status', 'sent')
        .limit(1)
        .maybeSingle();
      if (existingCustomerEmailError) throw new Error(`Customer email lookup failed: ${existingCustomerEmailError.message}`);

      if (!existingCustomerEmail) {
        currentBookingStatus = await readBookingStatus(booking.id);
        if (currentBookingStatus === 'cancelled') return finishCancelledPayment();
        const confirmationEmail = paymentConfirmedCustomerEmail({
          reference: booking.public_reference,
          firstName,
          tourDate: booking.tour_date || 'TBC',
          amountUsd: amountToRecord,
        });
        const emailResult = await sendEmail({
          to: customerEmail,
          replyTo: getInternalEmailRecipients()[0],
          idempotencyKey: `stripe-${session.id}-customer-payment`,
          ...confirmationEmail,
        });

        const { data: customerBookingEvent, error: customerBookingEventLookupError } = await supabase
          .from('booking_events')
          .select('id')
          .eq('booking_id', booking.id)
          .in('title', ['Payment confirmation email sent', 'Payment confirmation email failed'])
          .contains('metadata', { stripe_checkout_session_id: session.id })
          .limit(1)
          .maybeSingle();
        if (customerBookingEventLookupError) throw new Error(`Customer booking-event lookup failed: ${customerBookingEventLookupError.message}`);
        if (!customerBookingEvent) {
          const { error: customerBookingEventError } = await supabase.from('booking_events').insert({
            booking_id: booking.id,
            event_type: emailResult.sent ? 'email' : 'system',
            direction: 'outbound',
            title: emailResult.sent ? 'Payment confirmation email sent' : 'Payment confirmation email failed',
            body: emailResult.sent ? `Resend email id: ${emailResult.id ?? 'unknown'}` : emailResult.error,
            metadata: { stripe_checkout_session_id: session.id },
            created_by: 'resend',
          });
          if (customerBookingEventError) throw new Error(`Customer email event record failed: ${customerBookingEventError.message}`);
        }

        const { error: customerEmailEventError } = await supabase.from('email_events').insert({
          booking_id: booking.id,
          customer_id: booking.customer_id ?? null,
          template_key: 'payment_confirmed',
          to_email: customerEmail,
          subject: confirmationEmail.subject,
          body_snapshot: confirmationEmail.text,
          provider_message_id: emailResult.id ?? null,
          sent_by: 'stripe-webhook',
          status: emailResult.sent ? 'sent' : 'failed',
          raw_response: { ...emailResult, stripe_checkout_session_id: session.id },
        });
        if (customerEmailEventError) throw new Error(`Customer email audit insert failed: ${customerEmailEventError.message}`);
        if (!emailResult.sent) throw new Error(`Customer payment email failed: ${emailResult.error ?? 'unknown error'}`);
      }
    }

    currentBookingStatus = await readBookingStatus(booking.id);
    if (currentBookingStatus === 'cancelled') return finishCancelledPayment();

    if (internalRecipients.length) {
      const { data: existingInternalEmail, error: existingInternalEmailError } = await supabase
        .from('email_events')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('template_key', 'internal_payment_received')
        .eq('status', 'sent')
        .limit(1)
        .maybeSingle();
      if (existingInternalEmailError) throw new Error(`Internal email lookup failed: ${existingInternalEmailError.message}`);

      if (!existingInternalEmail) {
        currentBookingStatus = await readBookingStatus(booking.id);
        if (currentBookingStatus === 'cancelled') return finishCancelledPayment();
        const internalPaymentEmail = paymentReceivedInternalEmail({
          reference: booking.public_reference,
          firstName,
          customerName,
          customerEmail: customerEmail || 'not provided',
          tourDate: booking.tour_date || 'TBC',
          amountUsd: amountToRecord,
          stripeReference: paymentIntentId ?? session.id,
        });
        const internalEmailResult = await sendEmail({
          to: internalRecipients,
          replyTo: customerEmail || internalRecipients[0],
          idempotencyKey: `stripe-${session.id}-internal-payment`,
          ...internalPaymentEmail,
        });

        const { data: internalBookingEvent, error: internalBookingEventLookupError } = await supabase
          .from('booking_events')
          .select('id')
          .eq('booking_id', booking.id)
          .in('title', ['Internal payment notification email sent', 'Internal payment notification email failed'])
          .contains('metadata', { stripe_checkout_session_id: session.id })
          .limit(1)
          .maybeSingle();
        if (internalBookingEventLookupError) throw new Error(`Internal booking-event lookup failed: ${internalBookingEventLookupError.message}`);
        if (!internalBookingEvent) {
          const { error: internalBookingEventError } = await supabase.from('booking_events').insert({
            booking_id: booking.id,
            event_type: internalEmailResult.sent ? 'email' : 'system',
            direction: 'outbound',
            title: internalEmailResult.sent ? 'Internal payment notification email sent' : 'Internal payment notification email failed',
            body: internalEmailResult.sent ? `Resend email id: ${internalEmailResult.id ?? 'unknown'}` : internalEmailResult.error,
            metadata: { stripe_checkout_session_id: session.id },
            created_by: 'resend',
          });
          if (internalBookingEventError) throw new Error(`Internal email event record failed: ${internalBookingEventError.message}`);
        }

        const { error: internalEmailEventError } = await supabase.from('email_events').insert({
          booking_id: booking.id,
          customer_id: booking.customer_id ?? null,
          template_key: 'internal_payment_received',
          to_email: internalRecipients.join(', '),
          subject: internalPaymentEmail.subject,
          body_snapshot: internalPaymentEmail.text,
          provider_message_id: internalEmailResult.id ?? null,
          sent_by: 'stripe-webhook',
          status: internalEmailResult.sent ? 'sent' : 'failed',
          raw_response: { ...internalEmailResult, stripe_checkout_session_id: session.id },
        });
        if (internalEmailEventError) throw new Error(`Internal email audit insert failed: ${internalEmailEventError.message}`);
        if (!internalEmailResult.sent) throw new Error(`Internal payment email failed: ${internalEmailResult.error ?? 'unknown error'}`);
      }
    }
    } finally {
      if (bookingConfirmationToken) {
        await releaseBookingConfirmationLease(booking.id, bookingConfirmationToken);
        bookingConfirmationToken = null;
      }
    }
    await reconcileBookingPaymentBalance({ paymentId, bookingId: booking.id, processingToken });
  }

  return { matched: true, reference, bookingId: booking.id, amount: amountToRecord, paymentIntentId, alreadyRecorded };
}

async function handleStripeRefund(event: Stripe.Event) {
  if (!isSupabaseAdminConfigured) {
    throw new Error('Supabase admin is not configured.');
  }

  const object = event.data.object;
  const isCharge = object.object === 'charge';
  const isRefund = object.object === 'refund';

  if (!isCharge && !isRefund) {
    return { matched: false, reason: 'unsupported_refund_object' };
  }

  const charge = isCharge ? object as Stripe.Charge : null;
  const refund = isRefund ? object as Stripe.Refund : null;
  if (refund && !shouldProcessRefundStatus(refund.status)) {
    return { matched: true, ignored: true, reason: `refund_${refund.status ?? 'unknown'}` };
  }
  const paymentIntentId = typeof (charge?.payment_intent ?? refund?.payment_intent) === 'string'
    ? String(charge?.payment_intent ?? refund?.payment_intent)
    : null;

  if (!paymentIntentId) {
    console.warn('Stripe refund event has no payment intent', { eventId: event.id, eventType: event.type });
    return { matched: false, reason: 'missing_payment_intent' };
  }

  const supabase = createSupabaseAdminClient();
  const occurredAt = eventTimestamp(event);
  const individualRefundUsd = isRefund ? usdFromCents(refund?.amount) : 0;
  const chargeCumulativeRefundedUsd = isCharge ? usdFromCents(charge?.amount_refunded) : 0;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, booking_id, amount_usd, status, raw_event, refunded_at')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (paymentError) throw new Error(`Refund payment lookup failed: ${paymentError.message}`);
    if (!payment) {
      throw new Error(`Refund payment ${paymentIntentId} is not available yet; retry the Stripe event.`);
    }

    const originalAmountUsd = Number(payment.amount_usd ?? 0);
    const previousRawEvent = typeof payment.raw_event === 'object' && payment.raw_event
      ? payment.raw_event as Record<string, unknown>
      : {};
    const legacyCumulativeUsd = payment.status === 'refunded'
      ? originalAmountUsd
      : Number((previousRawEvent.latest_refund_event as { refunded_usd?: unknown } | undefined)?.refunded_usd ?? 0) || 0;
    const refundState = calculateRefundState({
      originalAmountUsd,
      previousRawEvent: {
        ...previousRawEvent,
        cumulative_refunded_usd: Math.max(Number(previousRawEvent.cumulative_refunded_usd ?? 0) || 0, legacyCumulativeUsd),
      },
      refundId: refund?.id ?? null,
      individualRefundUsd,
      chargeCumulativeRefundedUsd,
    });
    const previousRefundVersionMs = payment.refunded_at ? Date.parse(payment.refunded_at) : 0;
    const refundVersion = new Date(Math.max(Date.now(), previousRefundVersionMs + 1)).toISOString();
    const rawEvent = {
      ...refundState.rawEvent,
      latest_refund_event: {
        event_id: event.id,
        event_type: event.type,
        payment_intent_id: paymentIntentId,
        charge_id: charge?.id ?? refund?.charge ?? null,
        refund_id: refund?.id ?? null,
        individual_refunded_usd: individualRefundUsd,
        cumulative_refunded_usd: refundState.cumulativeRefundedUsd,
        original_amount_usd: originalAmountUsd,
        occurred_at: occurredAt,
      },
    };

    const existingProcessingToken = typeof previousRawEvent.processing_token === 'string'
      ? previousRawEvent.processing_token
      : '';
    let updatePayment = supabase
      .from('payments')
      .update({ status: refundState.status, refunded_at: refundVersion, raw_event: rawEvent })
      .eq('id', payment.id)
      .eq('status', payment.status);
    updatePayment = payment.refunded_at
      ? updatePayment.eq('refunded_at', payment.refunded_at)
      : updatePayment.is('refunded_at', null);
    updatePayment = existingProcessingToken
      ? updatePayment.eq('raw_event->>processing_token', existingProcessingToken)
      : updatePayment.is('raw_event->>processing_token', null);
    const { data: updatedPayment, error: updatePaymentError } = await updatePayment.select('id').maybeSingle();
    if (updatePaymentError) throw new Error(`Refund payment update failed: ${updatePaymentError.message}`);
    if (!updatedPayment) continue;

    const reconciliation = await reconcileBookingPaymentBalance({
      paymentId: payment.id,
      bookingId: payment.booking_id,
    });

    const { data: existingRefundEvent, error: existingRefundEventError } = await supabase
      .from('booking_events')
      .select('id')
      .eq('booking_id', payment.booking_id)
      .contains('metadata', { event_id: event.id })
      .limit(1)
      .maybeSingle();
    if (existingRefundEventError) throw new Error(`Refund event lookup failed: ${existingRefundEventError.message}`);

    if (!existingRefundEvent) {
      const { error: eventError } = await supabase.from('booking_events').insert({
        booking_id: payment.booking_id,
        event_type: 'payment',
        direction: 'system',
        title: refundState.status === 'refunded' ? 'Stripe payment refunded' : 'Stripe payment partially refunded',
        body: [
          `Stripe refund event ${event.id} received.`,
          `Payment intent: ${paymentIntentId}.`,
          `Cumulative refunded amount: ${refundState.cumulativeRefundedUsd} USD.`,
          'Booking status was not automatically changed; review cancellation/transfer status manually if needed.',
        ].join('\n'),
        metadata: {
          event_id: event.id,
          event_type: event.type,
          payment_intent_id: paymentIntentId,
          cumulative_refunded_usd: refundState.cumulativeRefundedUsd,
          remaining_paid_usd: refundState.remainingPaidUsd,
        },
        created_by: 'stripe-webhook',
        occurred_at: occurredAt,
      });
      if (eventError) throw new Error(`Refund event insert failed: ${eventError.message}`);
    }

    return {
      matched: true,
      paymentIntentId,
      cumulativeRefundedUsd: refundState.cumulativeRefundedUsd,
      remainingPaidUsd: reconciliation.onlinePaidUsd,
      status: reconciliation.status,
      changed: refundState.changed,
    };
  }

  throw new Error('Refund payment update conflicted repeatedly; retry the Stripe event.');
}

export async function POST(request: Request) {
  if (!stripeWebhookSecret) {
    return jsonError('Stripe webhook is not configured.', 503);
  }

  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return jsonError('Missing Stripe signature.', 400);
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid Stripe webhook payload.';
    return jsonError(`Webhook signature verification failed: ${message}`, 400);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const result = await handleCheckoutSessionPaid(event.data.object as Stripe.Checkout.Session);
        return NextResponse.json({ ok: true, received: true, type: event.type, result });
      }
      case 'charge.refunded':
      case 'refund.created':
      case 'refund.updated': {
        const result = await handleStripeRefund(event);
        return NextResponse.json({ ok: true, received: true, type: event.type, result });
      }
      default:
        return NextResponse.json({ ok: true, received: true, ignored: true, type: event.type });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe webhook handling failed.';
    console.error('Stripe webhook handling failed', { eventId: event.id, eventType: event.type, error: message });
    return jsonError(message, 500);
  }
}
