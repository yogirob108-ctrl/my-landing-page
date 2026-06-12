import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { bookings, emailTemplates, getMissingEmails, getOpsMetrics, statusLabels, statusOrder, type Booking } from '@/lib/booking-ops-data';
import { isSupabaseConfigured } from '@/lib/ops-config';
import { clearOpsPinSession, hasOpsPinSession } from '@/lib/ops-pin';

export const metadata: Metadata = {
  title: 'Ops Command Center | 8 Lakes Tours',
  description: 'Internal booking operations command center for 8 Lakes Tours.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' });
const dateTime = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

async function signOut() {
  'use server';
  await clearOpsPinSession();
  redirect('/ops/login');
}

function formatDate(value: string) {
  return shortDate.format(new Date(value));
}

function formatDateTime(value: string) {
  return dateTime.format(new Date(value));
}

function statusClass(status: string) {
  return `status status-${status.replaceAll('_', '-')}`;
}

function isAttentionBooking(booking: Booking) {
  return booking.status === 'awaiting_payment' || booking.tasks.some((task) => !task.done) || getMissingEmails(booking).length > 0;
}

function nextActionFor(booking: Booking) {
  if (booking.status === 'awaiting_payment') return 'Chase online reservation payment';
  const openTask = booking.tasks.find((task) => !task.done);
  if (openTask) return openTask.title;
  const missing = getMissingEmails(booking)[0];
  if (missing) return `Send ${missing.replaceAll('_', ' ')}`;
  return 'No immediate action';
}

export default async function OpsDashboardPage() {
  if (!(await hasOpsPinSession())) {
    redirect('/ops/login');
  }

  const metrics = getOpsMetrics();
  const onlineOutstanding = metrics.onlineDue - metrics.onlinePaid;
  const attentionBookings = bookings.filter(isAttentionBooking);
  const paidBookings = bookings.filter((booking) => booking.onlinePaidUsd >= booking.onlineDueUsd);
  const unpaidBookings = bookings.filter((booking) => booking.onlinePaidUsd < booking.onlineDueUsd);
  const openTasks = bookings.flatMap((booking) => booking.tasks.filter((task) => !task.done).map((task) => ({ booking, task })));

  return (
    <main className="ops-shell">
      <header className="topbar">
        <div>
          <p className="mini">8 Lakes Ops</p>
          <h1>Command center</h1>
        </div>
        <form action={signOut}><button className="signout" type="submit">Lock</button></form>
      </header>

      <nav className="quick-nav" aria-label="Ops sections">
        <a href="#today">Today</a>
        <a href="#pipeline">Pipeline</a>
        <a href="#money">Money</a>
        <a href="#tasks">Tasks</a>
      </nav>

      <section className="system-strip" aria-label="System status">
        <strong>{isSupabaseConfigured ? 'Supabase env detected' : 'PIN-only live v0'}</strong>
        <span>Protected by PIN. Sample records remain until Formspree/Stripe are bridged into Supabase.</span>
      </section>

      <section className="priority-grid" id="today">
        <PriorityCard tone="urgent" label="Needs attention" value={attentionBookings.length.toString()} detail="Unpaid bookings, missing emails, or open prep tasks" />
        <PriorityCard label="Guests in pipeline" value={metrics.guests.toString()} detail={`${bookings.length} booking records`} />
        <PriorityCard label="Online collected" value={money.format(metrics.onlinePaid)} detail={`${money.format(onlineOutstanding)} still outstanding`} />
        <PriorityCard label="Cash to families" value={money.format(metrics.familyCashDue)} detail="Tracked, not online revenue" />
      </section>

      <section className="ops-grid">
        <div className="main-stack">
          <section className="panel attention-panel">
            <div className="section-head">
              <div>
                <p className="mini">Priority queue</p>
                <h2>Do these next</h2>
              </div>
              <span>{attentionBookings.length} open</span>
            </div>
            <div className="action-list">
              {attentionBookings.map((booking) => (
                <article className="action-card" key={booking.id}>
                  <div className="action-top">
                    <div>
                      <span className="record-id">{booking.id}</span>
                      <h3>{booking.customerName}</h3>
                    </div>
                    <span className={statusClass(booking.status)}>{statusLabels[booking.status]}</span>
                  </div>
                  <p className="next-action">{nextActionFor(booking)}</p>
                  <div className="action-meta">
                    <span>{booking.tourDate}</span>
                    <span>{booking.guestCount} guest{booking.guestCount === 1 ? '' : 's'}</span>
                    <span>{booking.email}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel" id="pipeline">
            <div className="section-head">
              <div>
                <p className="mini">Customer database</p>
                <h2>Booking pipeline</h2>
              </div>
              <span>Source of truth shape</span>
            </div>
            <div className="status-board">
              {statusOrder.map((status) => (
                <div key={status} className="status-tile">
                  <span>{statusLabels[status]}</span>
                  <strong>{bookings.filter((booking) => booking.status === status).length}</strong>
                </div>
              ))}
            </div>
            <div className="booking-list">
              {bookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)}
            </div>
          </section>
        </div>

        <aside className="side-stack">
          <section className="panel money-panel" id="money">
            <p className="mini">Financial control</p>
            <h2>Split-payment ledger</h2>
            <LedgerRow label="Gross trip value" value={money.format(metrics.grossTripValue)} />
            <LedgerRow label="Online due" value={money.format(metrics.onlineDue)} />
            <LedgerRow label="Online paid" value={money.format(metrics.onlinePaid)} positive />
            <LedgerRow label="Online outstanding" value={money.format(onlineOutstanding)} warning={onlineOutstanding > 0} />
            <LedgerRow label="Cash paid to families" value={money.format(metrics.familyCashDue)} />
            <p className="ledger-note">Rule: the $1,140/person host-family amount is tracked operationally, but not treated as online revenue.</p>
          </section>

          <section className="panel compact-panel">
            <p className="mini">Payment state</p>
            <div className="mini-list">
              <strong>{paidBookings.length} paid online</strong>
              <span>{unpaidBookings.length} awaiting online payment</span>
            </div>
          </section>

          <section className="panel" id="tasks">
            <div className="section-head tight">
              <div>
                <p className="mini">Task board</p>
                <h2>Open prep</h2>
              </div>
              <span>{openTasks.length}</span>
            </div>
            <ul className="task-list">
              {openTasks.map(({ booking, task }) => (
                <li key={`${booking.id}-${task.title}`}>
                  <span>{formatDate(task.due)}</span>
                  <strong>{task.title}</strong>
                  <small>{booking.customerName} · {booking.id}</small>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <p className="mini">Email workflow</p>
            <h2>Manual sends first</h2>
            <div className="template-stack">
              {emailTemplates.slice(0, 5).map((template) => (
                <article key={template.key}>
                  <strong>{template.name}</strong>
                  <span>{template.subject}</span>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="panel infra-panel">
        <div className="section-head">
          <div>
            <p className="mini">Infrastructure priority</p>
            <h2>Build order from here</h2>
          </div>
          <a href="https://github.com/yogirob108-ctrl/my-landing-page/blob/main/docs/booking-ops-stack.md">Docs live in repo</a>
        </div>
        <ol className="infra-list">
          <li><strong>1. Keep PIN gate live</strong><span>Immediate protection while still faster than Supabase magic links.</span></li>
          <li><strong>2. Apply Supabase migration</strong><span>Tables already exist in repo: projects, customers, bookings, payments, email events, tasks.</span></li>
          <li><strong>3. Bridge Formspree</strong><span>Every application becomes a booking row and still notifies Rob.</span></li>
          <li><strong>4. Match Stripe payments</strong><span>Webhook marks online_due/paid and unlocks confirmation email.</span></li>
          <li><strong>5. Resend email actions</strong><span>Buttons send approved templates and log exact message snapshots.</span></li>
          <li><strong>6. Telegram read/draft bot</strong><span>Mobile lookup and status reports from the same database.</span></li>
        </ol>
      </section>

      <style>{`
        :root { color-scheme: dark; }
        .ops-shell { min-height: 100vh; background: #080806; color: #e9e1d3; font-family: var(--font-jost), Jost, sans-serif; padding: 0.9rem; padding-bottom: 5rem; }
        .topbar { position: sticky; top: 0; z-index: 20; display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.85rem 0.2rem 1rem; background: linear-gradient(180deg, #080806 72%, rgba(8,8,6,0)); backdrop-filter: blur(12px); }
        .mini { margin: 0 0 0.35rem; color: #c8a96e; text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.64rem; font-weight: 600; }
        h1, h2, h3, p { margin-top: 0; }
        h1, h2 { font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-weight: 300; color: #fff8ea; line-height: 0.96; }
        h1 { font-size: clamp(2.35rem, 12vw, 5.5rem); margin-bottom: 0; }
        h2 { font-size: clamp(1.9rem, 7vw, 3.4rem); margin-bottom: 0.4rem; }
        h3 { color: #fff8ea; margin-bottom: 0.25rem; }
        .signout { border: 1px solid rgba(200,169,110,0.36); background: rgba(200,169,110,0.1); color: #c8a96e; border-radius: 999px; padding: 0.7rem 0.9rem; text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.68rem; }
        .quick-nav { position: fixed; left: 0.75rem; right: 0.75rem; bottom: 0.75rem; z-index: 30; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.35rem; padding: 0.35rem; background: rgba(16,14,10,0.92); border: 1px solid rgba(200,169,110,0.22); border-radius: 999px; backdrop-filter: blur(16px); }
        .quick-nav a { text-align: center; text-decoration: none; color: #e9e1d3; padding: 0.7rem 0.2rem; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; }
        .system-strip, .panel, .priority-card { border: 1px solid rgba(200,169,110,0.18); background: rgba(233,225,211,0.045); border-radius: 22px; box-shadow: 0 18px 70px rgba(0,0,0,0.24); }
        .system-strip { display: grid; gap: 0.2rem; margin: 0.4rem 0 0.9rem; padding: 0.9rem; color: rgba(233,225,211,0.76); }
        .system-strip strong { color: #c8a96e; }
        .priority-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 0.7rem; margin-bottom: 0.7rem; }
        .priority-card { padding: 0.95rem; background: linear-gradient(145deg, rgba(200,169,110,0.09), rgba(233,225,211,0.035)); }
        .priority-card.urgent { border-color: rgba(255,180,158,0.42); background: linear-gradient(145deg, rgba(154,70,50,0.24), rgba(233,225,211,0.035)); }
        .priority-card span { display: block; color: rgba(233,225,211,0.68); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.13em; }
        .priority-card strong { display: block; color: #fff8ea; font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-weight: 300; font-size: clamp(2rem, 10vw, 3.6rem); line-height: 1; margin: 0.45rem 0; }
        .priority-card small { color: rgba(233,225,211,0.62); line-height: 1.45; }
        .ops-grid, .main-stack, .side-stack { display: grid; gap: 0.8rem; }
        .panel { padding: 1rem; }
        .section-head { display: flex; justify-content: space-between; align-items: end; gap: 1rem; margin-bottom: 0.9rem; }
        .section-head > span, .section-head a { color: #c8a96e; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; text-decoration: none; }
        .action-list, .booking-list, .template-stack { display: grid; gap: 0.7rem; }
        .action-card, .booking-row, .template-stack article, .task-list li { background: rgba(0,0,0,0.22); border: 1px solid rgba(233,225,211,0.07); border-radius: 18px; padding: 0.9rem; }
        .action-top, .booking-row-top { display: flex; justify-content: space-between; gap: 0.8rem; align-items: start; }
        .record-id { display: block; color: #c8a96e; font-size: 0.64rem; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 0.25rem; }
        .status { display: inline-flex; white-space: nowrap; border: 1px solid rgba(200,169,110,0.25); color: #fff8ea; border-radius: 999px; padding: 0.38rem 0.55rem; font-size: 0.58rem; letter-spacing: 0.09em; text-transform: uppercase; }
        .status-confirmed, .status-prep-sent, .status-ready-for-departure { background: rgba(73,128,88,0.2); border-color: rgba(73,128,88,0.55); }
        .status-awaiting-payment { background: rgba(255,180,80,0.12); border-color: rgba(255,180,80,0.35); }
        .next-action { margin: 0.8rem 0; color: #fff8ea; font-size: 1.02rem; }
        .action-meta, .booking-facts { display: flex; gap: 0.45rem; flex-wrap: wrap; color: rgba(233,225,211,0.62); font-size: 0.76rem; }
        .action-meta span, .booking-facts span { border: 1px solid rgba(200,169,110,0.13); border-radius: 999px; padding: 0.32rem 0.48rem; }
        .status-board { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 0.55rem; margin-bottom: 0.8rem; }
        .status-tile { border: 1px solid rgba(200,169,110,0.12); border-radius: 16px; padding: 0.75rem; background: rgba(200,169,110,0.045); }
        .status-tile span { display: block; color: rgba(233,225,211,0.64); font-size: 0.72rem; min-height: 2.2rem; }
        .status-tile strong { color: #fff8ea; font-size: 1.45rem; font-weight: 400; }
        .booking-row { display: grid; gap: 0.75rem; }
        .booking-row p { color: rgba(233,225,211,0.64); line-height: 1.55; margin-bottom: 0; }
        .money-line { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.45rem; }
        .money-line div { border-left: 2px solid rgba(200,169,110,0.55); background: rgba(200,169,110,0.06); padding: 0.55rem; border-radius: 10px; }
        .money-line span, .ledger-row span { display: block; color: rgba(233,225,211,0.6); font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.1em; }
        .money-line strong, .ledger-row strong { color: #fff8ea; font-weight: 500; }
        .ledger-row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.85rem 0; border-bottom: 1px solid rgba(200,169,110,0.12); }
        .ledger-row.positive strong { color: #9ed0a4; } .ledger-row.warning strong { color: #ffcf8d; }
        .ledger-note { margin: 1rem 0 0; color: rgba(233,225,211,0.68); line-height: 1.55; }
        .mini-list { display: grid; gap: 0.35rem; } .mini-list strong { color: #fff8ea; } .mini-list span { color: rgba(233,225,211,0.65); }
        .task-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.55rem; }
        .task-list li { display: grid; gap: 0.25rem; }
        .task-list span { color: #c8a96e; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.12em; }
        .task-list small, .template-stack span { color: rgba(233,225,211,0.6); line-height: 1.45; }
        .template-stack article { display: grid; gap: 0.25rem; }
        .infra-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.65rem; }
        .infra-list li { display: grid; gap: 0.25rem; padding: 0.85rem; border-radius: 16px; background: rgba(0,0,0,0.2); border: 1px solid rgba(233,225,211,0.07); }
        .infra-list strong { color: #fff8ea; } .infra-list span { color: rgba(233,225,211,0.64); line-height: 1.5; }
        @media (min-width: 760px) {
          .ops-shell { padding: 1.25rem; padding-bottom: 1.25rem; }
          .topbar, .system-strip, .priority-grid, .ops-grid, .infra-panel { max-width: 1320px; margin-left: auto; margin-right: auto; }
          .quick-nav { position: sticky; top: 0.85rem; bottom: auto; width: min(560px, 100%); margin: 0 auto 1rem; }
          .priority-grid { grid-template-columns: repeat(4, minmax(0,1fr)); }
          .status-board { grid-template-columns: repeat(7,minmax(0,1fr)); }
        }
        @media (min-width: 1080px) {
          .ops-grid { grid-template-columns: minmax(0,1.55fr) minmax(360px,0.75fr); align-items: start; }
          .side-stack { position: sticky; top: 5.8rem; }
          .booking-row { grid-template-columns: minmax(0,1fr) minmax(360px,0.7fr); align-items: center; }
          .infra-list { grid-template-columns: repeat(3,minmax(0,1fr)); }
        }
        @media (max-width: 430px) {
          .money-line { grid-template-columns: 1fr; }
          .action-top, .booking-row-top, .section-head { display: grid; }
        }
      `}</style>
    </main>
  );
}

function PriorityCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: 'urgent' }) {
  return <article className={`priority-card ${tone ?? ''}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function BookingRow({ booking }: { booking: Booking }) {
  const missingEmails = getMissingEmails(booking);
  return (
    <article className="booking-row">
      <div>
        <div className="booking-row-top">
          <div><span className="record-id">{booking.id}</span><h3>{booking.customerName}</h3></div>
          <span className={statusClass(booking.status)}>{statusLabels[booking.status]}</span>
        </div>
        <div className="booking-facts">
          <span>{booking.email}</span><span>{booking.phone}</span><span>{booking.tourDate}</span><span>{booking.formSource}</span><span>Submitted {formatDateTime(booking.submittedAt)}</span>
        </div>
        <p>{booking.notes}</p>
        {missingEmails.length > 0 && <p className="next-action">Missing email: {missingEmails.join(', ').replaceAll('_', ' ')}</p>}
      </div>
      <div className="money-line">
        <div><span>Online</span><strong>{money.format(booking.onlinePaidUsd)} / {money.format(booking.onlineDueUsd)}</strong></div>
        <div><span>Family cash</span><strong>{money.format(booking.familyCashDueUsd)}</strong></div>
        <div><span>Guests</span><strong>{booking.guestCount}</strong></div>
      </div>
    </article>
  );
}

function LedgerRow({ label, value, positive, warning }: { label: string; value: string; positive?: boolean; warning?: boolean }) {
  return <div className={`ledger-row ${positive ? 'positive' : ''} ${warning ? 'warning' : ''}`}><span>{label}</span><strong>{value}</strong></div>;
}
