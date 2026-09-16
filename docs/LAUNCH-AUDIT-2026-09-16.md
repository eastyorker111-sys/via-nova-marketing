# Via Nova website launch audit

Status: REVIEWED, September 16, 2026. Business-project record; not GBC coursework.

## Completed and verified

- Public production domain: https://vianovamarketing.ca/. Normal DNS and HTTPS worked from this computer during final checks.
- Phone +1 (437) 237-6895, email east_yorker@outlook.com, and address 75 Thorncliffe Park Drive, Toronto, Ontario M4H 1L4, Canada are on Contact and every footer. Ownership states EAST YORKER CORP.
- Original VN logo, star/path, approved five-colour palette, and Adobe Source Serif 4 / Source Sans 3 remain in place.
- Google indexing blocks removed from HTML and Vercel response headers. Public production authorization is recorded in AGENTS.md.
- Unique titles/descriptions, canonical addresses, social-sharing metadata and Organization/WebSite/page structured data added. No fabricated review ratings, credentials, or social links.
- Sitemap generated from the page list, robots.txt available, /index.html redirects to /, and missing pages return a branded 404 with noindex.
- Privacy page describes actual brief-tool and analytics behaviour. It is a website-specific explanation, not a claim of legal compliance.
- Browser security headers added: nosniff, frame protection, referrer policy and restrictions on camera/microphone/location access.
- Google Search Console domain verification TXT saved in Vercel. Domain property is accessible. Sitemap submission status: Success; Google discovered the original five pages. Published sitemap now contains six pages, including Privacy.
- Google's Security issues and Manual actions reports both said “No issues detected.” This is a current report result, not a comprehensive security certification.
- Vercel Web Analytics enabled on the included Hobby allowance, with no paid upgrade. Official SDK deployed; first visitor/page view appeared in dashboard.
- Analytics uses public production pages only, removes URL query/hash data, excludes project-brief fields and honours Do Not Track. No Google Analytics, advertising pixel, custom conversion events or session replay installed.

## Verification evidence

- Build and eight existing/extended structural checks passed.
- All six HTML pages, robots.txt and sitemap.xml returned HTTP 200 publicly, with no X-Robots-Tag indexing block.
- Unknown URL returned HTTP 404 with the custom page; /index.html returned 308 to /.
- Analytics script returned HTTP 200 and the dashboard recorded a visit.
- Chrome layout checks on all six pages at 320, 768 and 1440 pixels: one H1, images loaded, no horizontal overflow. Contact also checked at 390 pixels.
- Mobile navigation opens and closes; Escape tested. Brief tool validates and produces its local download success state. It does not submit an enquiry.
- Desktop homepage/services/about and mobile contact inspected visually. Local browser logs had no errors in that check. Live Chrome later reported extension-style asynchronous listener errors; no corresponding website failure was observed.

## Remaining work and limits

- Indexing/rankings take processing time; sitemap success is not proof every page is indexed or a promise of first place.
- Real case studies, approved mission/vision wording, operating hours, founder biography, social-profile URLs, and any response-time promise need verified business content. Work page remains an honest placeholder.
- Contact currently works through phone/email links. The brief remains a local download. Server-delivered forms need an email delivery provider, verified sender and spam controls; no delivery integration is claimed.
- Google Business Profile requires confirmation of business eligibility, in-person service model, hours and address-display preference before creation. Do not infer that clients can walk into the published mailing address.
- Backlinks cannot be added by a tag in this site. Use real business profiles, relevant partner mentions with permission, and published work people have a reason to reference. No purchased link scheme, fake traffic or fabricated testimonials.
- Performance still has room for improvement: original hero PNG is about 2.3 MB and original TTF fonts are retained for reference. The website now serves WOFF2 fonts totalling 597,644 bytes, down from 1,850,748 bytes (about 68% smaller), with the same typefaces. No measured Core Web Vitals or formal accessibility conformance claim. Further asset optimization should preserve the original approved artwork.
- Business plan suitability is separate from DNS: current Vercel account is Hobby. No subscription was changed.

## Next actions

1. Review Google's indexing report after it finishes processing.
2. Supply approved hours, real case-study material and social URLs.
3. Confirm whether the business meets clients in person before starting Google Business Profile.
4. Build useful service-specific content from real offerings and evidence; seek relevant editorial links over time.
5. Measure page speed and optimize delivery assets without redesigning the logo.

## Official references

- https://developers.google.com/search/docs/essentials
- https://developers.google.com/search/docs/appearance/structured-data/organization
- https://vercel.com/docs/analytics/quickstart
- https://vercel.com/docs/analytics/privacy-policy
- https://vercel.com/docs/analytics/limits-and-pricing

- Google confirmed the homepage indexing request and added it to the priority crawl queue. Actual indexing remains pending.
- Homepage headline revised to two intentional lines at the user’s request; responsive sizing checked before release.
