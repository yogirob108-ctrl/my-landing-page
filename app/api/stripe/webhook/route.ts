import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { isSupabaseAdminConfigured } from '@/lib/ops-config';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function usdFromCents(amount: number | null | undefined) {
  if (!amount || amount <= 0) return 0;
  return Math.round(amount) / 100;
}

function getCheckoutReference(session: Stripe.Checkout.Session) {
  return (
    session.client_reference_id ||
    session.metadata?.booking_reference ||
    session.metadata?.public_reference ||
    ''
  ).trim();
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
  const supabase = createSupabaseAdminClient();

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, public_reference, status, online_paid_usd, online_due_usd')
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
  const alreadyRecorded = existingPaid >= amountToRecord && booking.status === 'paid';

  if (!alreadyRecorded) {
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'paid',
        online_paid_usd: amountToRecord,
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
        `Payment intent: ${typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? 'unknown'}.`,
        `Amount recorded: ${amountToRecord} ${currency}.`,
      ].join('\n'),
      created_by: 'stripe-webhook',
    });

    if (eventError) {
      throw new Error(`Payment event insert failed: ${eventError.message}`);
    }
  }

  return { matched: true, reference, bookingId: booking.id, amount: amountToRecord, alreadyRecorded };
}

export async function POST(request: Request) {
  if (!stripe || !stripeWebhookSecret) {
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
      default:
        return NextResponse.json({ ok: true, received: true, ignored: true, type: event.type });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe webhook handling failed.';
    console.error('Stripe webhook handling failed', { eventId: event.id, eventType: event.type, error: message });
    return jsonError(message, 500);
  }
}
