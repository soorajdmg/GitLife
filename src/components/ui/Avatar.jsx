export default function Avatar({ u, size = 36 }) {
  if (u.avatarUrl) {
    return (
      <img
        src={u.avatarUrl}
        alt={u.ini}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        referrerPolicy="no-referrer"
        onError={e => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextSibling.style.display = 'flex';
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: u.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontWeight: 700, color: 'white', flexShrink: 0, letterSpacing: '-0.5px'
    }}>
      {u.ini}
    </div>
  );
}
