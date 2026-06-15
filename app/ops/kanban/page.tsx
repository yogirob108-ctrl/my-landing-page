import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createTask, getOpsTasks, kanbanStatuses, updateTaskStatus, type KanbanStatus, type OpsTask } from '@/lib/ops-workspace';
import { hasOpsPinSession } from '@/lib/ops-pin';

export const metadata: Metadata = {
  title: 'Kanban | 8 Lakes Ops',
  description: 'Internal 8 Lakes Tours todo and kanban board.',
  robots: { index: false, follow: false },
};

const nextStatus: Record<KanbanStatus, KanbanStatus | null> = {
  todo: 'doing',
  doing: 'waiting',
  waiting: 'done',
  done: null,
};

const previousStatus: Record<KanbanStatus, KanbanStatus | null> = {
  todo: null,
  doing: 'todo',
  waiting: 'doing',
  done: 'waiting',
};

export default async function OpsKanbanPage({ searchParams }: { searchParams?: Promise<{ saved?: string }> }) {
  if (!(await hasOpsPinSession())) redirect('/ops/login');
  const qs = await searchParams;
  const { mode, tasks } = await getOpsTasks();

  return (
    <main className="kanban-shell">
      <header className="topbar">
        <Link href="/ops">← Ops</Link>
        <div><p className="mini">8 Lakes todo board</p><h1>Kanban</h1></div>
        <Link href="/ops/influencers">Influencers →</Link>
      </header>

      {qs?.saved === 'missing_config' && <section className="banner warning">Supabase service-role access is missing, so this board is sample-only.</section>}
      {qs?.saved && qs.saved !== 'missing_config' && <section className="banner success">Saved.</section>}
      {mode === 'sample' && <section className="banner warning">Sample mode — add Supabase service-role config before using this for live tasks.</section>}

      <section className="create-panel">
        <div>
          <p className="mini">Capture quickly</p>
          <h2>Don’t let random ops jobs disappear.</h2>
        </div>
        <form action={createTask}>
          <input name="title" required placeholder="Task title" />
          <input name="owner" placeholder="Owner" defaultValue="Henry" />
          <select name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select>
          <input name="dueDate" placeholder="Due date" />
          <select name="status" defaultValue="todo">{kanbanStatuses.map((status) => <option key={status.key} value={status.key}>{status.label}</option>)}</select>
          <textarea name="description" placeholder="Notes / next action" />
          <button type="submit">Add task</button>
        </form>
      </section>

      <section className="board" aria-label="Kanban board">
        {kanbanStatuses.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.key);
          return (
            <section className="column" key={column.key}>
              <div className="column-head"><div><p className="mini">{column.hint}</p><h2>{column.label}</h2></div><span>{columnTasks.length}</span></div>
              <div className="cards">
                {columnTasks.length ? columnTasks.map((task) => <TaskCard key={task.id} task={task} />) : <p className="empty">Nothing here.</p>}
              </div>
            </section>
          );
        })}
      </section>

      <style>{`
        :root{color-scheme:dark}.kanban-shell{min-height:100vh;background:#080806;color:#e9e1d3;font-family:var(--font-jost),Jost,sans-serif;padding:.9rem}.topbar,.banner,.create-panel,.board{max-width:1420px;margin-left:auto;margin-right:auto}.topbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.8rem}.topbar a{color:#c8a96e;text-decoration:none;border:1px solid rgba(200,169,110,.24);border-radius:999px;padding:.55rem .75rem}.mini{margin:0 0 .3rem;color:#c8a96e;text-transform:uppercase;letter-spacing:.18em;font-size:.64rem;font-weight:700}h1,h2,p{margin-top:0}h1,h2{font-family:var(--font-cormorant),'Cormorant Garamond',serif;color:#fff8ea;font-weight:300;line-height:.96}h1{font-size:clamp(2.5rem,10vw,5.4rem);margin-bottom:0}h2{font-size:clamp(1.45rem,4vw,2.5rem)}.banner,.create-panel,.column{border:1px solid rgba(200,169,110,.18);background:rgba(233,225,211,.045);border-radius:22px;box-shadow:0 18px 70px rgba(0,0,0,.22)}.banner{padding:.9rem;margin-bottom:.8rem}.warning{color:#ffcf8d}.success{color:#9ed0a4}.create-panel{display:grid;gap:1rem;padding:1rem;margin-bottom:.8rem}.create-panel form{display:grid;gap:.6rem}input,select,textarea{width:100%;box-sizing:border-box;border:1px solid rgba(200,169,110,.18);background:rgba(0,0,0,.25);color:#fff8ea;border-radius:13px;padding:.82rem;font:inherit}textarea{min-height:88px}button{border:1px solid #c8a96e;background:#c8a96e;color:#080806;border-radius:999px;padding:.75rem .95rem;text-transform:uppercase;letter-spacing:.12em;font-size:.68rem;cursor:pointer}.board{display:grid;gap:.8rem}.column{padding:.85rem;min-height:240px}.column-head{display:flex;justify-content:space-between;gap:1rem;align-items:start;margin-bottom:.65rem}.column-head h2{margin-bottom:0}.column-head span{display:inline-grid;place-items:center;min-width:2rem;height:2rem;border-radius:999px;background:rgba(200,169,110,.16);color:#c8a96e}.cards{display:grid;gap:.65rem}.card{border:1px solid rgba(233,225,211,.08);background:rgba(0,0,0,.24);border-radius:17px;padding:.85rem}.card h3{margin:.2rem 0 .4rem;color:#fff8ea;font-weight:500}.card p{color:rgba(233,225,211,.72);line-height:1.45}.meta{display:flex;flex-wrap:wrap;gap:.35rem;margin:.7rem 0}.meta span{border:1px solid rgba(200,169,110,.18);border-radius:999px;padding:.25rem .45rem;color:rgba(233,225,211,.7);font-size:.68rem}.moves{display:flex;gap:.45rem;flex-wrap:wrap}.moves form{margin:0}.moves button{background:rgba(200,169,110,.1);color:#c8a96e;padding:.55rem .7rem}.empty{color:rgba(233,225,211,.45);font-style:italic}@media(min-width:760px){.create-panel{grid-template-columns:280px 1fr;align-items:start}.create-panel form{grid-template-columns:1.5fr .7fr .65fr .65fr .75fr auto}.create-panel textarea{grid-column:1/-2}.create-panel button{grid-column:-2/-1;grid-row:1 / span 2;align-self:stretch}.board{grid-template-columns:repeat(4,minmax(0,1fr));align-items:start}}`}</style>
    </main>
  );
}

function TaskCard({ task }: { task: OpsTask }) {
  const forward = nextStatus[task.status];
  const back = previousStatus[task.status];
  return (
    <article className="card">
      <p className="mini">{task.priority}</p>
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      <div className="meta"><span>{task.owner || 'Henry/Rob'}</span>{task.dueDate && <span>Due {task.dueDate}</span>}</div>
      <div className="moves">
        {back && <MoveButton id={task.id} status={back} label="← Back" />}
        {forward && <MoveButton id={task.id} status={forward} label={forward === 'done' ? 'Done ✓' : 'Move →'} />}
      </div>
    </article>
  );
}

function MoveButton({ id, status, label }: { id: string; status: KanbanStatus; label: string }) {
  return <form action={updateTaskStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} /><button type="submit">{label}</button></form>;
}
