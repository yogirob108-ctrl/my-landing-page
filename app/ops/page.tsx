import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { bookings, emailTemplates, getMissingEmails, getOpsMetrics, stackDecisions, statusLabels, statusOrder, telegramBotCommands } from '@/lib/booking-ops-data';
import { isAllowedOpsEmail, isSupabaseConfigured } from '@/lib/ops-config';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const metadata: Metadata = {
  title: 'Booking Ops Dashboard Prototype | 8 Lakes Tours',
  description: 'Internal booking operations prototype for 8 Lakes Tours customer flow, payments, email tracking, and pre-trip tasks.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const metrics = getOpsMetrics();
const confirmedBookings = bookings.filter((booking) => ['confirmed', 'prep_sent', 'ready_for_departure', 'completed'].includes(booking.status));
const onlineOutstanding = metrics.onlineDue - metrics.onlinePaid;

function formatDate(value: string) {
  return date.format(new Date(value));
}

function formatDateTime(value: string) {
  return dateTime.format(new Date(value));
}

function statusClass(status: string) {
  return `status status-${status.replaceAll('_', '-')}`;
}

async function signOut() {
  'use server';

  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect('/ops/login');
}

async function getOpsUser() {
  if (!isSupabaseConfigured) {
    return { email: null, mode: 'prototype' as const };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;

  if (!isAllowedOpsEmail(email)) {
    redirect('/ops/login');
  }

  return { email, mode: 'authenticated' as const };
}

export default async function OpsDashboardPage() {
  const opsUser = await getOpsUser();

  return (
    <main className="ops-page">
      <header className="ops-hero">
        <nav className="ops-nav">
          <Link href="/" className="brand">8 Lakes Tours</Link>
          <div className="nav-links">
            <a href="#bookings">Bookings</a>
            <a href="#emails">Email flow</a>
            <a href="#stack">Stack</a>
            {opsUser.mode === 'authenticated' ? <span className="admin-pill">{opsUser.email}</span> : <span className="admin-pill warning-pill">Prototype mode</span>}
            {opsUser.mode === 'authenticated' && (
              <form action={signOut}>
                <button type="submit" className="nav-button">Sign out</button>
              </form>
            )}
            <Link href="/">Public site</Link>
          </div>
        </nav>
        {opsUser.mode === 'prototype' && (
          <div className="setup-banner">
            Supabase auth is not configured in this environment yet. This route is still showing sample data only; add the Supabase env vars before using live customer data.
          </div>
        )}
        <div className="hero-grid">
          <div>
            <p className="eyebrow">Booking Ops v0</p>
            <h1>Customer flow, payments, emails, and prep tasks in one focused dashboard.</h1>
            <p className="lead">This is the first internal operating-system prototype: keep Formspree as the intake pipe for now, make the owned booking database the source of truth, and move email templates from memory into a logged workflow.</p>
          </div>
          <aside className="decision-card">
            <p className="eyebrow">Immediate build target</p>
            <ol>
              <li>See every customer and booking state.</li>
              <li>Separate $959 online revenue from $1,140 family cash.</li>
              <li>Click-send templates and log exactly what was sent.</li>
              <li>Track missing prep items before departure.</li>
            </ol>
          </aside>
        </div>
      </header>

      <section className="metrics-grid" aria-label="Booking metrics">
        <Metric label="Confirmed guests" value={confirmedBookings.reduce((sum, booking) => sum + booking.guestCount, 0).toString()} note={`${bookings.length} active booking records`} />
        <Metric label="Online paid" value={money.format(metrics.onlinePaid)} note={`${money.format(onlineOutstanding)} still pending online`} />
        <Metric label="Host-family cash due" value={money.format(metrics.familyCashDue)} note="Paid locally, not counted as online revenue" />
        <Metric label="Open prep tasks" value={metrics.openTasks.toString()} note="Insurance, arrival details, cash reminders" />
      </section>

      <section className="panel" id="bookings">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Bookings</p>
            <h2>Operational customer database</h2>
          </div>
          <p>These records are sample data showing the exact fields the real Supabase table should own. No live customer data belongs in this public prototype yet.</p>
        </div>

        <div className="status-row">
          {statusOrder.map((status) => (
            <div key={status} className="status-tile">
              <span>{statusLabels[status]}</span>
              <strong>{bookings.filter((booking) => booking.status === status).length}</strong>
            </div>
          ))}
        </div>

        <div className="booking-list">
          {bookings.map((booking) => {
            const missingEmails = getMissingEmails(booking);
            return (
              <article key={booking.id} className="booking-card">
                <div className="booking-topline">
                  <div>
                    <span className="record-id">{booking.id}</span>
                    <h3>{booking.customerName}</h3>
                    <p>{booking.email} · {booking.phone}</p>
                  </div>
                  <span className={statusClass(booking.status)}>{statusLabels[booking.status]}</span>
                </div>

                <div className="booking-grid">
                  <Info label="Tour date" value={booking.tourDate} />
                  <Info label="Guests" value={booking.guestCount.toString()} />
                  <Info label="Riding" value={booking.ridingExperience} />
                  <Info label="Dietary" value={booking.dietaryNotes} />
                  <Info label="Source" value={booking.formSource} />
                  <Info label="Submitted" value={formatDateTime(booking.submittedAt)} />
                </div>

                <div className="money-strip">
                  <Info label="Gross trip value" value={money.format(booking.totalTripValueUsd)} />
                  <Info label="Online paid / due" value={`${money.format(booking.onlinePaidUsd)} / ${money.format(booking.onlineDueUsd)}`} />
                  <Info label="Cash to family" value={money.format(booking.familyCashDueUsd)} />
                  <Info label="Stripe" value={booking.stripeReference ?? 'Not matched yet'} />
                </div>

                <div className="sub-panels">
                  <div>
                    <h4>Email history</h4>
                    <ul className="event-list">
                      {booking.emails.map((event) => (
                        <li key={`${booking.id}-${event.template}-${event.sentAt}`}>
                          <strong>{event.subject}</strong>
                          <span>{formatDateTime(event.sentAt)} · sent by {event.sentBy}</span>
                        </li>
                      ))}
                    </ul>
                    {missingEmails.length > 0 && <p className="warning">Missing next: {missingEmails.join(', ').replaceAll('_', ' ')}</p>}
                  </div>
                  <div>
                    <h4>Open tasks</h4>
                    <ul className="task-list">
                      {booking.tasks.map((task) => (
                        <li key={`${booking.id}-${task.title}`} className={task.done ? 'done' : ''}>
                          <span>{task.done ? '✓' : '•'}</span>
                          <div>
                            <strong>{task.title}</strong>
                            <small>Due {formatDate(task.due)}</small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="notes">{booking.notes}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="two-column" id="emails">
        <div className="panel">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Email templates</p>
              <h2>Click-send first, automate later</h2>
            </div>
            <p>Each button in the real app should send through Resend, save the message snapshot, and write an email_events row.</p>
          </div>
          <div className="template-list">
            {emailTemplates.map((template) => (
              <article key={template.key} className="template-card">
                <div>
                  <h3>{template.name}</h3>
                  <p>{template.subject}</p>
                  <span>{template.trigger}</span>
                </div>
                <button type="button" aria-label={`Prototype send button for ${template.name}`}>Send</button>
              </article>
            ))}
          </div>
        </div>

        <div className="panel financial-panel">
          <p className="eyebrow">Financial view</p>
          <h2>Keep gross value separate from money collected online</h2>
          <dl>
            <div><dt>Gross customer trip value</dt><dd>{money.format(metrics.grossTripValue)}</dd></div>
            <div><dt>Online reservation amount due</dt><dd>{money.format(metrics.onlineDue)}</dd></div>
            <div><dt>Online amount received</dt><dd>{money.format(metrics.onlinePaid)}</dd></div>
            <div><dt>Online outstanding</dt><dd>{money.format(onlineOutstanding)}</dd></div>
            <div><dt>Cash due directly to families</dt><dd>{money.format(metrics.familyCashDue)}</dd></div>
          </dl>
          <p className="callout">Accounting rule: the $1,140 family portion is tracked operationally but should not be treated as online revenue collected by 8 Lakes Tours / Horse Adventures.</p>
        </div>
      </section>

      <section className="panel" id="stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Stack design</p>
            <h2>Small owned system, not a bloated CRM</h2>
          </div>
          <p>The real implementation should grow from this dashboard into a protected app backed by Supabase, Resend, Stripe webhooks, and a Formspree bridge.</p>
        </div>
        <div className="stack-grid">
          {stackDecisions.map((decision) => (
            <article key={decision.layer} className="stack-card">
              <span>{decision.layer}</span>
              <h3>{decision.choice}</h3>
              <p>{decision.why}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel bot-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Telegram ops bot</p>
            <h2>On-the-go customer reports and decision support</h2>
          </div>
          <p>The bot should be a command layer over the same booking database, not a separate system. It can answer status questions, draft messages, and surface logs while Rob is travelling or away from the laptop.</p>
        </div>
        <div className="bot-grid">
          {telegramBotCommands.map((item) => (
            <article key={item.command} className="bot-card">
              <code>{item.command}</code>
              <p>{item.purpose}</p>
            </article>
          ))}
        </div>
        <p className="callout">Safety rule: early bot versions should read and draft only. Sending customer emails, refunding payments, or changing booking status should require an explicit confirmation step or happen inside the protected dashboard.</p>
      </section>

      <section className="panel blueprint-panel">
        <p className="eyebrow">Next build steps</p>
        <h2>Implementation sequence</h2>
        <ol className="blueprint-list">
          <li><strong>Protect /ops</strong><span>Add Supabase Auth or a single admin allow-list before real data is entered.</span></li>
          <li><strong>Create Supabase tables</strong><span>customers, bookings, payments, email_templates, email_events, booking_tasks.</span></li>
          <li><strong>Bridge Formspree</strong><span>Forward submissions into the bookings table while preserving Rob’s current notification email.</span></li>
          <li><strong>Add Resend actions</strong><span>Turn prototype buttons into server actions that send email and log the exact message snapshot.</span></li>
          <li><strong>Connect Stripe webhooks</strong><span>Payment success marks online_paid_usd and unlocks the booking-confirmed email.</span></li>
          <li><strong>Automate reminders</strong><span>Only after the manual template flow is trusted: insurance, arrival details, final checklist.</span></li>
        </ol>
      </section>

      <style>{`
        :root { color-scheme: dark; }
        .ops-page { min-height: 100vh; background: #0e0c09; color: #d4cfc4; font-family: var(--font-jost), Jost, sans-serif; font-weight: 300; }
        .ops-hero { padding: 1.5rem clamp(1.25rem, 4vw, 4rem) 4rem; background: radial-gradient(circle at 20% 0%, rgba(200,169,110,0.16), transparent 32rem), linear-gradient(140deg, #17120c 0%, #0e0c09 72%); border-bottom: 1px solid rgba(200,169,110,0.16); }
        .ops-nav { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 5rem; flex-wrap: wrap; }
        .brand { font-family: var(--font-cormorant), 'Cormorant Garamond', serif; color: #f5f0e8; letter-spacing: 0.16em; text-transform: uppercase; text-decoration: none; }
        .nav-links { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
        .nav-links a { color: #c8a96e; text-decoration: none; text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.68rem; }
        .admin-pill { border: 1px solid rgba(200,169,110,0.24); color: rgba(245,240,232,0.78); padding: 0.38rem 0.55rem; font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase; }
        .warning-pill { color: #e6bf73; }
        .nav-button { border: 1px solid rgba(200,169,110,0.3); background: transparent; color: #c8a96e; padding: 0.4rem 0.55rem; cursor: pointer; }
        .setup-banner { width: min(1240px, 100%); margin: -3.5rem auto 3rem; padding: 0.85rem 1rem; border: 1px solid rgba(230,191,115,0.28); background: rgba(200,169,110,0.08); color: #e6bf73; line-height: 1.55; }
        .hero-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.65fr); gap: clamp(2rem, 5vw, 5rem); align-items: end; max-width: 1240px; margin: 0 auto; }
        .eyebrow { margin: 0 0 0.9rem; color: #c8a96e; text-transform: uppercase; letter-spacing: 0.24em; font-size: 0.66rem; font-weight: 500; }
        h1, h2, h3, h4, p { margin-top: 0; }
        h1, h2 { font-family: var(--font-cormorant), 'Cormorant Garamond', serif; color: #f5f0e8; font-weight: 300; line-height: 1.04; }
        h1 { font-size: clamp(2.7rem, 7vw, 6.3rem); max-width: 920px; margin-bottom: 1.4rem; }
        h2 { font-size: clamp(2rem, 4vw, 3.7rem); margin-bottom: 0.8rem; }
        h3 { color: #f5f0e8; font-size: 1.1rem; margin-bottom: 0.3rem; }
        h4 { color: #c8a96e; text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.68rem; margin-bottom: 0.9rem; }
        .lead { max-width: 780px; color: rgba(212,207,196,0.82); line-height: 1.8; font-size: 1.02rem; }
        .decision-card, .panel, .booking-card, .template-card, .stack-card, .status-tile { border: 1px solid rgba(200,169,110,0.18); background: rgba(245,240,232,0.035); box-shadow: 0 18px 60px rgba(0,0,0,0.18); }
        .decision-card { padding: 1.5rem; }
        .decision-card ol { margin: 0; padding-left: 1.2rem; line-height: 1.7; color: rgba(245,240,232,0.82); }
        .metrics-grid, .panel, .two-column { width: min(1240px, calc(100% - 2.5rem)); margin-left: auto; margin-right: auto; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-top: -2rem; position: relative; z-index: 2; }
        .metric { padding: 1.2rem; background: #17120c; border: 1px solid rgba(200,169,110,0.22); }
        .metric span { display: block; color: #c8a96e; text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.62rem; margin-bottom: 0.7rem; }
        .metric strong { display: block; color: #f5f0e8; font-size: clamp(1.5rem, 3vw, 2.2rem); font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-weight: 300; }
        .metric small { color: rgba(212,207,196,0.62); line-height: 1.5; }
        .panel { margin-top: 2rem; padding: clamp(1.25rem, 3vw, 2rem); }
        .section-heading { display: flex; justify-content: space-between; gap: 2rem; align-items: end; margin-bottom: 1.5rem; }
        .section-heading p:not(.eyebrow) { max-width: 520px; line-height: 1.75; color: rgba(212,207,196,0.72); }
        .section-heading.compact { display: block; }
        .status-row { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 0.65rem; margin-bottom: 1.5rem; }
        .status-tile { padding: 0.85rem; }
        .status-tile span { display: block; color: rgba(212,207,196,0.7); font-size: 0.72rem; min-height: 2rem; }
        .status-tile strong { color: #f5f0e8; font-size: 1.5rem; font-weight: 400; }
        .booking-list { display: grid; gap: 1rem; }
        .booking-card { padding: 1.25rem; background: rgba(14,12,9,0.7); }
        .booking-topline { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
        .booking-topline p, .notes { color: rgba(212,207,196,0.68); line-height: 1.6; }
        .record-id { color: #c8a96e; font-size: 0.66rem; letter-spacing: 0.18em; text-transform: uppercase; }
        .status { display: inline-flex; align-items: center; align-self: start; border: 1px solid rgba(200,169,110,0.22); color: #f5f0e8; padding: 0.45rem 0.65rem; font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap; }
        .status-confirmed, .status-prep-sent, .status-ready-for-departure { background: rgba(87, 139, 97, 0.18); border-color: rgba(87,139,97,0.5); }
        .status-awaiting-payment { background: rgba(200,169,110,0.12); }
        .booking-grid, .money-strip { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 0.75rem; margin-bottom: 0.8rem; }
        .money-strip { grid-template-columns: repeat(4, minmax(0, 1fr)); padding: 0.9rem; background: rgba(200,169,110,0.06); border-left: 2px solid #c8a96e; }
        .info span { display: block; color: rgba(200,169,110,0.86); font-size: 0.58rem; letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 0.35rem; }
        .info strong { color: #f5f0e8; font-weight: 400; font-size: 0.86rem; line-height: 1.45; }
        .sub-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
        .event-list, .task-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.65rem; }
        .event-list li, .task-list li { padding: 0.75rem; background: rgba(245,240,232,0.035); border: 1px solid rgba(245,240,232,0.06); }
        .event-list strong, .task-list strong { display: block; color: #f5f0e8; font-size: 0.82rem; }
        .event-list span, .task-list small { color: rgba(212,207,196,0.62); font-size: 0.72rem; }
        .task-list li { display: flex; gap: 0.65rem; }
        .task-list li > span { color: #c8a96e; }
        .warning { margin-top: 0.8rem; color: #e6bf73; font-size: 0.78rem; }
        .notes { margin: 1rem 0 0; font-size: 0.86rem; }
        .two-column { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr); gap: 2rem; }
        .template-list, .stack-grid { display: grid; gap: 0.8rem; }
        .template-card { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding: 1rem; }
        .template-card p, .stack-card p { color: rgba(212,207,196,0.72); line-height: 1.55; margin-bottom: 0.3rem; }
        .template-card span, .stack-card span { color: #c8a96e; font-size: 0.62rem; letter-spacing: 0.14em; text-transform: uppercase; }
        button { border: 1px solid #c8a96e; background: #c8a96e; color: #0e0c09; padding: 0.7rem 0.95rem; text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.62rem; cursor: not-allowed; opacity: 0.82; }
        .financial-panel dl { margin: 1.4rem 0; display: grid; gap: 0.85rem; }
        .financial-panel dl div { display: flex; justify-content: space-between; gap: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(200,169,110,0.12); }
        dt { color: rgba(212,207,196,0.72); } dd { margin: 0; color: #f5f0e8; font-weight: 500; }
        .callout { padding: 1rem; border-left: 2px solid #c8a96e; background: rgba(200,169,110,0.06); color: rgba(245,240,232,0.78); line-height: 1.6; }
        .stack-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .stack-card { padding: 1rem; }
        .bot-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.8rem; margin-bottom: 1rem; }
        .bot-card { padding: 1rem; background: rgba(245,240,232,0.035); border: 1px solid rgba(200,169,110,0.14); }
        .bot-card code { display: inline-block; margin-bottom: 0.75rem; color: #0e0c09; background: #c8a96e; padding: 0.35rem 0.5rem; font-size: 0.78rem; }
        .bot-card p { color: rgba(212,207,196,0.74); line-height: 1.55; margin: 0; }
        .blueprint-list { display: grid; gap: 0.9rem; margin: 1.5rem 0 0; padding: 0; list-style: none; }
        .blueprint-list li { display: grid; grid-template-columns: 220px 1fr; gap: 1rem; padding: 1rem; background: rgba(245,240,232,0.035); border: 1px solid rgba(200,169,110,0.12); }
        .blueprint-list strong { color: #f5f0e8; } .blueprint-list span { color: rgba(212,207,196,0.72); line-height: 1.55; }
        @media (max-width: 980px) {
          .hero-grid, .two-column, .sub-panels { grid-template-columns: 1fr; }
          .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .status-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .booking-grid, .money-strip, .stack-grid, .bot-grid { grid-template-columns: 1fr 1fr; }
          .section-heading { display: block; }
        }
        @media (max-width: 640px) {
          .ops-nav { margin-bottom: 3rem; }
          .metrics-grid, .booking-grid, .money-strip, .stack-grid, .bot-grid { grid-template-columns: 1fr; }
          .booking-topline, .template-card, .financial-panel dl div, .blueprint-list li { display: block; }
          .status { margin-top: 1rem; }
          .template-card button { margin-top: 1rem; }
        }
      `}</style>
    </main>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
