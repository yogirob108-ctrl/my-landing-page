import { Resend } from 'resend';

const DEFAULT_FROM = '8 Lakes Tours <onboarding@resend.dev>';
const DEFAULT_INTERNAL_RECIPIENTS = ['8lakestours@gmail.com'];

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

type EmailResult = {
  sent: boolean;
  id?: string;
  error?: string;
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

function splitEmails(value: string | undefined) {
  return value?.split(',').map((email) => email.trim()).filter(Boolean) ?? [];
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function getInternalEmailRecipients() {
  const configured = splitEmails(process.env.INTERNAL_NOTIFICATION_EMAILS);
  return configured.length > 0 ? configured : DEFAULT_INTERNAL_RECIPIENTS;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailInput): Promise<EmailResult> {
  const resend = getResendClient();
  if (!resend) return { sent: false, error: 'RESEND_API_KEY is not configured' };

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    to,
    subject,
    html,
    replyTo,
  });

  if (error) return { sent: false, error: error.message };
  return { sent: true, id: data?.id };
}

export function bookingInternalEmail(input: {
  reference: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tourDate: string;
  ridingExperience: string;
  notes: string;
}) {
  const name = `${input.firstName} ${input.lastName}`.trim();
  return {
    subject: `New 8 Lakes application: ${name} (${input.reference})`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f1a14">
        <h1>New 8 Lakes application</h1>
        <p><strong>Reference:</strong> ${escapeHtml(input.reference)}</p>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(input.phone || 'Not provided')}</p>
        <p><strong>Tour date:</strong> ${escapeHtml(input.tourDate || 'TBC')}</p>
        <p><strong>Riding experience:</strong> ${escapeHtml(input.ridingExperience || 'Not provided')}</p>
        <p><strong>Notes:</strong><br>${escapeHtml(input.notes || 'None').replaceAll('\n', '<br>')}</p>
        <p>Status in ops: awaiting payment.</p>
      </div>
    `,
  };
}

export function bookingCustomerEmail(input: { reference: string; firstName: string; tourDate: string }) {
  return {
    subject: `We received your 8 Lakes Tours application (${input.reference})`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.65;color:#1f1a14">
        <h1>Thanks ${escapeHtml(input.firstName)} — we received your application.</h1>
        <p>Your reference is <strong>${escapeHtml(input.reference)}</strong>.</p>
        <p>Tour date selected: <strong>${escapeHtml(input.tourDate || 'TBC')}</strong>.</p>
        <p>The 2026 trip price is <strong>$2,099</strong>: <strong>$959 online</strong> to confirm your place, then <strong>$1,140 in cash</strong> paid directly to the nomadic host family in Mongolia.</p>
        <p>If you have questions before paying, reply to this email and the 8 Lakes Tours team will help.</p>
        <p>— 8 Lakes Tours</p>
      </div>
    `,
  };
}

export function leadInternalEmail(input: { name: string; email: string; source: string; interest: string }) {
  return {
    subject: `New 8 Lakes lead: ${input.email}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f1a14">
        <h1>New trip-update subscriber</h1>
        <p><strong>Name:</strong> ${escapeHtml(input.name || 'Subscriber')}</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p><strong>Interest:</strong> ${escapeHtml(input.interest)}</p>
        <p><strong>Source:</strong> ${escapeHtml(input.source)}</p>
      </div>
    `,
  };
}

export function leadCustomerEmail(input: { name: string }) {
  const greeting = input.name ? `Hi ${escapeHtml(input.name.split(/\s+/)[0])},` : 'Hi,';
  return {
    subject: 'You’re on the 8 Lakes Tours update list',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.65;color:#1f1a14">
        <h1>${greeting}</h1>
        <p>You’re on the list for practical Mongolia trip updates, new dates, and preparation notes from 8 Lakes Tours.</p>
        <p>If you’re ready to reserve, you can complete the application on the website any time.</p>
        <p>— 8 Lakes Tours</p>
      </div>
    `,
  };
}
