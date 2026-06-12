import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createBookingRecord } from '@/app/ops/actions';
import { getOpsDataset, missingConfigMessage } from '@/lib/ops-records';
import { clearOpsPinSession, hasOpsPinSession } from '@/lib/ops-pin';
import { getOpsMetrics, statusLabels, statusOrder } from '@/lib/booking-ops-data';

export const metadata: Metadata = {
  title: 'Ops Bookings CMS | 8 Lakes Tours',
  description: 'Internal booking CMS table for 8 Lakes Tours.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

async function signOut() {
  'use server';
  await clearOpsPinSession();
  redirect('/ops/login');
}

function formatDateTime(value: string) {
  return dateTime.format(new Date(value));
}

function nextAction(booking: { status: string; tasks: { done: boolean; title: string }[]; onlinePaidUsd: number; onlineDueUsd: number }) {
  if (booking.onlinePaidUsd < booking.onlineDueUsd) return 'Chase payment';
  const openTask = booking.tasks.find((task) => !task.done);
  if (openTask) return openTask.title;
  return 'Healthy';
}

export default async function OpsDashboardPage() {
  if (!(await hasOpsPinSession())) redirect('/ops/login');

  const dataset = await getOpsDataset();
  const bookings = dataset.bookings;
  const metrics = getOpsMetrics(bookings);
  const configMessage = missingConfigMessage(dataset.mode);

  return (
    <main className="cms-shell">
      <header className="topbar">
        <div>
          <p className="mini">8 Lakes Ops CMS</p>
          <h1>Bookings</h1>
        </div>
        <form action={signOut}><button type="submit">Lock</button></form>
      </header>

      {configMessage && <section className="warning-banner">{configMessage}</section>}

      <section className="metrics" aria-label="Booking metrics">
        <Metric label="Records" value={bookings.length.toString()} />
        <Metric label="Guests" value={metrics.guests.toString()} />
        <Metric label="Online paid" value={money.format(metrics.onlinePaid)} />
        <Metric label="Outstanding" value={money.format(metrics.onlineDue - metrics.onlinePaid)} />
      </section>

      <section className="create-panel">
        <div>
          <p className="mini">Add record</p>
          <h2>Manual booking entry</h2>
        </div>
        <form action={createBookingRecord}>
          <input name="firstName" required placeholder="First name" />
          <input name="lastName" required placeholder="Last name" />
          <input name="email" required type="email" placeholder="Email" />
          <input name="phone" placeholder="Phone" />
          <input name="tourDate" placeholder="Tour date / window" />
          <input name="guestCount" type="number" min="1" defaultValue="1" aria-label="Guests" />
          <button type="submit">Create</button>
        </form>
      </section>

      <section className="table-panel">
        <div className="panel-head">
          <div>
            <p className="mini">CMS table</p>
            <h2>Click a booking to edit the record, tasks, money, and communication log.</h2>
          </div>
          <span>{dataset.mode === 'supabase' ? 'Live Supabase' : 'Sample mode'}</span>
        </div>

        <div className="filter-row" aria-label="Status filters">
          <Link href="/ops">All</Link>
          {statusOrder.map((status) => <a key={status} href={`#${status}`}>{statusLabels[status]}</a>)}
        </div>

        <div className="booking-table" role="table" aria-label="Bookings">
          <div className="table-row table-head" role="row">
            <span>Status</span><span>Customer</span><span>Tour</span><span>Money</span><span>Last contact</span><span>Next action</span>
          </div>
          {bookings.map((booking) => (
            <Link href={`/ops/bookings/${booking.id}`} className="table-row" role="row" key={booking.id} id={booking.status}>
              <span><Status status={booking.status} /></span>
              <span className="customer-cell"><strong>{booking.customerName}</strong><small>{booking.email}<br />{booking.phone}</small></span>
              <span><strong>{booking.tourDate}</strong><small>{booking.guestCount} guest{booking.guestCount === 1 ? '' : 's'} · {booking.ridingExperience}</small></span>
              <span><strong>{money.format(booking.onlinePaidUsd)} / {money.format(booking.onlineDueUsd)}</strong><small>{money.format(booking.familyCashDueUsd)} family cash</small></span>
              <span><strong>{booking.communicationEvents[0] ? formatDateTime(booking.communicationEvents[0].occurredAt) : formatDateTime(booking.submittedAt)}</strong><small>{booking.communicationEvents[0]?.title ?? 'Form submitted'}</small></span>
              <span><strong>{nextAction(booking)}</strong><small>Open record →</small></span>
            </Link>
          ))}
        </div>
      </section>

      <style>{`
        :root { color-scheme: dark; }
        .cms-shell { min-height: 100vh; background: #080806; color: #e9e1d3; font-family: var(--font-jost), Jost, sans-serif; padding: 0.9rem; }
        .topbar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; max-width: 1360px; margin: 0 auto 0.8rem; }
        .mini { color: #c8a96e; text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.64rem; font-weight: 600; margin: 0 0 0.3rem; }
        h1, h2, p { margin-top: 0; } h1, h2 { color: #fff8ea; font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-weight: 300; line-height: 0.98; }
        h1 { font-size: clamp(2.7rem, 11vw, 5.5rem); margin-bottom: 0; } h2 { font-size: clamp(1.55rem, 4vw, 2.7rem); max-width: 760px; }
        button, .filter-row a { border: 1px solid rgba(200,169,110,0.34); background: rgba(200,169,110,0.1); color: #c8a96e; border-radius: 999px; padding: 0.72rem 0.9rem; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.68rem; text-decoration: none; cursor: pointer; }
        .warning-banner, .table-panel, .metric, .create-panel { border: 1px solid rgba(200,169,110,0.18); background: rgba(233,225,211,0.045); border-radius: 22px; box-shadow: 0 18px 70px rgba(0,0,0,0.22); }
        .warning-banner { max-width: 1360px; margin: 0 auto 0.8rem; padding: 0.9rem; color: #ffcf8d; line-height: 1.55; }
        .metrics { max-width: 1360px; margin: 0 auto 0.8rem; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 0.65rem; }
        .metric { padding: 0.9rem; } .metric span { display: block; color: rgba(233,225,211,0.62); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.12em; } .metric strong { color: #fff8ea; font-size: 1.8rem; font-weight: 400; }
        .create-panel { max-width: 1360px; margin: 0 auto 0.8rem; padding: 0.9rem; display: grid; gap: 0.7rem; }
        .create-panel h2 { margin-bottom: 0; }
        .create-panel form { display: grid; gap: 0.55rem; }
        .create-panel input { width: 100%; box-sizing: border-box; border: 1px solid rgba(200,169,110,0.18); background: rgba(0,0,0,0.24); color: #fff8ea; border-radius: 12px; padding: 0.78rem; font: inherit; }
        .create-panel button { background: #c8a96e; color: #080806; }
        .table-panel { max-width: 1360px; margin: 0 auto; padding: 0.8rem; }
        .panel-head { display: flex; justify-content: space-between; gap: 1rem; align-items: end; margin-bottom: 0.8rem; } .panel-head > span { color: #c8a96e; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.7rem; }
        .filter-row { display: flex; gap: 0.45rem; overflow-x: auto; padding-bottom: 0.8rem; margin-bottom: 0.2rem; }
        .filter-row a { white-space: nowrap; background: rgba(0,0,0,0.18); }
        .booking-table { display: grid; gap: 0.55rem; }
        .table-row { display: grid; gap: 0.55rem; padding: 0.9rem; border-radius: 18px; border: 1px solid rgba(233,225,211,0.075); background: rgba(0,0,0,0.22); color: inherit; text-decoration: none; }
        .table-head { display: none; color: #c8a96e; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.64rem; background: transparent; border-color: rgba(200,169,110,0.16); }
        .table-row span { min-width: 0; } .table-row strong { display: block; color: #fff8ea; font-weight: 500; overflow-wrap: anywhere; } .table-row small { display: block; color: rgba(233,225,211,0.62); line-height: 1.45; margin-top: 0.2rem; overflow-wrap: anywhere; }
        .status { display: inline-flex; white-space: nowrap; border: 1px solid rgba(200,169,110,0.25); color: #fff8ea; border-radius: 999px; padding: 0.38rem 0.55rem; font-size: 0.58rem; letter-spacing: 0.09em; text-transform: uppercase; }
        .status-confirmed, .status-prep-sent, .status-ready-for-departure { background: rgba(73,128,88,0.2); border-color: rgba(73,128,88,0.55); }
        .status-awaiting-payment { background: rgba(255,180,80,0.12); border-color: rgba(255,180,80,0.35); }
        @media (min-width: 780px) { .metrics { grid-template-columns: repeat(4,minmax(0,1fr)); } .create-panel { grid-template-columns: 260px 1fr; align-items: end; } .create-panel form { grid-template-columns: repeat(6,minmax(0,1fr)) auto; } .table-row { grid-template-columns: 0.9fr 1.4fr 1.5fr 1.1fr 1.1fr 1fr; align-items: center; } .table-head { display: grid; } .table-panel { padding: 1rem; } }
      `}</style>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article className="metric"><span>{label}</span><strong>{value}</strong></article>;
}

function Status({ status }: { status: string }) {
  return <span className={`status status-${status.replaceAll('_', '-')}`}>{statusLabels[status as keyof typeof statusLabels]}</span>;
}
