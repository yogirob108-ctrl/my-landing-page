import { NextResponse } from 'next/server';
import { checkSupabaseHealth } from '@/lib/supabase-health';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await checkSupabaseHealth();

  return NextResponse.json(
    {
      ok: supabase.ok,
      app: '8-lakes-public-site',
      supabase,
    },
    {
      status: supabase.ok ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}
