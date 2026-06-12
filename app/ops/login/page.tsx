import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAllowedOpsEmail, isSupabaseConfigured } from '@/lib/ops-config';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const metadata: Metadata = {
  title: 'Ops Login | 8 Lakes Tours',
  description: 'Admin login for the 8 Lakes Tours booking operations dashboard.',
  robots: { index: false, follow: false },
};

async function sendMagicLink(formData: FormData) {
  'use server';

  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  if (!email || !isAllowedOpsEmail(email)) {
    redirect('/ops/login?error=not_allowed');
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin') ?? 'http://localhost:3000';
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/ops`,
    },
  });

  if (error) {
    redirect('/ops/login?error=send_failed');
  }

  redirect('/ops/login?sent=1');
}

export default async function OpsLoginPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="login-page">
        <section className="login-card">
          <p className="eyebrow">Ops setup</p>
          <h1>Supabase is not configured yet.</h1>
          <p>Add <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and <code>OPS_ALLOWED_EMAILS</code> before using login.</p>
          <Link href="/ops">Back to prototype dashboard</Link>
        </section>
        <LoginStyles />
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="eyebrow">Booking Ops</p>
        <h1>Sign in to /ops</h1>
        <p>Use an allow-listed admin email. Supabase will send a magic link; no shared password needed.</p>
        <form action={sendMagicLink}>
          <label htmlFor="email">Admin email</label>
          <input id="email" name="email" type="email" autoComplete="email" required placeholder="rob@example.com" />
          <button type="submit">Send magic link</button>
        </form>
        <p className="hint">If the email is not in <code>OPS_ALLOWED_EMAILS</code>, no login link is sent.</p>
        <Link href="/">Back to public site</Link>
      </section>
      <LoginStyles />
    </main>
  );
}

function LoginStyles() {
  return (
    <style>{`
      .login-page { min-height: 100vh; display: grid; place-items: center; background: radial-gradient(circle at 20% 0%, rgba(200,169,110,0.16), transparent 32rem), #0e0c09; color: #d4cfc4; padding: 1.25rem; font-family: var(--font-jost), Jost, sans-serif; }
      .login-card { width: min(100%, 520px); border: 1px solid rgba(200,169,110,0.2); background: rgba(245,240,232,0.04); padding: clamp(1.5rem, 4vw, 2.4rem); box-shadow: 0 20px 80px rgba(0,0,0,0.25); }
      .eyebrow { margin: 0 0 0.8rem; color: #c8a96e; text-transform: uppercase; letter-spacing: 0.24em; font-size: 0.66rem; }
      h1 { color: #f5f0e8; font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: clamp(2.3rem, 8vw, 4rem); line-height: 1; font-weight: 300; margin: 0 0 1rem; }
      p { line-height: 1.7; color: rgba(212,207,196,0.78); }
      form { display: grid; gap: 0.75rem; margin: 1.5rem 0; }
      label { color: #c8a96e; text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.68rem; }
      input { width: 100%; box-sizing: border-box; border: 1px solid rgba(200,169,110,0.28); background: rgba(14,12,9,0.75); color: #f5f0e8; padding: 0.9rem 1rem; font: inherit; }
      button, a { display: inline-flex; justify-content: center; border: 1px solid #c8a96e; background: #c8a96e; color: #0e0c09; padding: 0.85rem 1rem; text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.68rem; text-decoration: none; cursor: pointer; }
      a { margin-top: 0.8rem; background: transparent; color: #c8a96e; }
      code { color: #f5f0e8; background: rgba(200,169,110,0.12); padding: 0.1rem 0.25rem; }
      .hint { font-size: 0.84rem; color: rgba(212,207,196,0.6); }
    `}</style>
  );
}
