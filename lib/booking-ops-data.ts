export type BookingStatus =
  | 'application_received'
  | 'awaiting_payment'
  | 'confirmed'
  | 'prep_sent'
  | 'ready_for_departure'
  | 'completed'
  | 'cancelled';

export type EmailTemplateKey =
  | 'application_received'
  | 'booking_confirmed'
  | 'packing_list'
  | 'insurance_reminder'
  | 'arrival_details'
  | 'final_checklist'
  | 'post_trip_followup';

export type EmailEvent = {
  template: EmailTemplateKey;
  sentAt: string;
  sentBy: string;
  subject: string;
};

export type BookingTask = {
  title: string;
  due: string;
  done: boolean;
};

export type Booking = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  nationality: string;
  emergencyContact: string;
  tourDate: string;
  guestCount: number;
  status: BookingStatus;
  ridingExperience: string;
  dietaryNotes: string;
  totalTripValueUsd: number;
  onlineDueUsd: number;
  onlinePaidUsd: number;
  familyCashDueUsd: number;
  stripeReference?: string;
  formSource: 'Formspree' | 'Direct form' | 'Manual';
  submittedAt: string;
  paymentReceivedAt?: string;
  notes: string;
  emails: EmailEvent[];
  tasks: BookingTask[];
};

export const statusLabels: Record<BookingStatus, string> = {
  application_received: 'Application received',
  awaiting_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  prep_sent: 'Prep info sent',
  ready_for_departure: 'Ready for departure',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const statusOrder: BookingStatus[] = [
  'application_received',
  'awaiting_payment',
  'confirmed',
  'prep_sent',
  'ready_for_departure',
  'completed',
  'cancelled',
];

export const emailTemplates: { key: EmailTemplateKey; name: string; subject: string; trigger: string }[] = [
  {
    key: 'application_received',
    name: 'Application received',
    subject: 'We received your 8 Lakes Tours application',
    trigger: 'Send after the form lands, before payment is matched.',
  },
  {
    key: 'booking_confirmed',
    name: 'Booking confirmed',
    subject: 'Your 8 Lakes Tours booking is confirmed',
    trigger: 'Send after the $959 online reservation payment is confirmed.',
  },
  {
    key: 'packing_list',
    name: 'Packing list',
    subject: 'Your 8 Lakes Tours packing list',
    trigger: 'Send immediately after confirmation, or resend any time by button.',
  },
  {
    key: 'insurance_reminder',
    name: 'Insurance reminder',
    subject: 'Travel insurance reminder for Mongolia',
    trigger: 'Send 45–30 days before departure if insurance is not confirmed.',
  },
  {
    key: 'arrival_details',
    name: 'Arrival details',
    subject: 'Arrival details for your 8 Lakes Tours expedition',
    trigger: 'Send once meeting point, Rob contact, and transfer plan are final.',
  },
  {
    key: 'final_checklist',
    name: 'Final checklist',
    subject: 'Final checklist before Mongolia',
    trigger: 'Send 2–7 days before departure.',
  },
  {
    key: 'post_trip_followup',
    name: 'Post-trip follow-up',
    subject: 'Thank you for riding with 8 Lakes Tours',
    trigger: 'Send after the trip to request feedback, photos, and testimonial permission.',
  },
];

export const stackDecisions = [
  {
    layer: 'Current intake',
    choice: 'Keep Formspree for now',
    why: 'It already notifies Rob and receives the public booking form. Treat it as a temporary intake pipe, not the source of truth.',
  },
  {
    layer: 'Source of truth',
    choice: 'Postgres via Supabase',
    why: 'Own the booking/customer/payment/email-log data model instead of bending a generic CRM around the split-payment tour model.',
  },
  {
    layer: 'Internal app',
    choice: 'Next.js /ops dashboard',
    why: 'Same repo, same deployment workflow, and a focused internal UI for Rob/Henry: bookings, money, email history, tasks.',
  },
  {
    layer: 'Email sending',
    choice: 'Resend from info@8lakestours.com',
    why: 'Transactional email templates can be button-sent first and automated later while logging exact message snapshots.',
  },
  {
    layer: 'Payments',
    choice: 'Stripe payment links now, webhooks later',
    why: 'Payment success should update online_paid_usd, payment status, and the email workflow without forcing the full $2,099 through Stripe.',
  },
  {
    layer: 'Automation',
    choice: 'Cron jobs only after manual flow is trusted',
    why: 'Manual click-to-send proves the templates and statuses before scheduled reminders start sending on their own.',
  },
];

export const bookings: Booking[] = [
  {
    id: '8LT-2026-001',
    customerName: 'Maya Thompson',
    email: 'maya@example.com',
    phone: '+1 415 555 0184',
    whatsapp: '+1 415 555 0184',
    nationality: 'United States',
    emergencyContact: 'Daniel Thompson · +1 415 555 0199',
    tourDate: 'June 22 – 30, 2026',
    guestCount: 1,
    status: 'prep_sent',
    ridingExperience: 'Intermediate — comfortable riding',
    dietaryNotes: 'Vegetarian',
    totalTripValueUsd: 2099,
    onlineDueUsd: 959,
    onlinePaidUsd: 959,
    familyCashDueUsd: 1140,
    stripeReference: 'cs_live_example_001',
    formSource: 'Formspree',
    submittedAt: '2026-06-09T14:22:00Z',
    paymentReceivedAt: '2026-06-09T14:36:00Z',
    notes: 'Arrives in Ulaanbaatar two days early. Asked about borrowing riding helmet.',
    emails: [
      { template: 'application_received', sentAt: '2026-06-09T14:23:00Z', sentBy: 'system', subject: 'We received your 8 Lakes Tours application' },
      { template: 'booking_confirmed', sentAt: '2026-06-09T14:38:00Z', sentBy: 'Rob', subject: 'Your 8 Lakes Tours booking is confirmed' },
      { template: 'packing_list', sentAt: '2026-06-09T14:39:00Z', sentBy: 'Rob', subject: 'Your 8 Lakes Tours packing list' },
    ],
    tasks: [
      { title: 'Confirm travel insurance', due: '2026-05-10', done: false },
      { title: 'Send final arrival details', due: '2026-06-15', done: false },
      { title: 'Confirm $1,140 clean USD cash reminder', due: '2026-06-15', done: false },
    ],
  },
  {
    id: '8LT-2026-002',
    customerName: 'Jonas Richter',
    email: 'jonas@example.com',
    phone: '+49 30 5550 1920',
    nationality: 'Germany',
    emergencyContact: 'Anna Richter · +49 30 5550 1111',
    tourDate: 'July 16 – 24, 2026',
    guestCount: 2,
    status: 'awaiting_payment',
    ridingExperience: 'Beginner — little to none',
    dietaryNotes: 'No pork for one guest',
    totalTripValueUsd: 4198,
    onlineDueUsd: 1918,
    onlinePaidUsd: 0,
    familyCashDueUsd: 2280,
    formSource: 'Formspree',
    submittedAt: '2026-06-10T09:12:00Z',
    notes: 'Travelling as a couple. Needs reassurance about beginner riding level.',
    emails: [
      { template: 'application_received', sentAt: '2026-06-10T09:14:00Z', sentBy: 'system', subject: 'We received your 8 Lakes Tours application' },
    ],
    tasks: [
      { title: 'Send payment reminder if unpaid after 24h', due: '2026-06-11', done: false },
      { title: 'Rob to answer beginner riding question', due: '2026-06-11', done: false },
    ],
  },
  {
    id: '8LT-2026-003',
    customerName: 'Sofia Alvarez',
    email: 'sofia@example.com',
    phone: '+34 600 555 121',
    whatsapp: '+34 600 555 121',
    nationality: 'Spain',
    emergencyContact: 'Lucia Alvarez · +34 600 555 122',
    tourDate: 'August 4 – 12, 2026',
    guestCount: 1,
    status: 'confirmed',
    ridingExperience: 'Advanced — experienced rider',
    dietaryNotes: 'None',
    totalTripValueUsd: 2099,
    onlineDueUsd: 959,
    onlinePaidUsd: 959,
    familyCashDueUsd: 1140,
    stripeReference: 'cs_live_example_003',
    formSource: 'Manual',
    submittedAt: '2026-06-08T18:45:00Z',
    paymentReceivedAt: '2026-06-08T19:02:00Z',
    notes: 'Asked if she can bring small camera drone. Needs policy answer.',
    emails: [
      { template: 'booking_confirmed', sentAt: '2026-06-08T19:06:00Z', sentBy: 'Rob', subject: 'Your 8 Lakes Tours booking is confirmed' },
    ],
    tasks: [
      { title: 'Send packing list', due: '2026-06-11', done: false },
      { title: 'Reply with drone policy', due: '2026-06-11', done: false },
    ],
  },
];

export function getOpsMetrics(sourceBookings = bookings) {
  return sourceBookings.reduce(
    (totals, booking) => {
      totals.guests += booking.guestCount;
      totals.grossTripValue += booking.totalTripValueUsd;
      totals.onlineDue += booking.onlineDueUsd;
      totals.onlinePaid += booking.onlinePaidUsd;
      totals.familyCashDue += booking.familyCashDueUsd;
      totals.openTasks += booking.tasks.filter((task) => !task.done).length;
      return totals;
    },
    { guests: 0, grossTripValue: 0, onlineDue: 0, onlinePaid: 0, familyCashDue: 0, openTasks: 0 },
  );
}

export function getMissingEmails(booking: Booking) {
  const sent = new Set(booking.emails.map((event) => event.template));
  if (booking.status === 'awaiting_payment') {
    return ['booking_confirmed', 'packing_list'].filter((template) => !sent.has(template as EmailTemplateKey));
  }
  return ['booking_confirmed', 'packing_list', 'insurance_reminder', 'arrival_details'].filter(
    (template) => !sent.has(template as EmailTemplateKey),
  );
}
