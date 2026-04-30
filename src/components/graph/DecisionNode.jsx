import { Handle, Position } from '@xyflow/react';
import BlameBadge from '../ui/BlameBadge.jsx';

const TYPE_COLOR = { feat: '#4ade80', fix: '#f87171', chore: '#a78bfa' };

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 640;

function typeColor(type) {
  return TYPE_COLOR[type] || '#9ca3af';
}

// Node width scales with number of dependents (children)
// 0 deps → 200px, 1-2 → 230px, 3-5 → 265px, 6+ → 300px
function nodeWidth(dependentCount) {
  const d = dependentCount || 0;
  if (d === 0) return 200;
  if (d <= 2)  return 230;
  if (d <= 5)  return 265;
  return 300;
}

// Font size scales slightly too
function nodeFontSize(dependentCount) {
  const d = dependentCount || 0;
  if (d === 0) return 12.5;
  if (d <= 2)  return 13;
  if (d <= 5)  return 13.5;
  return 14;
}

// Max chars before truncation scales with width
function maxChars(dependentCount) {
  const d = dependentCount || 0;
  if (d === 0) return 70;
  if (d <= 2)  return 85;
  if (d <= 5)  return 100;
  return 120;
}

export default function DecisionNode({ data, selected }) {
  const isDark = data.isDark;
  const depCount = data.dependentCount || 0;
  const isLoadBearing = depCount >= 3;
  const isBroken = data.blameStatus === 'broken';

  // Connect-mode visual states (set by GraphPage)
  const isConnectSource = data.isConnectSource;
  const isConnectTarget = data.isConnectTarget;

  // Search visual states
  const isSearchMatch = data.isSearchMatch;
  const isSearchDimmed = data.isSearchDimmed;

  const width = nodeWidth(depCount);
  const fontSize = nodeFontSize(depCount);
  const chars = maxChars(depCount);

  const borderColor = isSearchMatch
    ? 'oklch(68% 0.22 55)'
    : isConnectSource
    ? 'oklch(52% 0.2 260)'
    : isConnectTarget
    ? 'oklch(65% 0.15 155)'
    : selected
    ? 'oklch(52% 0.2 260)'
    : isBroken
    ? 'oklch(72% 0.14 30)'
    : isLoadBearing
    ? 'oklch(72% 0.18 290)'
    : isDark ? 'oklch(35% 0.015 260)' : 'oklch(88% 0.008 260)';

  const boxShadow = isSearchMatch
    ? '0 0 0 3px oklch(68% 0.22 55 / 0.45), 0 4px 20px oklch(68% 0.22 55 / 0.2)'
    : isConnectSource
    ? '0 0 0 3px oklch(52% 0.2 260 / 0.4), 0 4px 16px oklch(25% 0.05 260 / 0.12)'
    : isConnectTarget
    ? '0 0 0 2px oklch(65% 0.15 155 / 0.35), 0 4px 16px oklch(25% 0.05 260 / 0.1)'
    : isLoadBearing
    ? '0 0 0 2px oklch(52% 0.18 290 / 0.3), 0 4px 20px oklch(25% 0.05 260 / 0.12)'
    : selected
    ? '0 0 0 2px oklch(52% 0.2 260 / 0.25), 0 4px 16px oklch(25% 0.05 260 / 0.1)'
    : isDark ? '0 2px 8px oklch(0% 0 0 / 0.3)' : '0 2px 8px oklch(25% 0.05 260 / 0.08)';

  const text = data.decision || '';
  const truncated = text.length > chars ? text.slice(0, chars - 3) + '…' : text;
  const branch = (data.branch_name || 'main').replace(/^what-if\//i, '⎇ ');

  const bgColor = isSearchMatch
    ? (isDark ? 'oklch(22% 0.018 55)' : 'oklch(98% 0.018 55)')
    : isConnectTarget
    ? (isDark ? 'oklch(20% 0.012 155)' : 'oklch(97% 0.012 155)')
    : isDark ? 'oklch(20% 0.015 260)' : 'white';

  const branchPillBg = isDark ? 'oklch(26% 0.012 260)' : 'oklch(95% 0.005 260)';
  const branchPillColor = isDark ? 'oklch(68% 0.01 260)' : 'oklch(55% 0.01 260)';
  const textColor = isDark ? 'oklch(88% 0.008 260)' : 'oklch(20% 0.015 260)';
  const depCountColor = isLoadBearing
    ? 'oklch(42% 0.18 290)'
    : isDark ? 'oklch(60% 0.01 260)' : 'oklch(52% 0.01 260)';
  const handleBorder = isDark ? 'oklch(20% 0.015 260)' : 'white';

  return (
    <div style={{
      background: bgColor,
      borderRadius: 12,
      border: `1.5px solid ${borderColor}`,
      boxShadow,
      padding: isLoadBearing ? '12px 16px' : '10px 14px',
      width,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: 'relative',
      borderLeft: isBroken ? '3px solid oklch(60% 0.18 30)' : undefined,
      transition: 'border-color 0.15s, box-shadow 0.15s, width 0.2s, background 0.15s, opacity 0.15s',
      cursor: isConnectTarget ? 'pointer' : 'default',
      opacity: isSearchDimmed ? 0.3 : 1,
    }}>
      <Handle
        type="target"
        position={Position.Top}
        style={IS_MOBILE ? {
          width: 36,
          height: 14,
          borderRadius: 7,
          background: 'oklch(68% 0.12 260 / 0.25)',
          border: `1.5px solid oklch(68% 0.12 260 / 0.5)`,
          top: -7,
        } : {
          background: 'oklch(68% 0.12 260)', width: 8, height: 8, border: `2px solid ${handleBorder}`,
        }}
      />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: typeColor(data.type), background: typeColor(data.type) + '22', padding: '1px 6px', borderRadius: 4 }}>
          {data.type || 'feat'}
        </span>
        <span style={{ fontSize: 10, color: branchPillColor, fontFamily: "'JetBrains Mono', monospace", background: branchPillBg, padding: '1px 6px', borderRadius: 4, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {branch}
        </span>
        {isLoadBearing && (
          <span style={{ fontSize: 9, fontWeight: 700, color: 'oklch(42% 0.18 290)', background: 'oklch(95% 0.06 290)', padding: '1px 5px', borderRadius: 4, border: '1px solid oklch(85% 0.1 290)' }}>
            load-bearing
          </span>
        )}
        {isConnectTarget && (
          <span style={{ fontSize: 9, fontWeight: 700, color: 'oklch(40% 0.18 155)', background: 'oklch(93% 0.06 155)', padding: '1px 5px', borderRadius: 4 }}>
            click to link
          </span>
        )}
      </div>

      {/* Decision text */}
      <div style={{ fontSize, fontWeight: isLoadBearing ? 600 : 500, color: textColor, lineHeight: 1.45, marginBottom: 6 }}>
        {truncated}
      </div>

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {data.blameStatus && <BlameBadge status={data.blameStatus} />}
        {depCount > 0 && (
          <span style={{ fontSize: 10, color: depCountColor, fontWeight: isLoadBearing ? 700 : 400, marginLeft: 'auto' }}>
            {depCount} {depCount === 1 ? 'decision depends on this' : 'decisions depend on this'}
          </span>
        )}
      </div>

      {IS_MOBILE && (
        <div style={{
          marginTop: 8,
          marginLeft: -14,
          marginRight: -14,
          marginBottom: -10,
          height: 28,
          borderRadius: '0 0 10px 10px',
          background: 'oklch(68% 0.12 260 / 0.12)',
          borderTop: `1px dashed oklch(68% 0.12 260 / 0.4)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          pointerEvents: 'none',
        }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v10M8 13l-3-3M8 13l3-3" stroke="oklch(52% 0.14 260)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'oklch(52% 0.14 260)', letterSpacing: '0.03em' }}>
            drag to connect
          </span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={IS_MOBILE ? {
          width: '100%',
          height: 28,
          borderRadius: '0 0 10px 10px',
          background: 'transparent',
          border: 'none',
          transform: 'translateX(-50%)',
          bottom: 0,
          cursor: 'grab',
        } : {
          background: 'oklch(68% 0.12 260)', width: 8, height: 8, border: `2px solid ${handleBorder}`,
        }}
      />
    </div>
  );
}
