import { useState } from 'react';
import BlameBadge from '../ui/BlameBadge.jsx';
import { api } from '../../config/api.js';
import { queryClient, QUERY_KEYS } from '../../config/queryClient.js';

const BLAME_STATUSES = [
  { value: 'broken',        label: '⚠ Mark as broken',   color: 'oklch(60% 0.18 30)'  },
  { value: 'investigating', label: '⟳ Investigating',    color: 'oklch(55% 0.18 55)'  },
  { value: 'resolved',      label: '✓ Mark as resolved', color: 'oklch(45% 0.18 155)' },
];

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function BlameChainPanel({
  node,           // selected decision node data
  allNodes,       // all nodes in graph (to compute dependents)
  onClose,
  onConnectMode,  // callback to trigger canvas connect mode
}) {
  const [blameNote, setBlameNote] = useState(node?.blameNote || '');
  const [savingBlame, setSavingBlame] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [allDecisions, setAllDecisions] = useState(null);

  if (!node) return null;

  const influencedBy = node.influencedBy || [];
  const dependents = allNodes.filter(n =>
    (n.data?.influencedBy || []).some(e => e.decisionId === node.id)
  );

  const handleBlameStatus = async (status) => {
    setSavingBlame(true);
    try {
      await api.setDecisionBlame(node.id, status, blameNote || null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.decisionGraph });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingBlame(false);
    }
  };

  const handleClearBlame = async () => {
    setSavingBlame(true);
    try {
      await api.setDecisionBlame(node.id, null, null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.decisionGraph });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingBlame(false);
    }
  };

  const handleRemoveLink = async (decisionId) => {
    try {
      await api.updateDecisionLinks(node.id, [], [decisionId]);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.decisionGraph });
    } catch (e) {
      console.error(e);
    }
  };

  const label = (txt) => (
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'oklch(52% 0.01 260)', marginBottom: 6 }}>
      {txt}
    </div>
  );

  const sectionStyle = { marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid oklch(93% 0.005 260)' };

  return (
    <div style={{
      position: 'absolute', right: 0, top: 0, bottom: 0, width: 340,
      background: 'white', borderLeft: '1px solid oklch(90% 0.005 260)',
      boxShadow: '-4px 0 20px oklch(25% 0.05 260 / 0.08)',
      overflowY: 'auto', zIndex: 20, display: 'flex', flexDirection: 'column',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid oklch(93% 0.005 260)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'oklch(18% 0.015 260)', lineHeight: 1.4, marginBottom: 5, wordBreak: 'break-word' }}>
            {node.decision}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10.5, color: 'oklch(55% 0.01 260)', fontFamily: "'JetBrains Mono', monospace", background: 'oklch(95% 0.005 260)', padding: '1px 6px', borderRadius: 4 }}>
              {(node.branch_name || 'main').replace(/^what-if\//i, '⎇ ')}
            </span>
            <span style={{ fontSize: 10.5, color: 'oklch(58% 0.01 260)' }}>{timeAgo(node.timestamp)}</span>
            {node.blameStatus && <BlameBadge status={node.blameStatus} />}
          </div>
        </div>
        <button onClick={onClose} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid oklch(88% 0.008 260)', background: 'white', fontSize: 13, cursor: 'pointer', color: 'oklch(44% 0.01 260)', flexShrink: 0 }}>×</button>
      </div>

      <div style={{ flex: 1, padding: '16px 18px', overflowY: 'auto' }}>

        {/* Blame status */}
        <div style={sectionStyle}>
          {label('Blame status')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <textarea
              placeholder="What went wrong? (optional note)"
              value={blameNote}
              onChange={e => setBlameNote(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid oklch(88% 0.008 260)', borderRadius: 7, fontSize: 12.5, resize: 'vertical', fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'oklch(20% 0.015 260)', boxSizing: 'border-box', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {BLAME_STATUSES.map(s => (
                <button key={s.value} disabled={savingBlame} onClick={() => handleBlameStatus(s.value)}
                  style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: `1px solid ${s.color}22`, background: node.blameStatus === s.value ? s.color + '22' : 'white', color: s.color, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s' }}>
                  {s.label}
                </button>
              ))}
            </div>
            {node.blameStatus && (
              <button disabled={savingBlame} onClick={handleClearBlame}
                style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid oklch(88% 0.008 260)', background: 'white', fontSize: 11, color: 'oklch(48% 0.01 260)', cursor: 'pointer' }}>
                Clear blame
              </button>
            )}
          </div>
        </div>

        {/* Influencers */}
        <div style={sectionStyle}>
          {label(`Influenced by (${influencedBy.length})`)}
          {influencedBy.length === 0 ? (
            <div style={{ fontSize: 12, color: 'oklch(62% 0.01 260)', fontStyle: 'italic' }}>No influences linked yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {influencedBy.map(e => {
                const refNode = allNodes.find(n => n.id === e.decisionId);
                return (
                  <div key={e.decisionId} style={{ background: 'oklch(97% 0.004 260)', borderRadius: 7, padding: '7px 10px', border: '1px solid oklch(92% 0.005 260)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <div style={{ flex: 1, fontSize: 12, color: 'oklch(22% 0.015 260)', lineHeight: 1.35 }}>
                        {refNode?.data?.decision || e.decisionId}
                      </div>
                      <button onClick={() => handleRemoveLink(e.decisionId)}
                        style={{ padding: '1px 6px', borderRadius: 4, border: '1px solid oklch(88% 0.008 260)', background: 'white', fontSize: 11, color: 'oklch(52% 0.01 260)', cursor: 'pointer', flexShrink: 0 }}>
                        ×
                      </button>
                    </div>
                    {e.note && <div style={{ fontSize: 11, color: 'oklch(52% 0.01 260)', marginTop: 4, fontStyle: 'italic' }}>"{e.note}"</div>}
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={onConnectMode}
            style={{ marginTop: 8, width: '100%', padding: '7px', borderRadius: 7, border: '1.5px dashed oklch(82% 0.012 260)', background: 'white', fontSize: 12, color: 'oklch(48% 0.1 260)', cursor: 'pointer', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'oklch(62% 0.15 260)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'oklch(82% 0.012 260)'; }}>
            + Connect to an influence on canvas
          </button>
        </div>

        {/* Dependents */}
        <div>
          {label(`Decisions that depend on this (${dependents.length})`)}
          {dependents.length === 0 ? (
            <div style={{ fontSize: 12, color: 'oklch(62% 0.01 260)', fontStyle: 'italic' }}>Nothing depends on this yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dependents.map(n => (
                <div key={n.id} style={{ background: 'oklch(97% 0.004 260)', borderRadius: 7, padding: '7px 10px', border: '1px solid oklch(92% 0.005 260)', fontSize: 12, color: 'oklch(22% 0.015 260)', lineHeight: 1.35 }}>
                  {n.data?.decision || n.id}
                  {n.data?.blameStatus && <span style={{ marginLeft: 6 }}><BlameBadge status={n.data.blameStatus} /></span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
