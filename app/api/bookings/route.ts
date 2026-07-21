import { randomInt } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isSupabaseAdminConfigured } from '@/lib/ops-config';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { bookingCustomerEmail, bookingInternalEmail, getInternalEmailRecipients, sendEmail } from '@/lib/email';
import { subscribeToNewsletter } from '@/lib/newsletter';
import { hasExplicitNewsletterOptIn } from '@/lib/newsletter-consent.mjs';

const ONLINE_DUE_USD = 999;
const MAX_GROUP_SIZE = 8;

const GROUP_PRICING_TIERS = [
  { min: 1, max: 2, perPersonUsd: 1999 },
  { min: 3, max: 4, perPersonUsd: 1949 },
  { min: 5, max: 6, perPersonUsd: 1899 },
  { min: 7, max: 8, perPersonUsd: 1799 },
] as const;

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
  guest_count?: string;
  dietary_restrictions?: string;
  how_heard?: string;
  notes?: string;
  signature?: string;
  newsletter_opt_in?: unknown;
  attribution?: AttributionPayload;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function clampGuestCount(value: unknown) {
  const parsed = Number.parseInt(String(value ?? '1'), 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(MAX_GROUP_SIZE, Math.max(1, parsed));
}

function getGroupPricing(value: unknown) {
  const guestCount = clampGuestCount(value);
  const tier = GROUP_PRICING_TIERS.find(option => guestCount >= option.min && guestCount <= option.max) ?? GROUP_PRICING_TIERS[0];
  const onlinePerPersonUsd = ONLINE_DUE_USD;
  const localFamilyPerPersonUsd = tier.perPersonUsd - onlinePerPersonUsd;
  return {
    guestCount,
    perPersonUsd: tier.perPersonUsd,
    onlinePerPersonUsd,
    localFamilyPerPersonUsd,
    totalTripValueUsd: tier.perPersonUsd * guestCount,
    onlinePaymentUsd: onlinePerPersonUsd * guestCount,
    localFamilyPaymentUsd: localFamilyPerPersonUsd * guestCount,
  };
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
  const groupPricing = getGroupPricing(payload.guest_count);
  const requiresManualPaymentLink = groupPricing.guestCount >= 3;
  const attributionBlock = attributionNote(payload.attribution);
  const bookingNotes = [
    `Guests booking together: ${groupPricing.guestCount}`,
    `Group rate: $${groupPricing.perPersonUsd.toLocaleString('en-US')} per person ($${groupPricing.onlinePerPersonUsd.toLocaleString('en-US')} online + $${groupPricing.localFamilyPerPersonUsd.toLocaleString('en-US')} local family cash)`,
    requiresManualPaymentLink ? 'GROUP REQUEST: Rob should confirm date/horse/guide/host-family capacity before sending a custom Stripe payment link or order. Do not assume the public Buy Button collected payment.' : '',
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

  if (hasExplicitNewsletterOptIn(payload.newsletter_opt_in)) {
    const newsletterResult = await subscribeToNewsletter(supabase, {
      firstName,
      lastName,
      email,
      source: 'booking_form_explicit_opt_in',
      interest: '8 Lakes Tours newsletter, offers, deals, blog posts, field notes, and business updates',
      consentContext: 'Explicit optional newsletter checkbox selected on the 8 Lakes Tours booking form',
      attribution: payload.attribution,
    });

    if (!newsletterResult.ok) {
      console.warn('Booking customer newsletter audience update failed', { email, error: newsletterResult.error });
    }
  }

  const { data: booking, error: bookingError } = await supabase.from('bookings').insert({
    public_reference: reference,
    project_id: project.id,
    customer_id: customerResult.data.id,
    tour_date: clean(payload.tour_date) || 'TBC',
    guest_count: groupPricing.guestCount,
    status: 'awaiting_payment',
    riding_experience: clean(payload.riding_experience) || null,
    dietary_notes: clean(payload.dietary_restrictions) || null,
    notes: bookingNotes,
    form_source: 'website',
    total_trip_value_usd: groupPricing.totalTripValueUsd,
    online_due_usd: groupPricing.onlinePaymentUsd,
    online_paid_usd: 0,
    family_cash_due_usd: groupPricing.localFamilyPaymentUsd,
  }).select('id').single();

  if (bookingError || !booking) {
    return jsonError(bookingError?.message ?? 'Booking record could not be saved.', 500);
  }

  await supabase.from('booking_events').insert({
    booking_id: booking.id,
    event_type: 'system',
    direction: 'system',
    title: 'Website booking submitted',
    body: `${firstName} ${lastName} submitted the public reservation form for ${groupPricing.guestCount} guest${groupPricing.guestCount === 1 ? '' : 's'}.${requiresManualPaymentLink ? ' This is a human-confirmed group request: Rob should confirm availability and send a custom Stripe payment link/order.' : ' The booking is awaiting online payment.'}${howHeard ? `\n\nHow they heard about us: ${howHeard}` : ''}`,
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
    guestCount: groupPricing.guestCount,
    pricePerPersonUsd: groupPricing.perPersonUsd,
    onlinePaymentUsd: groupPricing.onlinePaymentUsd,
    localFamilyPaymentUsd: groupPricing.localFamilyPaymentUsd,
    totalTripValueUsd: groupPricing.totalTripValueUsd,
    requiresManualPaymentLink,
    ridingExperience: clean(payload.riding_experience),
    notes: bookingNotes ?? '',
  });
  const customerEmail = bookingCustomerEmail({ reference, firstName, tourDate, guestCount: groupPricing.guestCount, pricePerPersonUsd: groupPricing.perPersonUsd, onlinePaymentUsd: groupPricing.onlinePaymentUsd, localFamilyPaymentUsd: groupPricing.localFamilyPaymentUsd, totalTripValueUsd: groupPricing.totalTripValueUsd, requiresManualPaymentLink });
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
