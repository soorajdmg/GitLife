import { useState } from 'react';
import { CATEGORIES } from '../../data/gitlife';

export default function NewCommitModal({ onClose, onSubmit }) {
  const [commitType, setCommitType] = useState('main');
  const [msg, setMsg] = useState('');
  const [body, setBody] = useState('');
  const [cat, setCat] = useState('');
  const [branchName, setBranchName] = useState('');

  const submit = () => {
    if (!msg.trim()) return;
    onSubmit({
      message: msg.trim(),
      body: body.trim() || null,
      category: cat || 'Career',
      branch: commitType === 'main' ? 'main' : `what-if/${branchName || 'untitled'}`,
      wi: commitType === 'whatif'
    });
    onClose();
  };

  const iStyle = {
    width: '100%', padding: '9px 13px',
    border: '1px solid oklch(88% 0.008 260)', borderRadius: 9,
    fontSize: 13.5, color: 'oklch(18% 0.015 260)', background: 'white',
    outline: 'none', transition: 'border-color 0.15s', fontFamily: "'Plus Jakarta Sans', sans-serif"
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'oklch(15% 0.02 260 / 0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 18, padding: 28, width: 520, maxWidth: 'calc(100vw - 32px)', boxShadow: '0 24px 64px oklch(25% 0.05 260 / 0.18)' }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 22, display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: 'oklch(93% 0.05 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'oklch(42% 0.2 260)' }}>+</span>
          New commit
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'oklch(50% 0.01 260)', marginBottom: 7 }}>Branch type</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['main', '● main — real life', 'oklch(52% 0.2 260)'], ['whatif', '⎇ what-if branch', 'oklch(60% 0.19 55)']].map(([val, lbl, clr]) => (
              <button key={val} onClick={() => setCommitType(val)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s', border: commitType === val ? `1px solid ${clr}` : '1px solid oklch(88% 0.008 260)', background: commitType === val ? clr : 'white', color: commitType === val ? 'white' : 'oklch(48% 0.01 260)' }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {commitType === 'whatif' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'oklch(50% 0.01 260)', marginBottom: 7 }}>Branch name</div>
            <input style={iStyle} placeholder="e.g. move-to-berlin" value={branchName} onChange={e => setBranchName(e.target.value)}
              onFocus={e => e.target.style.borderColor = 'oklch(52% 0.2 260)'} onBlur={e => e.target.style.borderColor = 'oklch(88% 0.008 260)'} />
            <div style={{ fontSize: 11, color: 'oklch(60% 0.01 260)', marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>what-if/{branchName || 'branch-name'}</div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'oklch(50% 0.01 260)', marginBottom: 7 }}>Commit message</div>
          <input style={iStyle} placeholder="What decision did you make (or imagine)?" value={msg} onChange={e => setMsg(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'oklch(52% 0.2 260)'} onBlur={e => e.target.style.borderColor = 'oklch(88% 0.008 260)'} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'oklch(50% 0.01 260)', marginBottom: 7 }}>
            Description <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>(optional)</span>
          </div>
          <textarea style={{ ...iStyle, resize: 'vertical' }} rows={3} placeholder="Context, reasoning, how it felt..." value={body} onChange={e => setBody(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'oklch(52% 0.2 260)'} onBlur={e => e.target.style.borderColor = 'oklch(88% 0.008 260)'} />
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'oklch(50% 0.01 260)', marginBottom: 7 }}>Category</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s', border: `1px solid ${cat === c ? 'oklch(52% 0.2 260)' : 'oklch(88% 0.008 260)'}`, background: cat === c ? 'oklch(52% 0.2 260)' : 'white', color: cat === c ? 'white' : 'oklch(48% 0.01 260)' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid oklch(88% 0.008 260)', background: 'white', fontSize: 13.5, fontWeight: 500, color: 'oklch(44% 0.01 260)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={!msg.trim()} style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: msg.trim() ? 'oklch(52% 0.2 260)' : 'oklch(80% 0.05 260)', color: 'white', fontSize: 13.5, fontWeight: 600, cursor: msg.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}>Commit</button>
        </div>
      </div>
    </div>
  );
}
