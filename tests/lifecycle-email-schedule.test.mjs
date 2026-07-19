import test from 'node:test';
import assert from 'node:assert/strict';
import { getLifecycleEmailSchedule, parseTourStartDate } from '../lib/lifecycle-email-schedule.mjs';

test('parses month-first tour ranges used by live bookings', () => {
  assert.equal(parseTourStartDate('June 5–13, 2027')?.toISOString(), '2027-06-05T00:00:00.000Z');
});

test('parses legacy ordinal dates without a written year', () => {
  const referenceDate = new Date('2026-07-19T08:00:00Z');
  assert.equal(parseTourStartDate('August 31st - September 9th', referenceDate)?.toISOString(), '2026-08-31T00:00:00.000Z');
  assert.equal(parseTourStartDate('7 June - 15 June', referenceDate)?.toISOString(), '2026-06-07T00:00:00.000Z');
});

test('does not send lifecycle prep or insurance eleven months early', () => {
  const schedule = getLifecycleEmailSchedule({ now: new Date('2026-07-19T08:00:00Z'), tourDate: 'June 5–13, 2027' });
  assert.equal(schedule.prepDue, false);
  assert.equal(schedule.insuranceDue, false);
});

test('preparation becomes due at 60 days before departure', () => {
  assert.equal(getLifecycleEmailSchedule({ now: new Date('2027-04-05T08:00:00Z'), tourDate: 'June 5–13, 2027' }).prepDue, false);
  assert.equal(getLifecycleEmailSchedule({ now: new Date('2027-04-06T08:00:00Z'), tourDate: 'June 5–13, 2027' }).prepDue, true);
});

test('insurance becomes due at 30 days before departure', () => {
  assert.equal(getLifecycleEmailSchedule({ now: new Date('2027-05-05T08:00:00Z'), tourDate: 'June 5–13, 2027' }).insuranceDue, false);
  assert.equal(getLifecycleEmailSchedule({ now: new Date('2027-05-06T08:00:00Z'), tourDate: 'June 5–13, 2027' }).insuranceDue, true);
});

test('never sends lifecycle emails after departure', () => {
  const schedule = getLifecycleEmailSchedule({ now: new Date('2027-06-06T08:00:00Z'), tourDate: 'June 5–13, 2027' });
  assert.equal(schedule.prepDue, false);
  assert.equal(schedule.insuranceDue, false);
});
