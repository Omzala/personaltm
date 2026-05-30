---
name: 9to5wrapped-design
description: Use this skill to generate well-branded interfaces and assets for 9to5Wrapped (the AI daily-report generator — "you do the work, the app does the talking"), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## What's here
- `README.md` — full brand context: product, content fundamentals (voice/tone), visual foundations (the warm-cream-light / neon-dark dual system, glassmorphism, the `.glow-card` cursor glow), and iconography (lucide).
- `colors_and_type.css` — the foundation. Light + dark color tokens, spacing/radii/shadow/easing scales, and the semantic type scale (Unbounded display, Playfair Display editorial body, Inter UI, Fira Code mono). **Load this first** in any new artifact.
- `assets/` — brand mark (lucide glyph in an accent chip) + the in-use lucide icon reference.
- `preview/` — small spec cards for color, type, spacing, and components.
- `ui_kits/app/` — an interactive, pixel-faithful recreation of the product (Auth → Onboarding → Dashboard) in both themes. Lift components from here.

## Quick rules
- Two moods, one skeleton: **light = warm cream `#f4f5ea` + ink**, **dark = near-black `#07070f` + neon** (`data-theme="dark"`). Accent leads pink in light, neon-green in dark.
- Headlines in **Unbounded**; editorial/body copy in **Playfair Display**; dense UI chrome in **Inter**; raw data in **Fira Code**.
- Glassmorphic panels (translucent + `backdrop-filter: blur`), 10–18px radii, soft light shadows / neon-ringed dark shadows.
- Icons: **lucide only**, 2px stroke, ~17px. No emoji.
- Voice: sentence case, brisk, outcome-first, speaks to "you". Verbs on buttons.
- Persist the theme to `localStorage`; honor `prefers-reduced-motion` for the glow.
