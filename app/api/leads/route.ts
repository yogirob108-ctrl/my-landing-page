import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isSupabaseAdminConfigured } from '@/lib/ops-config';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { getInternalEmailRecipients, leadCustomerEmail, leadInternalEmail, sendEmail } from '@/lib/email';

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured) {
    return jsonError('Lead capture is temporarily unavailable. Please email info@8lakestours.com.', 503);
  }

  let payload: { name?: string; email?: string; source?: string; interest?: string };
  try {
    payload = await request.json();
  } catch {
    return jsonError('Invalid lead submission.');
  }

  const email = clean(payload.email).toLowerCase();
  const name = clean(payload.name);
  const source = clean(payload.source) || 'homepage_subscribe';
  const interest = clean(payload.interest) || 'Trip updates';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError('Please enter a valid email address.');
  }

  const [firstName = 'Subscriber', ...lastParts] = name ? name.split(/\s+/) : ['Subscriber'];
  const lastName = lastParts.join(' ');
  const now = new Date().toISOString();
  const notes = [
    'Lead/subscriber record',
    `Status: subscribed`,
    `Source: ${source}`,
    `Interest: ${interest}`,
    `Consent: ${now}`,
  ].join('\n');

  const supabase = createSupabaseAdminClient();
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id, notes')
    .eq('email', email)
    .maybeSingle();

  const record = {
    first_name: firstName,
    last_name: lastName,
    email,
    notes: existingCustomer?.notes ? `${existingCustomer.notes}\n\n${notes}` : notes,
    updated_at: now,
  };

  const result = existingCustomer
    ? await supabase.from('customers').update(record).eq('id', existingCustomer.id).select('id').single()
    : await supabase.from('customers').insert(record).select('id').single();

  if (result.error || !result.data) {
    return jsonError(result.error?.message ?? 'Lead could not be saved.', 500);
  }

  const internalRecipients = getInternalEmailRecipients();
  const internalEmail = leadInternalEmail({ name, email, source, interest });
  const customerEmail = leadCustomerEmail({ name });

  await Promise.allSettled([
    sendEmail({ to: internalRecipients, replyTo: email, ...internalEmail }),
    sendEmail({ to: email, replyTo: internalRecipients[0], ...customerEmail }),
  ]);

  revalidatePath('/ops');

  return NextResponse.json({ ok: true });
}
