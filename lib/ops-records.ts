import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { bookings as sampleBookings, getMissingEmails, type Booking, type BookingStatus } from '@/lib/booking-ops-data';
import { isSupabaseAdminConfigured } from '@/lib/ops-config';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export type CommunicationEvent = {
  id: string;
  bookingId: string;
  type: 'note' | 'email' | 'whatsapp' | 'phone' | 'payment' | 'status' | 'task' | 'system';
  direction: 'inbound' | 'outbound' | 'internal' | 'system';
  title: string;
  body: string;
  createdBy: string;
  occurredAt: string;
};

export type OpsBookingRecord = Booking & {
  firstName: string;
  lastName: string;
  communicationEvents: CommunicationEvent[];
};

export type OpsDataset = {
  mode: 'supabase' | 'sample';
  bookings: OpsBookingRecord[];
};

type SupabaseBookingRow = {
  public_reference: string;
  tour_date: string;
  guest_count: number;
  status: BookingStatus;
  riding_experience: string | null;
  dietary_notes: string | null;
  notes: string | null;
  form_source: string;
  total_trip_value_usd: number;
  online_due_usd: number;
  online_paid_usd: number;
  family_cash_due_usd: number;
  submitted_at: string;
  confirmed_at: string | null;
  customers: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    nationality: string | null;
    emergency_contact: string | null;
    notes: string | null;
  } | null;
  payments?: { stripe_checkout_session_id: string | null; stripe_payment_intent_id: string | null; status: string; paid_at: string | null }[];
  email_events?: { template_key: string; sent_at: string; sent_by: string; subject: string }[];
  booking_tasks?: { title: string; due_at: string | null; completed_at: string | null }[];
  booking_events?: { id: string; event_type: CommunicationEvent['type']; direction: CommunicationEvent['direction']; title: string; body: string | null; created_by: string; occurred_at: string }[];
};

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

function sampleRecord(booking: Booking): OpsBookingRecord {
  const { firstName, lastName } = splitName(booking.customerName);
  return {
    ...booking,
    firstName,
    lastName,
    communicationEvents: [
      {
        id: `${booking.id}-submitted`,
        bookingId: booking.id,
        type: 'system',
        direction: 'system',
        title: 'Application entered ops',
        body: `${booking.formSource} record created for ${booking.customerName}.`,
        createdBy: 'system',
        occurredAt: booking.submittedAt,
      },
      ...booking.emails.map((event) => ({
        id: `${booking.id}-${event.template}-${event.sentAt}`,
        bookingId: booking.id,
        type: 'email' as const,
        direction: 'outbound' as const,
        title: event.subject,
        body: `Template: ${event.template}`,
        createdBy: event.sentBy,
        occurredAt: event.sentAt,
      })),
    ],
  };
}

export function getSampleDataset(): OpsDataset {
  return { mode: 'sample', bookings: sampleBookings.map(sampleRecord) };
}

export async function getOpsDataset(): Promise<OpsDataset> {
  if (!isSupabaseAdminConfigured) return getSampleDataset();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      public_reference,
      tour_date,
      guest_count,
      status,
      riding_experience,
      dietary_notes,
      notes,
      form_source,
      total_trip_value_usd,
      online_due_usd,
      online_paid_usd,
      family_cash_due_usd,
      submitted_at,
      confirmed_at,
      customers(first_name,last_name,email,phone,whatsapp,nationality,emergency_contact,notes),
      payments(stripe_checkout_session_id,stripe_payment_intent_id,status,paid_at),
      email_events(template_key,sent_at,sent_by,subject),
      booking_tasks(title,due_at,completed_at),
      booking_events(id,event_type,direction,title,body,created_by,occurred_at)
    `)
    .order('submitted_at', { ascending: false });

  if (error || !data) return getSampleDataset();

  const records = (data as unknown as SupabaseBookingRow[]).map((row): OpsBookingRecord => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
    const name = `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim() || row.public_reference;
    const emails = (row.email_events ?? []).map((event) => ({
      template: event.template_key as Booking['emails'][number]['template'],
      sentAt: event.sent_at,
      sentBy: event.sent_by,
      subject: event.subject,
    }));
    const tasks = (row.booking_tasks ?? []).map((task) => ({
      title: task.title,
      due: task.due_at ?? row.submitted_at,
      done: Boolean(task.completed_at),
    }));
    const payment = (row.payments ?? [])[0];

    return {
      id: row.public_reference,
      firstName: customer?.first_name ?? '',
      lastName: customer?.last_name ?? '',
      customerName: name,
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      whatsapp: customer?.whatsapp ?? undefined,
      nationality: customer?.nationality ?? '',
      emergencyContact: customer?.emergency_contact ?? '',
      tourDate: row.tour_date,
      guestCount: row.guest_count,
      status: row.status,
      ridingExperience: row.riding_experience ?? '',
      dietaryNotes: row.dietary_notes ?? '',
      totalTripValueUsd: row.total_trip_value_usd,
      onlineDueUsd: row.online_due_usd,
      onlinePaidUsd: row.online_paid_usd,
      familyCashDueUsd: row.family_cash_due_usd,
      stripeReference: payment?.stripe_checkout_session_id ?? payment?.stripe_payment_intent_id ?? undefined,
      formSource: row.form_source === 'manual' ? 'Manual' : row.form_source === 'direct' ? 'Direct form' : 'Formspree',
      submittedAt: row.submitted_at,
      paymentReceivedAt: payment?.paid_at ?? undefined,
      notes: row.notes ?? customer?.notes ?? '',
      emails,
      tasks,
      communicationEvents: (row.booking_events ?? []).map((event) => ({
        id: event.id,
        bookingId: row.public_reference,
        type: event.event_type,
        direction: event.direction,
        title: event.title,
        body: event.body ?? '',
        createdBy: event.created_by,
        occurredAt: event.occurred_at,
      })),
    };
  });

  return { mode: 'supabase', bookings: records };
}

export async function getOpsBooking(reference: string) {
  const dataset = await getOpsDataset();
  return { mode: dataset.mode, booking: dataset.bookings.find((booking) => booking.id === reference) ?? null };
}

async function findBookingAndCustomer(reference: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('id,customer_id,public_reference')
    .eq('public_reference', reference)
    .single();
  if (error || !data) throw new Error(`Booking ${reference} not found`);
  return { supabase, booking: data };
}

function intFromForm(formData: FormData, key: string) {
  return Number.parseInt(String(formData.get(key) ?? '0'), 10) || 0;
}

export async function updateBookingRecord(reference: string, formData: FormData) {
  'use server';

  if (!isSupabaseAdminConfigured) redirect(`/ops/bookings/${reference}?saved=missing_config`);

  const { supabase, booking } = await findBookingAndCustomer(reference);
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  await supabase.from('customers').update({
    first_name: firstName,
    last_name: lastName,
    email,
    phone: String(formData.get('phone') ?? '').trim(),
    whatsapp: String(formData.get('whatsapp') ?? '').trim() || null,
    nationality: String(formData.get('nationality') ?? '').trim() || null,
    emergency_contact: String(formData.get('emergencyContact') ?? '').trim() || null,
    notes: String(formData.get('customerNotes') ?? '').trim() || null,
    updated_at: new Date().toISOString(),
  }).eq('id', booking.customer_id);

  await supabase.from('bookings').update({
    tour_date: String(formData.get('tourDate') ?? '').trim(),
    guest_count: intFromForm(formData, 'guestCount'),
    status: String(formData.get('status') ?? 'application_received') as BookingStatus,
    riding_experience: String(formData.get('ridingExperience') ?? '').trim() || null,
    dietary_notes: String(formData.get('dietaryNotes') ?? '').trim() || null,
    notes: String(formData.get('bookingNotes') ?? '').trim() || null,
    total_trip_value_usd: intFromForm(formData, 'totalTripValueUsd'),
    online_due_usd: intFromForm(formData, 'onlineDueUsd'),
    online_paid_usd: intFromForm(formData, 'onlinePaidUsd'),
    family_cash_due_usd: intFromForm(formData, 'familyCashDueUsd'),
    updated_at: new Date().toISOString(),
  }).eq('id', booking.id);

  await supabase.from('booking_events').insert({
    booking_id: booking.id,
    event_type: 'system',
    direction: 'system',
    title: 'Record updated',
    body: `Edited ${firstName} ${lastName}`.trim(),
    created_by: 'ops-pin-user',
  });

  revalidatePath('/ops');
  revalidatePath(`/ops/bookings/${reference}`);
  redirect(`/ops/bookings/${reference}?saved=1`);
}

export async function createBookingRecord(formData: FormData) {
  'use server';

  if (!isSupabaseAdminConfigured) redirect('/ops?created=missing_config');

  const supabase = createSupabaseAdminClient();
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const now = new Date();
  const reference = `8LT-${now.getUTCFullYear()}-${Math.floor(now.getTime() / 1000).toString().slice(-6)}`;

  const { data: project, error: projectError } = await supabase
    .from('tour_projects')
    .select('id')
    .eq('slug', '8-lakes-tours')
    .single();
  if (projectError || !project) throw new Error('8 Lakes Tours project is missing');

  const { data: customer, error: customerError } = await supabase.from('customers').insert({
    first_name: firstName,
    last_name: lastName,
    email,
    phone: String(formData.get('phone') ?? '').trim() || null,
    whatsapp: String(formData.get('whatsapp') ?? '').trim() || null,
    nationality: String(formData.get('nationality') ?? '').trim() || null,
  }).select('id').single();
  if (customerError || !customer) throw new Error(customerError?.message ?? 'Customer insert failed');

  const guestCount = intFromForm(formData, 'guestCount') || 1;
  const { data: booking, error: bookingError } = await supabase.from('bookings').insert({
    public_reference: reference,
    project_id: project.id,
    customer_id: customer.id,
    tour_date: String(formData.get('tourDate') ?? '').trim() || 'TBC',
    guest_count: guestCount,
    status: 'application_received',
    riding_experience: String(formData.get('ridingExperience') ?? '').trim() || null,
    dietary_notes: String(formData.get('dietaryNotes') ?? '').trim() || null,
    notes: String(formData.get('notes') ?? '').trim() || null,
    form_source: 'manual',
    total_trip_value_usd: guestCount * 2099,
    online_due_usd: guestCount * 959,
    online_paid_usd: 0,
    family_cash_due_usd: guestCount * 1140,
  }).select('id').single();
  if (bookingError || !booking) throw new Error(bookingError?.message ?? 'Booking insert failed');

  await supabase.from('booking_events').insert({
    booking_id: booking.id,
    event_type: 'system',
    direction: 'system',
    title: 'Manual booking created',
    body: `${firstName} ${lastName}`.trim(),
    created_by: 'ops-pin-user',
  });

  revalidatePath('/ops');
  redirect(`/ops/bookings/${reference}?saved=created`);
}

export async function addCommunicationEvent(reference: string, formData: FormData) {
  'use server';

  if (!isSupabaseAdminConfigured) redirect(`/ops/bookings/${reference}?saved=missing_config`);

  const { supabase, booking } = await findBookingAndCustomer(reference);
  await supabase.from('booking_events').insert({
    booking_id: booking.id,
    event_type: String(formData.get('eventType') ?? 'note'),
    direction: String(formData.get('direction') ?? 'internal'),
    title: String(formData.get('title') ?? '').trim(),
    body: String(formData.get('body') ?? '').trim(),
    created_by: String(formData.get('createdBy') ?? 'Rob/Henry').trim() || 'Rob/Henry',
  });

  revalidatePath('/ops');
  revalidatePath(`/ops/bookings/${reference}`);
  redirect(`/ops/bookings/${reference}?saved=event`);
}

export function missingConfigMessage(mode: OpsDataset['mode']) {
  if (mode === 'supabase') return null;
  return 'Supabase service-role access is not configured here yet, so edits are shown as UI but will not persist until SUPABASE_SERVICE_ROLE_KEY is added and the migration is applied.';
}

export { getMissingEmails };
