import { useRef } from 'react';
import { useReactFlow } from '@xyflow/react';

const pill = (active) => ({
  padding: '5px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 500,
  cursor: 'pointer', border: 'none', transition: 'all 0.12s',
  background: active ? 'oklch(52% 0.2 260)' : 'white',
  color: active ? 'white' : 'oklch(44% 0.01 260)',
  boxShadow: active ? 'none' : 'inset 0 0 0 1px oklch(88% 0.008 260)',
  whiteSpace: 'nowrap',
});

const divider = <div style={{ width: 1, height: 20, background: 'oklch(90% 0.005 260)', flexShrink: 0 }} />;

export default function GraphToolbar({ mode, onModeChange, loadBearingOnly, onLoadBearingToggle, onTidy, searchQuery, onSearchChange, onSearchJump }) {
  const { fitView } = useReactFlow();
  const inputRef = useRef(null);

  return (
    <div style={{
      position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
      zIndex: 10,
      background: 'white', borderRadius: 10,
      boxShadow: '0 4px 16px oklch(25% 0.05 260 / 0.12)',
      border: '1px solid oklch(92% 0.005 260)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: 'flex', flexDirection: 'column', gap: 0,
      maxWidth: 'calc(100vw - 24px)',
      width: 'max-content',
    }}>

      {/* Row 1: mode + filters + fit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', flexWrap: 'wrap' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={pill(mode === 'graph')} onClick={() => onModeChange('graph')}>Graph</button>
          <button style={pill(mode === 'blame')} onClick={() => onModeChange('blame')}>Blame</button>
        </div>

        {divider}

        {/* Load-bearing filter */}
        <button
          style={{ ...pill(loadBearingOnly), fontSize: 11.5 }}
          onClick={onLoadBearingToggle}
          title="Show only load-bearing decisions (3+ dependents)"
        >
          ◈ Load-bearing
        </button>

        {divider}

        {/* Tidy layout */}
        <button
          style={{ ...pill(false), fontSize: 11.5 }}
          onClick={onTidy}
          title="Arrange connected nodes by causal depth"
        >
          ✦ Tidy up
        </button>

        {divider}

        {/* Fit view */}
        <button
          style={{ ...pill(false), padding: '5px 10px', fontSize: 13 }}
          onClick={() => fitView({ padding: 0.1, duration: 400 })}
          title="Fit all nodes in view"
        >
          ⊞
        </button>
      </div>

      {/* Row 2: search — full width on its own line */}
      <div style={{ borderTop: '1px solid oklch(93% 0.005 260)', padding: '6px 12px' }}>
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
              paddingLeft: 22, paddingRight: searchQuery ? 22 : 8,
              paddingTop: 4, paddingBottom: 4,
              border: '1px solid oklch(88% 0.008 260)',
              borderRadius: 7, fontSize: 12, outline: 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: 'oklch(24% 0.015 260)',
              background: searchQuery ? 'oklch(97% 0.008 260)' : 'white',
              width: '100%',
              transition: 'border-color 0.12s, background 0.12s',
            }}
            onFocus={e => { e.target.style.borderColor = 'oklch(52% 0.2 260)'; }}
            onBlur={e => { e.target.style.borderColor = 'oklch(88% 0.008 260)'; }}
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
