import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { addCommunicationEvent, updateBookingRecord } from '@/app/ops/actions';
import { getOpsBooking, getMissingEmails, missingConfigMessage } from '@/lib/ops-records';
import { hasOpsPinSession } from '@/lib/ops-pin';
import { statusLabels, statusOrder } from '@/lib/booking-ops-data';

export const metadata: Metadata = { title: 'Booking Record | 8 Lakes Ops', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default async function BookingDetailPage({ params, searchParams }: { params: Promise<{ reference: string }>; searchParams?: Promise<{ saved?: string }> }) {
  if (!(await hasOpsPinSession())) redirect('/ops/login');
  const { reference } = await params;
  const qs = await searchParams;
  const { mode, booking } = await getOpsBooking(reference);
  if (!booking) notFound();
  const configMessage = missingConfigMessage(mode);
  const saveAction = updateBookingRecord.bind(null, booking.id);
  const eventAction = addCommunicationEvent.bind(null, booking.id);
  const missingEmails = getMissingEmails(booking);
  const applicationSaved = booking.communicationEvents.some((event) => event.title.toLowerCase().includes('application') || event.title.toLowerCase().includes('booking'));
  const internalEmailSent = booking.communicationEvents.some((event) => event.title === 'Internal notification email sent');
  const customerEmailSent = booking.communicationEvents.some((event) => event.title === 'Customer confirmation email sent');
  const onlinePaymentComplete = booking.onlinePaidUsd >= booking.onlineDueUsd && booking.onlineDueUsd > 0;

  return (
    <main className="record-shell">
      <header className="topbar">
        <Link href="/ops">← Bookings</Link>
        <div><p className="mini">{booking.id}</p><h1>{booking.customerName}</h1></div>
        <span className="mode">{mode === 'supabase' ? 'Live' : 'Sample'}</span>
      </header>

      {qs?.saved === 'missing_config' && <section className="warning">Cannot persist yet: add SUPABASE_SERVICE_ROLE_KEY in Vercel/local env and apply migrations.</section>}
      {qs?.saved && qs.saved !== 'missing_config' && <section className="success">Saved.</section>}
      {configMessage && <section className="warning">{configMessage}</section>}

      <section className="record-grid">
        <form action={saveAction} className="panel edit-panel">
          <div className="section-head"><p className="mini">Editable record</p><button type="submit">Save changes</button></div>
          <fieldset><legend>Customer</legend><div className="fields two"><Input name="firstName" label="First name" defaultValue={booking.firstName} /><Input name="lastName" label="Last name" defaultValue={booking.lastName} /><Input name="email" label="Email" defaultValue={booking.email} /><Input name="phone" label="Phone" defaultValue={booking.phone} /><Input name="whatsapp" label="WhatsApp" defaultValue={booking.whatsapp ?? ''} /><Input name="nationality" label="Nationality" defaultValue={booking.nationality} /></div><Input name="emergencyContact" label="Emergency contact" defaultValue={booking.emergencyContact} /><Textarea name="customerNotes" label="Customer notes" defaultValue={booking.notes} /></fieldset>
          <fieldset><legend>Booking</legend><div className="fields two"><Input name="tourDate" label="Tour date" defaultValue={booking.tourDate} /><Input name="guestCount" label="Guests" type="number" defaultValue={booking.guestCount.toString()} /><label><span>Status</span><select name="status" defaultValue={booking.status}>{statusOrder.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label><Input name="ridingExperience" label="Riding" defaultValue={booking.ridingExperience} /></div><Input name="dietaryNotes" label="Dietary" defaultValue={booking.dietaryNotes} /><Textarea name="bookingNotes" label="Internal notes" defaultValue={booking.notes} /></fieldset>
          <fieldset><legend>Money</legend><div className="fields four"><Input name="totalTripValueUsd" label="Total USD" type="number" defaultValue={booking.totalTripValueUsd.toString()} /><Input name="onlineDueUsd" label="Online due" type="number" defaultValue={booking.onlineDueUsd.toString()} /><Input name="onlinePaidUsd" label="Online paid" type="number" defaultValue={booking.onlinePaidUsd.toString()} /><Input name="familyCashDueUsd" label="Family cash" type="number" defaultValue={booking.familyCashDueUsd.toString()} /></div></fieldset>
        </form>

        <aside className="side-stack">
          <section className="panel flow-card">
            <p className="mini">Booking flow</p>
            <h2>Where this guest is</h2>
            <FlowLine done={applicationSaved} label="Application saved in /ops" note={`${booking.formSource} · ${dateTime.format(new Date(booking.submittedAt))}`} />
            <FlowLine done={internalEmailSent && customerEmailSent} label="Emails sent" note={internalEmailSent && customerEmailSent ? 'Internal alert + customer confirmation sent' : 'Check timeline for email failure'} />
            <FlowLine done={onlinePaymentComplete} label={`${money.format(booking.onlineDueUsd)} online reservation paid`} note={onlinePaymentComplete ? `Recorded as ${money.format(booking.onlinePaidUsd)} paid` : 'Still needs Stripe match/manual paid update'} />
            <FlowLine done={booking.status !== 'awaiting_payment'} label="Confirmed / prep in motion" note={`Current status: ${statusLabels[booking.status]}`} />
            <FlowLine done={false} label={`${money.format(booking.familyCashDueUsd)} family cash reminder`} note="Guest should bring clean USD notes to pay hosts directly in Mongolia." muted />
          </section>
          <section className="panel ledger"><p className="mini">Payment</p><h2>{money.format(booking.onlinePaidUsd)} / {money.format(booking.onlineDueUsd)}</h2><p>{money.format(booking.familyCashDueUsd)} due direct to family.</p><p>{booking.stripeReference ?? 'No Stripe payment matched yet.'}</p></section>
          <section className="panel"><p className="mini">Missing emails</p>{missingEmails.length ? <ul>{missingEmails.map((item) => <li key={item}>{item.replaceAll('_', ' ')}</li>)}</ul> : <p>Nothing missing.</p>}</section>
          <section className="panel"><p className="mini">Email composer v1</p><label><span>Template</span><select><option>Payment reminder</option><option>Booking confirmed</option><option>Packing list</option><option>Arrival details</option></select></label><textarea readOnly value={`Hi ${booking.firstName || booking.customerName},\n\nJust a quick note from 8 Lakes Tours...`} /><button type="button" disabled>Send via domain — next PR</button></section>
        </aside>
      </section>

      <section className="panel timeline-panel">
        <div className="section-head"><div><p className="mini">Communication log</p><h2>Timeline</h2></div></div>
        <form action={eventAction} className="event-form"><select name="eventType" defaultValue="note"><option value="note">Note</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="phone">Phone</option><option value="payment">Payment</option></select><select name="direction" defaultValue="internal"><option value="internal">Internal</option><option value="inbound">Inbound</option><option value="outbound">Outbound</option><option value="system">System</option></select><input name="title" required placeholder="Short summary" /><input name="createdBy" defaultValue="Rob/Henry" /><textarea name="body" placeholder="Details, pasted message, call notes…" /><button type="submit">Add communication</button></form>
        <div className="timeline">{booking.communicationEvents.map((event) => <article key={event.id}><span>{event.type} · {event.direction} · {dateTime.format(new Date(event.occurredAt))}</span><strong>{event.title}</strong><p>{event.body}</p><small>{event.createdBy}</small></article>)}</div>
      </section>

      <style>{`
        :root { color-scheme: dark; } .record-shell { min-height:100vh; background:#080806; color:#e9e1d3; font-family:var(--font-jost),Jost,sans-serif; padding:.9rem; } .topbar,.record-grid,.timeline-panel,.warning,.success{max-width:1360px;margin-left:auto;margin-right:auto}.topbar{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:.8rem}.topbar a{color:#c8a96e;text-decoration:none}.mini{color:#c8a96e;text-transform:uppercase;letter-spacing:.18em;font-size:.64rem;font-weight:600;margin:0 0 .3rem}h1,h2,p{margin-top:0}h1,h2{color:#fff8ea;font-family:var(--font-cormorant),'Cormorant Garamond',serif;font-weight:300;line-height:.98}h1{font-size:clamp(2.2rem,9vw,5rem);margin-bottom:0}.mode,.warning,.success{border:1px solid rgba(200,169,110,.2);border-radius:999px;padding:.55rem .75rem;color:#c8a96e}.warning,.success{border-radius:18px;margin-bottom:.8rem;line-height:1.5}.warning{color:#ffcf8d}.success{color:#9ed0a4}.record-grid{display:grid;gap:.8rem}.panel{border:1px solid rgba(200,169,110,.18);background:rgba(233,225,211,.045);border-radius:22px;padding:1rem;box-shadow:0 18px 70px rgba(0,0,0,.22)}.flow-card h2{font-size:1.8rem;margin-bottom:.75rem}.flow-line{display:grid;grid-template-columns:auto 1fr;gap:.65rem;border-top:1px solid rgba(233,225,211,.08);padding:.75rem 0}.flow-line:first-of-type{border-top:0}.flow-dot{width:1.25rem;height:1.25rem;border-radius:999px;display:inline-grid;place-items:center;border:1px solid rgba(200,169,110,.45);color:#c8a96e;font-size:.72rem}.flow-done .flow-dot{background:#c8a96e;color:#080806}.flow-muted{opacity:.78}.flow-line strong{display:block;color:#fff8ea;font-weight:500}.flow-line small{display:block;color:rgba(233,225,211,.62);line-height:1.45;margin-top:.16rem}.section-head{display:flex;justify-content:space-between;gap:1rem;align-items:center}fieldset{border:1px solid rgba(233,225,211,.08);border-radius:18px;margin:0 0 1rem;padding:1rem}legend{color:#c8a96e;text-transform:uppercase;letter-spacing:.14em;font-size:.68rem}.fields{display:grid;gap:.7rem}.two,.four{grid-template-columns:1fr}label span{display:block;color:rgba(233,225,211,.62);font-size:.68rem;text-transform:uppercase;letter-spacing:.12em;margin-bottom:.3rem}input,select,textarea{width:100%;box-sizing:border-box;border:1px solid rgba(200,169,110,.18);background:rgba(0,0,0,.24);color:#fff8ea;border-radius:12px;padding:.8rem;font:inherit}textarea{min-height:100px}button{border:1px solid #c8a96e;background:#c8a96e;color:#080806;border-radius:999px;padding:.75rem .95rem;text-transform:uppercase;letter-spacing:.12em;font-size:.68rem;cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}.side-stack{display:grid;gap:.8rem}.ledger h2{font-size:2.4rem}.event-form{display:grid;gap:.6rem;margin-bottom:1rem}.timeline{display:grid;gap:.65rem}.timeline article{border:1px solid rgba(233,225,211,.08);background:rgba(0,0,0,.22);border-radius:18px;padding:.9rem}.timeline span,.timeline small{color:rgba(233,225,211,.58);font-size:.72rem}.timeline strong{display:block;color:#fff8ea;margin:.35rem 0}.timeline p{color:rgba(233,225,211,.7);line-height:1.5;margin-bottom:.35rem}@media(min-width:820px){.record-grid{grid-template-columns:minmax(0,1.45fr) minmax(340px,.65fr);align-items:start}.side-stack{position:sticky;top:1rem}.two{grid-template-columns:1fr 1fr}.four{grid-template-columns:repeat(4,1fr)}.event-form{grid-template-columns:160px 160px 1fr 180px}.event-form textarea{grid-column:1/-2;min-height:86px}.event-form button{align-self:end}}`}</style>
    </main>
  );
}

function Input({ name, label, defaultValue, type = 'text' }: { name: string; label: string; defaultValue: string; type?: string }) {
  return <label><span>{label}</span><input name={name} type={type} defaultValue={defaultValue} /></label>;
}

function Textarea({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return <label><span>{label}</span><textarea name={name} defaultValue={defaultValue} /></label>;
}

function FlowLine({ done, label, note, muted = false }: { done: boolean; label: string; note: string; muted?: boolean }) {
  return (
    <div className={`flow-line ${done ? 'flow-done' : ''} ${muted ? 'flow-muted' : ''}`}>
      <span className="flow-dot">{done ? '✓' : '•'}</span>
      <div><strong>{label}</strong><small>{note}</small></div>
    </div>
  );
}
