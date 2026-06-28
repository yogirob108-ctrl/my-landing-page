import { randomInt } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isSupabaseAdminConfigured } from '@/lib/ops-config';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { bookingCustomerEmail, bookingInternalEmail, getInternalEmailRecipients, sendEmail } from '@/lib/email';
import { subscribeToNewsletter } from '@/lib/newsletter';

const TOTAL_TRIP_VALUE_USD = 1999;
const ONLINE_DUE_USD = 999;
const FAMILY_CASH_DUE_USD = 1000;

type AttributionPayload = {
  landing_url?: unknown;
  current_url?: unknown;
  referrer?: unknown;
  source?: unknown;
  medium?: unknown;
  campaign?: unknown;
  term?: unknown;
  content?: unknown;
  gclid?: unknown;
  fbclid?: unknown;
  ttclid?: unknown;
  msclkid?: unknown;
  ga_client_id?: unknown;
};

type PublicBookingPayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  emergency_contact?: string;
  riding_experience?: string;
  tour_date?: string;
  dietary_restrictions?: string;
  how_heard?: string;
  notes?: string;
  signature?: string;
  attribution?: AttributionPayload;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function attributionLines(attribution: AttributionPayload | undefined) {
  if (!attribution || typeof attribution !== 'object') return [];
  const fields: Array<[keyof AttributionPayload, string]> = [
    ['source', 'UTM source'],
    ['medium', 'UTM medium'],
    ['campaign', 'UTM campaign'],
    ['term', 'UTM term'],
    ['content', 'UTM content'],
    ['gclid', 'Google click ID'],
    ['fbclid', 'Meta click ID'],
    ['ttclid', 'TikTok click ID'],
    ['msclkid', 'Microsoft click ID'],
    ['referrer', 'Referrer'],
    ['landing_url', 'Landing URL'],
    ['current_url', 'Current URL'],
    ['ga_client_id', 'GA client ID'],
  ];

  return fields
    .map(([key, label]) => {
      const value = clean(attribution[key]);
      return value ? `${label}: ${value.slice(0, 500)}` : '';
    })
    .filter(Boolean);
}

function attributionNote(attribution: AttributionPayload | undefined) {
  const lines = attributionLines(attribution);
  if (!lines.length) return '';
  return ['--- Attribution ---', ...lines].join('\n');
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function generateBookingReference() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const code = Array.from({ length: 5 }, () => alphabet[randomInt(alphabet.length)]).join('');
  return `8L-${code}`;
}

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured) {
    return jsonError('Booking system is temporarily unavailable. Please email info@8lakestours.com.', 503);
  }

  let payload: PublicBookingPayload;
  try {
    payload = await request.json();
  } catch {
    return jsonError('Invalid booking submission.');
  }

  const firstName = clean(payload.first_name);
  const lastName = clean(payload.last_name);
  const email = clean(payload.email).toLowerCase();
  const signature = clean(payload.signature);
  const howHeard = clean(payload.how_heard);
  const guestNotes = clean(payload.notes);
  const attributionBlock = attributionNote(payload.attribution);
  const bookingNotes = [
    howHeard ? `How they heard about us: ${howHeard}` : '',
    guestNotes,
    attributionBlock,
  ].filter(Boolean).join('\n\n') || null;

  if (!firstName || !lastName || !email || !signature) {
    return jsonError('Please complete your name, email, and waiver signature.');
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const reference = generateBookingReference();

  const { data: project, error: projectError } = await supabase
    .from('tour_projects')
    .select('id')
    .eq('slug', '8-lakes-tours')
    .single();

  if (projectError || !project) {
    return jsonError('8 Lakes Tours booking project is not configured.', 500);
  }

  const customerFields = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone: clean(payload.phone) || null,
    nationality: clean(payload.nationality) || null,
    emergency_contact: clean(payload.emergency_contact) || null,
    notes: [signature ? `Waiver signed online as: ${signature}` : '', attributionBlock].filter(Boolean).join('\n\n') || null,
    updated_at: now.toISOString(),
  };

  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id, notes')
    .eq('email', email)
    .maybeSingle();

  const customerPayload = {
    ...customerFields,
    notes: existingCustomer?.notes
      ? `${existingCustomer.notes}\n\n${customerFields.notes}`
      : customerFields.notes,
  };

  const customerResult = existingCustomer
    ? await supabase.from('customers').update(customerPayload).eq('id', existingCustomer.id).select('id').single()
    : await supabase.from('customers').insert(customerPayload).select('id').single();

  if (customerResult.error || !customerResult.data) {
    return jsonError(customerResult.error?.message ?? 'Customer record could not be saved.', 500);
  }

  const newsletterResult = await subscribeToNewsletter(supabase, {
    firstName,
    lastName,
    email,
    source: 'booking_form',
    interest: '8 Lakes Tours booking customer, newsletter, offers, deals, blog posts, field notes, and business updates',
    consentContext: 'Automatically added from completed 8 Lakes Tours booking form',
    attribution: payload.attribution,
  });

  if (!newsletterResult.ok) {
    console.warn('Booking customer newsletter audience update failed', { email, error: newsletterResult.error });
  }

  const { data: booking, error: bookingError } = await supabase.from('bookings').insert({
    public_reference: reference,
    project_id: project.id,
    customer_id: customerResult.data.id,
    tour_date: clean(payload.tour_date) || 'TBC',
    guest_count: 1,
    status: 'awaiting_payment',
    riding_experience: clean(payload.riding_experience) || null,
    dietary_notes: clean(payload.dietary_restrictions) || null,
    notes: bookingNotes,
    form_source: 'website',
    total_trip_value_usd: TOTAL_TRIP_VALUE_USD,
    online_due_usd: ONLINE_DUE_USD,
    online_paid_usd: 0,
    family_cash_due_usd: FAMILY_CASH_DUE_USD,
  }).select('id').single();

  if (bookingError || !booking) {
    return jsonError(bookingError?.message ?? 'Booking record could not be saved.', 500);
  }

  await supabase.from('booking_events').insert({
    booking_id: booking.id,
    event_type: 'system',
    direction: 'system',
    title: 'Website booking submitted',
    body: `${firstName} ${lastName} submitted the public reservation form and is awaiting online payment.${howHeard ? `\n\nHow they heard about us: ${howHeard}` : ''}`,
    created_by: 'website-form',
  });

  const tourDate = clean(payload.tour_date) || 'TBC';
  const internalEmail = bookingInternalEmail({
    reference,
    firstName,
    lastName,
    email,
    phone: clean(payload.phone),
    tourDate,
    ridingExperience: clean(payload.riding_experience),
    notes: bookingNotes ?? '',
  });
  const customerEmail = bookingCustomerEmail({ reference, firstName, tourDate });
  const internalRecipients = getInternalEmailRecipients();

  const internalResult = await sendEmail({
    to: internalRecipients,
    replyTo: email,
    ...internalEmail,
  });
  const customerEmailResult = await sendEmail({
    to: email,
    replyTo: internalRecipients[0],
    ...customerEmail,
  });

  await supabase.from('booking_events').insert([
    {
      booking_id: booking.id,
      event_type: internalResult.sent ? 'email' : 'system',
      direction: 'outbound',
      title: internalResult.sent ? 'Internal notification email sent' : 'Internal notification email failed',
      body: internalResult.sent ? `Resend email id: ${internalResult.id ?? 'unknown'}` : internalResult.error,
      created_by: 'resend',
    },
    {
      booking_id: booking.id,
      event_type: customerEmailResult.sent ? 'email' : 'system',
      direction: 'outbound',
      title: customerEmailResult.sent ? 'Customer confirmation email sent' : 'Customer confirmation email failed',
      body: customerEmailResult.sent ? `Resend email id: ${customerEmailResult.id ?? 'unknown'}` : customerEmailResult.error,
      created_by: 'resend',
    },
  ]);

  await supabase.from('email_events').insert([
    {
      booking_id: booking.id,
      customer_id: customerResult.data.id,
      template_key: 'internal_booking_notification',
      to_email: internalRecipients.join(', '),
      subject: internalEmail.subject,
      body_snapshot: internalEmail.text,
      provider_message_id: internalResult.id ?? null,
      sent_by: 'website-form',
      status: internalResult.sent ? 'sent' : 'failed',
      raw_response: internalResult,
    },
    {
      booking_id: booking.id,
      customer_id: customerResult.data.id,
      template_key: 'booking_received',
      to_email: email,
      subject: customerEmail.subject,
      body_snapshot: customerEmail.text,
      provider_message_id: customerEmailResult.id ?? null,
      sent_by: 'website-form',
      status: customerEmailResult.sent ? 'sent' : 'failed',
      raw_response: customerEmailResult,
    },
  ]);


  return NextResponse.json({ ok: true, reference });
}
