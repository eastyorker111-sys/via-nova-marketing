# Approved audit work — 21 September 2026

## Image delivery implemented

Approved artwork and PNG masters retained. Generated responsive WebP delivery copies with scripts/optimize-images.mjs using sharp. Homepage uses responsive image candidates; About landscape uses WebP with PNG fallback. Logo geometry, fonts and palette unchanged.

- Hero master: 2,321,208 bytes; largest WebP: 149,668 bytes (93.6% smaller). Smaller candidates: 32,200 and 66,486 bytes.
- Logo master: 457,147 bytes; largest WebP: 28,270 bytes (93.8% smaller). Smaller candidates: 7,446 and 16,094 bytes.
- Build and all 11 existing tests pass.
- Chrome: all six pages checked at 320, 390, 768 and 1440 CSS pixels; no horizontal overflow or broken images observed. Homepage artwork inspected visually at mobile and desktop sizes.
- These are asset-size savings, not a measured new PageSpeed score or real-user performance claim.

## Enquiry form

User confirmed east_yorker@outlook.com as the receiving inbox. After user sign-in, created a separate Via Nova Formspree form (xqpaqedp). Outlook address was verified in the account. Existing account allowance showed 1/50 monthly submissions used before testing; both businesses share that allowance. No paid plan selected and Toronto Gadgets form unchanged.

Contact page now uses native HTTPS POST, required name/email/message, optional business/service, a honeypot and the provider's existing spam protection. Browser-native submission also works without JavaScript. Privacy wording discloses Formspree processing/storage. Direct email/phone/WhatsApp remain alternatives. No secret keys or enquiry contents sent to analytics.

Chrome blocked empty submission and a completed test reached Formspree's success page. The labelled TEST VN-20260921 record was verified in the Via Nova submissions Inbox (not Spam). Actual Outlook notification receipt awaits owner confirmation; provider acceptance is not proof of mailbox delivery. Contact checked at 320, 390, 768 and 1440 actual viewport widths without overflow and visually inspected on mobile. Build and all 11 checks pass.

Formspree documentation used: https://help.formspree.io/articles/building-your-form/honeypot-spam-filtering and the authenticated form's native HTML integration instructions.

## Preserved boundaries

Drive migration paused at user's request. Hosting purchase/migration not performed. Logo/banner consistency changes remain deferred. Content workflow and owned-business case-study draft prepared at D:/Via Nova Marketing/Operations/Content-and-case-study-workflow.md and verified uploaded to the new Drive account under Via Nova Marketing. These remain drafts, not published posts/case studies. No invented results or newly proposed service claims published.

Image release: production READY, commit 16008f6. Public homepage/About and optimized images returned HTTP 200; Chrome confirmed WebP image loading. This note precedes the subsequent contact-form release.
