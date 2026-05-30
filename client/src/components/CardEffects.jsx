import { useEffect } from 'react';
import { gsap } from 'gsap';

const DEFAULT_GLOW_COLOR = '132, 0, 255';
const DEFAULT_SPOTLIGHT_RADIUS = 320;
const MOBILE_BREAKPOINT = 768;

const CARD_SELECTOR = '.glow-card';
const FIELD_SELECTOR = 'input, select, textarea';
// These big panels never tilt — wobble + scrollbar risk, and they're not "cards".
const NO_TILT_SELECTOR = '.auth-panel, .onboarding-panel, .report-modal';
// The two dashboard panels get a gentle tilt (no magnetism / particles) so the
// whole surface leans with the cursor without shoving the layout.
const SOFT_TILT_SELECTOR = '.workspace, .result-panel';
const CARD_TILT = 8; // max tilt (deg) for small cards
const PANEL_TILT = 5; // softer tilt (deg) for the big dashboard panels
const FIELD_TILT = 4; // gentler tilt (deg) for inputs
const MAGNET = 0.05; // magnetism factor for cards
const MAGNET_MAX = 10; // px cap so wide cards don't shove the layout
const PARTICLE_COUNT = 6;

/**
 * App-wide cursor effects. Mount once near the root.
 *
 * Generalises the MagicBento interaction so it applies to every real card and
 * field in the app — no per-component wiring:
 *   • a soft radial spotlight follows the cursor,
 *   • each `.glow-card` lights its border edge (drives `.glow-card::after`),
 *   • the card / field under the pointer tilts in 3D with light magnetism,
 *   • cards emit a few drifting glow particles while hovered.
 *
 * Honours `prefers-reduced-motion` and disables on touch. Glow colour is read
 * from the shared `--glow-rgb` design token so it stays in sync with the theme.
 */
export function GlobalSpotlight({
  glowColor = DEFAULT_GLOW_COLOR,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  disabled = false
}) {
  useEffect(() => {
    if (disabled) return undefined;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch =
      typeof window !== 'undefined' &&
      (window.innerWidth <= MOBILE_BREAKPOINT ||
        (window.matchMedia && window.matchMedia('(hover: none)').matches));

    if (prefersReduced || isTouch) return undefined;

    // Resolve the live glow token so particles match the active theme.
    const resolveGlow = () => {
      const token = getComputedStyle(document.documentElement).getPropertyValue('--glow-rgb').trim();
      return token || glowColor;
    };

    // ── cursor spotlight ─────────────────────────────────────────
    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.12) 0%,
        rgba(${glowColor}, 0.06) 15%,
        rgba(${glowColor}, 0.03) 25%,
        rgba(${glowColor}, 0.015) 40%,
        rgba(${glowColor}, 0.008) 65%,
        transparent 70%
      );
      z-index: 5;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
      left: 0;
      top: 0;
    `;
    document.body.appendChild(spotlight);

    const proximity = spotlightRadius * 0.5;
    const fadeDistance = spotlightRadius * 0.75;

    // ── tilt / particle state ────────────────────────────────────
    let activeTarget = null;
    let activeIsCard = false;
    const particleMap = new WeakMap();

    const isField = el => Boolean(el && el.matches && el.matches(FIELD_SELECTOR));

    const applyTilt = (el, e, maxTilt, magnet) => {
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const clamp = v => Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, v));
      gsap.to(el, {
        rotateX: ((py - cy) / cy) * -maxTilt,
        rotateY: ((px - cx) / cx) * maxTilt,
        x: magnet ? clamp((px - cx) * MAGNET) : 0,
        y: magnet ? clamp((py - cy) * MAGNET) : 0,
        duration: 0.18,
        ease: 'power2.out',
        transformPerspective: 900,
        transformOrigin: 'center center',
        overwrite: true
      });
    };

    const resetTilt = el => {
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true,
        // Hand control back to CSS (hover lift + transitions) once we settle flat.
        onComplete: () => {
          el.style.transition = '';
          if (!particleMap.has(el)) gsap.set(el, { clearProps: 'transform' });
        }
      });
    };

    const spawnParticles = card => {
      if (particleMap.has(card)) return;
      const glow = resolveGlow();
      const rect = card.getBoundingClientRect();
      const list = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = document.createElement('div');
        p.className = 'glow-particle';
        const left = 12 + Math.random() * Math.max(1, rect.width - 24);
        const top = 12 + Math.random() * Math.max(1, rect.height - 24);
        p.style.cssText = `position:absolute;left:${left}px;top:${top}px;width:4px;height:4px;border-radius:50%;background:rgba(${glow},1);box-shadow:0 0 6px rgba(${glow},0.6);pointer-events:none;z-index:2;`;
        card.appendChild(p);
        list.push(p);
        gsap.fromTo(p, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
        gsap.to(p, {
          x: (Math.random() - 0.5) * 18,
          y: (Math.random() - 0.5) * 18,
          duration: 2 + Math.random() * 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
        gsap.to(p, { opacity: 0.3, duration: 1.5, repeat: -1, yoyo: true, ease: 'power2.inOut' });
      }
      particleMap.set(card, list);
    };

    const clearParticles = card => {
      const list = particleMap.get(card);
      if (!list) return;
      particleMap.delete(card);
      list.forEach(p =>
        gsap.to(p, {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          ease: 'back.in(1.7)',
          onComplete: () => p.remove()
        })
      );
    };

    const setActive = (target, isCard) => {
      if (target === activeTarget) return;
      if (activeTarget) {
        if (activeIsCard) clearParticles(activeTarget);
        resetTilt(activeTarget);
      }
      activeTarget = target;
      activeIsCard = isCard;
      if (target) {
        // Let gsap own the transform; CSS must not also ease it (would lag).
        target.style.transition = 'none';
        if (isCard) spawnParticles(target);
      }
    };

    const handleMouseMove = e => {
      // 1) border glow for every card on the page
      const cards = document.querySelectorAll(CARD_SELECTOR);
      if (cards.length) {
        let minDistance = Infinity;
        cards.forEach(card => {
          const rect = card.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const distance =
            Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(rect.width, rect.height) / 2;
          const eff = Math.max(0, distance);
          minDistance = Math.min(minDistance, eff);

          let gi = 0;
          if (eff <= proximity) gi = 1;
          else if (eff <= fadeDistance) gi = (fadeDistance - eff) / (fadeDistance - proximity);

          card.style.setProperty('--glow-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
          card.style.setProperty('--glow-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
          card.style.setProperty('--glow-intensity', gi.toString());
          card.style.setProperty('--glow-radius', `${spotlightRadius}px`);
        });

        gsap.to(spotlight, { left: e.clientX, top: e.clientY, duration: 0.1, ease: 'power2.out' });

        const targetOpacity =
          minDistance <= proximity
            ? 0.8
            : minDistance <= fadeDistance
              ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
              : 0;
        gsap.to(spotlight, { opacity: targetOpacity, duration: targetOpacity > 0 ? 0.2 : 0.5, ease: 'power2.out' });
      }

      // 2) tilt — prefer the field under the cursor, else its card. Keep a
      //    panel flat while one of its own fields is focused (comfortable typing).
      const field = e.target.closest ? e.target.closest(FIELD_SELECTOR) : null;
      const card = e.target.closest ? e.target.closest(CARD_SELECTOR) : null;
      const focusedField = isField(document.activeElement) ? document.activeElement : null;

      if (field && field !== focusedField) {
        setActive(field, false);
        applyTilt(field, e, FIELD_TILT, false);
      } else if (
        card &&
        !card.matches(NO_TILT_SELECTOR) &&
        !(focusedField && card.contains(focusedField))
      ) {
        const soft = card.matches(SOFT_TILT_SELECTOR);
        // soft panels: tilt only (no particles, no magnetism); small cards: full effect
        setActive(card, !soft);
        applyTilt(card, e, soft ? PANEL_TILT : CARD_TILT, !soft);
      } else {
        setActive(null, false);
      }
    };

    const handleMouseLeave = () => {
      document.querySelectorAll(CARD_SELECTOR).forEach(card => {
        card.style.setProperty('--glow-intensity', '0');
      });
      gsap.to(spotlight, { opacity: 0, duration: 0.3, ease: 'power2.out' });
      setActive(null, false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (activeTarget) {
        clearParticles(activeTarget);
        activeTarget.style.transition = '';
        gsap.set(activeTarget, { clearProps: 'transform' });
      }
      spotlight.parentNode?.removeChild(spotlight);
    };
  }, [glowColor, spotlightRadius, disabled]);

  return null;
}

export default GlobalSpotlight;
