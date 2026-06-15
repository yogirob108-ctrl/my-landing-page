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
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f1a14;max-width:720px">
        <h1 style="margin-bottom:0.35rem">New 8 Lakes application</h1>
        <p style="font-size:16px;margin-top:0"><strong>${escapeHtml(name)}</strong> submitted the website application and was shown the $959 Stripe reservation payment.</p>

        <div style="border:1px solid #e2d5bd;border-radius:14px;padding:14px 16px;margin:18px 0;background:#fffaf1">
          <p style="margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em;font-size:12px;color:#8a6a2c">Ops flow</p>
          <ol style="margin:0;padding-left:20px">
            <li>Application saved in the Adventure Therapy ops database as <strong>${escapeHtml(input.reference)}</strong>.</li>
            <li>Customer receives this confirmation and pays <strong>$959 online</strong>.</li>
            <li>Rob/Henry confirms payment in Stripe and marks the booking paid in the Adventure Therapy ops dashboard until webhook automation is added.</li>
            <li>Customer brings <strong>$1,200 clean USD cash</strong> for the host family in Mongolia.</li>
          </ol>
        </div>

        <h2 style="font-size:18px;margin:18px 0 8px">Guest details</h2>
        <p><strong>Reference:</strong> ${escapeHtml(input.reference)}</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(input.phone || 'Not provided')}</p>
        <p><strong>Tour date:</strong> ${escapeHtml(input.tourDate || 'TBC')}</p>
        <p><strong>Riding experience:</strong> ${escapeHtml(input.ridingExperience || 'Not provided')}</p>
        <p><strong>Notes:</strong><br>${escapeHtml(input.notes || 'None').replaceAll('\n', '<br>')}</p>
      </div>
    `,
  };
}

export function bookingCustomerEmail(input: { reference: string; firstName: string; tourDate: string }) {
  return {
    subject: `Your 8 Lakes Tours application is saved (${input.reference})`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.65;color:#1f1a14;max-width:680px">
        <h1 style="margin-bottom:0.35rem">Thanks ${escapeHtml(input.firstName)} — your application is saved.</h1>
        <p>Your booking reference is <strong>${escapeHtml(input.reference)}</strong>.</p>
        <p>Tour date selected: <strong>${escapeHtml(input.tourDate || 'TBC')}</strong>.</p>

        <div style="border:1px solid #e2d5bd;border-radius:14px;padding:16px 18px;margin:20px 0;background:#fffaf1">
          <p style="margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em;font-size:12px;color:#8a6a2c">How payment works</p>
          <p style="margin:0 0 10px">The 2026 trip price is <strong>$2,159 per person</strong>, split into two parts:</p>
          <ul style="margin:0;padding-left:20px">
            <li><strong>$959 paid online</strong> to reserve your place with 8 Lakes Tours.</li>
            <li><strong>$1,200 paid locally in cash</strong> directly to the nomadic host family in Mongolia.</li>
          </ul>
        </div>

        <h2 style="font-size:18px;margin:18px 0 8px">Next steps</h2>
        <ol style="padding-left:20px">
          <li>Complete the online reservation payment on the website if you have not already done so.</li>
          <li>We review the application and confirm your place.</li>
          <li>Before departure, we send practical preparation notes, packing guidance, and arrival details.</li>
          <li>Please plan to bring the family cash portion in clean USD notes for the hosts.</li>
        </ol>

        <p>If anything is unclear before paying, just reply to this email and we’ll help.</p>
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
