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

export function requiresManualPaymentLink(tourDate, guestCount, tourDates = TOUR_DATES) {
  const selected = String(tourDate ?? '').trim();
  const optionExists = tourDates.some(option => option.date === selected);
  return !optionExists || clampGuestCount(guestCount) >= 3 || isRequestOnlyTourDate(selected, tourDates);
}
