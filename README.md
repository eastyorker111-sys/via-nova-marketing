# Via Nova Marketing — initial website

Status: **DRAFT / not deployed**. Independent agency website, separate from GBC course materials.

## Local preview

Requires Node.js 20 or later. No runtime packages, external fonts, tracking scripts, or build dependencies.

```sh
npm run dev
```

Open http://127.0.0.1:4173. Restart after editing to rebuild. `npm run build` generates the five static HTML pages and assets in `dist/`. `npm test` checks page structure and internal links. Do not deploy until launch content is approved.

## Pages

- Home: brand introduction, service overview, illustrative work, about, contact CTA.
- Services: four draft service areas and a four-step approach.
- About: brand philosophy and guiding principles; no invented team biographies.
- Work: clearly labelled brand explorations and case-study placeholders; no client claims.
- Contact: accessible project brief builder. Downloads a local text file; sends nothing and uses no storage or backend.

## Brand

Deep Navy `#0B2D45`, Rich Teal `#0E6F6B`, Warm Ivory `#F9F7F2`, Metallic Gold `#D4AF7C`, Stone Grey `#D9DBDF`. Tagline: **A Higher Way Forward**. Editable SVG monogram interprets the approved VN / ascending path / guiding star direction; it is not a traced or verified reproduction of the prior logo image. Original CSS/SVG art, system sans-serif typography, and editorial serif accents require no remote assets.

## Editing

`src/pages.mjs`: page copy and shared layout. `public/assets/styles.css`: tokens, layouts, responsive styles. `public/assets/site.js`: mobile menu and local brief download. `public/assets/mark.svg`: initial vector mark. `scripts/`: dependency-free build and local preview server (development only).

## Before launch

- Approve service positioning, target audience, copy, and final logo artwork.
- Supply a verified contact email or enquiry endpoint, then replace the local-only brief workflow and test delivery.
- Supply approved client projects and evidence for any outcomes or testimonials.
- Confirm business details and production domain; add canonical URLs and social sharing image.
- Review any privacy requirements for the actual launch integrations.
- Remove the intentional `noindex, nofollow` draft metadata after launch approval.

There is no deployment configuration, hosting integration, analytics, or automatic publishing workflow in this repository.
