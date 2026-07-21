const EXPLICIT_OPT_IN_VALUES = new Set(['1', 'true', 'yes', 'on']);

export function hasExplicitNewsletterOptIn(value) {
  if (value === true) return true;
  if (typeof value !== 'string') return false;
  return EXPLICIT_OPT_IN_VALUES.has(value.trim().toLowerCase());
}
