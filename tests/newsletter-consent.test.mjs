import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { hasExplicitNewsletterOptIn } from '../lib/newsletter-consent.mjs';

test('newsletter consent defaults to off', () => {
  assert.equal(hasExplicitNewsletterOptIn(undefined), false);
  assert.equal(hasExplicitNewsletterOptIn(false), false);
  assert.equal(hasExplicitNewsletterOptIn('false'), false);
  assert.equal(hasExplicitNewsletterOptIn(''), false);
});

test('newsletter consent accepts only explicit checked values', () => {
  assert.equal(hasExplicitNewsletterOptIn(true), true);
  assert.equal(hasExplicitNewsletterOptIn('on'), true);
  assert.equal(hasExplicitNewsletterOptIn('true'), true);
  assert.equal(hasExplicitNewsletterOptIn('yes'), true);
  assert.equal(hasExplicitNewsletterOptIn('1'), true);
  assert.equal(hasExplicitNewsletterOptIn('subscribe me maybe'), false);
});

test('booking UI exposes a separate unchecked newsletter choice', async () => {
  const source = await readFile(new URL('../app/HomePageClient.tsx', import.meta.url), 'utf8');
  assert.match(source, /name="newsletter_opt_in"/);
  assert.match(source, /occasional 8 Lakes Tours news/i);
});
