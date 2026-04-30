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
      {merged ? '✓' : wi ? '⎇' : '●'} {name}
    </span>
  );
}
