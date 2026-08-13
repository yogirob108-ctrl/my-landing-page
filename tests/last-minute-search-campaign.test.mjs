import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const campaignDir = new URL('../docs/marketing/google-ads-september-2026-test/', import.meta.url);

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if (character === '\n' && !quoted) {
      row.push(field.replace(/\r$/, ''));
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  assert.equal(quoted, false, 'CSV contains an unterminated quoted field');
  return rows;
}

test('homepage gives last-minute visitors an honest September availability path', async () => {
  const [source, tourDatesSource] = await Promise.all([
    readFile(new URL('../app/HomePageClient.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../lib/tour-dates.mjs', import.meta.url), 'utf8'),
  ]);

  assert.match(source, /September 14\s*[–-]\s*22, 2026/);
  assert.match(source, /tourDates\.some\(option => option\.date === 'September 14 – 22, 2026'\)/);
  assert.match(source, /ask.*availability|availability.*request/i);
  assert.match(source, /personally confirmed.*before payment|before payment.*personally confirmed/i);
  assert.doesNotMatch(source, /September places available|last places|only \d+ places/i);
  assert.match(tourDatesSource, /September 14 – 22, 2026[^\n]+status: 'Availability by request'[^\n]+requiresConfirmation: true/);
});

test('campaign pack is paused, homepage-led, narrow and bounded to the approved test', async () => {
  const [brief, keywords, negatives, ads] = await Promise.all([
    readFile(new URL('README.md', campaignDir), 'utf8'),
    readFile(new URL('keywords.csv', campaignDir), 'utf8'),
    readFile(new URL('negative-keywords.csv', campaignDir), 'utf8'),
    readFile(new URL('responsive-search-ad.csv', campaignDir), 'utf8'),
  ]);
  const all = `${brief}\n${keywords}\n${negatives}\n${ads}`;

  assert.match(brief, /€3(?:\.00)? per day/i);
  assert.match(brief, /14 calendar days/i);
  assert.match(brief, /August 31, 2026/i);
  assert.match(brief, /campaign end date.*September 13, 2026/i);
  assert.match(brief, /€50.*manual.*stop|manual.*stop.*€50/i);
  assert.match(brief, /Google Search only/i);
  assert.match(brief, /Search Partners.*off/i);
  assert.match(brief, /Display.*off/i);
  assert.match(brief, /presence/i);
  assert.match(all, /PAUSED/i);
  assert.doesNotMatch(keywords, /,Broad,/i);
  assert.match(keywords, /https:\/\/www\.8lakestours\.com\/\?utm_source=google&utm_medium=cpc&utm_campaign=september_2026_last_minute/);
  assert.match(negatives, /adventure therapy/i);
  assert.match(ads, /Ask About September Dates/i);
  assert.doesNotMatch(ads, /last places|only \d+ places|guaranteed availability/i);
});

test('responsive search ad CSV is valid and assets respect Google character limits', async () => {
  const source = await readFile(new URL('responsive-search-ad.csv', campaignDir), 'utf8');
  const [header, ...data] = parseCsv(source);
  assert.deepEqual(header, ['asset_type', 'text', 'status']);
  data.forEach(row => assert.equal(row.length, header.length, `malformed CSV row: ${JSON.stringify(row)}`));
  const rows = data.map(([type, text, status]) => ({ type, text, status }));

  const headlines = rows.filter(row => row.type === 'headline');
  const descriptions = rows.filter(row => row.type === 'description');
  assert.ok(headlines.length >= 8 && headlines.length <= 15);
  assert.ok(descriptions.length >= 2 && descriptions.length <= 4);
  headlines.forEach(({ text }) => assert.ok(text.length <= 30, `headline too long: ${text}`));
  descriptions.forEach(({ text }) => assert.ok(text.length <= 90, `description too long: ${text}`));
});
