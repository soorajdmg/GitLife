import './SkeletonCard.css';

export default function SkeletonCard({ height = '80px', lines = 2 }) {
  return (
    <div className="skeleton-card" style={{ minHeight: height }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{ width: i === 0 ? '60%' : '40%' }}
        />
      ))}
    </div>
  );
}
