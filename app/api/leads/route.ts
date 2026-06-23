import { NextResponse } from 'next/server';
import { isSupabaseAdminConfigured } from '@/lib/ops-config';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { getInternalEmailRecipients, leadCustomerEmail, leadInternalEmail, sendEmail } from '@/lib/email';
import { isValidEmail, normalizeEmail, subscribeToNewsletter, type AttributionPayload } from '@/lib/newsletter';

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured) {
    return jsonError('Newsletter signup is temporarily unavailable. Please email info@8lakestours.com.', 503);
  }

  let payload: { name?: string; email?: string; source?: string; interest?: string; attribution?: AttributionPayload };
  try {
    payload = await request.json();
  } catch {
    return jsonError('Invalid newsletter signup.');
  }

  const email = normalizeEmail(payload.email);
  const name = clean(payload.name);
  const source = clean(payload.source) || 'homepage_subscribe';
  const interest = clean(payload.interest) || '8 Lakes Tours newsletter, offers, deals, blog posts, and business updates';

  if (!isValidEmail(email)) {
    return jsonError('Please enter a valid email address.');
  }

  const supabase = createSupabaseAdminClient();
  const subscription = await subscribeToNewsletter(supabase, {
    name,
    email,
    source,
    interest,
    consentContext: 'Homepage newsletter/promotional updates CTA form',
    attribution: payload.attribution,
  });

  if (!subscription.ok) {
    return jsonError(subscription.error, 500);
  }

  const internalRecipients = getInternalEmailRecipients();
  const internalEmail = leadInternalEmail({ name, email, source, interest });
  const customerEmail = leadCustomerEmail({ name });

  await Promise.allSettled([
    sendEmail({ to: internalRecipients, replyTo: email, ...internalEmail }),
    sendEmail({ to: email, replyTo: internalRecipients[0], ...customerEmail }),
  ]);


  return NextResponse.json({ ok: true });
}
