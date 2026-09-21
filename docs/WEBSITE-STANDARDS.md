# Via Nova website standards

Working system recorded 16 September 2026. These rules guide future changes; they are not a claim that every check has passed. Keep agency work in this repository, separate from GBC course materials.

## Purpose and content

The website introduces Via Nova and helps prospective clients understand its services and take the next step. The founder's stated direction is helping Canadian small businesses from product to branding, combining business experience with marketing education. Final mission, vision, service scope, and whether sourcing belongs here or at TorontoGadgets remain unapproved. Do not turn proposed wording into an approved business claim.

Keep Home, Services, About, Work, and Contact understandable and connected. Each page needs a clear purpose and relevant next action. Use honest portfolio placeholders until real projects are supplied. Never invent clients, testimonials, results, qualifications, or contact details. The contact form now submits to the separate Via Nova Formspree endpoint. Preserve direct phone, email and WhatsApp alternatives, spam protection and accurate privacy wording.

## Brand and visual system

- Preserve the original serif VN monogram, ascending road, guiding star, wordmark, and “A Higher Way Forward” tagline. Never replace the logo with a newly drawn approximation.
- Exact palette: navy #0B2D45, teal #0E6F6B, ivory #F9F7F2, gold #D4AF7C, stone #D9DBDF. Choose accessible combinations; an approved colour is not readable on every background. Use gold mainly for accents.
- Current website fonts: Adobe Source Serif 4 for headings, Source Sans 3 for body and controls. Keep the supplied licenses. Logo lettering is part of the artwork and stays untouched.
- Premium editorial direction: generous space, deliberate alignment, restrained ornament, strong imagery, consistent rhythm. Avoid a new style on every page.
- Use sentence case for headings and controls. Reserve spaced capitals for short labels and the identity. Preserve proper names and acronyms.
- Project targets: body and inputs at least 16px; body line height around 1.5–1.7; clearly differentiated heading levels; captions preferably at least 12px. These are design targets, not universal WCAG font-size requirements. Existing 11px captions should be assessed during the next visual pass.
- Maintain reusable colour, spacing, type, and component tokens. Consolidate existing accumulated CSS overrides when changing that system, with visual regression checks.
- Use Adobe for requested artwork edits. Retain originals, identify generated imagery honestly, record asset provenance, and optimize delivery without changing brand colours or logo geometry.

## Structure and accessibility

Use semantic HTML, one descriptive H1 per page as this project's convention, nested headings, meaningful link labels, and explicit form labels. Choose heading levels for content structure, not visual size. See [MDN headings guidance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Headings_and_paragraphs).

Target WCAG 2.2 AA: normal text contrast at least 4.5:1, large text 3:1, and applicable interface boundaries 3:1. Test keyboard access, visible unobscured focus, useful image alternatives, 200% text resizing, and reflow at 320 CSS pixels. Minimum pointer targets are 24×24 CSS pixels with specified exceptions; aim for 44×44 for principal controls. Honour reduced-motion preferences. These checks alone do not establish conformance. See [W3C WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/).

## Build and performance

Keep the current static HTML/CSS/JavaScript architecture unless a feature justifies a change. Do not introduce a framework because a plugin happens to support it. Source pages live in src/pages.mjs, assets in public/assets, and dist is generated output.

Check image dimensions/compression, reserve media space to avoid movement, load essential fonts deliberately, and minimize unnecessary scripts. Measure before claiming speed. Core Web Vitals good thresholds are LCP ≤2.5 seconds, INP ≤200 milliseconds, and CLS ≤0.1, evaluated at the 75th percentile of field visits. Lab tests help diagnose but do not replace field evidence. See [Google Web Vitals](https://web.dev/articles/vitals).

## Security and private hosting

Keep secrets out of browser code, generated files, logs, and Git. Prefer safe text insertion over interpreting untrusted input as HTML. Review third-party scripts and validate future server inputs. Load the installed security-best-practices skill for security-specific work; this document is not a security audit.

The user explicitly approved public production launch on September 16, 2026. Keep preview deployments authenticated. Verify production at https://vianovamarketing.ca/ works without authentication after releases. Public pages must not carry noindex. Do not weaken preview protection to automate checks.

## Verification and release sequence

1. Recover the relevant approved decisions and define what the change must accomplish.
2. Implement the smallest coherent change. Preserve original artwork and keep unresolved business assumptions visible.
3. Build and run the relevant existing checks. For visual changes inspect every affected page in the user's Google Chrome through the supported browser tools.
4. Check representative widths of 320, 390, 768, and 1440px, plus zoom and keyboard behaviour. Verify actual font loading, case, line breaks, overflow, navigation, menu, and contact submission as applicable.
5. Record evidence and limitations. Passing structural tests does not prove visual quality, accessibility, security, or performance.
6. Commit only intended files. A local commit is not a GitHub push; GitHub push authentication was verified on September 16, 2026.
7. For an authorized deployment, apply the protection checks above and inspect the resulting live page. Documentation-only changes do not require deployment.

## Skill and tool selection

- Adobe tools: artwork preparation and refinement; already available.
- Vercel verification and browser-verification skills: trace user flows and check rendered results; guidance read. Always use Google Chrome, adapting browser instructions to the supported tool.
- Vercel deployment/CLI skills: private hosting and deployment verification; guidance read.
- Security Best Practices: installed and frontend guidance read on 16 September; available for selection from the next conversation turn.
- Skill Installer: discover genuine gaps; avoid duplicate browser/hosting integrations.
- Figma remains optional for a dedicated design-system deliverable. It is not required to maintain this static website.

Next substantive review: assess the current site against this system, address caption readability and CSS consistency, and keep mission/service-scope decisions separate from visual corrections.
