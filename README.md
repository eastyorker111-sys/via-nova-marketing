# Via Nova Marketing

Status: **DRAFT — not deployed**. Agency work is kept separate from GBC course materials.

## Preview and checks

Requires Node.js 20+. Run `npm run dev`, then open http://127.0.0.1:4173. Run `npm run build` after editing; `npm test` checks page landmarks, internal destinations, and placeholder disclosures. No build dependencies or third-party tracking.

## Five pages

- Home: mountain-road hero, brand statement, services, approach, portfolio placeholder, and contact CTA.
- Services: four draft service areas and the Discover / Define / Create / Refine process.
- About: brand philosophy, original identity, and guiding principles.
- Work: an explicitly unfinished portfolio without invented client projects or results.
- Contact: accessible local project brief download. No transmission, storage, or enquiry backend.

## Recovered brand identity

The original serif VN monogram, ascending road, gold guiding star, VIA NOVA wordmark, and A Higher Way Forward tagline are retained from the recovered original artwork. The earlier replacement SVG has been removed. Adobe prepared crops of the original logo and monogram; these are raster originals, not newly drawn substitutes.

Playfair Display and Montserrat are hosted locally, with OFL licenses in `public/assets/fonts/`.

Palette: Deep Navy #0B2D45, Rich Teal #0E6F6B, Warm Ivory #F9F7F2, Metallic Gold #D4AF7C, Stone Grey #D9DBDF.

## Asset provenance

Brand source: the original logo and final board recovered from the user’s shared Greeting Exchange conversation, https://chatgpt.com/share/6aaaec5b-9a28-83ea-9ae8-e42121f7a5cf. Reference copies remain outside this repository in the adjacent `via-nova-brand-reference` directory.

`public/assets/hero-adobe.png`: AI-generated mountain-road artwork, refined with Adobe image adjustments (highlights -18, shadows +10, contrast +7, vibrance +8, saturation -4). Art direction: photoreal winding alpine road on the right, navy and teal mountain slopes, golden sunrise in the upper right, pale mist on the left for editorial text. Decorative brand metaphor, not a location or client-project photograph.

`public/assets/logo-adobe.png` and `monogram-adobe.png`: Adobe crops of the recovered original logo. Full logo crop preserves the star, wordmark, and tagline.

## Editing and launch gaps

Page copy and shared layout live in `src/pages.mjs`; styling and interactions in `public/assets/`. Contact details, service copy, client case studies, production domain, and an enquiry channel need confirmation before launch. No fake phone number, email address, testimonial, or results are used. Draft pages intentionally have noindex metadata. No hosting or automatic deployment is configured.
