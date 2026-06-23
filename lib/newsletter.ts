import type { SupabaseClient } from '@supabase/supabase-js';

export type AttributionPayload = {
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

export type NewsletterSubscribeInput = {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  source: string;
  interest?: string;
  consentContext?: string;
  attribution?: AttributionPayload;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function attributionNote(attribution: AttributionPayload | undefined) {
  if (!attribution || typeof attribution !== 'object') return '';
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
  const lines = fields
    .map(([key, label]) => {
      const value = clean(attribution[key]);
      return value ? `${label}: ${value.slice(0, 500)}` : '';
    })
    .filter(Boolean);

  return lines.length ? ['--- Attribution ---', ...lines].join('\n') : '';
}

function nameParts(input: NewsletterSubscribeInput) {
  const fullName = clean(input.name);
  const first = clean(input.firstName);
  const last = clean(input.lastName);

  if (first || last) {
    return { firstName: first || 'Subscriber', lastName: last };
  }

  if (fullName) {
    const [firstPart = 'Subscriber', ...lastParts] = fullName.split(/\s+/);
    return { firstName: firstPart, lastName: lastParts.join(' ') };
  }

  return { firstName: 'Subscriber', lastName: '' };
}

function newsletterNote(input: NewsletterSubscribeInput, subscribedAt: string) {
  return [
    '--- 8 Lakes newsletter / marketing audience ---',
    'Status: subscribed',
    `Source: ${input.source}`,
    `Interest: ${input.interest || '8 Lakes Tours updates'}`,
    `Consent: ${subscribedAt}`,
    `Consent context: ${input.consentContext || 'Website newsletter signup / booking form'}`,
    'Use: newsletter, offers, deals, blog posts, business updates, field notes, and future 8 Lakes Tours promotions.',
    'Opt-out: remove or mark unsubscribed if the contact replies asking not to receive updates.',
    attributionNote(input.attribution),
  ].filter(Boolean).join('\n');
}

function appendNotes(existingNotes: string | null | undefined, block: string) {
  const existing = clean(existingNotes);
  if (!existing) return block;
  return `${existing}\n\n${block}`;
}

export async function subscribeToNewsletter(supabase: SupabaseClient, input: NewsletterSubscribeInput) {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    return { ok: false as const, error: 'Please enter a valid email address.' };
  }

  const now = new Date().toISOString();
  const { firstName, lastName } = nameParts(input);

  const { data: existingCustomer, error: existingError } = await supabase
    .from('customers')
    .select('id, notes')
    .eq('email', email)
    .maybeSingle();

  if (existingError) {
    return { ok: false as const, error: existingError.message };
  }

  const record = {
    first_name: firstName,
    last_name: lastName,
    email,
    notes: appendNotes(existingCustomer?.notes, newsletterNote({ ...input, email }, now)),
    updated_at: now,
  };

  const result = existingCustomer
    ? await supabase.from('customers').update(record).eq('id', existingCustomer.id).select('id').single()
    : await supabase.from('customers').insert(record).select('id').single();

  if (result.error || !result.data) {
    return { ok: false as const, error: result.error?.message ?? 'Subscriber could not be saved.' };
  }

  return { ok: true as const, customerId: result.data.id as string, email };
}
