'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isSupabaseAdminConfigured } from '@/lib/ops-config';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import type { BookingStatus } from '@/lib/booking-ops-data';

function intFromForm(formData: FormData, key: string) {
  return Number.parseInt(String(formData.get(key) ?? '0'), 10) || 0;
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

export async function createBookingRecord(formData: FormData) {
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

export async function updateBookingRecord(reference: string, formData: FormData) {
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

export async function addCommunicationEvent(reference: string, formData: FormData) {
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
