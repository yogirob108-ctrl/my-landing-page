import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { clearOpsPinSession, isValidOpsPin, setOpsPinSession } from '@/lib/ops-pin';

export const metadata: Metadata = {
  title: 'Ops PIN | 8 Lakes Tours',
  description: 'PIN gate for the 8 Lakes Tours booking operations dashboard.',
  robots: { index: false, follow: false },
};

async function enterOps(formData: FormData) {
  'use server';

  const pin = String(formData.get('pin') ?? '');
  if (!isValidOpsPin(pin)) {
    redirect('/ops/login?error=pin');
  }

  await setOpsPinSession();
  redirect('/ops');
}

async function signOut() {
  'use server';

  await clearOpsPinSession();
  redirect('/ops/login');
}

export default async function OpsLoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const hasPinError = params?.error === 'pin';

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="eyebrow">8 Lakes Ops</p>
        <h1>Enter the ops PIN.</h1>
        <p className="intro">A lightweight gate for the live v0 dashboard while the full Supabase/Auth layer is being finished.</p>
        <form action={enterOps}>
          <label htmlFor="pin">4-digit PIN</label>
          <input id="pin" name="pin" type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4} autoComplete="one-time-code" required autoFocus placeholder="••••" />
          {hasPinError && <p className="error">Wrong PIN. Try again.</p>}
          <button type="submit">Open ops</button>
        </form>
        <form action={signOut}>
          <button type="submit" className="ghost">Clear session</button>
        </form>
        <Link href="/">Back to public site</Link>
      </section>
      <LoginStyles />
    </main>
  );
}

function LoginStyles() {
  return (
    <style>{`
      .login-page { min-height: 100vh; display: grid; place-items: center; background: radial-gradient(circle at 12% 0%, rgba(200,169,110,0.18), transparent 28rem), radial-gradient(circle at 100% 100%, rgba(76,112,94,0.18), transparent 28rem), #080806; color: #e9e1d3; padding: 1rem; font-family: var(--font-jost), Jost, sans-serif; }
      .login-card { width: min(100%, 440px); border: 1px solid rgba(200,169,110,0.22); background: rgba(16,14,10,0.92); padding: clamp(1.35rem, 5vw, 2.2rem); box-shadow: 0 24px 100px rgba(0,0,0,0.4); border-radius: 24px; }
      .eyebrow { margin: 0 0 0.75rem; color: #c8a96e; text-transform: uppercase; letter-spacing: 0.22em; font-size: 0.68rem; }
      h1 { color: #fff8ea; font-family: var(--font-cormorant), 'Cormorant Garamond', serif; font-size: clamp(2.4rem, 12vw, 4.5rem); line-height: 0.95; font-weight: 300; margin: 0 0 1rem; }
      .intro, .error { line-height: 1.65; color: rgba(233,225,211,0.72); }
      .error { margin: 0; color: #ffb49e; }
      form { display: grid; gap: 0.75rem; margin: 1.35rem 0; }
      label { color: #c8a96e; text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.68rem; }
      input { width: 100%; box-sizing: border-box; border: 1px solid rgba(200,169,110,0.32); background: rgba(0,0,0,0.28); color: #fff8ea; padding: 1rem; font: inherit; font-size: 1.35rem; letter-spacing: 0.45em; text-align: center; border-radius: 14px; }
      button, a { width: 100%; box-sizing: border-box; display: inline-flex; justify-content: center; border: 1px solid #c8a96e; background: #c8a96e; color: #080806; padding: 0.95rem 1rem; text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.7rem; text-decoration: none; cursor: pointer; border-radius: 999px; }
      .ghost, a { margin-top: 0.6rem; background: transparent; color: #c8a96e; }
    `}</style>
  );
}
