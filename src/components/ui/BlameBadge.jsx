export default function BlameBadge({ status }) {
  if (!status) return null;

  const config = {
    broken:        { label: '⚠ broken',        bg: 'oklch(96% 0.04 30)',  color: 'oklch(48% 0.18 30)',  border: 'oklch(88% 0.08 30)'  },
    investigating: { label: '⟳ investigating', bg: 'oklch(97% 0.04 55)',  color: 'oklch(48% 0.18 55)',  border: 'oklch(88% 0.08 55)'  },
    resolved:      { label: '✓ resolved',       bg: 'oklch(96% 0.04 155)', color: 'oklch(42% 0.18 155)', border: 'oklch(85% 0.08 155)' },
  }[status];

  if (!config) return null;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
      background: config.bg, color: config.color,
      border: `1px solid ${config.border}`,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {config.label}
    </span>
  );
}
