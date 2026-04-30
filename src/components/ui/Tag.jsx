import { catColor } from '../../data/gitlife';
import { useTheme } from '../../contexts/ThemeContext';

export default function Tag({ cat }) {
  const { isDark } = useTheme();
  const c = catColor(cat);

  // In dark mode use a darker, more saturated bg and a brighter fg
  const h = { Career: '260', Health: '155', Relationships: '330', Finance: '60', Education: '200', Travel: '25', Housing: '80' }[cat] || '260';
  const bg = isDark ? `oklch(28% 0.08 ${h})` : c.bg;
  const fg = isDark ? `oklch(80% 0.18 ${h})` : c.fg;

  return (
    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: bg, color: fg }}>
      {cat}
    </span>
  );
}
