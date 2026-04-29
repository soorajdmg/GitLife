import { useReactFlow } from '@xyflow/react';

const pill = (active) => ({
  padding: '5px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 500,
  cursor: 'pointer', border: 'none', transition: 'all 0.12s',
  background: active ? 'oklch(52% 0.2 260)' : 'white',
  color: active ? 'white' : 'oklch(44% 0.01 260)',
  boxShadow: active ? 'none' : 'inset 0 0 0 1px oklch(88% 0.008 260)',
});

export default function GraphToolbar({ mode, onModeChange, loadBearingOnly, onLoadBearingToggle }) {
  const { fitView } = useReactFlow();

  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 10, display: 'flex', alignItems: 'center', gap: 8,
      background: 'white', borderRadius: 10, padding: '6px 10px',
      boxShadow: '0 4px 16px oklch(25% 0.05 260 / 0.12)',
      border: '1px solid oklch(92% 0.005 260)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button style={pill(mode === 'graph')} onClick={() => onModeChange('graph')}>Graph</button>
        <button style={pill(mode === 'blame')} onClick={() => onModeChange('blame')}>Blame</button>
      </div>

      <div style={{ width: 1, height: 20, background: 'oklch(90% 0.005 260)' }} />

      {/* Load-bearing filter */}
      <button
        style={{ ...pill(loadBearingOnly), fontSize: 11.5 }}
        onClick={onLoadBearingToggle}
        title="Show only load-bearing decisions (3+ dependents)"
      >
        ◈ Load-bearing
      </button>

      <div style={{ width: 1, height: 20, background: 'oklch(90% 0.005 260)' }} />

      {/* Fit view */}
      <button
        style={{ ...pill(false), padding: '5px 10px', fontSize: 13 }}
        onClick={() => fitView({ padding: 0.1, duration: 400 })}
        title="Fit all nodes in view"
      >
        ⊞
      </button>

      {/* Legend */}
      <div style={{ width: 1, height: 20, background: 'oklch(90% 0.005 260)' }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 10.5, color: 'oklch(52% 0.01 260)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(60% 0.18 30)', display: 'inline-block' }} />
          broken
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(52% 0.18 290)', display: 'inline-block' }} />
          load-bearing
        </span>
      </div>
    </div>
  );
}
