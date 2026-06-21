import { NextResponse } from 'next/server';
import { getInternalEmailRecipients, insuranceReminderCustomerEmail, preparationCustomerEmail, sendEmail } from '@/lib/email';
import { isSupabaseAdminConfigured } from '@/lib/ops-config';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const DAY_MS = 24 * 60 * 60 * 1000;
const TEMPLATE_PREP = 'preparation_packing';
const TEMPLATE_INSURANCE = 'insurance_final_check';

type BookingRow = {
  id: string;
  public_reference: string;
  customer_id: string | null;
  tour_date: string | null;
  status: string;
  confirmed_at: string | null;
  created_at: string | null;
  customer?: { first_name?: string | null; email?: string | null } | { first_name?: string | null; email?: string | null }[] | null;
};

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    return request.headers.get('authorization') === `Bearer ${secret}`;
  }

  // Vercel Cron calls are public HTTP requests unless CRON_SECRET is configured.
  // This fallback keeps local/prod cron usable but avoids accepting normal browser/manual traffic.
  const userAgent = request.headers.get('user-agent') || '';
  return userAgent.toLowerCase().includes('vercel-cron');
}

function parseTourStartDate(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:\s*[–-]\s*(?:[A-Za-z]+\s+)?\d{1,2})?,\s*(\d{4})/i);
  if (!match) return null;

  const month = MONTHS[match[1].toLowerCase()];
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (month === undefined || !day || !year) return null;
  return new Date(Date.UTC(year, month, day, 9, 0, 0));
}

function getCustomer(booking: BookingRow) {
  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  return {
    firstName: customer?.first_name || 'there',
    email: customer?.email || '',
  };
}

function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / DAY_MS);
}

function daysSince(date: string | null | undefined, now: Date) {
  if (!date) return 0;
  return Math.floor((now.getTime() - new Date(date).getTime()) / DAY_MS);
}

async function alreadySent(supabase: ReturnType<typeof createSupabaseAdminClient>, bookingIds: string[]) {
  if (bookingIds.length === 0) return new Set<string>();

  const { data, error } = await supabase
    .from('email_events')
    .select('booking_id, template_key')
    .in('booking_id', bookingIds)
    .in('template_key', [TEMPLATE_PREP, TEMPLATE_INSURANCE])
    .eq('status', 'sent');

  if (error) throw new Error(`Email-event lookup failed: ${error.message}`);
  return new Set((data || []).map((row) => `${row.booking_id}:${row.template_key}`));
}

async function sendLifecycleEmail({
  supabase,
  booking,
  templateKey,
  createdBy,
}: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  booking: BookingRow;
  templateKey: typeof TEMPLATE_PREP | typeof TEMPLATE_INSURANCE;
  createdBy: string;
}) {
  const customer = getCustomer(booking);
  if (!customer.email) return { sent: false, skipped: true, reason: 'missing_customer_email' };

  const email = templateKey === TEMPLATE_PREP
    ? preparationCustomerEmail({ reference: booking.public_reference, firstName: customer.firstName, tourDate: booking.tour_date || 'TBC' })
    : insuranceReminderCustomerEmail({ reference: booking.public_reference, firstName: customer.firstName, tourDate: booking.tour_date || 'TBC' });

  const result = await sendEmail({
    to: customer.email,
    replyTo: getInternalEmailRecipients()[0],
    ...email,
  });

  await supabase.from('booking_events').insert({
    booking_id: booking.id,
    event_type: result.sent ? 'email' : 'system',
    direction: 'outbound',
    title: result.sent
      ? (templateKey === TEMPLATE_PREP ? 'Preparation email sent' : 'Insurance/final-check email sent')
      : (templateKey === TEMPLATE_PREP ? 'Preparation email failed' : 'Insurance/final-check email failed'),
    body: result.sent ? `Resend email id: ${result.id ?? 'unknown'}` : result.error,
    created_by: createdBy,
  });

  await supabase.from('email_events').insert({
    booking_id: booking.id,
    customer_id: booking.customer_id,
    template_key: templateKey,
    to_email: customer.email,
    subject: email.subject,
    body_snapshot: email.text,
    provider_message_id: result.id ?? null,
    sent_by: createdBy,
    status: result.sent ? 'sent' : 'failed',
    raw_response: result,
  });

  if (result.sent && templateKey === TEMPLATE_PREP && booking.status === 'confirmed') {
    await supabase.from('bookings').update({ status: 'prep_sent', updated_at: new Date().toISOString() }).eq('id', booking.id);
  }

  return { sent: result.sent, id: result.id, error: result.error };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase admin is not configured' }, { status: 503 });
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date();

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, public_reference, customer_id, tour_date, status, confirmed_at, created_at, customer:customers(first_name, email)')
    .in('status', ['confirmed', 'prep_sent', 'ready_for_departure'])
    .order('confirmed_at', { ascending: true, nullsFirst: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (bookings || []) as BookingRow[];
  const sent = await alreadySent(supabase, rows.map((row) => row.id));
  const results: Array<Record<string, unknown>> = [];

  for (const booking of rows) {
    const startDate = parseTourStartDate(booking.tour_date);
    if (!startDate) {
      results.push({ reference: booking.public_reference, skipped: true, reason: 'unparseable_tour_date', tourDate: booking.tour_date });
      continue;
    }

    const daysUntilDeparture = daysBetween(now, startDate);
    const daysAfterConfirmation = daysSince(booking.confirmed_at || booking.created_at, now);
    if (daysUntilDeparture < -1) continue;

    const prepAlreadySent = sent.has(`${booking.id}:${TEMPLATE_PREP}`);
    const insuranceAlreadySent = sent.has(`${booking.id}:${TEMPLATE_INSURANCE}`);

    const prepDue = !prepAlreadySent && (daysAfterConfirmation >= 2 || daysUntilDeparture <= 21);
    const insuranceDue = !insuranceAlreadySent && (daysUntilDeparture <= 2 || (daysUntilDeparture <= 14 && daysAfterConfirmation >= 2));

    if (prepDue) {
      const result = await sendLifecycleEmail({ supabase, booking, templateKey: TEMPLATE_PREP, createdBy: 'drip-cron' });
      results.push({ reference: booking.public_reference, template: TEMPLATE_PREP, daysUntilDeparture, daysAfterConfirmation, ...result });
      if (result.sent) sent.add(`${booking.id}:${TEMPLATE_PREP}`);
    }

    if (insuranceDue) {
      const result = await sendLifecycleEmail({ supabase, booking, templateKey: TEMPLATE_INSURANCE, createdBy: 'drip-cron' });
      results.push({ reference: booking.public_reference, template: TEMPLATE_INSURANCE, daysUntilDeparture, daysAfterConfirmation, ...result });
      if (result.sent) sent.add(`${booking.id}:${TEMPLATE_INSURANCE}`);
    }
  }

  return NextResponse.json({ ok: true, checked: rows.length, results });
}
