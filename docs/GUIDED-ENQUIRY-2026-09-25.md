# Guided enquiry and messaging — 25 September 2026

Status: implemented and checked locally; preview approval pending, not pushed or deployed.

Approved scope: clarify Home/Services/About messaging for flexible Canada-wide branding and marketing; improve the existing brief into one relevant question at a time. Preserve identity, existing services and unrelated pages.

Implemented: logo, website, video, content, materials, campaigns, strategy, full-journey and guidance routes; product-launch stage routing without mandatory bundles; explicit confirmation of guidance direction; shared answers, backtracking, editable review, exclusion of irrelevant fields with restorable in-page answers; existing Formspree endpoint and quick-contact alternative. Optional blanks are grouped under discussion points in the summary. No automatic prices or delivery promises.

Evidence:
- Build and 20 automated tests pass, including route selection, inactive branches and analytics consent/privacy tests.
- Chrome: video-only launch route, logo + website route, unsure route with and without confirmation, shared-answer retention, service removal/restoration, idea-stage discovery opt-out, invalid email, required-choice validation, and summary editing checked without submission.
- Chrome layout: Home, Services, About and Quote checked at 320, 390, 768 and 1440 CSS pixels; no horizontal overflow. Desktop home/form and mobile form visually reviewed.
- Mobile navigation and analytics choice controls open correctly.
- Live Home/Services/About/Work/Contact/Quote/Privacy, sitemap and robots all returned HTTP 200 before deployment.
- Contact phone/email/WhatsApp destinations and Formspree endpoint retained.
- Work, Contact and Privacy generated HTML compared with HEAD and unchanged.

Limits: no test enquiry sent; current email delivery, external analytics account collection, third-party profile status and hosting/account settings were not verified. No live deployment occurred. Preview server is local on port 4173.

Screenshots: D:/Via Nova Marketing/Website Previews/2026-09-25/
Next: owner reviews the preview; publish only after specific preview approval. Pre-existing AGENTS.md changes and two untracked image originals excluded from this work.
