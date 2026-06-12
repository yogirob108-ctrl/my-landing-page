import { createHash } from 'crypto';
import { cookies } from 'next/headers';

export const OPS_PIN_COOKIE = 'atl_ops_pin_session';
const PIN_MAX_AGE_SECONDS = 60 * 60 * 12;

export function getOpsPin() {
  // Temporary bootstrapping guard. Production should set OPS_PIN in Vercel;
  // 2909 is the explicit temporary fallback Henry requested for the live v0.
  return process.env.OPS_PIN ?? '2909';
}

function sessionValue() {
  const secret = process.env.OPS_SESSION_SECRET ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '8-lakes-ops-v0';
  return createHash('sha256').update(`${getOpsPin()}:${secret}:booking-ops`).digest('hex');
}

export async function hasOpsPinSession() {
  const cookieStore = await cookies();
  return cookieStore.get(OPS_PIN_COOKIE)?.value === sessionValue();
}

export async function setOpsPinSession() {
  const cookieStore = await cookies();
  cookieStore.set(OPS_PIN_COOKIE, sessionValue(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/ops',
    maxAge: PIN_MAX_AGE_SECONDS,
  });
}

export async function clearOpsPinSession() {
  const cookieStore = await cookies();
  cookieStore.delete(OPS_PIN_COOKIE);
}

export function isValidOpsPin(pin: string) {
  return pin.trim() === getOpsPin();
}
