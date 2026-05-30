# 9to5Wrapped — Design System

> **Tagline:** *You do the work, the app does the talking.*

9to5Wrapped is an **AI-powered, role-aware daily work-report generator**. You log simple task rows — time spent, status, priority, category, outcome, blockers, next steps, subtasks — and 9to5Wrapped turns them into a polished report matched to your **role, seniority, tools, and manager's expectations**, then exports it to CSV / spreadsheet form. The pitch on the auth screen says it best: *"Role-aware daily reports in minutes."*

The personality is deliberately **Gen-Z / playful-pro**: a warm cream "paper-on-a-grid" light mode and a moody **neon dark mode**, glassmorphic panels, a cursor-following glow on every card, and confident, heavy display type.

---

## Sources

This system was reverse-engineered from a single attached codebase (read-only, mounted via File System Access API):

- **`src/`** — a Vite + React 18 single-page app.
  - `src/styles.css` — the authoritative design system (~1,600 lines, self-described as *"9to5Wrapped Design System v2 — Gen-Z Light + Dark Neon"*). All color/type/component tokens below are lifted from here.
  - `src/App.jsx` — app shell, topbar, theme toggle (persisted to `localStorage`).
  - `src/pages/AuthPage.jsx` — sign in / sign up split screen with profile capture.
  - `src/pages/OnboardingPage.jsx` + `src/pages/ProfileFields.jsx` — profile setup form.
  - `src/pages/DashboardPage.jsx` — the core "Task report studio" (task cards, metrics, column picker, AI report output, saved-report history, preview modal).
  - `src/components/CardEffects.jsx` — `GlobalSpotlight`, the app-wide cursor glow driving `.glow-card`.
  - `src/components/MagicBento.jsx` — a decorative bento showcase (particles / spotlight / tilt / magnetism).
  - `src/api/client.js`, `src/context/AuthContext.jsx` — data layer (not design-relevant).

No font files, logos, or raster assets ship in the repo — type is loaded from system/Google Fonts and all iconography is **lucide-react**. See [Iconography](#iconography).

> **Naming note:** the source codebase brands the product **"9to5Wrapped"** internally (topbar, auth copy). Per direction, the product name is **"9to5Wrapped"** — that's used throughout this design system and the UI kit. If you re-sync from source, swap the literal `9to5Wrapped` strings for `9to5Wrapped`.

---

## File index (manifest)

| Path | What it is |
|------|------------|
| `README.md` | This file — context, content + visual foundations, iconography, index |
| `colors_and_type.css` | **Foundation tokens** — light + dark color vars, spacing, radii, shadows, easing, and the semantic type scale. Load first. |
| `SKILL.md` | Agent Skill manifest so this system is usable as a downloadable skill |
| `preview/` | Small HTML cards rendered in the Design System tab (color, type, components, spacing) |
| `assets/` | Logos + the SVG icon reference sheet |
| `ui_kits/app/` | **The product UI kit** — pixel-faithful, interactive recreation of the 9to5Wrapped web app (Auth → Onboarding → Dashboard), light + dark |

There is **one product surface** (the web app); no marketing site, mobile app, docs, or slide template was provided, so only one UI kit exists.

---

## Content fundamentals

How 9to5Wrapped writes. The voice is **confident, brisk, and outcome-obsessed** — it talks to a busy professional who wants credit for their work without writing the report themselves.

- **Person:** Speaks **to "you"** ("Tell the AI how *your* work should be understood"). Never "we." The product is a quiet assistant, not a teammate with opinions.
- **Casing:** **Sentence case everywhere** — headings, buttons, labels. No Title Case, no ALL CAPS except tiny eyebrow/section labels (`SAVED REPORTS`) which are letter-spaced uppercase.
- **Length:** Extremely tight. Headlines are one line. Button labels are 1–2 words (`New`, `Role plan`, `Carry over`, `Save`, `Raw CSV`). Helper text is a single sentence.
- **Verbs first, imperative:** `Generate AI report`, `Add task`, `Add subtask`, `Carry over`, `View full report`, `Create account`. Buttons describe the action, not the noun.
- **Concrete over fluffy:** value framed as deliverables and proof — *"Outcome or proof of value,"* *"polished report matched to your role, seniority, tools, and manager expectations."* Avoids hype words; the closest it gets is "polished" and "in minutes."
- **Placeholder copy guides the user:** inputs teach by example — `you@company.com`, `Min 8 characters`, `What should this report answer?`, `Outcome or proof of value`, `Blocker (if any)`, `Next step`.
- **Status vocabulary** (fixed set, sentence case): `Not started`, `Planned`, `In progress`, `Done`, `Blocked`, `Waiting`, `Carried over`, `Skipped`. Priorities: `Low / Medium / High / Urgent`. Categories: `Planning, Execution, Review, Meeting, Research, Support, Admin, Learning, Bug fix, Follow-up`.
- **Tags / proof chips:** short, punchy, no punctuation — `AI-powered`, `Role-aware`, `Export to CSV`, `5 min setup`.
- **Loading / transient states** are casual and human: `Please wait...`, `Working...`, `Saving...`, `Loading...`.
- **No emoji.** Tone is conveyed through neon, motion, and weight — not emoji. (See Iconography.)

**Representative lines:**
- *"Role-aware daily reports in minutes"* (hero)
- *"Enter simple time and task rows, then generate a polished report matched to your role, seniority, tools, and manager expectations."* (subhead)
- *"Tell the AI how your work should be understood"* (onboarding title)
- *"Task report studio"* (dashboard title) · *"What progress mattered most today?"* (default focus question)

---

## Visual foundations

The look is two distinct moods sharing one skeleton. **Light = warm, papery, optimistic.** **Dark = neon cyber, glowing, nocturnal.** Same layout, same radii, same motion — the palette and shadow story flip.

### Color
- **Light surfaces** are a warm **cream `#f4f5ea`** base (not white) with white glass panels floating on top. Text is near-black ink `#12131c`.
- **Dark surfaces** drop to **near-black `#07070f`** with translucent navy glass panels (`rgba(8,8,22,0.58)`) and off-white text `#eeeeff`.
- **Accent palette is the brand signature** — pink `#ff4d6d`, teal `#23d5ab`, lime `#b8f563`, yellow `#ffd166`, purple `#8b5cf6` in light; these intensify to **neon** in dark — hot pink `#ff0080`, neon green `#00ff87`, electric cyan `#00d4ff`, `#ffcc00`. The *primary accent swaps*: pink leads in light, neon green leads in dark.
- **Semantic mapping:** teal/green = active/done/success, pink = danger/blocked, yellow = planned/warning, neutral grey = skipped.

### Type
- **Unbounded** (geometric, rounded, expressive) for **display + all headings** — the cool, Gen-Z voice of the brand.
- **Playfair Display** (high-contrast editorial serif) for **body copy, key labels, and the rendered report** — gives the output a refined, written-by-a-human feel that plays against the techy Unbounded headlines.
- **Inter** remains for dense UI chrome (eyebrows, chips, buttons, form fields); **Fira Code** for any raw CSV / code view.
- Headings are **bold (700–800)** with **tight negative tracking** (-0.005 to -0.02em). Big headlines use a **gradient text clip** (ink → accent). Serif body runs at a calm 400–600 weight, ~1.6 line-height. *(Original product shipped Inter throughout; the Unbounded + Playfair pairing was introduced at the user's request.)*
- Body is calm: 400 weight, 1.6–1.72 line-height, muted `--text-2`. Labels are **750 weight**, slightly tracked. Buttons 750. Eyebrows are 850, uppercase, `0.07em` tracked.

### Backgrounds
- The **32×32px grid-paper texture** (`--border`-colored hairlines) is the persistent backdrop — subtle, draftsman-like. (`.surface-grid`)
- Auth + onboarding screens add **soft radial color blooms** in the corners (pink + teal in light; dimmed neon in dark) for depth.
- No photography, no illustration, no repeating motifs beyond the grid + glow.

### Glass, blur & transparency
- Panels (auth, onboarding, workspace, result, modals, topbar) are **glassmorphic**: translucent fill + `backdrop-filter: blur(20–28px)` + a 1px hairline border. Used liberally — it's a core motif, not an accent.
- Inner cards (metrics, profile context, todo cards) use lighter glass (`blur(10–16px)`).

### The glow-card system (signature interaction)
- Every meaningful card carries `.glow-card`. A single app-wide `GlobalSpotlight` tracks the cursor and drives CSS vars so a **radial border-glow** lights up the *edge* of whichever card the pointer is near, plus a soft screen-blend spotlight follows the cursor. Glow color is purple `132,0,255` by default.
- Honors `prefers-reduced-motion` and disables on touch.

### Shadows & elevation
- **Light:** soft, neutral, low-spread drop shadows (`sm` 2/8, `md` 8/24, `lg` 22/50 at 7–12% ink).
- **Dark:** deeper black shadows **plus a faint neon ring** (`0 0 0 1px rgba(0,255,135,0.04–0.08)`) and, on interactive elements, **outer neon bloom** (e.g. primary button `0 0 16px → 0 0 28px` green glow on hover). The report console gets an inner neon glow + green `text-shadow`.

### Radii & borders
- Rounding ladder: inputs/buttons **10px**, chips/metrics **12px**, cards **14px**, panels **16px**, modals **18px**, chips/tags **pill (100px)**. Score ring is a circle.
- Borders are 1–1.5px hairlines; inputs use **1.5px**. **Status-coded left borders** (5px) on todo cards and 3px on status selects encode state by color.

### Motion
- **Entrances:** `fadeInUp`, `slideInRight`, `scaleIn`, `cardEnter` — short (0.18–0.6s), staggered by index on lists (`animationDelay: index * 0.04s`).
- **Easing:** primary is `cubic-bezier(0.16, 1, 0.3, 1)` (snappy ease-out); `ease-in-out` for fast micro-transitions. Tokens: `--t-fast 120ms`, `--t-base 220ms`, `--t-slow 380ms`.
- **Hover:** cards/buttons **lift** (`translateY(-1 to -2px)`); icon buttons **scale** (`1.06`); history rows **slide** (`translateX(2px)`); brand icon **rotates** (`-10deg + scale`); theme toggle **rotates 22°**. Dark mode adds neon bloom on hover.
- **Press:** primary/secondary/ghost buttons **shrink** (`translateY(0) scale(0.98)`).
- **Focus:** 3px `--focus-ring` halo + accent border; dark mode adds a faint neon outer glow.
- `neonPulse` keyframe exists for emphasis (pulsing green box-shadow).

### Layout rules
- **Sticky topbar** (68px, blurred) and a **sticky result panel** on the dashboard (`top: 88px`).
- Dashboard is a **2-column grid** (`1.28fr` workspace / `0.72fr` result) collapsing to one column < 1200px. Auth is a **2-column split** (copy / panel) collapsing < 980px.
- Generous container padding (`clamp(18–44px)`), 14–24px gaps. Forms use `.two-column` and dense grid toplines.

---

## Iconography

- **Library:** **[lucide-react](https://lucide.dev)** exclusively — clean, **2px stroke, rounded line caps/joins**, no fills. This is the single icon language; do not mix in another set.
- **Sizing:** small and consistent — **17px** in buttons, **18px** in metrics, **15px** for inline/subtask actions, **24px** for the oversized brand mark. Icons inherit accent color in metrics (`--accent`) and the active accent in the brand chip.
- **Brand mark:** a lucide glyph (`FileText` in the topbar, `BriefcaseBusiness` on auth) set in a **rounded accent-filled square** (`--accent` bg, white glyph, 10–14px radius). In dark mode the chip gets a neon green glow. There is **no standalone logotype** in the codebase — the wordmark is just **"9to5Wrapped"** set in **Unbounded 700** (originally Inter 850). See `assets/`.
- **Icons in use** (from `DashboardPage`): `Sparkles, WandSparkles` (AI/generate), `ListChecks, ListTree` (tasks/subtasks), `AlarmClock` (blocked), `RotateCcw` (carry over), `FilePlus2` (new), `Plus`, `Trash2`, `Save`, `Download, FileDown` (export), `Copy, Check`, `Columns3`, `Eye`, `X`, `ArrowRight`, `Moon, Sun` (theme), `BriefcaseBusiness, FileText` (brand).
- **No emoji. No unicode-glyph icons.** The select-dropdown chevron is an inline SVG (stroked, matches lucide weight; stroke color flips to neon green in dark).
- **In this system:** the kits load lucide from CDN (`unpkg.com/lucide@latest`) and render via `data-lucide` attributes. `assets/icon-reference.html` shows the in-use set; the brand chip is reproduced in `assets/`. When you need an icon lucide doesn't have, pick the nearest lucide glyph rather than introducing a new style — flag it if it's a stretch.

---

*Built to be edited. Tokens live in `colors_and_type.css`; the product recreation lives in `ui_kits/app/`. See `SKILL.md` to run this as a skill.*
