import { useTheme } from '../../contexts/ThemeContext';

export default function BranchPill({ name, wi, merged }) {
  const { isDark } = useTheme();

  let bg, fg;
  if (isDark) {
    if (merged)  { bg = 'oklch(26% 0.08 155)'; fg = 'oklch(76% 0.18 155)'; }
    else if (wi) { bg = 'oklch(26% 0.08 60)';  fg = 'oklch(78% 0.18 60)';  }
    else         { bg = 'oklch(28% 0.08 260)'; fg = 'oklch(78% 0.18 260)'; }
  } else {
    if (merged)  { bg = 'oklch(92% 0.05 155)'; fg = 'oklch(38% 0.18 155)'; }
    else if (wi) { bg = 'oklch(93% 0.06 60)';  fg = 'oklch(45% 0.19 55)';  }
    else         { bg = 'oklch(93% 0.05 260)'; fg = 'oklch(42% 0.2 260)';  }
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 5,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 500,
      background: bg, color: fg, whiteSpace: 'nowrap'
    }}>
      {merged ? '✓' : wi ? (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="5" cy="3.5" r="1.5" /><circle cx="5" cy="12.5" r="1.5" /><circle cx="11" cy="6.5" r="1.5" />
          <line x1="5" y1="5" x2="5" y2="11" /><path d="M5 5c0 0 0-1.5 6 0" />
        </svg>
      ) : '●'} {name}
    </span>
  );
}
