// Single source of truth for group pricing.
// The client shows the guest these numbers and the booking API puts them in the
// invoice email, so both must import from here rather than recompute the split.

export const BASE_PRICE_USD = 1999;
export const BASE_ONLINE_PAYMENT_USD = 999;
export const BASE_LOCAL_FAMILY_PAYMENT_USD = 1000;
export const MAX_GROUP_SIZE = 8;

export const GROUP_PRICING_TIERS = [
  { min: 1, max: 2, label: '1–2 guests', perPersonUsd: 1999 },
  { min: 3, max: 4, label: '3–4 guests', perPersonUsd: 1949 },
  { min: 5, max: 6, label: '5–6 guests', perPersonUsd: 1899 },
  { min: 7, max: 8, label: '7–8 guests', perPersonUsd: 1799 },
];

export function clampGuestCount(value) {
  const parsed = Number.parseInt(String(value ?? '1'), 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(MAX_GROUP_SIZE, Math.max(1, parsed));
}

export function getGroupPricing(value) {
  const guestCount = clampGuestCount(value);
  const tier = GROUP_PRICING_TIERS.find(option => guestCount >= option.min && guestCount <= option.max) ?? GROUP_PRICING_TIERS[0];

  // The group discount is shared evenly between 8 Lakes and the host family, so
  // larger groups never cost the family the whole reduction. Every tier discount
  // is even, so both halves stay whole dollars.
  const perPersonSavingsUsd = BASE_PRICE_USD - tier.perPersonUsd;
  const sharedSavingsPerPersonUsd = perPersonSavingsUsd / 2;
  const onlinePerPersonUsd = BASE_ONLINE_PAYMENT_USD - sharedSavingsPerPersonUsd;
  const localFamilyPerPersonUsd = BASE_LOCAL_FAMILY_PAYMENT_USD - sharedSavingsPerPersonUsd;

  return {
    guestCount,
    tier,
    perPersonUsd: tier.perPersonUsd,
    onlinePerPersonUsd,
    localFamilyPerPersonUsd,
    totalTripValueUsd: tier.perPersonUsd * guestCount,
    onlinePaymentUsd: onlinePerPersonUsd * guestCount,
    localFamilyPaymentUsd: localFamilyPerPersonUsd * guestCount,
    perPersonSavingsUsd,
    sharedSavingsPerPersonUsd,
  };
}
