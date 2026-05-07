import { useState, useEffect, useRef } from 'react';

/* ─── SCROLL UNLOCK ─────────────────────────────────────── */
function useScrollUnlock() {
  useEffect(() => {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);
}

/* ─── INTERSECTION REVEAL ───────────────────────────────── */
function useReveal(threshold = 0.08) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, y = 32 }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : `translateY(${y}px) scale(0.995)`,
      filter: visible ? 'blur(0px)' : 'blur(4px)',
      transition: `opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      willChange: 'transform, opacity',
    }}>{children}</div>
  );
}

/* ─── LOGO ──────────────────────────────────────────────── */
function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="oklch(52% 0.2 260)" />
      <line x1="10" y1="6" x2="10" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      <path d="M10 11 C10 11 10 8 18 8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="10" cy="19" r="2.4" fill="white" />
      <circle cx="10" cy="11" r="2.4" fill="white" />
      <circle cx="18" cy="8" r="2.4" fill="white" opacity="0.65" />
    </svg>
  );
}

/* ─── ANIMATED COMMIT TICKER ────────────────────────────── */
const COMMITS = [
  { branch: 'career/senior-eng', msg: 'Accepted offer at Meridian Labs', cat: 'Career', catColor: '260', forks: 31, merges: 18 },
  { branch: 'life/moved-to-lisbon', msg: 'Relocated to Portugal after 3 years of planning', cat: 'Life', catColor: '155', forks: 54, merges: 72 },
  { branch: 'health/marathon-done', msg: 'Finished first marathon — 4h 12m', cat: 'Health', catColor: '30', forks: 8, merges: 44 },
  { branch: 'finance/bought-index', msg: 'Started monthly index fund contributions', cat: 'Finance', catColor: '55', forks: 27, merges: 61 },
  { branch: 'career/quit-corp', msg: 'Left stable job to build something of my own', cat: 'Career', catColor: '260', forks: 139, merges: 88 },
  { branch: 'life/adopted-dog', msg: 'Welcomed Mochi into the family', cat: 'Life', catColor: '155', forks: 22, merges: 17 },
];

function CommitTicker() {
  const [offset, setOffset] = useState(0);
  const raf = useRef(null);
  const speed = 0.35;
  const cardW = 292;
  const gap = 14;
  const total = COMMITS.length * (cardW + gap);

  useEffect(() => {
    let prev = performance.now();
    const tick = (now) => {
      const dt = now - prev;
      prev = now;
      setOffset(o => {
        const next = o + speed * dt / 16;
        return next >= total ? next - total : next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [total]);

  const doubled = [...COMMITS, ...COMMITS];

  return (
    <div className="gl-ticker" style={{ width: '100%', overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
      <div className="gl-ticker-inner" style={{ display: 'flex', gap: gap, transform: `translateX(-${offset}px)`, willChange: 'transform' }}>
        {doubled.map((c, i) => (
          <CommitCard key={i} commit={c} />
        ))}
      </div>
    </div>
  );
}

function CommitCard({ commit: c }) {
  const catBg = `oklch(93% 0.055 ${c.catColor})`;
  const catFg = `oklch(36% 0.18 ${c.catColor})`;
  return (
    <div style={{
      flexShrink: 0,
      width: 278,
      background: 'oklch(96% 0.008 260)',
      border: '1px solid oklch(91% 0.008 260)',
      borderRadius: 20,
      padding: '5px',
      boxShadow: '0 4px 24px oklch(52% 0.2 260 / 0.06)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 'calc(20px - 5px)',
        padding: '14px 16px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="oklch(60% 0.01 260)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5" cy="3.5" r="1.5" /><circle cx="5" cy="12.5" r="1.5" /><circle cx="11" cy="6.5" r="1.5" />
            <line x1="5" y1="5" x2="5" y2="11" /><path d="M5 5 C5 5 5 3.5 11 5" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'oklch(58% 0.01 260)', fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{c.branch}</span>
          <div style={{ marginLeft: 'auto', flexShrink: 0, background: catBg, color: catFg, fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '2px 7px', letterSpacing: '0.04em' }}>{c.cat}</div>
        </div>
        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'oklch(18% 0.015 260)', lineHeight: 1.45, margin: '0 0 12px', minHeight: 36 }}>{c.msg}</p>
        <div style={{ display: 'flex', gap: 7 }}>
          {[['⎇', c.forks], ['↩', c.merges]].map(([icon, n]) => (
            <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'oklch(96.5% 0.005 260)', borderRadius: 20, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: 'oklch(52% 0.01 260)' }}>
              <span style={{ fontSize: 12 }}>{icon}</span>{n}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── FEATURE ZIGZAG ROW ────────────────────────────────── */
function FeatureRow({ icon, title, body, visual, reverse = false, delay = 0 }) {
  return (
    <Reveal delay={delay}>
      <div className="gl-feature-row" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'clamp(32px, 5vw, 96px)',
        alignItems: 'center',
        padding: 'clamp(48px, 6vw, 88px) 0',
        borderTop: '1px solid oklch(93% 0.006 80)',
      }}>
        {/* Text side */}
        <div className="gl-feature-text" style={{ order: reverse ? 2 : 1 }}>
          {/* Icon — double-bezel, responsive via class */}
          <div className="gl-feature-icon" style={{
            width: 54, height: 54,
            background: 'oklch(93% 0.04 260)',
            border: '1px solid oklch(87% 0.07 260)',
            borderRadius: 16,
            padding: '4px',
            marginBottom: 22,
            boxShadow: '0 4px 20px oklch(52% 0.2 260 / 0.1)',
            display: 'inline-flex',
          }}>
            <div className="gl-feature-icon-inner" style={{
              flex: 1, borderRadius: 13,
              background: 'oklch(95% 0.05 260)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
            }}>{icon}</div>
          </div>
          <h3 style={{ fontSize: 'clamp(18px, 2.2vw, 28px)', fontWeight: 800, color: 'oklch(10% 0.015 260)', margin: '0 0 14px', letterSpacing: '-0.025em', lineHeight: 1.15 }}>{title}</h3>
          <p style={{ fontSize: 'clamp(14px, 1.4vw, 16px)', color: 'oklch(48% 0.01 260)', lineHeight: 1.8, margin: 0, maxWidth: '50ch' }}>{body}</p>
        </div>
        {/* Visual side — double-bezel panel */}
        <div className="gl-feature-visual" style={{ order: reverse ? 1 : 2 }}>
          <div style={{
            background: 'oklch(94% 0.012 260)',
            border: '1px solid oklch(89% 0.01 260)',
            borderRadius: '1.75rem',
            padding: '7px',
            boxShadow: '0 16px 56px oklch(52% 0.2 260 / 0.07), 0 2px 8px oklch(20% 0.015 260 / 0.04)',
          }}>
            <div style={{
              background: 'white',
              borderRadius: 'calc(1.75rem - 7px)',
              padding: 'clamp(18px, 2.5vw, 28px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,1)',
            }}>
              {visual}
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ─── PLATFORM CARD ─────────────────────────────────────── */
function PlatformCard({ icon, label, badge, badgeColor, steps, cta, ctaAction }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'oklch(93% 0.014 260)' : 'oklch(95% 0.01 260)',
        border: `1px solid ${hov ? 'oklch(84% 0.1 260)' : 'oklch(90% 0.008 260)'}`,
        borderRadius: '1.75rem',
        padding: '6px',
        transition: 'background 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.4s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: hov
          ? '0 20px 60px oklch(52% 0.2 260 / 0.1), 0 4px 16px oklch(20% 0.01 260 / 0.06)'
          : '0 4px 20px oklch(20% 0.01 260 / 0.04)',
        height: '100%',
      }}
    >
      <div style={{
        background: 'white',
        borderRadius: 'calc(1.75rem - 6px)',
        padding: 'clamp(20px, 2.5vw, 30px)',
        display: 'flex', flexDirection: 'column', gap: 18,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,1)',
        height: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div className="gl-platform-icon" style={{
            width: 50, height: 50,
            background: 'oklch(94% 0.04 260)',
            border: '1px solid oklch(88% 0.07 260)',
            borderRadius: 14, padding: '4px',
            boxShadow: '0 2px 10px oklch(52% 0.2 260 / 0.08)',
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: 11,
              background: 'oklch(96% 0.05 260)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
            }}>{icon}</div>
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: badgeColor[0], color: badgeColor[1], padding: '4px 11px', borderRadius: 20 }}>{badge}</div>
        </div>
        <div>
          <h3 style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', fontWeight: 800, color: 'oklch(12% 0.015 260)', margin: '0 0 12px', letterSpacing: '-0.02em' }}>{label}</h3>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.map((s, i) => <li key={i} style={{ fontSize: 'clamp(12px, 1.1vw, 14px)', color: 'oklch(48% 0.01 260)', lineHeight: 1.65 }}>{s}</li>)}
          </ol>
        </div>
        {ctaAction && (
          <button
            onClick={ctaAction}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'oklch(52% 0.2 260)', color: 'white',
              border: 'none', borderRadius: 999, padding: '12px 22px',
              fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1)',
              transform: hov ? 'scale(1.04)' : 'scale(1)',
              boxShadow: hov ? '0 8px 28px oklch(52% 0.2 260 / 0.44)' : '0 3px 12px oklch(52% 0.2 260 / 0.25)',
              marginTop: 'auto',
            }}
          >
            {cta}
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
              transform: hov ? 'translateX(3px) translateY(-1px)' : 'translateX(0)',
            }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 5.5h8M6 2l4 3.5L6 9" /></svg>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ────────────────────────────────────── */
export default function LandingPage({ onGetStarted }) {
  useScrollUnlock();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 60);
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener('scroll', onScroll); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [menuOpen]);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Get the App', href: '#get-the-app' },
  ];

  const ease = 'cubic-bezier(0.16,1,0.3,1)';

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#f9fafb', minHeight: '100dvh', overflowX: 'hidden', color: 'oklch(14% 0.015 260)' }}>

      {/* ── FLOATING NAV ── */}
      <header style={{ position: 'fixed', inset: '0 0 auto', zIndex: 90, display: 'flex', justifyContent: 'center', padding: '16px 20px 0', pointerEvents: 'none' }}>
        <nav className="gl-nav" style={{
          pointerEvents: 'auto',
          display: 'flex', alignItems: 'center',
          background: scrolled ? 'rgba(249,250,251,0.94)' : 'rgba(249,250,251,0.78)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid oklch(91% 0.008 260)',
          borderRadius: 999,
          padding: '6px 6px 6px 20px',
          boxShadow: scrolled
            ? '0 4px 32px oklch(52% 0.2 260 / 0.08), inset 0 1px 0 rgba(255,255,255,0.8)'
            : '0 1px 14px oklch(20% 0.04 260 / 0.05), inset 0 1px 0 rgba(255,255,255,0.6)',
          transition: `box-shadow 0.4s ${ease}, background 0.4s ${ease}`,
          maxWidth: 660, width: '100%', gap: 2,
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
            <Logo size={26} />
            <span style={{ fontSize: 14.5, fontWeight: 800, color: 'oklch(14% 0.015 260)', letterSpacing: '-0.025em' }}>GitLife</span>
          </div>

          {/* Links (desktop) */}
          <div className="gl-desktop-links">
            {navLinks.map(({ label, href }) => (
              <a key={label} href={href} style={{ fontSize: 13, fontWeight: 600, color: 'oklch(42% 0.01 260)', padding: '6px 13px', borderRadius: 999, textDecoration: 'none', transition: `color 0.2s ${ease}, background 0.2s ${ease}` }}
                onMouseEnter={e => { e.currentTarget.style.background = 'oklch(93% 0.008 260)'; e.currentTarget.style.color = 'oklch(20% 0.015 260)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'oklch(42% 0.01 260)'; }}
              >{label}</a>
            ))}
          </div>

          {/* CTA (desktop) — button-in-button */}
          <button className="gl-desktop-cta" onClick={onGetStarted} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'oklch(52% 0.2 260)', color: 'white',
            border: 'none', borderRadius: 999, padding: '9px 9px 9px 17px',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', marginLeft: 6,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: '0 2px 14px oklch(52% 0.2 260 / 0.3)',
            transition: `transform 0.3s ${ease}, box-shadow 0.3s ${ease}`,
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 24px oklch(52% 0.2 260 / 0.48)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 14px oklch(52% 0.2 260 / 0.3)'; }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          >
            Get Started
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 5h7M5.5 2l3 3-3 3" /></svg>
            </div>
          </button>

          {/* Hamburger (mobile) */}
          <button className="gl-hamburger" onClick={() => setMenuOpen(p => !p)} aria-label="Open menu" style={{
            display: 'none', background: 'none', border: 'none', cursor: 'pointer',
            width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
            marginLeft: 6, flexShrink: 0, position: 'relative',
          }}>
            {[['calc(50% - 4px)', menuOpen ? '50%' : undefined, menuOpen ? 45 : 0],
              ['calc(50% + 4px)', menuOpen ? '50%' : undefined, menuOpen ? -45 : 0]].map(([top, override, rot], i) => (
              <span key={i} style={{
                display: 'block', position: 'absolute',
                width: 17, height: 1.5, background: 'oklch(28% 0.01 260)', borderRadius: 2,
                top: override || top,
                transform: `rotate(${rot}deg)`,
                transition: `all 0.32s ${ease}`,
              }} />
            ))}
          </button>
        </nav>
      </header>

      {/* ── MOBILE MENU ── */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 80,
          background: 'rgba(249,250,251,0.94)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          {navLinks.map(({ label, href }, i) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)} style={{
              fontSize: 28, fontWeight: 800, color: 'oklch(14% 0.015 260)',
              textDecoration: 'none', letterSpacing: '-0.03em',
              opacity: 0, animation: `glMenuIn 0.5s ${ease} ${60 + i * 60}ms forwards`,
            }}>{label}</a>
          ))}
          <button onClick={onGetStarted} style={{
            marginTop: 24, background: 'oklch(52% 0.2 260)', color: 'white',
            border: 'none', borderRadius: 999, padding: '14px 36px',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            opacity: 0, animation: `glMenuIn 0.5s ${ease} 240ms forwards`,
            boxShadow: '0 6px 28px oklch(52% 0.2 260 / 0.38)',
          }}>Get Started Free</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          HERO
         ══════════════════════════════════════════════════════ */}
      <section className="gl-hero-section" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 100, paddingBottom: 72, position: 'relative', overflow: 'hidden' }}>

        <div className="gl-orb" style={{ position: 'absolute', top: '10%', right: '-6%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, oklch(80% 0.12 260 / 0.16) 0%, transparent 65%)', filter: 'blur(72px)', pointerEvents: 'none' }} />
        <div className="gl-orb" style={{ position: 'absolute', bottom: '-4%', left: '2%', width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, oklch(80% 0.1 155 / 0.1) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div className="gl-container" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px, 4vw, 56px)', width: '100%' }}>
          <div className="gl-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(40px, 6vw, 96px)', alignItems: 'center' }}>

            {/* LEFT — text */}
            <div>
              <h1 style={{
                fontSize: 'clamp(34px, 5.5vw, 82px)',
                fontWeight: 900, lineHeight: 1.04, letterSpacing: '-0.033em',
                color: 'oklch(10% 0.015 260)', margin: '0 0 22px',
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? 'translateY(0)' : 'translateY(22px)',
                filter: heroVisible ? 'blur(0)' : 'blur(6px)',
                transition: `all 0.8s ${ease} 70ms`,
              }}>
                Your life,<br />
                <span style={{ position: 'relative', display: 'inline-block', color: 'oklch(52% 0.2 260)' }}>
                  version&nbsp;controlled
                  <svg style={{ position: 'absolute', bottom: -7, left: 0, width: '100%', opacity: 0.3 }} viewBox="0 0 320 10" fill="none" preserveAspectRatio="none">
                    <path d="M2 8 Q80 2 160 7 Q240 12 318 4" stroke="oklch(52% 0.2 260)" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p style={{
                fontSize: 'clamp(14px, 1.6vw, 18px)', color: 'oklch(46% 0.01 260)',
                lineHeight: 1.8, maxWidth: '46ch', margin: '0 0 38px',
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? 'translateY(0)' : 'translateY(16px)',
                filter: heroVisible ? 'blur(0)' : 'blur(4px)',
                transition: `all 0.78s ${ease} 150ms`,
              }}>
                Commit your decisions. Branch your paths. Fork what inspires you. GitLife turns your personal journey into a living, social git repository.
              </p>

              {/* CTAs */}
              <div className="gl-cta-group" style={{
                display: 'flex', flexWrap: 'wrap', gap: 10,
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? 'translateY(0)' : 'translateY(14px)',
                transition: `all 0.78s ${ease} 220ms`,
              }}>
                <button onClick={onGetStarted} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'oklch(52% 0.2 260)', color: 'white',
                  border: 'none', borderRadius: 999, padding: '14px 14px 14px 26px',
                  fontSize: 'clamp(13px, 1.2vw, 15px)', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: '0 4px 24px oklch(52% 0.2 260 / 0.4)',
                  transition: `transform 0.32s ${ease}, box-shadow 0.32s ${ease}`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 32px oklch(52% 0.2 260 / 0.56)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px oklch(52% 0.2 260 / 0.4)'; }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                >
                  Start your journey
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 6h9M7 3l3.5 3L7 9" /></svg>
                  </div>
                </button>

                <a href="#how-it-works" style={{
                  display: 'flex', alignItems: 'center',
                  background: 'white', color: 'oklch(28% 0.01 260)',
                  border: '1.5px solid oklch(88% 0.008 260)',
                  borderRadius: 999, padding: '13px 26px',
                  fontSize: 'clamp(13px, 1.2vw, 15px)', fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 1px 10px oklch(20% 0.01 260 / 0.05)',
                  transition: `all 0.3s ${ease}`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'oklch(74% 0.13 260)'; e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 20px oklch(52% 0.2 260 / 0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'oklch(88% 0.008 260)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 1px 10px oklch(20% 0.01 260 / 0.05)'; }}
                >How it works</a>
              </div>

              {/* Social proof */}
              <div className="gl-social-proof" style={{
                marginTop: 44, display: 'flex', alignItems: 'center', gap: 12,
                opacity: heroVisible ? 1 : 0,
                transition: `opacity 0.9s ${ease} 360ms`,
              }}>
                <div style={{ display: 'flex', flexShrink: 0 }}>
                  {['260', '155', '55', '30'].map((hue, i) => (
                    <div key={i} style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: `oklch(62% 0.18 ${hue})`,
                      border: '2.5px solid #f9fafb',
                      marginLeft: i === 0 ? 0 : -9,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, color: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}>
                      {['AR', 'PL', 'NM', 'SK'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'oklch(18% 0.015 260)' }}>Trusted by early adopters</div>
                  <div style={{ fontSize: 11.5, color: 'oklch(54% 0.01 260)' }}>documenting their life commits</div>
                </div>
              </div>
            </div>

            {/* RIGHT — live commit feed preview */}
            <div style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(28px)',
              filter: heroVisible ? 'blur(0)' : 'blur(8px)',
              transition: `all 0.9s ${ease} 320ms`,
            }}>
              <div style={{
                background: 'oklch(93% 0.012 260)',
                border: '1px solid oklch(88% 0.012 260)',
                borderRadius: '2.25rem',
                padding: '7px',
                boxShadow: '0 24px 72px oklch(52% 0.2 260 / 0.1), 0 4px 16px oklch(20% 0.015 260 / 0.05)',
              }}>
                <div style={{ background: 'white', borderRadius: 'calc(2.25rem - 7px)', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,1)' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid oklch(95% 0.006 260)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Logo size={20} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'oklch(22% 0.015 260)', letterSpacing: '-0.015em' }}>GitLife</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                      {['oklch(90% 0.08 30)', 'oklch(90% 0.08 60)', 'oklch(90% 0.08 155)'].map((c, i) => (
                        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {COMMITS.slice(0, 3).map((c, i) => {
                      const catBg = `oklch(93% 0.055 ${c.catColor})`;
                      const catFg = `oklch(36% 0.18 ${c.catColor})`;
                      return (
                        <div key={i} style={{ background: 'oklch(98% 0.004 260)', border: '1px solid oklch(93% 0.007 260)', borderRadius: 14, padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="oklch(62% 0.01 260)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="5" cy="3.5" r="1.5" /><circle cx="5" cy="12.5" r="1.5" /><circle cx="11" cy="6.5" r="1.5" />
                              <line x1="5" y1="5" x2="5" y2="11" /><path d="M5 5 C5 5 5 3.5 11 5" />
                            </svg>
                            <span style={{ fontSize: 9.5, color: 'oklch(58% 0.01 260)', fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, maxWidth: 160 }}>{c.branch}</span>
                            <div style={{ background: catBg, color: catFg, fontSize: 8.5, fontWeight: 700, borderRadius: 20, padding: '1.5px 6px', whiteSpace: 'nowrap' }}>{c.cat}</div>
                          </div>
                          <p style={{ fontSize: 11.5, fontWeight: 600, color: 'oklch(20% 0.015 260)', margin: '0 0 8px', lineHeight: 1.4 }}>{c.msg}</p>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {[['⎇', c.forks], ['↩', c.merges]].map(([icon, n]) => (
                              <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'white', borderRadius: 20, padding: '2px 7px', fontSize: 10, fontWeight: 600, color: 'oklch(54% 0.01 260)' }}>
                                <span>{icon}</span>{n}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ textAlign: 'center', padding: '4px 0 2px', fontSize: 11, color: 'oklch(65% 0.01 260)', fontWeight: 500 }}>+ see how others navigate life</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="gl-scroll-hint" style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          opacity: heroVisible ? 0.4 : 0,
          transition: `opacity 1.1s ${ease} 1000ms`,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'oklch(55% 0.01 260)' }}>Scroll</span>
          <div style={{ width: 1, height: 36, background: 'linear-gradient(oklch(55% 0.01 260), transparent)' }} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          LIVE TICKER STRIP
         ══════════════════════════════════════════════════════ */}
      <div style={{ padding: 'clamp(48px, 6vw, 96px) 0', background: 'white', borderTop: '1px solid oklch(93% 0.006 80)', borderBottom: '1px solid oklch(93% 0.006 80)' }}>
        <Reveal>
          <p style={{ textAlign: 'center', fontSize: 'clamp(10px, 1vw, 12px)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'oklch(62% 0.01 260)', marginBottom: 26 }}>
            What people commit to
          </p>
        </Reveal>
        <CommitTicker />
      </div>

      {/* ══════════════════════════════════════════════════════
          FEATURES
         ══════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: 'clamp(72px, 9vw, 160px) clamp(20px, 4vw, 56px)' }}>
        <div className="gl-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'inline-block', fontSize: 'clamp(9px, 0.9vw, 11px)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'oklch(52% 0.2 260)', background: 'oklch(93% 0.06 260)', borderRadius: 999, padding: '5px 14px', marginBottom: 18 }}>Features</div>
              <h2 style={{ fontSize: 'clamp(24px, 3.8vw, 52px)', fontWeight: 900, letterSpacing: '-0.028em', color: 'oklch(10% 0.015 260)', margin: 0, lineHeight: 1.12 }}>
                Git for humans.<br />Not just developers.
              </h2>
            </div>
          </Reveal>

          <FeatureRow
            delay={0} reverse={false}
            icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="oklch(44% 0.2 260)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="7" r="3"/><line x1="11" y1="10" x2="11" y2="19"/><circle cx="5" cy="17" r="2.5"/><circle cx="17" cy="17" r="2.5"/><line x1="11" y1="19" x2="5" y2="17"/><line x1="11" y1="19" x2="17" y2="17"/></svg>}
            title="Commit your decisions"
            body="Every big choice you make becomes a commit — with a branch, message, and impact score. Build a searchable, permanent changelog of your life."
            visual={
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="oklch(60% 0.01 260)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="5" cy="3.5" r="1.5"/><circle cx="5" cy="12.5" r="1.5"/><circle cx="11" cy="6.5" r="1.5"/>
                    <line x1="5" y1="5" x2="5" y2="11"/><path d="M5 5 C5 5 5 3.5 11 5"/>
                  </svg>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: 'oklch(55% 0.01 260)', fontFamily: "'JetBrains Mono', monospace" }}>career/new-chapter</span>
                  <div style={{ marginLeft: 'auto', background: 'oklch(93% 0.06 260)', color: 'oklch(36% 0.2 260)', fontSize: 9.5, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>Career</div>
                </div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: 'oklch(14% 0.015 260)', lineHeight: 1.45, margin: '0 0 6px' }}>
                  Left my stable job to go indie. Scary, but the best call I've ever made.
                </p>
                <p style={{ fontSize: 12, color: 'oklch(52% 0.01 260)', lineHeight: 1.6, margin: '0 0 14px' }}>
                  After 4 years at the same company, I finally pulled the trigger. Runway: 8 months. Goal: ship something people pay for.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'oklch(93% 0.05 155)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: 'oklch(36% 0.16 155)' }}>
                    Impact 9/10
                  </div>
                  {[['⎇', 47], ['↩', 23], ['♡', 118]].map(([icon, n]) => (
                    <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'oklch(97% 0.003 260)', borderRadius: 20, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: 'oklch(54% 0.01 260)' }}>
                      <span style={{ fontSize: 12 }}>{icon}</span>{n}
                    </div>
                  ))}
                </div>
              </div>
            }
          />

          <FeatureRow
            delay={0} reverse={true}
            icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="oklch(44% 0.2 260)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="5" r="2.5"/><circle cx="7" cy="17" r="2.5"/><circle cx="15" cy="9" r="2.5"/><line x1="7" y1="7.5" x2="7" y2="14.5"/><path d="M7 8 C7 8 7 6 15 6.5" /></svg>}
            title="Branch your what-ifs"
            body="Create experimental branches for paths not taken. Run alternative timelines alongside your main life branch and compare them side by side."
            visual={
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { branch: 'main', label: 'Took the startup offer', active: true, color: '260' },
                  { branch: 'what-if/stayed-at-corp', label: 'Stayed at Deloitte for 2 more years', active: false, color: '155' },
                  { branch: 'what-if/freelance-first', label: 'Gone freelance before committing', active: false, color: '55' },
                ].map(({ branch, label, active, color }) => (
                  <div key={branch} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: active ? 'oklch(95% 0.04 260)' : 'oklch(98% 0.003 260)',
                    border: `1px solid ${active ? 'oklch(85% 0.08 260)' : 'oklch(93% 0.006 260)'}`,
                    borderRadius: 12, padding: '10px 14px',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: `oklch(${active ? '52% 0.2' : '65% 0.12'} ${color})` }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: `oklch(${active ? '42% 0.18' : '58% 0.08'} ${color})`, fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>{branch}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'oklch(22% 0.015 260)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                    </div>
                    {active && <div style={{ fontSize: 9.5, fontWeight: 700, background: 'oklch(52% 0.2 260)', color: 'white', borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>active</div>}
                  </div>
                ))}
              </div>
            }
          />

          <FeatureRow
            delay={0} reverse={false}
            icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="oklch(44% 0.2 260)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17 L11 5 L18 17"/><line x1="7" y1="13" x2="15" y2="13"/></svg>}
            title="Fork what inspires you"
            body="See a decision someone else made that resonates? Fork it. Start your own version — same concept, your own context, your own story."
            visual={
              <div>
                <div style={{ background: 'oklch(97% 0.004 260)', border: '1px solid oklch(91% 0.008 260)', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'oklch(58% 0.01 260)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'oklch(62% 0.18 155)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: 'white', flexShrink: 0 }}>PL</div>
                    <span>priya.l · career/remote-first</span>
                  </div>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: 'oklch(18% 0.015 260)', margin: '0 0 8px', lineHeight: 1.4 }}>Switched to fully remote, moved to Bali for 6 months.</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[['⎇', 312], ['↩', 87]].map(([icon, n]) => (
                      <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'white', borderRadius: 20, padding: '2px 8px', fontSize: 10.5, fontWeight: 600, color: 'oklch(54% 0.01 260)' }}>
                        <span>{icon}</span>{n}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ height: 1, flex: 1, background: 'oklch(90% 0.01 260)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'oklch(93% 0.06 260)', borderRadius: 20, padding: '3px 10px' }}>
                    <span style={{ fontSize: 12 }}>⎇</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: 'oklch(38% 0.2 260)' }}>forked by you</span>
                  </div>
                  <div style={{ height: 1, flex: 1, background: 'oklch(90% 0.01 260)' }} />
                </div>
                <div style={{ background: 'oklch(95% 0.04 260)', border: '1px solid oklch(85% 0.08 260)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'oklch(42% 0.2 260)', marginBottom: 5 }}>you · career/remote-lisbon</div>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: 'oklch(18% 0.015 260)', margin: 0, lineHeight: 1.4 }}>Took the remote leap — chose Lisbon over Bali. Same energy, different timezone.</p>
                </div>
              </div>
            }
          />

          <FeatureRow
            delay={0} reverse={true}
            icon={<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="oklch(44% 0.2 260)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="18" height="18" rx="4"/><polyline points="5,14 9,10 13,13 17,7"/></svg>}
            title="Watch your life graph grow"
            body="An interactive, animated git graph of every commit, branch, fork, and merge in your personal history. Your life, rendered as beautiful code history."
            visual={
              <div style={{ padding: '4px 0' }}>
                <svg width="100%" viewBox="0 0 320 224" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                  <line x1="20" y1="22" x2="20" y2="202" stroke="oklch(76% 0.14 260)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M20 66 C20 84 100 74 100 92" stroke="oklch(70% 0.14 155)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  <line x1="100" y1="92" x2="100" y2="136" stroke="oklch(70% 0.14 155)" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M100 136 C100 152 20 142 20 158" stroke="oklch(70% 0.14 155)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  <circle cx="20" cy="22" r="5.5" fill="oklch(52% 0.2 260)" />
                  <text x="34" y="26" fontSize="10" fontWeight="600" fill="oklch(22% 0.015 260)" fontFamily="Plus Jakarta Sans, sans-serif">quit-corp job</text>
                  <circle cx="20" cy="66" r="5.5" fill="oklch(52% 0.2 260)" />
                  <text x="34" y="70" fontSize="10" fontWeight="600" fill="oklch(22% 0.015 260)" fontFamily="Plus Jakarta Sans, sans-serif">moved to Berlin</text>
                  <circle cx="20" cy="110" r="5.5" fill="oklch(52% 0.2 260)" />
                  <text x="34" y="114" fontSize="10" fontWeight="600" fill="oklch(22% 0.015 260)" fontFamily="Plus Jakarta Sans, sans-serif">went indie</text>
                  <circle cx="20" cy="158" r="6" fill="oklch(48% 0.22 260)" stroke="oklch(75% 0.16 260)" strokeWidth="1.5" />
                  <text x="34" y="162" fontSize="10" fontWeight="700" fill="oklch(36% 0.2 260)" fontFamily="Plus Jakarta Sans, sans-serif">got funded</text>
                  <circle cx="20" cy="202" r="5.5" fill="oklch(52% 0.2 260)" />
                  <text x="34" y="206" fontSize="10" fontWeight="600" fill="oklch(22% 0.015 260)" fontFamily="Plus Jakarta Sans, sans-serif">launched v1</text>
                  <circle cx="100" cy="92" r="4.5" fill="oklch(54% 0.18 155)" />
                  <text x="114" y="96" fontSize="9.5" fontWeight="600" fill="oklch(38% 0.15 155)" fontFamily="Plus Jakarta Sans, sans-serif">what-if: stayed at corp</text>
                  <circle cx="100" cy="136" r="4.5" fill="oklch(54% 0.18 155)" />
                  <text x="114" y="140" fontSize="9.5" fontWeight="600" fill="oklch(38% 0.15 155)" fontFamily="Plus Jakarta Sans, sans-serif">got promoted instead</text>
                  <rect x="88" y="62" width="124" height="17" rx="8" fill="oklch(93% 0.06 155)" />
                  <text x="150" y="74" fontSize="8.5" fontWeight="700" fill="oklch(36% 0.16 155)" fontFamily="Plus Jakarta Sans, sans-serif" textAnchor="middle" letterSpacing="0.04em">what-if/stayed-at-corp</text>
                </svg>
              </div>
            }
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
         ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: 'clamp(72px, 9vw, 160px) clamp(20px, 4vw, 56px)', background: 'white', borderTop: '1px solid oklch(93% 0.006 80)' }}>
        <div className="gl-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: 'clamp(44px, 6vw, 80px)' }}>
              <div style={{ display: 'inline-block', fontSize: 'clamp(9px, 0.9vw, 11px)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'oklch(52% 0.2 260)', background: 'oklch(93% 0.06 260)', borderRadius: 999, padding: '5px 14px', marginBottom: 18 }}>How it works</div>
              <h2 style={{ fontSize: 'clamp(24px, 3.8vw, 52px)', fontWeight: 900, letterSpacing: '-0.028em', color: 'oklch(10% 0.015 260)', margin: 0, lineHeight: 1.12 }}>
                Three steps.<br />One life repo.
              </h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(16px, 3vw, 40px)' }} className="gl-steps-grid">
            {[
              {
                num: '01', title: 'Write a commit',
                body: "Hit New Commit, pick a life branch — career, health, finance, or life — write your decision, add context, and set an impact score. Your choice is saved forever.",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="oklch(44% 0.2 260)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="3" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="21"/><line x1="3" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="21" y2="12"/></svg>,
              },
              {
                num: '02', title: 'Follow people you admire',
                body: "Follow anyone on GitLife and their commits appear in your feed. React to decisions, fork a commit you relate to, or just watch how others are navigating their lives.",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="oklch(44% 0.2 260)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="6" r="3.5"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" y1="9.5" x2="5" y2="16"/><line x1="12" y1="9.5" x2="19" y2="16"/><line x1="8" y1="19" x2="16" y2="19"/></svg>,
              },
              {
                num: '03', title: 'Explore your Life Graph',
                body: "Open the Life Graph to see every commit, branch, fork, and merge visualized as an interactive tree. Your entire personal history, rendered at a glance.",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="oklch(44% 0.2 260)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><polyline points="7,16 10,11 14,14 17,8"/></svg>,
              },
            ].map(({ num, title, body, icon }, i) => (
              <Reveal key={num} delay={i * 90}>
                <div style={{
                  background: 'oklch(95% 0.01 260)',
                  border: '1px solid oklch(90% 0.008 260)',
                  borderRadius: '1.75rem',
                  padding: '6px',
                  boxShadow: '0 8px 32px oklch(52% 0.2 260 / 0.05)',
                  height: '100%',
                }}>
                  <div style={{
                    background: '#f9fafb',
                    borderRadius: 'calc(1.75rem - 6px)',
                    padding: 'clamp(22px, 2.8vw, 36px)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                    height: '100%',
                    display: 'flex', flexDirection: 'column',
                  }}>
                    <div style={{ fontSize: 'clamp(36px, 4.5vw, 60px)', fontWeight: 900, color: 'oklch(91% 0.05 260)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 18, fontFamily: "'JetBrains Mono', monospace" }}>{num}</div>
                    <div className="gl-step-icon" style={{
                      width: 48, height: 48,
                      background: 'oklch(92% 0.05 260)',
                      border: '1px solid oklch(86% 0.07 260)',
                      borderRadius: 14, padding: '4px',
                      marginBottom: 18,
                      boxShadow: '0 2px 12px oklch(52% 0.2 260 / 0.1)',
                      display: 'inline-flex',
                    }}>
                      <div style={{ flex: 1, borderRadius: 11, background: 'oklch(95% 0.05 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)' }}>{icon}</div>
                    </div>
                    <h3 style={{ fontSize: 'clamp(14px, 1.3vw, 16px)', fontWeight: 800, color: 'oklch(13% 0.015 260)', margin: '0 0 12px', letterSpacing: '-0.018em', lineHeight: 1.3 }}>{title}</h3>
                    <p style={{ fontSize: 'clamp(12.5px, 1.1vw, 14px)', color: 'oklch(48% 0.01 260)', lineHeight: 1.75, margin: 0 }}>{body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          GET THE APP
         ══════════════════════════════════════════════════════ */}
      <section id="get-the-app" style={{ padding: 'clamp(72px, 9vw, 160px) clamp(20px, 4vw, 56px)', borderTop: '1px solid oklch(93% 0.006 80)' }}>
        <div className="gl-container" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: 'clamp(44px, 5vw, 72px)' }}>
              <div style={{ display: 'inline-block', fontSize: 'clamp(9px, 0.9vw, 11px)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'oklch(52% 0.2 260)', background: 'oklch(93% 0.06 260)', borderRadius: 999, padding: '5px 14px', marginBottom: 18 }}>Available everywhere</div>
              <h2 style={{ fontSize: 'clamp(24px, 3.8vw, 52px)', fontWeight: 900, letterSpacing: '-0.028em', color: 'oklch(10% 0.015 260)', margin: 0, lineHeight: 1.12 }}>
                One codebase.<br />Every screen.
              </h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(14px, 2.5vw, 36px)', alignItems: 'stretch' }} className="gl-platform-grid">
            <Reveal delay={0}>
              <PlatformCard
                badge="Web" badgeColor={['oklch(93% 0.06 155)', 'oklch(36% 0.16 155)']}
                label="Browser / Web"
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="oklch(44% 0.2 260)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3 C9.5 8 9.5 16 12 21"/><path d="M12 3 C14.5 8 14.5 16 12 21"/></svg>}
                steps={['Open the app in any modern browser', 'Sign up or log in with your account', 'Start committing your life decisions instantly']}
                cta="Open Web App"
                ctaAction={onGetStarted}
              />
            </Reveal>
            <Reveal delay={90}>
              <PlatformCard
                badge="Android" badgeColor={['oklch(93% 0.06 140)', 'oklch(34% 0.15 140)']}
                label="Android App"
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="oklch(44% 0.2 260)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9h12v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9z"/><path d="M6 9 L8 4 L16 4 L18 9"/><line x1="9" y1="4" x2="7" y2="2"/><line x1="15" y1="4" x2="17" y2="2"/><line x1="9" y1="14" x2="9" y2="17"/><line x1="15" y1="14" x2="15" y2="17"/></svg>}
                steps={['Download the APK from GitHub Releases', 'Enable "Install from unknown sources" once', 'Install and open — full native experience']}
                cta="Download APK"
                ctaAction={() => window.open('https://github.com/soorajdmg/GitLife-Android/releases', '_blank')}
              />
            </Reveal>
            <Reveal delay={180}>
              <PlatformCard
                badge="iOS PWA" badgeColor={['oklch(93% 0.05 260)', 'oklch(38% 0.2 260)']}
                label="iPhone / iPad"
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="oklch(44% 0.2 260)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="3"/><circle cx="12" cy="18" r="1.2" fill="oklch(44% 0.2 260)" stroke="none"/></svg>}
                steps={['Open the site in Safari on your iPhone', 'Tap the Share icon at the bottom of the browser', 'Select "Add to Home Screen" — runs like a native app']}
                cta={null}
                ctaAction={null}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: 'clamp(24px, 3vw, 40px) clamp(20px, 4vw, 56px)', borderTop: '1px solid oklch(93% 0.006 80)' }}>
        <div className="gl-container gl-footer-inner" style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Logo size={22} />
            <span style={{ fontSize: 13.5, fontWeight: 800, color: 'oklch(18% 0.015 260)', letterSpacing: '-0.022em' }}>GitLife</span>
          </div>
          <div className="gl-footer-links" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {navLinks.map(({ label, href }) => (
              <a key={label} href={href} style={{ fontSize: 12.5, color: 'oklch(54% 0.01 260)', textDecoration: 'none', fontWeight: 500, transition: `color 0.2s ${ease}` }}
                onMouseEnter={e => { e.currentTarget.style.color = 'oklch(26% 0.01 260)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'oklch(54% 0.01 260)'; }}
              >{label}</a>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: 'oklch(66% 0.01 260)', margin: 0 }}>
            &copy; {new Date().getFullYear()} GitLife. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @keyframes glMenuIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        /* ── NAV ── */
        @media (max-width: 600px) {
          .gl-desktop-links { display: none !important; }
          .gl-desktop-cta   { display: none !important; }
          .gl-hamburger     { display: flex !important; }
        }
        @media (min-width: 601px) {
          .gl-hamburger { display: none !important; }
        }
        @media (min-width: 1921px) {
          .gl-nav { max-width: 780px !important; }
        }

        /* ── CONTAINER WIDTHS (ultra-wide scaling) ── */
        @media (min-width: 1537px) {
          .gl-container { max-width: 1280px !important; }
        }
        @media (min-width: 1921px) {
          .gl-container { max-width: 1480px !important; }
        }
        @media (min-width: 2561px) {
          .gl-container { max-width: 1700px !important; }
        }

        /* ── HERO ── */
        @media (max-width: 768px) {
          .gl-hero-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .gl-hero-grid { gap: clamp(28px, 4vw, 56px) !important; }
        }
        /* Landscape mobile: don't trap in 100dvh */
        @media (orientation: landscape) and (max-height: 520px) {
          .gl-hero-section {
            min-height: auto !important;
            padding-top: 80px !important;
            padding-bottom: 56px !important;
          }
        }

        /* ── ORBS: hide on small phones ── */
        @media (max-width: 480px) {
          .gl-orb { display: none !important; }
        }

        /* ── SCROLL HINT: push down on mobile so it clears the hero content ── */
        @media (max-width: 768px) {
          .gl-scroll-hint { bottom: 10px !important; }
        }

        /* ── DISABLE ALL HOVER ANIMATIONS ON TOUCH DEVICES ── */
        @media (hover: none) {
          * { transition: none !important; }
          *:hover { transform: none !important; box-shadow: inherit !important; border-color: inherit !important; background: inherit !important; color: inherit !important; }
        }

        /* ── CTA BUTTON GROUP: stack on very small phones ── */
        @media (max-width: 380px) {
          .gl-cta-group {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .gl-cta-group > * {
            justify-content: center !important;
            width: 100% !important;
          }
        }

        /* ── SOCIAL PROOF: stack on very narrow ── */
        @media (max-width: 380px) {
          .gl-social-proof {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }

        /* ── TICKER: shrink on small phones ── */
        @media (max-width: 480px) {
          .gl-ticker { transform-origin: left center; }
          .gl-ticker-inner { transform: scale(0.82); transform-origin: left center; }
        }

        /* ── FEATURE ROWS ── */
        @media (max-width: 680px) {
          .gl-feature-row { grid-template-columns: 1fr !important; }
          /* Always show text first, visual second on mobile */
          .gl-feature-text   { order: 1 !important; }
          .gl-feature-visual { order: 2 !important; }
        }
        /* Tablet: reduce gap slightly */
        @media (min-width: 681px) and (max-width: 900px) {
          .gl-feature-row { gap: clamp(24px, 4vw, 48px) !important; }
        }
        /* Feature icon: smaller on mobile */
        @media (max-width: 480px) {
          .gl-feature-icon {
            width: 42px !important;
            height: 42px !important;
            border-radius: 13px !important;
          }
          .gl-feature-icon-inner { border-radius: 10px !important; }
        }

        /* ── STEP CARDS ── */
        @media (max-width: 640px) {
          .gl-steps-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .gl-steps-grid { grid-template-columns: 1fr 1fr !important; }
        }
        /* Step icon: smaller on mobile */
        @media (max-width: 480px) {
          .gl-step-icon {
            width: 40px !important;
            height: 40px !important;
            border-radius: 12px !important;
          }
        }

        /* ── PLATFORM CARDS ── */
        @media (max-width: 640px) {
          .gl-platform-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .gl-platform-grid { grid-template-columns: 1fr 1fr !important; }
        }
        /* Platform icon: smaller on mobile */
        @media (max-width: 480px) {
          .gl-platform-icon {
            width: 42px !important;
            height: 42px !important;
            border-radius: 12px !important;
          }
        }

        /* ── FOOTER ── */
        @media (max-width: 480px) {
          .gl-footer-inner {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
