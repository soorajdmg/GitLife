import { catColor } from '../../data/gitlife';

export default function Tag({ cat }) {
  const c = catColor(cat);
  return (
    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: c.bg, color: c.fg }}>
      {cat}
    </span>
  );
}
