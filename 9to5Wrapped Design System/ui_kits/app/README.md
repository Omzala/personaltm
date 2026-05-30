# 9to5Wrapped — App UI Kit

A pixel-faithful, **interactive** recreation of the 9to5Wrapped web app, supporting **light + dark mode**. Built from the source codebase (`src/`), not screenshots.

## Run it
Open `index.html`. No build step — React 18 + Babel standalone are loaded from CDN, lucide icons from CDN, and the production stylesheet (`app.css`) is the real `src/styles.css`.

## The flow (all fake, all clickable)
1. **Auth** (`AuthScreen.jsx`) — split hero + sign in / sign up segmented panel. *Sign in* (or "Continue with Google") drops you straight into a seeded dashboard. *Sign up* captures a profile and routes through onboarding.
2. **Onboarding** (`OnboardingScreen.jsx`) — the profile-setup form (`ProfileFields.jsx`), reused from sign-up.
3. **Dashboard** (`Dashboard.jsx`) — the "Task report studio": score ring, metric tiles, editable **task cards** (`TaskCard.jsx`) with status/priority/category, subtask trees, duration pickers, the Excel-column picker, a live CSV **report console**, and a saved-reports history with a preview modal. *Generate AI report* fills the console; *Role plan* / *Carry over* / *New* reshape the board.

Theme toggle (top-right everywhere) persists to `localStorage`. The signature **cursor glow** on `.glow-card` is driven by `spotlight.js` (a vanilla port of `CardEffects.jsx`).

## Files
| File | Role |
|------|------|
| `index.html` | Host — fonts, `app.css`, type overrides (Unbounded + Playfair), script order |
| `app.css` | The real production stylesheet (copied verbatim from `src/styles.css`) |
| `app.jsx` | Root state machine (auth → onboarding → dashboard) + seeded demo user |
| `Primitives.jsx` | `Icon` (lucide wrapper) + `ThemeToggle` |
| `Topbar.jsx`, `AuthScreen.jsx`, `OnboardingScreen.jsx`, `ProfileFields.jsx`, `TaskCard.jsx`, `Dashboard.jsx` | Surfaces & components |
| `spotlight.js` | Cursor-follow glow effect |

## Faithfulness notes
- Components are **cosmetic recreations** — real layout, classes, copy, and interactions, but the data layer (API, auth, carryover) is faked with `setTimeout` + seeded state.
- The decorative **MagicBento** showcase from the original dashboard is intentionally omitted (third-party demo, not core product).
- Headlines use **Unbounded** and editorial copy uses **Playfair Display** per the updated type direction; the original shipped Inter throughout.
