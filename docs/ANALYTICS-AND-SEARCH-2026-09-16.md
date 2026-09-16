# Analytics and search setup

Completed September 16, 2026, with the user's Google Chrome.

## Google Analytics

- Separate GA4 property: Via Nova Marketing, property ID 554686322, under existing account 381706523. Toronto Gadgets property was not modified.
- Reporting zone Toronto, currency CAD. Small-business setup category selected for the new agency; business objectives leads and website traffic.
- Website stream 15792510020; measurement ID G-LYCLD92MGB.
- Published to all website pages. Production hostname and known page paths only.
- Basic opt-in: no Google tag before analytics acceptance. Decline and footer Analytics settings are available. Preferences expire after 180 days. Do Not Track and Global Privacy Control prevent loading.
- Enhanced measurement confirmed OFF in stream settings. Ads personalisation/signals disabled in tag configuration. Page address query strings and fragments omitted, referrer reduced to origin, no project-brief data or personal contact values sent.
- Custom contact_click event records only contact_method (phone, email or whatsapp). A click is not a submitted lead or sent message.
- Existing Vercel aggregate analytics retained and explained separately in privacy information.
- Verification: Google tag response HTTP 200, Google collect response HTTP 204 in Chrome network observation. GA4 Realtime showed one active user, the homepage title, page_view, session_start and first_visit during testing. This visitor is verification traffic, not evidence of a new customer.
- Eleven automated checks passed. Consent layout had no horizontal overflow at 320, 390, 768 and 1440px. Decline and settings reopening were checked in Chrome.

## Search Console

- Existing verified domain property used.
- Resubmitted https://vianovamarketing.ca/sitemap.xml; successful, six discovered pages.
- Removed erroneous https://vianovamarketing.ca/ sitemap submission, which was HTML and reported one error. This removed only the mistaken sitemap entry, not a page from Google.
- All six sitemap page URLs return HTTP 200, canonical tags present, no noindex directives in page HTML. robots.txt permits crawling and references the correct XML sitemap.
- Security issues: No issues detected. Manual actions: No issues detected.
- Search performance/indexing reports still processing. Core Web Vitals lacks sufficient field data. Discovery does not guarantee indexing or ranking.

## Sources

- https://developers.google.com/tag-platform/security/concepts/consent-mode
- https://developers.google.com/analytics/devguides/collection/ga4/reference/config

## Remaining

Allow normal Analytics/Search Console reports time to populate. No paid ads, recurring jobs, automated fake traffic or ranking guarantees were introduced. Contact clicks are instrumented but a completed enquiry cannot be measured until a real sending form is configured.
