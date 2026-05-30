import { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '132, 0, 255';
const MOBILE_BREAKPOINT = 768;

// Keep the bento glow in sync with the design system: read the shared
// `--glow-rgb` token (set in styles.css / colors_and_type.css) so the showcase
// glows with the exact same color as every other `.glow-card` in the app.
const resolveGlowColor = explicit => {
  if (explicit) return explicit;
  if (typeof window !== 'undefined') {
    const token = getComputedStyle(document.documentElement).getPropertyValue('--glow-rgb').trim();
    if (token) return token;
  }
  return DEFAULT_GLOW_COLOR;
};

// On-brand showcase content - 9to5Wrapped features, sentence case, no emoji.
// The 3rd card spans 2×2 (the hero), so it gets the marquee feature.
const cardData = [
  {
    accent: 'var(--pink)',
    title: 'AI reports',
    description: 'Turn raw task rows into a polished daily report.',
    label: '9to5Wrapped'
  },
  {
    accent: 'var(--teal)',
    title: 'Role-aware',
    description: 'Matched to your role, seniority, and tools.',
    label: 'Context'
  },
  {
    accent: 'var(--purple)',
    title: 'Task report studio',
    description: 'Log time, status, priority, and outcomes in one calm workspace.',
    label: 'Workspace'
  },
  {
    accent: 'var(--yellow)',
    title: 'Carry over',
    description: 'Roll unfinished work into tomorrow in one click.',
    label: 'Momentum'
  },
  {
    accent: 'var(--lime)',
    title: 'Excel export',
    description: 'Send a clean CSV to your spreadsheet instantly.',
    label: 'Export'
  },
  {
    accent: 'var(--teal)',
    title: 'Daily score',
    description: 'See how much you finished at a glance.',
    label: 'Insight'
  }
];

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const calculateSpotlightValues = radius => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

const ParticleCard = ({
  children,
  className = '',
  disableAnimations = false,
  style,
  onClick,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  clickEffect = false,
  enableMagnetism = false
}) => {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef(null);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;

    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();

    particlesRef.current.forEach(particle => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        }
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const clone = particle.cloneNode(true);
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true
        });

        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true
        });
      }, index * 100);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;

    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 5,
          rotateY: 5,
          duration: 0.3,
          ease: 'power2.out',
          transformPerspective: 1000
        });
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }

      if (enableMagnetism) {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleMouseMove = e => {
      if (!enableTilt && !enableMagnetism) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: 'power2.out',
          transformPerspective: 1000
        });
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.05;
        const magnetY = (y - centerY) * 0.05;

        magnetismAnimationRef.current = gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleClick = e => {
      if (!clickEffect) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `;

      element.appendChild(ripple);

      gsap.fromTo(
        ripple,
        {
          scale: 0,
          opacity: 1
        },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        }
      );
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor]);

  return (
    <div
      ref={cardRef}
      className={`${className} particle-container`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(event);
        }
      }}
      style={{ ...style, position: 'relative', overflow: 'hidden' }}
    >
      {children}
    </div>
  );
};

const GlobalSpotlight = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR
}) => {
  const spotlightRef = useRef(null);
  const isInsideSection = useRef(false);

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = e => {
      if (!spotlightRef.current || !gridRef.current) return;

      const section = gridRef.current.closest('.bento-section');
      const rect = section?.getBoundingClientRect();
      const mouseInside =
        rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      isInsideSection.current = mouseInside || false;
      const cards = gridRef.current.querySelectorAll('.card');

      if (!mouseInside) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
        cards.forEach(card => {
          card.style.setProperty('--glow-intensity', '0');
        });
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      cards.forEach(card => {
        const cardElement = card;
        const cardRect = cardElement.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance =
          Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });

      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
        ease: 'power2.out'
      });

      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0;

      gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      isInsideSection.current = false;
      gridRef.current?.querySelectorAll('.card').forEach(card => {
        card.style.setProperty('--glow-intensity', '0');
      });
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

const BentoCardGrid = ({ children, gridRef }) => (
  <div
    className="bento-section"
    style={{ fontSize: 'clamp(1rem, 0.9rem + 0.5vw, 1.5rem)' }}
    ref={gridRef}
  >
    {children}
  </div>
);

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

const MagicBento = ({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = null,
  clickEffect = true,
  enableMagnetism = true,
  cards = cardData,
  onCardSelect
}) => {
  const gridRef = useRef(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;
  // Brand glow — explicit prop wins, otherwise pull the live design token.
  const glow = resolveGlowColor(glowColor);

  return (
    <>
      <style>
        {`
          .bento-section,
          .bento-section *,
          .bento-section *::before,
          .bento-section *::after {
            box-sizing: border-box;
          }

          .bento-section {
            --glow-x: 50%;
            --glow-y: 50%;
            --glow-intensity: 0;
            --glow-radius: 200px;
            --glow-color: ${glow};
            display: grid;
            gap: 0.75rem;
            padding: 0;
            width: 100%;
            max-width: 100%;
            margin: 0;
            position: relative;
            user-select: none;
          }

          .card-responsive {
            display: grid;
            gap: 0.75rem;
            grid-template-columns: 1fr;
            width: 100%;
            margin: 0 auto;
          }

          .bento-section .card {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            min-height: 200px;
            height: 100%;
            min-width: 0;
            width: 100%;
            max-width: 100%;
            padding: 1.25rem;
            border-radius: var(--r-lg, 14px);
            border: 1px solid var(--border);
            background: var(--surface-glass);
            -webkit-backdrop-filter: blur(16px) saturate(140%);
            backdrop-filter: blur(16px) saturate(140%);
            color: var(--text);
            font-weight: 400;
            box-shadow: var(--shadow-sm);
            overflow: hidden;
            transition: transform var(--t-base, 220ms), box-shadow var(--t-base, 220ms), border-color var(--t-base, 220ms);
          }

          .bento-section .card:hover {
            transform: translateY(-2px);
            border-color: var(--border-hover);
            box-shadow: var(--shadow-lg);
          }

          .bento-section .card-clickable {
            cursor: pointer;
            outline: none;
          }

          .bento-section .card-clickable:focus-visible {
            border-color: var(--focus-border, var(--card-accent));
            box-shadow: 0 0 0 3px var(--focus-ring, rgba(var(--glow-color), 0.18)), var(--shadow-lg);
          }

          [data-theme="dark"] .bento-section .card:hover {
            box-shadow: var(--shadow-lg), 0 0 28px rgba(var(--glow-color), 0.22);
          }

          .bento-section .card__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75rem;
            position: relative;
          }

          .bento-section .card__label {
            font-family: var(--font-sans);
            font-size: 0.72rem;
            font-weight: 850;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            color: var(--card-accent, var(--accent));
          }

          .bento-section .card__content {
            display: flex;
            flex-direction: column;
            position: relative;
          }

          .bento-section .card__title {
            font-family: var(--font-display);
            font-weight: 700;
            letter-spacing: -0.01em;
            font-size: 1.12rem;
            margin: 0 0 0.35rem;
            color: var(--text);
          }

          .bento-section .card__description {
            font-family: var(--font-serif);
            font-size: 0.92rem;
            line-height: 1.5;
            color: var(--text-2);
          }

          .bento-section .card__action {
            display: inline-flex;
            align-items: center;
            width: fit-content;
            margin-top: 0.9rem;
            color: var(--card-accent, var(--accent));
            font-family: var(--font-sans);
            font-size: 0.78rem;
            font-weight: 850;
          }

          @media (min-width: 600px) {
            .card-responsive {
              grid-template-columns: repeat(2, 1fr);
              grid-auto-rows: 200px;
            }
          }

          @media (min-width: 1024px) {
            .card-responsive {
              grid-template-columns: repeat(4, 1fr);
              grid-auto-rows: 200px;
            }

            .card-responsive .card:nth-child(3) {
              grid-column: span 2;
              grid-row: span 2;
            }

            .card-responsive .card:nth-child(4) {
              grid-column: 1 / span 2;
              grid-row: 2 / span 2;
            }

            .card-responsive .card:nth-child(6) {
              grid-column: 4;
              grid-row: 3;
            }
          }

          .card--border-glow::after {
            content: '';
            position: absolute;
            inset: 0;
            padding: 2px;
            background: radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y),
                rgba(var(--glow-color), calc(var(--glow-intensity) * 0.8)) 0%,
                rgba(var(--glow-color), calc(var(--glow-intensity) * 0.35)) 30%,
                transparent 60%);
            border-radius: inherit;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude;
            pointer-events: none;
            opacity: 1;
            transition: opacity 0.3s ease;
            z-index: 3;
          }

          .particle::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: rgba(var(--glow-color), 0.2);
            border-radius: 50%;
            z-index: -1;
          }

          .text-clamp-1 {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            line-clamp: 1;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .text-clamp-2 {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          @media (max-width: 599px) {
            .card-responsive {
              grid-template-columns: 1fr;
              width: 100%;
              margin: 0 auto;
            }

            .card-responsive .card {
              width: 100%;
              min-height: 180px;
            }
          }
        `}
      </style>

      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glow}
        />
      )}

      <BentoCardGrid gridRef={gridRef}>
        <div className="card-responsive">
          {cards.map((card, index) => {
            const clickable = typeof onCardSelect === 'function';
            const baseClassName = `card${enableBorderGlow ? ' card--border-glow' : ''}${clickable ? ' card-clickable' : ''}`;

            const cardStyle = {
              '--card-accent': card.accent,
              '--glow-x': '50%',
              '--glow-y': '50%',
              '--glow-intensity': '0',
              '--glow-radius': '200px'
            };

            if (enableStars) {
              return (
                <ParticleCard
                  key={index}
                  className={baseClassName}
                  style={cardStyle}
                  disableAnimations={shouldDisableAnimations}
                  particleCount={particleCount}
                  glowColor={glow}
                  enableTilt={enableTilt}
                  clickEffect={clickEffect}
                  enableMagnetism={enableMagnetism}
                  onClick={clickable ? () => onCardSelect(card) : undefined}
                >
                  <div className="card__header">
                    <span className="card__label">{card.label}</span>
                  </div>
                  <div className="card__content">
                    <h3 className={`card__title ${textAutoHide ? 'text-clamp-1' : ''}`}>
                      {card.title}
                    </h3>
                    <p className={`card__description ${textAutoHide ? 'text-clamp-2' : ''}`}>
                      {card.description}
                    </p>
                    {clickable && <span className="card__action">Open module</span>}
                  </div>
                </ParticleCard>
              );
            }

            return (
              <div
                key={index}
                className={baseClassName}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => onCardSelect(card) : undefined}
                onKeyDown={(event) => {
                  if (!clickable) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onCardSelect(card);
                  }
                }}
                style={cardStyle}
                ref={el => {
                  if (!el) return;

                  const handleMouseMove = e => {
                    if (shouldDisableAnimations) return;

                    const rect = el.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;

                    if (enableTilt) {
                      const rotateX = ((y - centerY) / centerY) * -10;
                      const rotateY = ((x - centerX) / centerX) * 10;

                      gsap.to(el, {
                        rotateX,
                        rotateY,
                        duration: 0.1,
                        ease: 'power2.out',
                        transformPerspective: 1000
                      });
                    }

                    if (enableMagnetism) {
                      const magnetX = (x - centerX) * 0.05;
                      const magnetY = (y - centerY) * 0.05;

                      gsap.to(el, {
                        x: magnetX,
                        y: magnetY,
                        duration: 0.3,
                        ease: 'power2.out'
                      });
                    }
                  };

                  const handleMouseLeave = () => {
                    if (shouldDisableAnimations) return;

                    if (enableTilt) {
                      gsap.to(el, {
                        rotateX: 0,
                        rotateY: 0,
                        duration: 0.3,
                        ease: 'power2.out'
                      });
                    }

                    if (enableMagnetism) {
                      gsap.to(el, {
                        x: 0,
                        y: 0,
                        duration: 0.3,
                        ease: 'power2.out'
                      });
                    }
                  };

                  const handleClick = e => {
                    if (!clickEffect || shouldDisableAnimations) return;

                    const rect = el.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    const maxDistance = Math.max(
                      Math.hypot(x, y),
                      Math.hypot(x - rect.width, y),
                      Math.hypot(x, y - rect.height),
                      Math.hypot(x - rect.width, y - rect.height)
                    );

                    const ripple = document.createElement('div');
                    ripple.style.cssText = `
                      position: absolute;
                      width: ${maxDistance * 2}px;
                      height: ${maxDistance * 2}px;
                      border-radius: 50%;
                      background: radial-gradient(circle, rgba(${glow}, 0.4) 0%, rgba(${glow}, 0.2) 30%, transparent 70%);
                      left: ${x - maxDistance}px;
                      top: ${y - maxDistance}px;
                      pointer-events: none;
                      z-index: 1000;
                    `;

                    el.appendChild(ripple);

                    gsap.fromTo(
                      ripple,
                      {
                        scale: 0,
                        opacity: 1
                      },
                      {
                        scale: 1,
                        opacity: 0,
                        duration: 0.8,
                        ease: 'power2.out',
                        onComplete: () => ripple.remove()
                      }
                    );
                  };

                  el.addEventListener('mousemove', handleMouseMove);
                  el.addEventListener('mouseleave', handleMouseLeave);
                  el.addEventListener('click', handleClick);
                }}
              >
                <div className="card__header">
                  <span className="card__label">{card.label}</span>
                </div>
                <div className="card__content">
                  <h3 className={`card__title ${textAutoHide ? 'text-clamp-1' : ''}`}>
                    {card.title}
                  </h3>
                  <p className={`card__description ${textAutoHide ? 'text-clamp-2' : ''}`}>
                    {card.description}
                  </p>
                  {clickable && <span className="card__action">Open module</span>}
                </div>
              </div>
            );
          })}
        </div>
      </BentoCardGrid>
    </>
  );
};

export default MagicBento;
