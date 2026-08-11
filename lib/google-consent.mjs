export const CONSENT_STORAGE_KEY = 'eight_lakes_google_consent';

export const GOOGLE_CONSENT_DEFAULTS = Object.freeze({
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500,
});

const NECESSARY_ONLY = Object.freeze({
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
});

const MEASUREMENT = Object.freeze({
  ad_storage: 'granted',
  analytics_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'denied',
});

export function normalizeConsentChoice(value) {
  return value === 'measurement' || value === 'necessary' ? value : null;
}

export function cookieDomainsForHostname(hostname) {
  const normalized = String(hostname ?? '').trim().replace(/^\.+/, '').toLowerCase();
  if (!normalized) return [];
  const parts = normalized.split('.').filter(Boolean);
  const parent = parts.length > 2 ? parts.slice(1).join('.') : normalized;
  return [...new Set([normalized, parent])];
}

export function consentUpdateForChoice(choice) {
  return choice === 'measurement' ? { ...MEASUREMENT } : { ...NECESSARY_ONLY };
}
