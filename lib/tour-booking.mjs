import { TOUR_DATES, getVisibleTourDates } from './tour-dates.mjs';

function clampGuestCount(value) {
  const parsed = Number.parseInt(String(value ?? '1'), 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(8, Math.max(1, parsed));
}

export function isRequestOnlyTourDate(value, tourDates = TOUR_DATES) {
  const selected = String(value ?? '').trim();
  if (!selected) return false;
  return tourDates.some(option => option.date === selected && option.requiresConfirmation === true);
}

export function isBookableTourDate(value, now = new Date(), tourDates = TOUR_DATES) {
  const selected = String(value ?? '').trim();
  if (!selected) return false;
  return getVisibleTourDates(tourDates, now).some(option => option.date === selected);
}

export function canAutomaticallyConfirmBooking(tourDate, guestCount, now = new Date(), tourDates = TOUR_DATES) {
  return isBookableTourDate(tourDate, now, tourDates)
    && !requiresManualPaymentLink(tourDate, guestCount, tourDates);
}

export const GROUP_INVOICE = 'group_invoice';
export const AVAILABILITY_CHECK = 'availability';
export const UNKNOWN_SELECTION = 'unknown_selection';

// Why a selection cannot use the public Buy Button, or null when it can.
// The Buy Button collects one $999 seat, so groups are invoiced personally
// even on a fixed date where nothing needs confirming.
export function manualPaymentReason(tourDate, guestCount, tourDates = TOUR_DATES) {
  const selected = String(tourDate ?? '').trim();
  if (!tourDates.some(option => option.date === selected)) return UNKNOWN_SELECTION;
  if (isRequestOnlyTourDate(selected, tourDates)) return AVAILABILITY_CHECK;
  if (clampGuestCount(guestCount) >= 3) return GROUP_INVOICE;
  return null;
}

export function requiresManualPaymentLink(tourDate, guestCount, tourDates = TOUR_DATES) {
  return manualPaymentReason(tourDate, guestCount, tourDates) !== null;
}
