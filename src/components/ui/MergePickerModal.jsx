import { useState, useEffect } from 'react';
import { api } from '../../config/api';
import { useTheme } from '../../contexts/ThemeContext';

export default function MergePickerModal({ open, onClose, onConfirm, targetCommit }) {
  const { isDark } = useTheme();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!open) { setSelected(null); setSearch(''); return; }
    setLoading(true);
    api.getDecisions({ sortBy: 'timestamp', sortOrder: 'desc' })
      .then(data => setDecisions(data))
      .catch(() => setDecisions([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const m = {
    bg:          isDark ? 'oklch(18% 0.01 260)'  : 'white',
    border:      isDark ? 'oklch(30% 0.012 260)' : 'oklch(94% 0.004 80)',
    borderInput: isDark ? 'oklch(30% 0.012 260)' : 'oklch(88% 0.008 260)',
    borderFaint: isDark ? 'oklch(26% 0.01 260)'  : 'oklch(96% 0.004 80)',
    textPri:     isDark ? 'oklch(92% 0.008 260)' : 'oklch(18% 0.015 260)',
    textSec:     isDark ? 'oklch(65% 0.01 260)'  : 'oklch(48% 0.01 260)',
    textMuted:   isDark ? 'oklch(52% 0.01 260)'  : 'oklch(55% 0.01 260)',
    inputBg:     isDark ? 'oklch(22% 0.01 260)'  : 'oklch(98% 0.003 80)',
    rowHover:    isDark ? 'oklch(22% 0.01 260)'  : 'oklch(98% 0.005 80)',
    rowSelected: isDark ? 'oklch(22% 0.05 260)'  : 'oklch(95% 0.015 260)',
    cancelBg:    isDark ? 'oklch(24% 0.012 260)' : 'white',
    cancelText:  isDark ? 'oklch(68% 0.01 260)'  : 'oklch(40% 0.01 260)',
    targetBg:    isDark ? 'oklch(20% 0.012 260)' : 'oklch(97% 0.006 80)',
    shadow:      isDark ? '0 8px 40px oklch(5% 0.01 260 / 0.55)' : '0 8px 40px oklch(20% 0.05 260 / 0.18)',
  };

  const filtered = decisions.filter(d =>
    d.decision?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'oklch(15% 0.02 260 / 0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: m.bg, borderRadius: 16, width: '100%', maxWidth: 480,
          boxShadow: m.shadow,
          display: 'flex', flexDirection: 'column', maxHeight: '80vh',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${m.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: m.textPri, marginBottom: 4 }}>
            Which of your decisions matches this?
          </div>
          {targetCommit && (
            <div style={{
              fontSize: 12, color: m.textSec, background: m.targetBg,
              borderRadius: 8, padding: '6px 10px', marginTop: 8,
              borderLeft: '3px solid oklch(52% 0.2 260)',
            }}>
              "{targetCommit.message}"
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${m.border}` }}>
          <input
            autoFocus
            placeholder="Search your decisions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
              border: `1px solid ${m.borderInput}`, outline: 'none',
              color: m.textPri, background: m.inputBg,
              boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = 'oklch(52% 0.2 260)'}
            onBlur={e => e.target.style.borderColor = m.borderInput}
          />
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: m.textMuted, fontSize: 13 }}>
              Loading your decisions…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: m.textMuted, fontSize: 13 }}>
              No decisions found
            </div>
          ) : filtered.map(d => {
            const isSelected = selected === d._id?.toString() || selected === d.id;
            const id = d.id || d._id?.toString();
            return (
              <button
                key={id}
                onClick={() => setSelected(id)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 4,
                  width: '100%', padding: '12px 20px', border: 'none', textAlign: 'left',
                  cursor: 'pointer', transition: 'background 0.1s',
                  background: isSelected ? m.rowSelected : m.bg,
                  borderBottom: `1px solid ${m.borderFaint}`,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = m.rowHover; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = m.bg; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                    background: d.branch_name === 'main' ? (isDark ? 'oklch(22% 0.08 140)' : 'oklch(94% 0.01 140)') : (isDark ? 'oklch(22% 0.06 290)' : 'oklch(94% 0.015 290)'),
                    color: d.branch_name === 'main' ? (isDark ? 'oklch(68% 0.18 140)' : 'oklch(38% 0.15 140)') : (isDark ? 'oklch(68% 0.18 290)' : 'oklch(38% 0.18 290)'),
                  }}>
                    {d.branch_name || 'main'}
                  </span>
                  {isSelected && (
                    <span style={{ marginLeft: 'auto', color: 'oklch(52% 0.2 260)', fontSize: 13 }}>✓</span>
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: m.textPri, lineHeight: 1.4 }}>
                  {d.decision}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: `1px solid ${m.border}`,
          display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 8, border: `1px solid ${m.borderInput}`,
              background: m.cancelBg, color: m.cancelText, fontSize: 13,
              fontWeight: 500, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => { if (selected) { onConfirm(selected); onClose(); } }}
            disabled={!selected}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: selected ? 'oklch(42% 0.2 260)' : (isDark ? 'oklch(28% 0.01 260)' : 'oklch(88% 0.008 260)'),
              color: selected ? 'white' : m.textMuted,
              fontSize: 13, fontWeight: 600, cursor: selected ? 'pointer' : 'default',
              transition: 'all 0.12s',
            }}
          >
            Merge
          </button>
        </div>
      </div>
    </div>
  );
}
