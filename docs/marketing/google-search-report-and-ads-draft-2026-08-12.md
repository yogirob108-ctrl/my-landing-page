# 8 Lakes Tours — Google Search Report & Paid Search Draft

**Prepared:** 12 August 2026
**Site:** https://www.8lakestours.com/
**Google Ads client:** 8 Lakes Tours (`285-034-4584`), owned by `8lakestours@gmail.com`
**Status:** Research and draft only. No campaign, billing submission, budget activation, ads, or spend.

## Executive summary

Google Search Console recorded **100 organic clicks**, **846 impressions**, **11.8% CTR**, and **average position 5.3** during the selected last-three-month window.

The disclosed query sample is almost entirely people already looking for **8 Lakes / Eight Lakes in Mongolia**. That is useful evidence of brand and destination fit, but it is not enough to prove non-brand paid-search demand. Google exposes only 11 query rows for this low-volume property, and the 10 rows captured account for only **9% of clicks** and **21.3% of impressions**. Most query-level data is privacy-suppressed.

The right first paid test is therefore not a broad or automated campaign. It is a tightly controlled, **paused Search campaign draft** using exact and phrase match around:

1. Mongolia horse trekking;
2. Eight Lakes / Naiman Nuur horse treks;
3. Orkhon Valley horse riding;
4. authentic nomadic-family adventure travel.

The account and public-facing brand are both **8 Lakes Tours**.

## 1. What currently brings organic Google traffic

### Search Console totals

- Period: last 3 months selected in Search Console
- Clicks: **100**
- Impressions: **846**
- CTR: **11.8%**
- Average position: **5.3**
- Search type: Web
- Property: `https://www.8lakestours.com/`

### Disclosed query sample

| Query | Clicks | Impressions | CTR |
|---|---:|---:|---:|
| 8 lakes mongolia | 6 | 94 | 6.38% |
| 8 lakes trek mongolia | 2 | 7 | 28.57% |
| eight lakes mongolia | 1 | 46 | 2.17% |
| 8lakes | 0 | 8 | 0% |
| 8 lakes | 0 | 7 | 0% |
| twin lakes mongolia | 0 | 7 | 0% |
| eight lakes | 0 | 6 | 0% |
| 8-lakes.com | 0 | 3 | 0% |
| eight lake | 0 | 1 | 0% |
| lakes in mongolia map | 0 | 1 | 0% |

Search Console reported 11 disclosed rows; browser input issues prevented capture of the final pagination row. The ten captured rows total **9 clicks and 180 impressions**. They must not be treated as the complete query mix.

### What the data means

**1. Current visible demand is branded/destination-aware.**
The click-producing terms all combine “8/eight lakes” with “Mongolia” or “trek.” People reaching the site through disclosed queries already know the place, brand, or both.

**2. Adding “trek” signals much stronger intent.**
`8 lakes trek mongolia` produced 2 clicks from 7 impressions (28.6% CTR), versus 6 from 94 (6.4%) for `8 lakes mongolia`. The sample is tiny, but this is directionally consistent with commercial intent: “trek” describes the product, while the broader location query may be informational.

**3. The spelling variants matter.**
Google shows `8 lakes`, `eight lakes`, `8lakes`, and `8-lakes.com`. SEO copy should continue to use both “Eight Lakes” and “8 Lakes”; paid search can cover close variants through exact and phrase match without creating dozens of duplicates.

**4. Some impressions are clearly irrelevant.**
`twin lakes mongolia` and `lakes in mongolia map` are not strong booking searches for this product. They belong in the initial negative-keyword review.

**5. Aggregate organic performance is promising but not proof of paid performance.**
An 11.8% sitewide organic CTR and average position 5.3 suggest the result is relevant when it appears. Paid CPC, conversion rate, and customer acquisition cost remain unknown.

**6. Privacy suppression is the dominant limitation.**
The captured rows explain only 9% of clicks. We cannot honestly infer that 91% of clicks came from any specific terms, countries, pages, or intents.

## 2. Offer and conversion fit

The live site sells one clear, high-value product:

- 9-day horseback expedition through the Orkhon Valley and Eight Lakes / Naiman Nuur region;
- hosted with nomadic families and guided by local horsemen;
- beginner and intermediate riders welcome;
- maximum 8 guests;
- 2026 total price **$1,799–$1,999 per person**, depending on group size;
- 1–2 guests can reserve online after the booking form;
- groups of 3–8 require Rob to confirm availability and send the exact payment order;
- fixed August/September 2026 departures plus private dates through late September.

The site already captures first-touch UTMs, `gclid`, landing URL, referrer, and GA client ID. GA4 tracks the booking funnel and has key events including `booking_form_submit`, `qualify_lead`, and `payment_received`.

### Conversion recommendation

If this draft is eventually launched:

- **Primary:** `qualify_lead` and `payment_received`
- **Secondary/observation:** `booking_form_submit`
- **Do not optimize for:** newsletter signup, page view, scroll, or Stripe click

A raw form submission is not always a qualified customer, especially for 3–8-person groups. Smart bidding should eventually learn from accepted/qualified leads and payments, not from low-friction activity.

## 3. Campaign recommendation

### Campaign A — Non-brand Search

**Draft name:** `Search | Nonbrand | Mongolia Horse Trek | EN`
**Status:** PAUSED / local blueprint only
**Goal:** qualified booking enquiries and paid reservations
**Networks:** Google Search only; disable Display expansion and Search Partners for the first test
**Language:** English
**Location setting:** Presence only — people in or regularly in the selected locations, not people merely interested in them
**Initial geo test:** United Kingdom, Netherlands, United States, Canada, Germany (English queries only)
**Schedule:** 24/7; forms work across time zones
**Match types:** exact and phrase only
**Initial bid strategy:** Maximize Clicks with a conservative CPC cap while conversion volume is zero; move to Maximize Conversions only after the primary conversion data is reliable and material
**Draft budget guardrail:** €17/day, 30-day hard test cap of €510

This budget is a planning placeholder, not a recommendation to spend before margin and acceptable CAC are confirmed.

### Campaign B — Brand protection

**Draft name:** `Search | Brand | 8 Lakes Tours | EN`
**Status:** PAUSED / optional
**Keywords:** exact and phrase variants of 8 Lakes Tours / 8 Lakes Mongolia
**Draft budget guardrail:** €3/day, hard test cap of €90 over 30 days

Brand traffic is currently small and organic visibility is already reasonable. This campaign is optional unless competitors or OTAs begin bidding on the brand.

### Recommended ad groups

1. **Horse Trekking Mongolia** — highest direct commercial intent
2. **Eight Lakes / Naiman Nuur** — destination-aware intent seen in Search Console
3. **Orkhon Valley** — itinerary/location intent
4. **Nomadic Family Adventure** — experiential intent; keep tightly qualified with “Mongolia,” “tour,” “trek,” or “horse”

The exact keyword blueprint is in `google-ads-keyword-draft-2026-08-12.csv`.

## 4. Responsive search ad draft

All headlines are within Google's 30-character limit; all descriptions are within the 90-character limit.

### Headlines

1. Mongolia Horse Trekking
2. 9-Day Eight Lakes Trek
3. Ride the Orkhon Valley
4. Stay With Nomadic Families
5. Small Groups, Max 8
6. Beginner Riders Welcome
7. Local Mongolian Horsemen
8. 2026 Mongolia Expeditions
9. From $1,799 Per Person
10. Reserve Your Mongolia Trek
11. Ethical, Family-Run Travel
12. Eight Lakes Horse Trek
13. Real Mongolia, Not a Resort
14. Guided Naiman Nuur Trek
15. Private Group Dates

### Descriptions

1. Ride Mongolia’s Orkhon Valley and Eight Lakes on a 9-day small-group horse trek.
2. Stay with nomadic families, ride with local horsemen, and camp under open steppe skies.
3. Beginner and intermediate riders welcome. Maximum 8 guests. Fixed and private dates.
4. Total price $1,799–$1,999 per person. $999 online; the balance supports local hosts.

### Landing page

**Final URL:** `https://www.8lakestours.com/horse-trekking-mongolia`

The dedicated paid-search landing page now puts the searcher's exact intent above the fold: 9 days, Eight Lakes/Naiman Nuur, Orkhon Valley, beginner suitability, max 8, transparent price and payment split, request-only 2027 inventory, itinerary, safety, and one primary availability CTA.

Cold paid-search traffic will need more reassurance than existing brand-aware visitors. The landing page should foreground the named organiser and host family, genuine trip photography, the full price and payment split, cancellation terms, mandatory insurance, and direct contact access. It should not imply that the $999 online booking payment is the full price or call it a generic deposit.

The booking handoff still asks for emergency contact, nationality, dietary information and a liability signature. That is operationally defensible but high-friction for cold traffic. The landing page therefore makes the request-only, no-automatic-payment state explicit and provides direct email access before sending visitors into the full application. Form-start and completion rates should be watched closely during the test.

## 5. Negative keywords

Initial negatives are in `google-ads-negative-keywords-2026-08-12.csv`.

High-priority exclusions include:

- `twin lakes`
- `map`
- `weather`
- `jobs`
- `free`
- `horse for sale`
- `riding lessons`
- `hotel`
- `car rental`
- `flight only`
- `fishing`
- `minecraft`
- `therapy`

“Therapy” should remain negative because this campaign sells a Mongolia horse trek, not clinical, rehabilitation, counselling, or equine-therapy services.

## 6. Implementation and launch status

1. **Completed — durable future inventory.** The site publishes 2027 small-group interest and June–September private-departure requests without inventing fixed dates. Every 2027 option requires personal confirmation before payment.
2. **Completed — dedicated paid-search landing page.** All draft keywords now use `/horse-trekking-mongolia` rather than the long homepage.
3. **Completed on site — Consent Mode v2.** Google analytics and advertising storage default to denied; visitors can allow non-personalized measurement, keep necessary-only mode, or withdraw their choice. Ad personalization remains denied.
4. **Pending in Google — Ads↔GA4 conversion linking/import.** Import only meaningful lead/payment events and verify they fire once per real lead/payment.
5. **Approved test control.** The test is capped at €20/day: €17/day non-brand and €3/day brand, with a €600 planning ceiling for 30 days.
6. **Required from day one.** Apply the negative list and review actual search terms daily for the first week.
7. **Guardrail.** Do not use broad match, Performance Max, Display expansion, or auto-applied recommendations during the initial low-data test.
8. **Brand guardrail.** Use 8 Lakes Tours consistently in the Ads account, ads, and landing pages.
9. **Pending user participation.** Google Ads billing/payment-profile completion may require Henry to enter or confirm sensitive details directly.
10. **Source of truth.** Public date options come from `lib/tour-dates.mjs`; expired departures are removed using the Mongolia date boundary.

## 7. Measurement plan

Track these by campaign, ad group, keyword, search term, country, device, and landing page:

- qualified leads;
- paid reservations;
- booking revenue;
- cost per qualified lead;
- cost per booking;
- lead-to-payment rate;
- search-term relevance;
- impression share lost to budget/rank;
- landing-page conversion rate.

Decision rule after 30 days or the first meaningful volume:

- pause any query spending materially without a qualified lead;
- add irrelevant queries as exact/phrase negatives;
- move budget toward ad groups producing qualified leads, not merely clicks;
- only switch to conversion-based automated bidding after event quality is verified.

## 8. Evidence and limitations

1. **Google Search Console Performance** — authenticated first-party property `https://www.8lakestours.com/`, Web, last 3 months, accessed 12 August 2026: 100 clicks, 846 impressions, 11.8% CTR, average position 5.3; 11 disclosed query rows.
2. **Live site:** https://www.8lakestours.com/ — product, price, dates, itinerary, structured data, and booking flow.
3. **Supporting live pages:** https://www.8lakestours.com/about, https://www.8lakestours.com/faq, https://www.8lakestours.com/preparation, https://www.8lakestours.com/terms, and https://www.8lakestours.com/privacy — organiser, suitability, access, insurance, payment and policy details.
4. **Production source:** `app/HomePageClient.tsx` — pricing, group handling, attribution capture, booking flow, and GA4 funnel events.
5. **Production metadata:** `app/layout.tsx` — public brand, offer positioning, search metadata, and GA4 measurement ID.
6. No paid Google Ads search-term data exists because no campaign has run.
7. No GA4 organic landing-page or key-event counts were exported in this session; the new Search Console↔GA4 link and existing event definitions should be used for future query-to-conversion analysis, but no counts are fabricated here.
