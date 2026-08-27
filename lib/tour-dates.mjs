const MONGOLIA_TIME_ZONE = 'Asia/Ulaanbaatar';

export const TOUR_DATES = [
  { date: 'June 22 – 30, 2026', startDate: '2026-06-22', endDate: '2026-06-30', detail: '9 Days · 8 Nights · Orkhon Valley, Mongolia', status: 'Open · max 8' },
  { date: 'July 6 – 14, 2026', startDate: '2026-07-06', endDate: '2026-07-14', detail: '9 Days · 8 Nights · Orkhon Valley, Mongolia', status: 'Open · max 8' },
  { date: 'July 16 – 24, 2026', startDate: '2026-07-16', endDate: '2026-07-24', detail: '9 Days · 8 Nights · Orkhon Valley, Mongolia', status: 'Open · max 8' },
  { date: 'July 28 – August 5, 2026', startDate: '2026-07-28', endDate: '2026-08-05', detail: '9 Days · 8 Nights · Orkhon Valley, Mongolia', status: 'Open · max 8' },
  { date: 'August 4 – 12, 2026', startDate: '2026-08-04', endDate: '2026-08-12', detail: '9 Days · 8 Nights · Orkhon Valley, Mongolia', status: 'Open · max 8' },
  { date: 'August 24 – September 1, 2026', startDate: '2026-08-24', endDate: '2026-09-01', detail: '9 Days · 8 Nights · Orkhon Valley, Mongolia', status: 'Open · max 8' },
  { date: 'September 14 – 22, 2026', startDate: '2026-09-14', endDate: '2026-09-22', detail: '9 Days · 8 Nights · Orkhon Valley, Mongolia', status: 'Open · max 8' },
  { date: 'September 23 – October 1, 2026', startDate: '2026-09-23', endDate: '2026-10-01', detail: '9 Days · 8 Nights · Orkhon Valley, Mongolia', status: 'Open · max 8' },
  { date: '2026 Private Group Date', detail: 'Custom departure · Available through late September 2026', status: 'On Request', muted: true, availableUntil: '2026-09-30', requiresConfirmation: true },
  { date: '2027 Small-Group Departures', detail: 'Fixed dates are being planned · Join the priority list', status: 'Register Interest', muted: true, availableUntil: '2027-09-30', requiresConfirmation: true },
  { date: '2027 Private Group Date', detail: 'Choose your dates · June–September 2027', status: 'Request Dates', muted: true, availableUntil: '2027-09-30', requiresConfirmation: true },
];

function dateKeyInTimeZone(now, timeZone = MONGOLIA_TIME_ZONE) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError('A valid Date is required');
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getVisibleTourDates(tourDates, now = new Date()) {
  const today = dateKeyInTimeZone(now);
  return tourDates.filter(option => {
    if (option.startDate && option.startDate <= today) return false;
    if (option.availableUntil && option.availableUntil < today) return false;
    return true;
  });
}
