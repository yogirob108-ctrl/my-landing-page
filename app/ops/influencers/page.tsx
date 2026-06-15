import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createInfluencer, getInfluencers, influencerStatuses, updateInfluencerStatus, type InfluencerRecord } from '@/lib/ops-workspace';
import { hasOpsPinSession } from '@/lib/ops-pin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Influencers | 8 Lakes Ops',
  description: 'Internal 8 Lakes Tours partnership and influencer tracker.',
  robots: { index: false, follow: false },
};

export default async function OpsInfluencersPage({ searchParams }: { searchParams?: Promise<{ saved?: string }> }) {
  if (!(await hasOpsPinSession())) redirect('/ops/login');
  const qs = await searchParams;
  const { mode, influencers } = await getInfluencers();

  return (
    <main className="influencer-shell">
      <header className="topbar">
        <Link href="/ops">← Ops</Link>
        <div><p className="mini">Partnership pipeline</p><h1>Influencers</h1></div>
        <Link href="/ops/kanban">Kanban →</Link>
      </header>

      {qs?.saved === 'missing_config' && <section className="banner warning">Supabase service-role access is missing, so this table is sample-only.</section>}
      {qs?.saved && qs.saved !== 'missing_config' && <section className="banner success">Saved.</section>}
      {mode === 'sample' && <section className="banner warning">Sample mode — add Supabase service-role config before using this for live outreach.</section>}

      <section className="create-panel">
        <div><p className="mini">Track collaborators</p><h2>Adventure creators, horse people, Mongolia/travel accounts.</h2></div>
        <form action={createInfluencer}>
          <input name="name" placeholder="Creator / account name" />
          <input name="handle" placeholder="@handle" />
          <select name="platform" defaultValue="Instagram"><option>Instagram</option><option>TikTok</option><option>YouTube</option><option>Blog</option><option>Other</option></select>
          <input name="url" placeholder="Profile URL" />
          <input name="audience" placeholder="Audience size" />
          <input name="niche" placeholder="Niche" />
          <input name="country" placeholder="Country / region" />
          <input name="email" type="email" placeholder="Email" />
          <select name="status" defaultValue="prospect">{influencerStatuses.map((status) => <option key={status.key} value={status.key}>{status.label}</option>)}</select>
          <textarea name="notes" placeholder="Outreach angle, comp idea, last contact, fit" />
          <button type="submit">Add creator</button>
        </form>
      </section>

      <section className="table-panel">
        <div className="panel-head"><div><p className="mini">Collaboration targets</p><h2>{influencers.length} creators tracked</h2></div></div>
        <div className="table">
          <div className="row head"><span>Creator</span><span>Audience</span><span>Niche</span><span>Status</span><span>Contact / notes</span></div>
          {influencers.map((influencer) => <InfluencerRow key={influencer.id} influencer={influencer} />)}
        </div>
      </section>

      <style>{`
        :root{color-scheme:dark}.influencer-shell{min-height:100vh;background:#080806;color:#e9e1d3;font-family:var(--font-jost),Jost,sans-serif;padding:.9rem}.topbar,.banner,.create-panel,.table-panel{max-width:1420px;margin-left:auto;margin-right:auto}.topbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.8rem}.topbar a{color:#c8a96e;text-decoration:none;border:1px solid rgba(200,169,110,.24);border-radius:999px;padding:.55rem .75rem}.mini{margin:0 0 .3rem;color:#c8a96e;text-transform:uppercase;letter-spacing:.18em;font-size:.64rem;font-weight:700}h1,h2,p{margin-top:0}h1,h2{font-family:var(--font-cormorant),'Cormorant Garamond',serif;color:#fff8ea;font-weight:300;line-height:.96}h1{font-size:clamp(2.5rem,10vw,5.4rem);margin-bottom:0}h2{font-size:clamp(1.45rem,4vw,2.5rem)}.banner,.create-panel,.table-panel{border:1px solid rgba(200,169,110,.18);background:rgba(233,225,211,.045);border-radius:22px;box-shadow:0 18px 70px rgba(0,0,0,.22)}.banner{padding:.9rem;margin-bottom:.8rem}.warning{color:#ffcf8d}.success{color:#9ed0a4}.create-panel{display:grid;gap:1rem;padding:1rem;margin-bottom:.8rem}.create-panel form{display:grid;gap:.6rem}input,select,textarea{width:100%;box-sizing:border-box;border:1px solid rgba(200,169,110,.18);background:rgba(0,0,0,.25);color:#fff8ea;border-radius:13px;padding:.82rem;font:inherit}textarea{min-height:88px}button{border:1px solid #c8a96e;background:#c8a96e;color:#080806;border-radius:999px;padding:.75rem .95rem;text-transform:uppercase;letter-spacing:.12em;font-size:.68rem;cursor:pointer}.table-panel{padding:1rem}.panel-head{display:flex;justify-content:space-between;gap:1rem}.table{display:grid;gap:.55rem}.row{display:grid;gap:.5rem;border:1px solid rgba(233,225,211,.08);background:rgba(0,0,0,.22);border-radius:17px;padding:.8rem}.row.head{display:none;color:rgba(233,225,211,.55);text-transform:uppercase;letter-spacing:.12em;font-size:.66rem;background:transparent;border:0}.creator strong{display:block;color:#fff8ea}.creator a{display:block;color:#c8a96e;overflow-wrap:anywhere}.cell-label{color:rgba(233,225,211,.45);font-size:.65rem;text-transform:uppercase;letter-spacing:.12em}.pill{display:inline-flex;width:max-content;border:1px solid rgba(200,169,110,.22);border-radius:999px;padding:.3rem .5rem;color:#c8a96e;text-transform:uppercase;letter-spacing:.08em;font-size:.62rem}.notes{color:rgba(233,225,211,.72);line-height:1.45}.status-form{display:flex;gap:.4rem;align-items:center}.status-form select{padding:.55rem}.status-form button{background:rgba(200,169,110,.1);color:#c8a96e;padding:.55rem .7rem}@media(min-width:820px){.create-panel{grid-template-columns:300px 1fr;align-items:start}.create-panel form{grid-template-columns:repeat(5,minmax(0,1fr))}.create-panel textarea{grid-column:1/-2}.create-panel button{grid-column:-2/-1;grid-row:2 / span 2;align-self:stretch}.row{grid-template-columns:1.25fr .65fr 1fr .95fr 1.4fr;align-items:start}.row.head{display:grid}.cell-label{display:none}}`}</style>
    </main>
  );
}

function InfluencerRow({ influencer }: { influencer: InfluencerRecord }) {
  return (
    <article className="row">
      <div className="creator"><span className="cell-label">Creator</span><strong>{influencer.name}</strong>{influencer.handle && <span>{influencer.handle}</span>}{influencer.url && <a href={influencer.url} target="_blank" rel="noreferrer">{influencer.platform || 'Profile'}</a>}</div>
      <div><span className="cell-label">Audience</span><p>{influencer.audience || '—'}</p>{influencer.country && <span className="pill">{influencer.country}</span>}</div>
      <div><span className="cell-label">Niche</span><p>{influencer.niche || '—'}</p></div>
      <div><span className="cell-label">Status</span><form action={updateInfluencerStatus} className="status-form"><input type="hidden" name="id" value={influencer.id} /><select name="status" defaultValue={influencer.status}>{influencerStatuses.map((status) => <option key={status.key} value={status.key}>{status.label}</option>)}</select><button type="submit">Save</button></form></div>
      <div><span className="cell-label">Contact / notes</span>{influencer.email && <p>{influencer.email}</p>}<p className="notes">{influencer.notes || 'No notes yet.'}</p></div>
    </article>
  );
}
