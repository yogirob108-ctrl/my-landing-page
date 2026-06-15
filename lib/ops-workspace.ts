import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isSupabaseAdminConfigured } from '@/lib/ops-config';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export type KanbanStatus = 'todo' | 'doing' | 'waiting' | 'done';
export type InfluencerStatus = 'prospect' | 'contacted' | 'negotiating' | 'confirmed' | 'passed';

export type OpsTask = {
  id: string;
  title: string;
  description: string;
  owner: string;
  priority: string;
  dueDate: string;
  status: KanbanStatus;
  createdAt: string;
};

export type InfluencerRecord = {
  id: string;
  name: string;
  handle: string;
  platform: string;
  url: string;
  audience: string;
  niche: string;
  country: string;
  email: string;
  status: InfluencerStatus;
  notes: string;
  createdAt: string;
};

type CustomerWorkspaceRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

const TASK_MARKER = 'Ops todo record';
const INFLUENCER_MARKER = 'Influencer partnership record';

export const kanbanStatuses: { key: KanbanStatus; label: string; hint: string }[] = [
  { key: 'todo', label: 'To do', hint: 'Captured, not started' },
  { key: 'doing', label: 'Doing', hint: 'Actively moving' },
  { key: 'waiting', label: 'Waiting', hint: 'Blocked or waiting on someone' },
  { key: 'done', label: 'Done', hint: 'Finished / parked' },
];

export const influencerStatuses: { key: InfluencerStatus; label: string }[] = [
  { key: 'prospect', label: 'Prospect' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'negotiating', label: 'Negotiating' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'passed', label: 'Passed' },
];

function lineValue(notes: string | null | undefined, label: string, fallback = '') {
  return notes?.match(new RegExp(`^${label}:[ \\t]*([^\\r\\n]*)`, 'im'))?.[1]?.trim() || fallback;
}

function taskNotes(input: Omit<OpsTask, 'id' | 'createdAt'>) {
  return [
    TASK_MARKER,
    `Status: ${input.status}`,
    `Priority: ${input.priority || 'normal'}`,
    `Owner: ${input.owner || 'Henry/Rob'}`,
    `Due: ${input.dueDate || ''}`,
    `Description: ${input.description || ''}`,
  ].join('\n');
}

function influencerNotes(input: Omit<InfluencerRecord, 'id' | 'createdAt' | 'name' | 'handle' | 'email'>) {
  return [
    INFLUENCER_MARKER,
    `Status: ${input.status}`,
    `Platform: ${input.platform || ''}`,
    `URL: ${input.url || ''}`,
    `Audience: ${input.audience || ''}`,
    `Niche: ${input.niche || ''}`,
    `Country: ${input.country || ''}`,
    `Notes: ${input.notes || ''}`,
  ].join('\n');
}

function taskFromRow(row: CustomerWorkspaceRow): OpsTask {
  const notes = row.notes ?? '';
  return {
    id: row.id,
    title: row.first_name || 'Untitled task',
    description: lineValue(notes, 'Description'),
    owner: lineValue(notes, 'Owner', 'Henry/Rob'),
    priority: lineValue(notes, 'Priority', 'normal'),
    dueDate: lineValue(notes, 'Due'),
    status: (lineValue(notes, 'Status', 'todo') as KanbanStatus) || 'todo',
    createdAt: row.created_at,
  };
}

function influencerFromRow(row: CustomerWorkspaceRow): InfluencerRecord {
  const notes = row.notes ?? '';
  return {
    id: row.id,
    name: row.first_name || 'Unnamed creator',
    handle: row.last_name || '',
    email: row.email || '',
    platform: lineValue(notes, 'Platform'),
    url: lineValue(notes, 'URL'),
    audience: lineValue(notes, 'Audience'),
    niche: lineValue(notes, 'Niche'),
    country: lineValue(notes, 'Country'),
    status: (lineValue(notes, 'Status', 'prospect') as InfluencerStatus) || 'prospect',
    notes: lineValue(notes, 'Notes'),
    createdAt: row.created_at,
  };
}

export async function getOpsTasks() {
  if (!isSupabaseAdminConfigured) return { mode: 'sample' as const, tasks: getSampleTasks() };
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('customers')
    .select('id,first_name,last_name,email,phone,notes,created_at')
    .ilike('notes', `%${TASK_MARKER}%`)
    .order('created_at', { ascending: true });

  if (error || !data) return { mode: 'sample' as const, tasks: getSampleTasks() };

  if (data.length === 0) {
    await createSeedFlyerTask();
    const { data: seeded } = await supabase
      .from('customers')
      .select('id,first_name,last_name,email,phone,notes,created_at')
      .ilike('notes', `%${TASK_MARKER}%`)
      .order('created_at', { ascending: true });
    return { mode: 'supabase' as const, tasks: ((seeded ?? []) as CustomerWorkspaceRow[]).map(taskFromRow) };
  }

  return { mode: 'supabase' as const, tasks: (data as CustomerWorkspaceRow[]).map(taskFromRow) };
}

async function createSeedFlyerTask() {
  const supabase = createSupabaseAdminClient();
  const task = {
    title: 'Print flyers for Odessa',
    description: 'Design/print a small batch of 8 Lakes Tours flyers Henry can leave at Odessa.',
    owner: 'Henry',
    priority: 'high',
    dueDate: '',
    status: 'todo' as KanbanStatus,
  };
  await supabase.from('customers').insert({
    first_name: task.title,
    last_name: 'ops-task',
    email: `ops-task-${Date.now()}@8lakestours.internal`,
    notes: taskNotes(task),
  });
}

export async function getInfluencers() {
  if (!isSupabaseAdminConfigured) return { mode: 'sample' as const, influencers: getSampleInfluencers() };
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('customers')
    .select('id,first_name,last_name,email,phone,notes,created_at')
    .ilike('notes', `%${INFLUENCER_MARKER}%`)
    .order('created_at', { ascending: false });

  if (error || !data) return { mode: 'sample' as const, influencers: getSampleInfluencers() };
  return { mode: 'supabase' as const, influencers: (data as CustomerWorkspaceRow[]).map(influencerFromRow) };
}

export async function createTask(formData: FormData) {
  'use server';
  if (!isSupabaseAdminConfigured) redirect('/ops/kanban?saved=missing_config');
  const supabase = createSupabaseAdminClient();
  const task = {
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    owner: String(formData.get('owner') ?? 'Henry/Rob').trim() || 'Henry/Rob',
    priority: String(formData.get('priority') ?? 'normal').trim() || 'normal',
    dueDate: String(formData.get('dueDate') ?? '').trim(),
    status: String(formData.get('status') ?? 'todo') as KanbanStatus,
  };
  if (!task.title) redirect('/ops/kanban?saved=missing_title');
  await supabase.from('customers').insert({
    first_name: task.title,
    last_name: 'ops-task',
    email: `ops-task-${Date.now()}@8lakestours.internal`,
    notes: taskNotes(task),
  });
  revalidatePath('/ops');
  revalidatePath('/ops/kanban');
  redirect('/ops/kanban?saved=task');
}

export async function updateTaskStatus(formData: FormData) {
  'use server';
  if (!isSupabaseAdminConfigured) redirect('/ops/kanban?saved=missing_config');
  const supabase = createSupabaseAdminClient();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? 'todo') as KanbanStatus;
  const { data, error } = await supabase.from('customers').select('id,first_name,last_name,email,phone,notes,created_at').eq('id', id).single();
  if (error || !data) redirect('/ops/kanban?saved=missing_task');
  const existing = taskFromRow(data as CustomerWorkspaceRow);
  await supabase.from('customers').update({ notes: taskNotes({ ...existing, status }) }).eq('id', id);
  revalidatePath('/ops/kanban');
  redirect('/ops/kanban?saved=moved');
}

export async function createInfluencer(formData: FormData) {
  'use server';
  if (!isSupabaseAdminConfigured) redirect('/ops/influencers?saved=missing_config');
  const supabase = createSupabaseAdminClient();
  const name = String(formData.get('name') ?? '').trim();
  const handle = String(formData.get('handle') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const influencer = {
    platform: String(formData.get('platform') ?? '').trim(),
    url: String(formData.get('url') ?? '').trim(),
    audience: String(formData.get('audience') ?? '').trim(),
    niche: String(formData.get('niche') ?? '').trim(),
    country: String(formData.get('country') ?? '').trim(),
    status: String(formData.get('status') ?? 'prospect') as InfluencerStatus,
    notes: String(formData.get('notes') ?? '').trim(),
  };
  if (!name && !handle) redirect('/ops/influencers?saved=missing_name');
  await supabase.from('customers').insert({
    first_name: name || handle,
    last_name: handle,
    email: email || `influencer-${Date.now()}@8lakestours.internal`,
    notes: influencerNotes(influencer),
  });
  revalidatePath('/ops/influencers');
  redirect('/ops/influencers?saved=influencer');
}

export async function updateInfluencerStatus(formData: FormData) {
  'use server';
  if (!isSupabaseAdminConfigured) redirect('/ops/influencers?saved=missing_config');
  const supabase = createSupabaseAdminClient();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? 'prospect') as InfluencerStatus;
  const { data, error } = await supabase.from('customers').select('id,first_name,last_name,email,phone,notes,created_at').eq('id', id).single();
  if (error || !data) redirect('/ops/influencers?saved=missing_influencer');
  const existing = influencerFromRow(data as CustomerWorkspaceRow);
  await supabase.from('customers').update({
    notes: influencerNotes({ ...existing, status }),
  }).eq('id', id);
  revalidatePath('/ops/influencers');
  redirect('/ops/influencers?saved=status');
}

function getSampleTasks(): OpsTask[] {
  return [
    {
      id: 'sample-flyers',
      title: 'Print flyers for Odessa',
      description: 'Design/print a small batch of 8 Lakes Tours flyers Henry can leave at Odessa.',
      owner: 'Henry',
      priority: 'high',
      dueDate: '',
      status: 'todo',
      createdAt: new Date().toISOString(),
    },
  ];
}

function getSampleInfluencers(): InfluencerRecord[] {
  return [
    {
      id: 'sample-influencer',
      name: 'Example adventure creator',
      handle: '@wildhorsejournal',
      platform: 'Instagram',
      url: '',
      audience: '25k',
      niche: 'horse trekking / adventure travel',
      country: 'UK/EU',
      email: '',
      status: 'prospect',
      notes: 'Sample row — add real creators here.',
      createdAt: new Date().toISOString(),
    },
  ];
}
