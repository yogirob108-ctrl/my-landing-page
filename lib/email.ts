import { Resend } from 'resend';

const DEFAULT_FROM = '8 Lakes Tours <info@8lakestours.com>';
const DEFAULT_INTERNAL_RECIPIENTS = ['8lakestours@gmail.com'];
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.8lakestours.com';
const OPS_URL = process.env.OPS_BASE_URL || 'https://adventure-therapy-ops.vercel.app';
const TOTAL_PRICE_USD = '$1,999';
const ONLINE_PAYMENT_USD = '$999';
const FAMILY_CASH_USD = '$1,000';

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

type EmailResult = {
  sent: boolean;
  id?: string;
  error?: string;
};

type LifecycleEmailInput = {
  reference: string;
  firstName: string;
  tourDate: string;
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

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || value;
}

function nl2br(value: string) {
  return escapeHtml(value || 'None').replaceAll('\n', '<br>');
}

function emailShell({ preheader, title, intro, children, footer = true }: { preheader: string; title: string; intro?: string; children: string; footer?: boolean }) {
  return `
    <style>html,body{margin:0!important;padding:0!important;width:100%!important;} table{border-collapse:collapse;}</style>
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffaf1;margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#241d14">
      <tr>
        <td align="left" style="padding:0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:none;background:#fffaf1;border:0;border-radius:0;overflow:hidden;box-shadow:none">
            <tr>
              <td style="background:#171209;padding:15px 12px 14px;color:#f8eedb;border-bottom:4px solid #c8a96e">
                <p style="margin:0 0 10px;text-transform:uppercase;letter-spacing:.22em;font-size:11px;color:#c8a96e;font-weight:700">8 Lakes Tours</p>
                <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:34px;line-height:1.05;color:#fff8ea">${title}</h1>
                ${intro ? `<p style="margin:14px 0 0;color:#e9dcc6;font-size:16px;line-height:1.55">${intro}</p>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:13px 12px 16px">
                ${children}
                ${footer ? `
                  <hr style="border:0;border-top:1px solid #eadcc6;margin:22px 0 14px">
                  <p style="margin:0 0 6px;color:#5f513f;font-size:14px;line-height:1.55">Questions? Reply to this email or write to <a href="mailto:info@8lakestours.com" style="color:#8a5a13">info@8lakestours.com</a>.</p>
                  <p style="margin:0;color:#8b7a63;font-size:13px">8 Lakes Tours · Mongolia horse trekking · Orkhon Valley & Eight Lakes region</p>
                ` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function pill(label: string, value: string, detail: string) {
  return `
    <td style="width:33.333%;padding:4px" valign="top">
      <div style="border-left:4px solid #c8a96e;background:#fff6e7;border-radius:0;padding:11px;min-height:82px">
        <p style="margin:0 0 6px;text-transform:uppercase;letter-spacing:.12em;color:#8a6a2c;font-size:11px;font-weight:700">${label}</p>
        <p style="margin:0;color:#241d14;font-size:24px;font-weight:700;line-height:1">${value}</p>
        <p style="margin:8px 0 0;color:#6c5c48;font-size:13px;line-height:1.35">${detail}</p>
      </div>
    </td>
  `;
}

function detailRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #efe2ce;color:#7b6a54;font-size:13px;text-transform:uppercase;letter-spacing:.08em;width:34%">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #efe2ce;color:#241d14;font-size:15px;font-weight:700">${value}</td>
    </tr>
  `;
}

export function getInternalEmailRecipients() {
  const configured = splitEmails(process.env.INTERNAL_NOTIFICATION_EMAILS);
  return configured.length > 0 ? configured : DEFAULT_INTERNAL_RECIPIENTS;
}

export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailInput): Promise<EmailResult> {
  const resend = getResendClient();
  if (!resend) return { sent: false, error: 'RESEND_API_KEY is not configured' };

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    to,
    subject,
    html,
    text,
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
  const subject = `Action needed: ${name} booked 8 Lakes (${input.reference})`;
  const text = `New 8 Lakes booking\n\nReference: ${input.reference}\nGuest: ${name}\nEmail: ${input.email}\nPhone: ${input.phone || 'Not provided'}\nTour date: ${input.tourDate || 'TBC'}\nRiding experience: ${input.ridingExperience || 'Not provided'}\n\nAction checklist:\n1. Check for the ${ONLINE_PAYMENT_USD} Stripe payment.\n2. Mark the booking paid in the 8 Lakes ops dashboard when matched.\n3. Reply personally if anything looks odd or needs referral/review.\n4. Remind the guest to bring ${FAMILY_CASH_USD} clean USD cash for the host family.\n\nNotes:\n${input.notes || 'None'}`;

  return {
    subject,
    text,
    html: emailShell({
      preheader: `${name} booked ${input.tourDate || 'a future 8 Lakes date'}. Check Stripe and the 8 Lakes ops dashboard.`,
      title: 'New booking received',
      intro: `<strong>${escapeHtml(name)}</strong> submitted the booking form. Their place is confirmed once the ${ONLINE_PAYMENT_USD} online payment is matched.`,
      footer: false,
      children: `
        <div style="border-left:4px solid #c8a96e;background:#fff3dd;padding:12px 14px;margin-bottom:16px">
          <p style="margin:0 0 8px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#8a6a2c;font-weight:700">Operator checklist</p>
          <ol style="margin:0;padding-left:20px;color:#3a3024;line-height:1.7;font-size:15px">
            <li>Check Stripe for the <strong>${ONLINE_PAYMENT_USD}</strong> online booking payment.</li>
            <li>Open the 8 Lakes ops dashboard and mark <strong>${escapeHtml(input.reference)}</strong> paid when matched.</li>
            <li>Reply personally if the booking needs clarification, referral, or review.</li>
            <li>Make sure the guest knows to bring <strong>${FAMILY_CASH_USD} clean USD cash</strong> for the host family.</li>
          </ol>
          <p style="margin:14px 0 0"><a href="${OPS_URL}/bookings" style="display:inline-block;background:#241d14;color:#fff8ea;text-decoration:none;border-radius:0;padding:10px 14px;font-size:12px;text-transform:uppercase;letter-spacing:.12em;font-weight:700">Open 8 Lakes ops</a></p>
        </div>

        <h2 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:24px;margin:0 0 10px;color:#241d14">Guest details</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px">
          ${detailRow('Reference', escapeHtml(input.reference))}
          ${detailRow('Name', escapeHtml(name))}
          ${detailRow('Email', `<a href="mailto:${escapeHtml(input.email)}" style="color:#8a5a13">${escapeHtml(input.email)}</a>`)}
          ${detailRow('Phone', escapeHtml(input.phone || 'Not provided'))}
          ${detailRow('Tour date', escapeHtml(input.tourDate || 'TBC'))}
          ${detailRow('Riding level', escapeHtml(input.ridingExperience || 'Not provided'))}
        </table>

        <div style="border-left:4px solid #eadcc6;padding:12px 14px;background:#fffdf8">
          <p style="margin:0 0 8px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#8a6a2c;font-weight:700">Guest notes</p>
          <p style="margin:0;color:#3a3024;line-height:1.6">${nl2br(input.notes)}</p>
        </div>
      `,
    }),
  };
}

export function bookingCustomerEmail(input: { reference: string; firstName: string; tourDate: string }) {
  const subject = `8 Lakes Tours booking received — ${input.reference}`;
  const name = firstName(input.firstName);
  const text = `Hi ${name},\n\nThanks — your 8 Lakes Tours booking has been received.\n\nBooking reference: ${input.reference}\nSelected tour date: ${input.tourDate || 'TBC'}\n\nPayment structure:\nTotal 2026 trip price: ${TOTAL_PRICE_USD} per person\nOnline booking payment: ${ONLINE_PAYMENT_USD}\nCash paid directly to the host family in Mongolia: ${FAMILY_CASH_USD}\n\nYour place is confirmed once the online booking payment has been completed and matched. The ${FAMILY_CASH_USD} family portion is not collected online; please plan to bring clean USD notes to Mongolia for the host family.\n\nFood note:\nTraditional host-family food is meat- and dairy-heavy. For guests who can enjoy it, the dairy is one of the highest-quality parts of the trip: families always produce their own milk from yaks or cows and serve it fresh as milk tea, yoghurt, cheese, and other traditional foods.\n\nPacking note:\nMongolia's steppe weather can change fast. Pack for all seasons, even in summer, and bring more warm layers than you think you need.\n\nFacilities note:\nOnce you leave the city, countryside toilets are simple outhouses with squat toilets rather than Western flush toilets, and there are no regular showers. Bring wet wipes for cleaning hands and body between river washes; washing in the river can be part of the simple, therapeutic steppe rhythm when conditions allow.\n\nTranslation note:\nEnglish is not always strong in the host-family setting. So far we have found ChatGPT voice mode to be one of the easiest ways to communicate: say something like, “Please translate the following sentence into Mongolian for me,” then speak naturally and play/show the translation. Other translation apps can help too, but ChatGPT voice mode has worked especially well for simple back-and-forth conversation.\n\nNext steps:\n1. Complete the online booking payment on the website if you have not already done so.\n2. We review and match the booking/payment.\n3. We send preparation notes before departure.\n\nQuestions? Reply to this email.\n\n8 Lakes Tours`;

  return {
    subject,
    text,
    html: emailShell({
      preheader: `Reference ${input.reference}. Complete the ${ONLINE_PAYMENT_USD} online booking payment to confirm your place.`,
      title: `Thanks ${escapeHtml(name)} — booking received.`,
      intro: `Your booking has been saved. Your booking reference is <strong>${escapeHtml(input.reference)}</strong> for <strong>${escapeHtml(input.tourDate || 'TBC')}</strong>.`,
      children: `
        <div style="border-left:4px solid #c8a96e;background:#fff3dd;padding:12px 14px;margin-bottom:16px">
          <p style="margin:0 0 10px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#8a6a2c;font-weight:700">Important</p>
          <p style="margin:0;color:#3a3024;font-size:16px;line-height:1.55">Your place is confirmed once your <strong>${ONLINE_PAYMENT_USD} online booking payment</strong> has been completed and matched with this booking.</p>
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -4px 16px">
          <tr>
            ${pill('Total trip price', TOTAL_PRICE_USD, 'Per person for the 2026 9-day / 8-night expedition.')}
            ${pill('Pay online', ONLINE_PAYMENT_USD, 'Confirms your place with 8 Lakes Tours.')}
            ${pill('Bring in cash', FAMILY_CASH_USD, 'Paid directly to the nomadic host family in Mongolia.')}
          </tr>
        </table>

        <h2 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:24px;margin:0 0 10px;color:#241d14">Why the payment is split</h2>
        <p style="margin:0 0 18px;color:#3a3024;line-height:1.65;font-size:15px">Many nomadic host families cannot reliably receive cards, online payments, or bank transfers. The local family portion is paid directly in cash so that money reaches the hosts cleanly and transparently.</p>

        <div style="border-left:4px solid #eadcc6;padding:12px 14px;background:#fffdf8;margin-bottom:16px">
          <p style="margin:0 0 6px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#8a6a2c;font-weight:700">Food note</p>
          <p style="margin:0;color:#3a3024;line-height:1.6;font-size:15px">Traditional host-family food is meat- and dairy-heavy. For guests who can enjoy it, the dairy is one of the highest-quality parts of the trip: families always produce their own milk from yaks or cows and serve it fresh as milk tea, yoghurt, cheese, and other traditional foods.</p>
        </div>

        <h2 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:24px;margin:0 0 10px;color:#241d14">Next steps</h2>
        <ol style="margin:0 0 22px;padding-left:20px;color:#3a3024;line-height:1.75;font-size:15px">
          <li>Complete the online booking payment on the website if you have not already done so.</li>
          <li>We review the booking and match the payment to your reference.</li>
          <li>Before arrival, we send practical prep notes: packing guidance, insurance reminders, operator WhatsApp coordination, Bat-Ulzii pickup timing, and cash-payment instructions.</li>
          <li>Please plan to bring <strong>${FAMILY_CASH_USD} in clean USD notes</strong> for the host family.</li>
        </ol>

        <div style="border-left:4px solid #eadcc6;padding:12px 14px;background:#fffdf8;margin-bottom:16px">
          <p style="margin:0 0 6px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#8a6a2c;font-weight:700">Packing note</p>
          <p style="margin:0;color:#3a3024;line-height:1.6;font-size:15px">Mongolia&apos;s steppe weather can change quickly. Pack for all seasons, even in summer, and bring more warm layers than you think you need: base layers, fleece/down, warm socks, hat, gloves, and waterproof outerwear.</p>
        </div>

        <div style="border-left:4px solid #eadcc6;padding:12px 14px;background:#fffdf8;margin-bottom:16px">
          <p style="margin:0 0 6px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#8a6a2c;font-weight:700">Facilities note</p>
          <p style="margin:0;color:#3a3024;line-height:1.6;font-size:15px">Once you leave the city, countryside toilets are simple outhouses with squat toilets rather than Western flush toilets, and there are no regular showers. Bring wet wipes for cleaning hands and body between river washes; washing in the river can be part of the simple, therapeutic steppe rhythm when conditions allow.</p>
        </div>

        <div style="border-left:4px solid #eadcc6;padding:12px 14px;background:#fffdf8;margin-bottom:16px">
          <p style="margin:0 0 6px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#8a6a2c;font-weight:700">Translation note</p>
          <p style="margin:0;color:#3a3024;line-height:1.6;font-size:15px">English is not always strong in the host-family setting. So far, we&apos;ve found <strong>ChatGPT voice mode</strong> to be one of the easiest ways to communicate: say something like, “Please translate the following sentence into Mongolian for me,” then speak naturally and play or show the translation. Other translation apps can help too, but ChatGPT voice mode has worked especially well for simple back-and-forth conversation.</p>
        </div>

        <div style="border-left:4px solid #eadcc6;padding:12px 14px;background:#fffdf8;margin-bottom:16px">
          <p style="margin:0 0 6px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#8a6a2c;font-weight:700">Booking communication</p>
          <p style="margin:0;color:#3a3024;line-height:1.6;font-size:15px">We’ll send the practical preparation and arrival emails needed for this booking. Those are separate from the general newsletter.</p>
        </div>

        <div style="border-left:4px solid #eadcc6;padding:12px 14px;background:#fffdf8">
          <p style="margin:0 0 6px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#8a6a2c;font-weight:700">Keep this reference</p>
          <p style="margin:0;color:#241d14;font-size:18px;font-weight:700">${escapeHtml(input.reference)}</p>
        </div>
      `,
    }),
  };
}


export function paymentConfirmedCustomerEmail(input: LifecycleEmailInput & { amountUsd: number }) {
  const subject = `Payment received — 8 Lakes Tours ${input.reference}`;
  const name = firstName(input.firstName);
  const amount = `$${input.amountUsd.toLocaleString('en-US')}`;

  return {
    subject,
    text: `Hi ${name},\n\nGood news — we’ve received your ${amount} online booking payment for 8 Lakes Tours.\n\nBooking reference: ${input.reference}\nTour date: ${input.tourDate || 'TBC'}\n\nYour place is now confirmed.\n\nThe remaining ${FAMILY_CASH_USD} is paid directly to the host family in Mongolia in clean USD cash. We’ll send preparation notes, packing guidance, insurance reminders, and arrival coordination before departure.\n\nIf you have any questions before then, just reply to this email.\n\n8 Lakes Tours`,
    html: emailShell({
      preheader: `Payment received for booking ${input.reference}. Your 8 Lakes Tours place is confirmed.`,
      title: `Payment received — you’re confirmed.`,
      intro: `Hi ${escapeHtml(name)}, we’ve received your <strong>${escapeHtml(amount)} online booking payment</strong> for 8 Lakes Tours.`,
      children: `
        <div style="border-left:4px solid #c8a96e;background:#fff3dd;padding:12px 14px;margin-bottom:16px">
          <p style="margin:0 0 6px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#8a6a2c;font-weight:700">Booking confirmed</p>
          <p style="margin:0;color:#3a3024;font-size:16px;line-height:1.55">Your place is now confirmed for <strong>${escapeHtml(input.tourDate || 'TBC')}</strong>.</p>
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px">
          ${detailRow('Reference', escapeHtml(input.reference))}
          ${detailRow('Online payment received', escapeHtml(amount))}
          ${detailRow('Paid locally in Mongolia', FAMILY_CASH_USD)}
        </table>

        <p style="margin:0 0 18px;color:#3a3024;line-height:1.65;font-size:15px">The remaining <strong>${FAMILY_CASH_USD}</strong> is paid directly to the host family in Mongolia in clean USD cash. We’ll send preparation notes, packing guidance, insurance reminders, and arrival coordination before departure.</p>
        <p style="margin:0;color:#3a3024;line-height:1.65;font-size:15px">If you have any questions before then, just reply to this email.</p>
      `,
    }),
  };
}

export function preparationCustomerEmail(input: LifecycleEmailInput) {
  const subject = `Preparing for Mongolia — 8 Lakes Tours ${input.reference}`;
  const name = firstName(input.firstName);
  return {
    subject,
    text: `Hi ${name},\n\nHere are the main preparation notes for your 8 Lakes Tours booking.\n\nBooking reference: ${input.reference}\nTour date: ${input.tourDate || 'TBC'}\n\nPack for all seasons, even in summer. Mongolia’s steppe weather can shift quickly between warm sun, cold wind, rain, and very cold nights. Bring warm layers, waterproof outerwear, comfortable riding clothes, warm socks, hat, gloves, and basic toiletries.\n\nCountryside facilities are simple. Once outside the city, expect outhouse squat toilets rather than Western flush toilets, and no regular showers. Bring wet wipes for cleaning hands and body between river washes.\n\nFood is traditional host-family food: meat- and dairy-heavy, with fresh milk tea, yoghurt, cheese, and other local foods. Strict vegan or serious dairy-free needs are difficult in this remote setting.\n\nPlease also make sure you have travel insurance that covers horseback riding/adventure activity and emergency evacuation.\n\nIf you have any last questions, just reply to this email.\n\n8 Lakes Tours`,
    html: emailShell({
      preheader: `Packing, food, facilities, insurance, and practical prep for booking ${input.reference}.`,
      title: `Preparing for Mongolia.`,
      intro: `Hi ${escapeHtml(name)}, here are the main preparation notes for your 8 Lakes Tours booking.`,
      children: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px">
          ${detailRow('Reference', escapeHtml(input.reference))}
          ${detailRow('Tour date', escapeHtml(input.tourDate || 'TBC'))}
          ${detailRow('Local cash payment', FAMILY_CASH_USD)}
        </table>

        <div style="border-left:4px solid #eadcc6;padding:12px 14px;background:#fffdf8;margin-bottom:16px">
          <p style="margin:0 0 6px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#8a6a2c;font-weight:700">Packing</p>
          <p style="margin:0;color:#3a3024;line-height:1.6;font-size:15px">Pack for all seasons, even in summer. Mongolia’s steppe weather can shift quickly between warm sun, cold wind, rain, and very cold nights. Bring warm layers, waterproof outerwear, comfortable riding clothes, warm socks, hat, gloves, and basic toiletries.</p>
        </div>

        <div style="border-left:4px solid #eadcc6;padding:12px 14px;background:#fffdf8;margin-bottom:16px">
          <p style="margin:0 0 6px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#8a6a2c;font-weight:700">Facilities</p>
          <p style="margin:0;color:#3a3024;line-height:1.6;font-size:15px">Once outside the city, expect simple outhouse squat toilets rather than Western flush toilets, and no regular showers. Bring wet wipes for cleaning hands and body between river washes.</p>
        </div>

        <div style="border-left:4px solid #eadcc6;padding:12px 14px;background:#fffdf8;margin-bottom:16px">
          <p style="margin:0 0 6px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#8a6a2c;font-weight:700">Food</p>
          <p style="margin:0;color:#3a3024;line-height:1.6;font-size:15px">Food is traditional host-family food: meat- and dairy-heavy, with fresh milk tea, yoghurt, cheese, and other local foods. Strict vegan or serious dairy-free needs are difficult in this remote setting.</p>
        </div>

        <p style="margin:0;color:#3a3024;line-height:1.65;font-size:15px">Please also make sure you have travel insurance that covers horseback riding/adventure activity and emergency evacuation. If you have any last questions, just reply to this email.</p>
      `,
    }),
  };
}

export function insuranceReminderCustomerEmail(input: LifecycleEmailInput) {
  const subject = `Travel insurance check — 8 Lakes Tours ${input.reference}`;
  const name = firstName(input.firstName);
  return {
    subject,
    text: `Hi ${name},\n\nQuick check before your 8 Lakes Tours departure: please make sure your travel insurance is active and covers horseback riding or adventure activity, medical treatment, emergency evacuation, and repatriation.\n\nBooking reference: ${input.reference}\nTour date: ${input.tourDate || 'TBC'}\n\nAlso check that your passport, flights, warm layers, personal medication, first-aid basics, and ${FAMILY_CASH_USD} clean USD cash for the host family are sorted.\n\nIf you have any last questions, don’t hesitate to reply.\n\n8 Lakes Tours`,
    html: emailShell({
      preheader: `Insurance, documents, cash, and final preparation check for booking ${input.reference}.`,
      title: `Quick insurance check.`,
      intro: `Hi ${escapeHtml(name)}, a quick check before your 8 Lakes Tours departure.`,
      children: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px">
          ${detailRow('Reference', escapeHtml(input.reference))}
          ${detailRow('Tour date', escapeHtml(input.tourDate || 'TBC'))}
        </table>

        <div style="border-left:4px solid #c8a96e;background:#fff3dd;padding:12px 14px;margin-bottom:16px">
          <p style="margin:0 0 6px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#8a6a2c;font-weight:700">Required insurance</p>
          <p style="margin:0;color:#3a3024;line-height:1.6;font-size:15px">Please make sure your travel insurance is active and covers horseback riding or adventure activity, medical treatment, emergency evacuation, and repatriation.</p>
        </div>

        <p style="margin:0 0 18px;color:#3a3024;line-height:1.65;font-size:15px">Also check that your passport, flights, warm layers, personal medication, first-aid basics, and <strong>${FAMILY_CASH_USD} clean USD cash</strong> for the host family are sorted.</p>
        <p style="margin:0;color:#3a3024;line-height:1.65;font-size:15px">If you have any last questions, don’t hesitate to reply.</p>
      `,
    }),
  };
}

export function leadInternalEmail(input: { name: string; email: string; source: string; interest: string }) {
  const name = input.name || 'Subscriber';
  return {
    subject: `New 8 Lakes newsletter subscriber: ${input.email}`,
    text: `New newsletter subscriber\n\nName: ${name}\nEmail: ${input.email}\nInterest: ${input.interest}\nSource: ${input.source}`,
    html: emailShell({
      preheader: `${input.email} joined the 8 Lakes newsletter list.`,
      title: 'New newsletter subscriber',
      footer: false,
      children: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          ${detailRow('Name', escapeHtml(name))}
          ${detailRow('Email', `<a href="mailto:${escapeHtml(input.email)}" style="color:#8a5a13">${escapeHtml(input.email)}</a>`)}
          ${detailRow('Interest', escapeHtml(input.interest || 'Not provided'))}
          ${detailRow('Source', escapeHtml(input.source || 'website'))}
        </table>
      `,
    }),
  };
}

export function leadCustomerEmail(input: { name: string }) {
  const greetingName = input.name ? firstName(input.name) : '';
  const greeting = greetingName ? `Hi ${escapeHtml(greetingName)},` : 'Hi,';
  return {
    subject: 'Welcome to the 8 Lakes Tours newsletter',
    text: `${greetingName ? `Hi ${greetingName},` : 'Hi,'}\n\nThanks for joining the 8 Lakes Tours newsletter. We’ll send occasional updates about Mongolia horse trekking, new departure dates, offers, deals, blog posts, field notes, and behind-the-scenes news from the business.\n\nNo booking has been made from this signup. If you ever want to reserve a place, you can do that on the website: ${SITE_URL}/#book\n\nYou can opt out any time by replying to this email.\n\n8 Lakes Tours`,
    html: emailShell({
      preheader: 'Occasional 8 Lakes Tours news, offers, dates, blog posts, and field notes.',
      title: greeting,
      intro: 'Thanks for joining the 8 Lakes Tours newsletter.',
      children: `
        <p style="margin:0 0 18px;color:#3a3024;line-height:1.65;font-size:15px">We’ll send occasional updates about Mongolia horse trekking, new departure dates, offers, deals, blog posts, field notes, and behind-the-scenes news from the business.</p>
        <p style="margin:0 0 18px;color:#3a3024;line-height:1.65;font-size:15px">No booking has been made from this signup. If you ever want to reserve a place, you can do that on the website.</p>
        <p style="margin:0 0 18px;color:#3a3024;line-height:1.65;font-size:15px">You can opt out any time by replying to this email.</p>
        <p style="margin:0"><a href="${SITE_URL}" style="display:inline-block;background:#241d14;color:#fff8ea;text-decoration:none;border-radius:0;padding:12px 16px;font-size:12px;text-transform:uppercase;letter-spacing:.12em;font-weight:700">Visit 8 Lakes Tours</a></p>
      `,
    }),
  };
}
