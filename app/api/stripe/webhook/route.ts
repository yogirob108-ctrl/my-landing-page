import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { isSupabaseAdminConfigured } from '@/lib/ops-config';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { getInternalEmailRecipients, paymentConfirmedCustomerEmail, sendEmail } from '@/lib/email';

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = new Stripe('sk_test_webhook_signature_verification_only');

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

async function handleCheckoutSessionPaid(session: Stripe.Checkout.Session) {
  if (!isSupabaseAdminConfigured) {
    throw new Error('Supabase admin is not configured.');
  }

  const reference = getCheckoutReference(session);

  if (!reference) {
    console.warn('Stripe checkout session has no booking reference', { sessionId: session.id });
    return { matched: false, reason: 'missing_reference' };
  }

  if (session.payment_status && session.payment_status !== 'paid') {
    console.info('Ignoring checkout session that is not paid', {
      sessionId: session.id,
      reference,
      paymentStatus: session.payment_status,
    });
    return { matched: false, reason: 'not_paid' };
  }

  const onlinePaidUsd = usdFromCents(session.amount_total);
  const currency = session.currency?.toUpperCase() || 'USD';
  const paymentIntentId = getPaymentIntentId(session.payment_intent);
  const supabase = createSupabaseAdminClient();

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, public_reference, status, online_paid_usd, online_due_usd, tour_date, customer_id, customer:customers(first_name, email)')
    .eq('public_reference', reference)
    .single();

  if (bookingError || !booking) {
    console.warn('Stripe payment could not be matched to a booking', {
      sessionId: session.id,
      reference,
      error: bookingError?.message,
    });
    return { matched: false, reason: 'booking_not_found' };
  }

  const existingPaid = Number(booking.online_paid_usd ?? 0);
  const amountToRecord = onlinePaidUsd || Number(booking.online_due_usd ?? 0) || 959;
  const alreadyRecorded = existingPaid >= amountToRecord && ['confirmed', 'prep_sent', 'ready_for_departure', 'completed'].includes(booking.status);

  if (paymentIntentId) {
    const { data: existingPayment, error: existingPaymentError } = await supabase
      .from('payments')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (existingPaymentError) {
      throw new Error(`Payment lookup failed: ${existingPaymentError.message}`);
    }

    const paymentPayload = {
      booking_id: booking.id,
      provider: 'stripe',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      amount_usd: amountToRecord,
      status: 'paid',
      paid_at: new Date().toISOString(),
      raw_event: {
        checkout_session_id: session.id,
        payment_intent_id: paymentIntentId,
        event_source: 'checkout.session.completed',
        amount_total: session.amount_total,
        currency: session.currency,
      },
    };

    const paymentWrite = existingPayment
      ? await supabase.from('payments').update(paymentPayload).eq('id', existingPayment.id)
      : await supabase.from('payments').insert(paymentPayload);

    if (paymentWrite.error) {
      throw new Error(`Payment row write failed: ${paymentWrite.error.message}`);
    }
  }

  if (!alreadyRecorded) {
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        online_paid_usd: amountToRecord,
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);

    if (updateError) {
      throw new Error(`Booking payment update failed: ${updateError.message}`);
    }

    const { error: eventError } = await supabase.from('booking_events').insert({
      booking_id: booking.id,
      event_type: 'payment',
      direction: 'system',
      title: 'Stripe payment confirmed',
      body: [
        `Stripe checkout session ${session.id} completed.`,
        `Payment intent: ${paymentIntentId ?? 'unknown'}.`,
        `Amount recorded: ${amountToRecord} ${currency}.`,
      ].join('\n'),
      created_by: 'stripe-webhook',
    });

    if (eventError) {
      throw new Error(`Payment event insert failed: ${eventError.message}`);
    }

    const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
    const customerEmail = typeof customer?.email === 'string' ? customer.email : '';
    const firstName = typeof customer?.first_name === 'string' ? customer.first_name : 'there';

    if (customerEmail) {
      const confirmationEmail = paymentConfirmedCustomerEmail({
        reference: booking.public_reference,
        firstName,
        tourDate: booking.tour_date || 'TBC',
        amountUsd: amountToRecord,
      });
      const emailResult = await sendEmail({
        to: customerEmail,
        replyTo: getInternalEmailRecipients()[0],
        ...confirmationEmail,
      });

      await supabase.from('booking_events').insert({
        booking_id: booking.id,
        event_type: emailResult.sent ? 'email' : 'system',
        direction: 'outbound',
        title: emailResult.sent ? 'Payment confirmation email sent' : 'Payment confirmation email failed',
        body: emailResult.sent ? `Resend email id: ${emailResult.id ?? 'unknown'}` : emailResult.error,
        created_by: 'resend',
      });

      await supabase.from('email_events').insert({
        booking_id: booking.id,
        customer_id: booking.customer_id ?? null,
        template_key: 'payment_confirmed',
        to_email: customerEmail,
        subject: confirmationEmail.subject,
        body_snapshot: confirmationEmail.text,
        provider_message_id: emailResult.id ?? null,
        sent_by: 'stripe-webhook',
        status: emailResult.sent ? 'sent' : 'failed',
        raw_response: emailResult,
      });
    }
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
  const paymentIntentId = typeof (charge?.payment_intent ?? refund?.payment_intent) === 'string'
    ? String(charge?.payment_intent ?? refund?.payment_intent)
    : null;

  if (!paymentIntentId) {
    console.warn('Stripe refund event has no payment intent', { eventId: event.id, eventType: event.type });
    return { matched: false, reason: 'missing_payment_intent' };
  }

  const supabase = createSupabaseAdminClient();
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, booking_id, amount_usd, status, raw_event')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (paymentError) {
    throw new Error(`Refund payment lookup failed: ${paymentError.message}`);
  }

  if (!payment) {
    console.warn('Stripe refund could not be matched to a payment row', { eventId: event.id, eventType: event.type, paymentIntentId });
    return { matched: false, reason: 'payment_not_found', paymentIntentId };
  }

  const refundedUsd = isCharge ? usdFromCents(charge?.amount_refunded) : usdFromCents(refund?.amount);
  const originalAmountUsd = Number(payment.amount_usd ?? 0);
  const refundStatus = refundedUsd >= originalAmountUsd ? 'refunded' : 'partially_refunded';
  const remainingPaidUsd = Math.max(0, originalAmountUsd - refundedUsd);
  const occurredAt = eventTimestamp(event);

  const rawEvent = {
    ...(typeof payment.raw_event === 'object' && payment.raw_event ? payment.raw_event : {}),
    latest_refund_event: {
      event_id: event.id,
      event_type: event.type,
      payment_intent_id: paymentIntentId,
      charge_id: charge?.id ?? refund?.charge ?? null,
      refund_id: refund?.id ?? null,
      refunded_usd: refundedUsd,
      original_amount_usd: originalAmountUsd,
      received_at: occurredAt,
    },
  };

  const { error: updatePaymentError } = await supabase
    .from('payments')
    .update({
      status: refundStatus,
      refunded_at: occurredAt,
      raw_event: rawEvent,
    })
    .eq('id', payment.id);

  if (updatePaymentError) {
    throw new Error(`Refund payment update failed: ${updatePaymentError.message}`);
  }

  const { error: updateBookingError } = await supabase
    .from('bookings')
    .update({
      online_paid_usd: remainingPaidUsd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.booking_id);

  if (updateBookingError) {
    throw new Error(`Refund booking update failed: ${updateBookingError.message}`);
  }

  const { error: eventError } = await supabase.from('booking_events').insert({
    booking_id: payment.booking_id,
    event_type: 'payment',
    direction: 'system',
    title: refundStatus === 'refunded' ? 'Stripe payment refunded' : 'Stripe payment partially refunded',
    body: [
      `Stripe refund event ${event.id} received.`,
      `Payment intent: ${paymentIntentId}.`,
      `Refunded amount recorded: ${refundedUsd} USD.`,
      'Booking status was not automatically changed; review cancellation/transfer status manually if needed.',
    ].join('\n'),
    metadata: {
      event_id: event.id,
      event_type: event.type,
      payment_intent_id: paymentIntentId,
      refunded_usd: refundedUsd,
      remaining_paid_usd: remainingPaidUsd,
    },
    created_by: 'stripe-webhook',
    occurred_at: occurredAt,
  });

  if (eventError) {
    throw new Error(`Refund event insert failed: ${eventError.message}`);
  }

  return { matched: true, paymentIntentId, refundedUsd, remainingPaidUsd, status: refundStatus };
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
