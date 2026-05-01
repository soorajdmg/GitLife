import { useRef, useState } from 'react';

function pill(active, isDark, extra) {
  return {
    padding: '5px 12px',
    borderRadius: 7, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', border: 'none', transition: 'background 0.12s, color 0.12s',
    background: active ? 'oklch(52% 0.2 260)' : isDark ? 'oklch(24% 0.015 260)' : 'oklch(97% 0.005 260)',
    color: active ? 'white' : isDark ? 'oklch(72% 0.01 260)' : 'oklch(44% 0.01 260)',
    boxShadow: active ? 'none' : isDark ? 'inset 0 0 0 1px oklch(35% 0.015 260)' : 'inset 0 0 0 1px oklch(88% 0.008 260)',
    whiteSpace: 'nowrap', flexShrink: 0,
    ...extra,
  };
}

function Divider({ isDark, vertical = true }) {
  if (vertical) {
    return <div style={{ width: 1, height: 18, background: isDark ? 'oklch(30% 0.015 260)' : 'oklch(90% 0.005 260)', flexShrink: 0 }} />;
  }
  return <div style={{ width: '100%', height: 1, background: isDark ? 'oklch(28% 0.015 260)' : 'oklch(93% 0.005 260)' }} />;
}

export default function GraphToolbar({ mode, onModeChange, loadBearingOnly, onLoadBearingToggle, onTidy, searchQuery, onSearchChange, onSearchJump, isDark }) {
  const inputRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);

  const bg = isDark ? 'oklch(18% 0.015 260)' : 'white';
  const border = `1px solid ${isDark ? 'oklch(30% 0.015 260)' : 'oklch(92% 0.005 260)'}`;

  if (collapsed) {
    return (
      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: bg, borderRadius: 10, boxShadow: '0 4px 16px oklch(25% 0.05 260 / 0.12)', border, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <button
          onClick={() => setCollapsed(false)}
          title="Expand toolbar"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 600, color: isDark ? 'oklch(72% 0.01 260)' : 'oklch(44% 0.01 260)' }}>
            {mode === 'blame' ? 'Blame' : 'Graph'}{loadBearingOnly ? ' · ◈' : ''}{searchQuery ? ' · ⌕' : ''}
          </span>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke={isDark ? 'oklch(55% 0.01 260)' : 'oklch(60% 0.01 260)'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
      zIndex: 10, background: bg, borderRadius: 10,
      boxShadow: '0 4px 16px oklch(25% 0.05 260 / 0.12)',
      border, fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: 'flex', flexDirection: 'column',
      maxWidth: 'calc(100vw - 24px)',
      width: 'max-content',
    }}>

      {/* Controls row — wraps symmetrically in groups */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, padding: '6px 10px', justifyContent: 'center' }}>

        {/* Group 1: mode toggle */}
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          <button style={pill(mode === 'graph', isDark)} onClick={() => onModeChange('graph')}>Graph</button>
          <button style={pill(mode === 'blame', isDark)} onClick={() => onModeChange('blame')}>Blame</button>
        </div>

        <Divider isDark={isDark} />

        {/* Group 2: filters */}
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          <button style={pill(loadBearingOnly, isDark)} onClick={onLoadBearingToggle} title="Show only load-bearing decisions (3+ dependents)">
            ◈ Load-bearing
          </button>
        </div>

        <Divider isDark={isDark} />

        {/* Group 3: actions + collapse */}
        <div style={{ display: 'flex', gap: 3, flexShrink: 0, alignItems: 'center' }}>
          <button style={pill(false, isDark)} onClick={onTidy} title="Arrange connected nodes by causal depth">
            ✦ Tidy
          </button>
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse toolbar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', display: 'flex', alignItems: 'center', color: isDark ? 'oklch(50% 0.01 260)' : 'oklch(60% 0.01 260)', flexShrink: 0 }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

      </div>

      {/* Search row */}
      <div style={{ borderTop: `1px solid ${isDark ? 'oklch(28% 0.015 260)' : 'oklch(93% 0.005 260)'}`, padding: '6px 10px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 8, fontSize: 11, color: 'oklch(62% 0.01 260)', pointerEvents: 'none', userSelect: 'none' }}>⌕</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search nodes…"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onSearchJump();
              if (e.key === 'Escape') { onSearchChange(''); inputRef.current?.blur(); }
            }}
            style={{
              paddingLeft: 22, paddingRight: searchQuery ? 24 : 8,
              paddingTop: 4, paddingBottom: 4,
              border: `1px solid ${isDark ? 'oklch(35% 0.015 260)' : 'oklch(88% 0.008 260)'}`,
              borderRadius: 7, fontSize: 12, outline: 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: isDark ? 'oklch(88% 0.008 260)' : 'oklch(24% 0.015 260)',
              background: searchQuery
                ? (isDark ? 'oklch(22% 0.018 260)' : 'oklch(97% 0.008 260)')
                : (isDark ? 'oklch(20% 0.015 260)' : 'oklch(98% 0.004 260)'),
              width: '100%',
              minWidth: 160,
              transition: 'border-color 0.12s, background 0.12s',
            }}
            onFocus={e => { e.target.style.borderColor = 'oklch(52% 0.2 260)'; }}
            onBlur={e => { e.target.style.borderColor = isDark ? 'oklch(35% 0.015 260)' : 'oklch(88% 0.008 260)'; }}
          />
          {searchQuery && (
            <button
              onClick={() => { onSearchChange(''); inputRef.current?.focus(); }}
              style={{ position: 'absolute', right: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'oklch(55% 0.01 260)', padding: '0 2px', lineHeight: 1 }}
              title="Clear search"
            >✕</button>
          )}
        </div>
      </div>

    </div>
  );
}
