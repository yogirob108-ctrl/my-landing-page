import { isSupabaseAdminConfigured, supabaseUrl } from '@/lib/ops-config';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export type SupabaseHealthStatus = {
  ok: boolean;
  configured: boolean;
  projectRef: string | null;
  checkedAt: string;
  latencyMs?: number;
  error?: string;
};

export function getSupabaseProjectRef() {
  if (!supabaseUrl) return null;
  try {
    return new URL(supabaseUrl).hostname.split('.')[0] || null;
  } catch {
    return null;
  }
}

export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  const checkedAt = new Date().toISOString();
  const projectRef = getSupabaseProjectRef();

  if (!isSupabaseAdminConfigured) {
    return {
      ok: false,
      configured: false,
      projectRef,
      checkedAt,
      error: 'Supabase admin env vars are missing.',
    };
  }

  const started = Date.now();
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from('tour_projects')
      .select('id', { count: 'exact', head: true })
      .eq('slug', '8-lakes-tours')
      .limit(1);

    if (error) {
      return {
        ok: false,
        configured: true,
        projectRef,
        checkedAt,
        latencyMs: Date.now() - started,
        error: error.message,
      };
    }

    return {
      ok: true,
      configured: true,
      projectRef,
      checkedAt,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      projectRef,
      checkedAt,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : 'Unknown Supabase health-check error.',
    };
  }
}
