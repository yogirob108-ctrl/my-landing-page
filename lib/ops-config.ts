export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isSupabaseAdminConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

export function getAllowedOpsEmails() {
  return (process.env.OPS_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedOpsEmail(email: string | null | undefined) {
  const allowedEmails = getAllowedOpsEmails();

  if (!email || allowedEmails.length === 0) {
    return false;
  }

  return allowedEmails.includes(email.toLowerCase());
}
