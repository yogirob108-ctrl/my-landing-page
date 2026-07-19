const DAY_MS = 24 * 60 * 60 * 1000;

const MONTHS = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

export const PREPARATION_DAYS_BEFORE = 60;
export const INSURANCE_DAYS_BEFORE = 30;
export const ARRIVAL_DAYS_BEFORE = 14;

export function parseTourStartDate(value) {
  if (!value) return null;
  const monthFirst = value.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:\s*[–-]\s*(?:[A-Za-z]+\s+)?\d{1,2})?,\s*(\d{4})/i);
  const dayFirst = value.match(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)(?:\s*[–-]\s*\d{1,2}\s+[A-Za-z]+)?,?\s*(\d{4})/i);
  const match = monthFirst ?? dayFirst;
  if (!match) return null;
  const monthName = monthFirst ? match[1] : match[2];
  const day = Number(monthFirst ? match[2] : match[1]);
  const year = Number(match[3]);
  const month = MONTHS[monthName.toLowerCase()];
  if (month === undefined || !day || !year) return null;
  return new Date(Date.UTC(year, month, day));
}

function utcDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function getLifecycleEmailSchedule({ now = new Date(), tourDate, prepAlreadySent = false, insuranceAlreadySent = false, arrivalAlreadySent = false }) {
  const startDate = parseTourStartDate(tourDate);
  if (!startDate) return { startDate: null, daysUntilDeparture: null, prepDue: false, insuranceDue: false, arrivalDue: false };
  const daysUntilDeparture = Math.round((utcDay(startDate) - utcDay(now)) / DAY_MS);
  const upcoming = daysUntilDeparture >= 0;
  return {
    startDate,
    daysUntilDeparture,
    prepDue: upcoming && daysUntilDeparture <= PREPARATION_DAYS_BEFORE && !prepAlreadySent,
    insuranceDue: upcoming && daysUntilDeparture <= INSURANCE_DAYS_BEFORE && !insuranceAlreadySent,
    arrivalDue: upcoming && daysUntilDeparture <= ARRIVAL_DAYS_BEFORE && !arrivalAlreadySent,
  };
}
