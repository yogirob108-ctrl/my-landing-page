# September 2026 last-minute Google Search test

**Status:** PAUSED — activation-ready handoff only. No spend is authorized by these files.

## Purpose

Test whether a small amount of high-intent Google Search traffic can produce a booking for the remaining 2026 season. The directly bookable fixed-date opportunities are **September 14–22, 2026** and **September 23–October 1, 2026**.

## Campaign settings

- Account: 8 Lakes Tours (`285-034-4584`), owned by `8lakestours@gmail.com`
- Campaign: `Search | September 2026 | Mongolia Horse Trek | EN`
- Status while building: **PAUSED**
- Final URL: `https://www.8lakestours.com/?utm_source=google&utm_medium=cpc&utm_campaign=september_2026_last_minute&utm_term={keyword}&utm_content=responsive_search_ad`
- Network: **Google Search only**
- Search Partners: **off**
- Display Network / Display expansion: **off**
- Performance Max: none
- Automatically created assets and final-URL expansion: off
- Languages: English
- Locations: United Kingdom; Netherlands; Germany
- Location option: **Presence — people in or regularly in the targeted locations**
- Match types: Exact and Phrase only
- Bid strategy: Maximize Clicks with a **$2.50 maximum CPC limit** if Google exposes that control
- Budget: **$7.00 per day**
- Duration: **7 calendar days including activation day**
- Planned activation date: **August 30, 2026**
- Campaign end date: **September 5, 2026**
- Total control: **$55 manual spend stop**. Pause immediately when account cost reaches $55 even if the campaign end date has not arrived.

Google daily budgets are not hard total caps. $7/day plans around $49 over seven days but Google may spend more on individual days. The $55 ceiling therefore requires monitoring and a manual pause. The configured campaign end date provides the time stop; verify it in campaign settings after activation.

## Conversion roles

Complete and verify the GA4 ↔ Ads link before activation.

- Primary: `qualify_lead`
- Primary: `payment_received` only if it is not duplicated by a native Ads purchase action
- Secondary / observation: `booking_form_submit`
- Do not optimize for page views; scrolls; CTA clicks; newsletter signups

Because this account has no reliable conversion history and the budget is tiny: start with click learning and evaluate enquiries manually. Do not switch to Maximize Conversions during this test unless meaningful verified primary conversions unexpectedly accumulate.

## Activation checklist

1. Henry completes Google Ads billing profile and payment method directly. Do not share card or identity details.
2. Open normal Ads dashboard for client `285-034-4584`; verify Rob's United States billing profile, account time zone, and USD currency.
3. Link the exact GA4 web stream for `https://www.8lakestours.com/` with measurement ID `G-E9PW7T08LZ`.
4. Import conversion actions with the roles above and check for duplicates.
5. Create one Search campaign using this file and the three CSVs in this folder. Keep it PAUSED while building.
6. Confirm the final homepage URL returns HTTP 200 and retains the UTM query string.
7. Apply every negative before activation.
8. Read back: $7/day; Maximize Clicks; $2.50 CPC cap where available; Search only; Search Partners off; Display off; English; UK/NL/DE; presence targeting; exact/phrase only.
9. Confirm no broad match; Performance Max; auto-created expansion; or recommendations were enabled.
10. Before activation, verify the planned run is August 30–September 5, 2026, inclusive.
11. Activate once. Immediately reopen settings and verify the controls and campaign end date persisted.
12. Record activation date and create a daily search-term review reminder.
13. Pause earlier when account campaign cost reaches $55.

## Daily optimization

- Review search terms daily for the first seven days.
- Add irrelevant searches as exact or phrase negatives immediately.
- Pause a keyword after roughly $8–$10 spend without a relevant enquiry.
- Prefer exact queries with clear tour-booking intent over informational destination research.
- Judge success by qualified enquiries and payments rather than raw clicks.
- Do not extend beyond $55 without a separate decision.

## Honest offer guardrails

- It is truthful to advertise both listed September 2026 departures as open while they remain directly bookable on the live site.
- Do not use “last places” or a numerical scarcity claim without operational confirmation.
- Total price is $1,799–$1,999 per person.
- The $899–$999 per-guest online booking payment is not the total trip price.
- The remaining $900–$1,000 per guest is paid in clean USD cash directly to the host family.
