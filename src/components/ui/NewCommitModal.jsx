import { useState, useRef, useEffect } from 'react';
import { CATEGORIES } from '../../data/gitlife';
import { api } from '../../config/api';
import { useTheme } from '../../contexts/ThemeContext';

const VISIBILITY_OPTIONS = [
  { value: 'public',    label: 'Public',     desc: 'Anyone can see this' },
  { value: 'followers', label: 'Followers',  desc: 'Only your followers' },
  { value: 'private',   label: 'Only me',    desc: 'Completely private'  },
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

export default function NewCommitModal({ onClose, onSubmit, prefill }) {
  const { isDark } = useTheme();
  const [commitType, setCommitType] = useState(prefill ? 'what-if' : 'main');
  const [msg, setMsg] = useState(prefill?.message || '');
  const [body, setBody] = useState(prefill?.body || '');
  const [cat, setCat] = useState(prefill?.category || '');
  const [branchName, setBranchName] = useState('');
  const [existingBranches, setExistingBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchDropOpen, setBranchDropOpen] = useState(false);
  const branchDropRef = useRef();
  const [visibility, setVisibility] = useState('public');
  const [image, setImage] = useState(null);   // { file, url }
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  // Causal links state
  const [allDecisions, setAllDecisions] = useState([]);
  const [linksExpanded, setLinksExpanded] = useState(false);
  const [influences, setInfluences] = useState([]);  // [{ decisionId, decision, branch_name, timestamp, note }]
  const [influenceSearch, setInfluenceSearch] = useState('');
  const [influenceDropOpen, setInfluenceDropOpen] = useState(false);
  const influenceDropRef = useRef();

  useEffect(() => {
    if (!branchDropOpen) return;
    const handler = e => { if (branchDropRef.current && !branchDropRef.current.contains(e.target)) setBranchDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [branchDropOpen]);

  useEffect(() => {
    if (!influenceDropOpen) return;
    const handler = e => { if (influenceDropRef.current && !influenceDropRef.current.contains(e.target)) setInfluenceDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [influenceDropOpen]);

  // Fetch all decisions once on mount (used for branch picker + causal links search)
  useEffect(() => {
    api.getDecisions().then(decisions => {
      setAllDecisions(decisions);
    }).catch(() => {});
  }, []);

  // Derive existing branches from allDecisions when commitType changes to whatif
  useEffect(() => {
    if (commitType !== 'whatif') return;
    if (allDecisions.length === 0) {
      setLoadingBranches(true);
      return;
    }
    setLoadingBranches(false);
    const names = [...new Set(
      allDecisions
        .filter(d => /^what-if\//i.test(d.branch_name || d.branch))
        .map(d => d.branch_name || d.branch)
    )];
    setExistingBranches(names);
    setSelectedBranch(names.length > 0 ? names[0] : '__new__');
  }, [commitType, allDecisions]);

  const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const data = await res.json();
    return data.secure_url;
  };

  const submit = async () => {
    if (!msg.trim() || uploading) return;

    let imageUrl = null;
    if (image?.file) {
      setUploading(true);
      try {
        imageUrl = await uploadToCloudinary(image.file);
      } catch (err) {
        console.error('Image upload failed:', err);
        const proceed = window.confirm('Image upload failed. Post without the image?');
        if (!proceed) { setUploading(false); return; }
      } finally {
        setUploading(false);
      }
    }

    const resolvedBranch = commitType === 'main'
      ? 'main'
      : selectedBranch === '__new__'
        ? `what-if/${branchName || 'untitled'}`
        : selectedBranch;

    onSubmit({
      message: msg.trim(),
      body: body.trim() || null,
      category: cat || 'Career',
      branch: resolvedBranch,
      wi: commitType === 'whatif',
      isNewBranch: commitType === 'whatif' && selectedBranch === '__new__',
      visibility,
      image: imageUrl,
      influencedBy: influences.map(i => ({ decisionId: i.decisionId, note: i.note || '' })),
    });
    onClose();
  };

  const handleFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage({ file, url });
  };

  const removeImage = () => {
    if (image?.url) URL.revokeObjectURL(image.url);
    setImage(null);
    fileRef.current.value = '';
  };

  const addInfluence = (d) => {
    if (influences.find(i => i.decisionId === d.id)) return;
    setInfluences(prev => [...prev, { decisionId: d.id, decision: d.decision, branch_name: d.branch_name, timestamp: d.timestamp, note: '' }]);
    setInfluenceSearch('');
    setInfluenceDropOpen(false);
  };

  const removeInfluence = (decisionId) => {
    setInfluences(prev => prev.filter(i => i.decisionId !== decisionId));
  };

  const updateInfluenceNote = (decisionId, note) => {
    setInfluences(prev => prev.map(i => i.decisionId === decisionId ? { ...i, note } : i));
  };

  const influenceResults = influenceSearch.trim().length > 0
    ? allDecisions.filter(d =>
        !influences.find(i => i.decisionId === d.id) &&
        (d.decision || '').toLowerCase().includes(influenceSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const m = {
    bg:         isDark ? 'oklch(18% 0.01 260)'  : 'white',
    bgApp:      isDark ? 'oklch(14% 0.008 260)' : 'oklch(98.5% 0.005 80)',
    elevated:   isDark ? 'oklch(21% 0.012 260)' : 'oklch(98% 0.005 260)',
    border:     isDark ? 'oklch(30% 0.012 260)' : 'oklch(88% 0.008 260)',
    borderSub:  isDark ? 'oklch(26% 0.01 260)'  : 'oklch(91% 0.006 80)',
    borderFaint:isDark ? 'oklch(24% 0.01 260)'  : 'oklch(94% 0.004 80)',
    textPri:    isDark ? 'oklch(92% 0.008 260)' : 'oklch(18% 0.015 260)',
    textSec:    isDark ? 'oklch(65% 0.01 260)'  : 'oklch(48% 0.01 260)',
    textMuted:  isDark ? 'oklch(52% 0.01 260)'  : 'oklch(60% 0.01 260)',
    inputBg:    isDark ? 'oklch(22% 0.01 260)'  : 'white',
    inputBgSub: isDark ? 'oklch(20% 0.008 260)' : 'oklch(96% 0.012 260)',
    dropBg:     isDark ? 'oklch(21% 0.012 260)' : 'white',
    dropBorder: isDark ? 'oklch(30% 0.012 260)' : 'oklch(91% 0.006 80)',
    dropHover:  isDark ? 'oklch(25% 0.012 260)' : 'oklch(97% 0.006 80)',
    pillBg:     isDark ? 'oklch(22% 0.04 260)'  : 'oklch(96% 0.012 260)',
    pillBorder: isDark ? 'oklch(30% 0.04 260)'  : 'oklch(90% 0.015 260)',
    imageBg:    isDark ? 'oklch(20% 0.008 260)' : 'oklch(97% 0.004 80)',
    cancelBg:   isDark ? 'oklch(24% 0.012 260)' : 'white',
    cancelText: isDark ? 'oklch(68% 0.01 260)'  : 'oklch(44% 0.01 260)',
    shadow:     isDark ? '0 24px 64px oklch(5% 0.01 260 / 0.6)' : '0 24px 64px oklch(25% 0.05 260 / 0.18)',
  };

  const iStyle = {
    width: '100%', padding: '9px 13px',
    border: `1px solid ${m.border}`, borderRadius: 9,
    fontSize: 13.5, color: m.textPri, background: m.inputBg,
    outline: 'none', transition: 'border-color 0.15s', fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxSizing: 'border-box',
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'oklch(15% 0.02 260 / 0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: m.bg, borderRadius: 18, padding: 28, width: 520, maxWidth: 'calc(100vw - 32px)', boxShadow: m.shadow, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: prefill ? 10 : 22, display: 'flex', alignItems: 'center', gap: 9, color: m.textPri }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: isDark ? 'oklch(22% 0.05 260)' : 'oklch(93% 0.05 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'oklch(42% 0.2 260)' }}>⎇</span>
          {prefill ? 'Fork this path' : 'New commit'}
        </div>
        {prefill && (
          <div style={{ fontSize: 12, color: m.textSec, background: m.pillBg, border: `1px solid ${m.pillBorder}`, borderRadius: 8, padding: '7px 11px', marginBottom: 18 }}>
            Forking someone else's decision — edit it to make it yours, then choose a what-if branch.
          </div>
        )}

        {/* Branch type */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: m.textMuted, marginBottom: 7 }}>Branch type</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['main', '● main — real life', 'oklch(52% 0.2 260)'], ['whatif', '⎇ what-if branch', 'oklch(60% 0.19 55)']].map(([val, lbl, clr]) => (
              <button key={val} onClick={() => setCommitType(val)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s', border: commitType === val ? `1px solid ${clr}` : `1px solid ${m.border}`, background: commitType === val ? clr : m.inputBg, color: commitType === val ? 'white' : m.textSec }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {commitType === 'whatif' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: m.textMuted, marginBottom: 7 }}>Branch</div>

            {loadingBranches ? (
              <div style={{ fontSize: 12, color: m.textMuted, padding: '8px 0' }}>Loading branches…</div>
            ) : (
              <>
                {/* Custom branch picker */}
                <div ref={branchDropRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setBranchDropOpen(o => !o)}
                    style={{
                      ...iStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', textAlign: 'left',
                      borderColor: branchDropOpen ? 'oklch(60% 0.19 55)' : m.border,
                      background: m.inputBg,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      {selectedBranch === '__new__' ? (
                        <>
                          <span style={{ fontSize: 13, color: 'oklch(60% 0.19 55)', fontWeight: 600, lineHeight: 1 }}>+</span>
                          <span style={{ color: isDark ? 'oklch(65% 0.12 55)' : 'oklch(42% 0.12 55)', fontWeight: 500 }}>New branch…</span>
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="oklch(60% 0.19 55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <circle cx="5" cy="3" r="1.5"/><circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="3" r="1.5"/>
                            <path d="M5 4.5v7M11 4.5c0 3-6 4-6 7"/>
                          </svg>
                          <span style={{ color: m.textPri, fontWeight: 500 }}>
                            {selectedBranch.replace(/^what-if\//i, '')}
                          </span>
                        </>
                      )}
                    </span>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke={m.textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                      style={{ flexShrink: 0, transition: 'transform 0.15s', transform: branchDropOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <path d="M2 4l4 4 4-4"/>
                    </svg>
                  </button>

                  {branchDropOpen && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, zIndex: 20,
                      background: m.dropBg, border: `1px solid ${m.dropBorder}`, borderRadius: 10,
                      boxShadow: isDark ? '0 4px 20px oklch(5% 0.01 260 / 0.5)' : '0 4px 20px oklch(25% 0.05 260 / 0.12)', overflow: 'hidden',
                    }}>
                      {existingBranches.length > 0 && (
                        <>
                          <div style={{ padding: '7px 12px 4px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: m.textMuted }}>
                            Existing branches
                          </div>
                          {existingBranches.map(b => (
                            <button key={b} type="button"
                              onClick={() => { setSelectedBranch(b); setBranchDropOpen(false); }}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
                                fontSize: 13, fontWeight: selectedBranch === b ? 600 : 400,
                                background: selectedBranch === b ? (isDark ? 'oklch(22% 0.04 55)' : 'oklch(96% 0.015 60)') : m.dropBg,
                                color: selectedBranch === b ? 'oklch(42% 0.18 55)' : m.textPri,
                                transition: 'background 0.1s',
                              }}
                              onMouseEnter={e => { if (selectedBranch !== b) e.currentTarget.style.background = m.dropHover; }}
                              onMouseLeave={e => { e.currentTarget.style.background = selectedBranch === b ? (isDark ? 'oklch(22% 0.04 55)' : 'oklch(96% 0.015 60)') : m.dropBg; }}
                            >
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}>
                                <circle cx="5" cy="3" r="1.5"/><circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="3" r="1.5"/>
                                <path d="M5 4.5v7M11 4.5c0 3-6 4-6 7"/>
                              </svg>
                              {b.replace(/^what-if\//i, '')}
                              {selectedBranch === b && (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}>
                                  <path d="M2 6l3 3 5-5"/>
                                </svg>
                              )}
                            </button>
                          ))}
                          <div style={{ margin: '4px 12px', borderTop: `1px solid ${m.borderFaint}` }} />
                        </>
                      )}
                      <button type="button"
                        onClick={() => { setSelectedBranch('__new__'); setBranchDropOpen(false); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
                          fontSize: 13, fontWeight: selectedBranch === '__new__' ? 600 : 500,
                          background: selectedBranch === '__new__' ? (isDark ? 'oklch(22% 0.04 55)' : 'oklch(96% 0.015 60)') : m.dropBg,
                          color: selectedBranch === '__new__' ? 'oklch(42% 0.18 55)' : m.textSec,
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => { if (selectedBranch !== '__new__') e.currentTarget.style.background = m.dropHover; }}
                        onMouseLeave={e => { e.currentTarget.style.background = selectedBranch === '__new__' ? (isDark ? 'oklch(22% 0.04 55)' : 'oklch(96% 0.015 60)') : m.dropBg; }}
                      >
                        <span style={{ width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, lineHeight: 1, color: 'oklch(60% 0.19 55)', flexShrink: 0 }}>+</span>
                        New branch…
                        {selectedBranch === '__new__' && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}>
                            <path d="M2 6l3 3 5-5"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {selectedBranch && selectedBranch !== '__new__' && (
                  <div style={{ fontSize: 11, color: m.textMuted, marginTop: 5, fontFamily: "'JetBrains Mono', monospace" }}>{selectedBranch}</div>
                )}

                {selectedBranch === '__new__' && (
                  <div style={{ marginTop: 10 }}>
                    <input style={iStyle} placeholder="e.g. move-to-berlin" value={branchName} onChange={e => setBranchName(e.target.value)}
                      onFocus={e => e.target.style.borderColor = 'oklch(60% 0.19 55)'} onBlur={e => e.target.style.borderColor = m.border} />
                    <div style={{ fontSize: 11, color: m.textMuted, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>what-if/{branchName || 'branch-name'}</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Commit message */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: m.textMuted, marginBottom: 7 }}>Commit message</div>
          <input style={iStyle} placeholder="What decision did you make (or imagine)?" value={msg} onChange={e => setMsg(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'oklch(52% 0.2 260)'} onBlur={e => e.target.style.borderColor = m.border} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: m.textMuted, marginBottom: 7 }}>
            Description <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>(optional)</span>
          </div>
          <textarea style={{ ...iStyle, resize: 'vertical' }} rows={3} placeholder="Context, reasoning, how it felt..." value={body} onChange={e => setBody(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'oklch(52% 0.2 260)'} onBlur={e => e.target.style.borderColor = m.border} />
        </div>

        {/* Causal links */}
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setLinksExpanded(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%' }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: m.textMuted }}>
              Causal links
            </div>
            {influences.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, background: 'oklch(52% 0.2 260)', color: 'white', borderRadius: 4, padding: '1px 5px' }}>{influences.length}</span>
            )}
            <span style={{ fontSize: 13, color: m.textMuted, marginLeft: 'auto', transition: 'transform 0.15s', transform: linksExpanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>▾</span>
          </button>

          {linksExpanded && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11.5, color: m.textSec, marginBottom: 8 }}>
                What past decisions influenced this one?
              </div>

              {/* Selected influences as pills */}
              {influences.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  {influences.map(inf => (
                    <div key={inf.decisionId} style={{ background: m.pillBg, borderRadius: 8, padding: '7px 10px', border: `1px solid ${m.pillBorder}` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <div style={{ flex: 1, fontSize: 12.5, color: m.textPri, lineHeight: 1.35 }}>
                          {(inf.decision || '').length > 70 ? inf.decision.slice(0, 67) + '…' : inf.decision}
                        </div>
                        <button onClick={() => removeInfluence(inf.decisionId)}
                          style={{ padding: '1px 6px', borderRadius: 4, border: `1px solid ${m.border}`, background: m.inputBg, fontSize: 11.5, color: m.textSec, cursor: 'pointer', flexShrink: 0 }}>
                          ×
                        </button>
                      </div>
                      <input
                        placeholder="Why was this an influence? (optional)"
                        value={inf.note}
                        onChange={e => updateInfluenceNote(inf.decisionId, e.target.value)}
                        style={{ marginTop: 5, width: '100%', padding: '5px 8px', border: `1px solid ${m.border}`, borderRadius: 6, fontSize: 11.5, background: m.inputBg, color: m.textPri, boxSizing: 'border-box', outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        onFocus={e => e.target.style.borderColor = 'oklch(62% 0.15 260)'}
                        onBlur={e => e.target.style.borderColor = m.border}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Search input */}
              <div ref={influenceDropRef} style={{ position: 'relative' }}>
                <input
                  style={{ ...iStyle, fontSize: 13 }}
                  placeholder="Search past decisions…"
                  value={influenceSearch}
                  onChange={e => { setInfluenceSearch(e.target.value); setInfluenceDropOpen(true); }}
                  onFocus={e => { e.target.style.borderColor = 'oklch(52% 0.2 260)'; setInfluenceDropOpen(true); }}
                  onBlur={e => e.target.style.borderColor = m.border}
                />
                {influenceDropOpen && influenceResults.length > 0 && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30,
                    background: m.dropBg, border: `1px solid ${m.dropBorder}`, borderRadius: 9,
                    boxShadow: isDark ? '0 4px 20px oklch(5% 0.01 260 / 0.5)' : '0 4px 20px oklch(25% 0.05 260 / 0.12)', overflow: 'hidden', maxHeight: 220, overflowY: 'auto',
                  }}>
                    {influenceResults.map(d => (
                      <button key={d.id} type="button" onClick={() => addInfluence(d)}
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, padding: '9px 12px', border: 'none', cursor: 'pointer', textAlign: 'left', background: m.dropBg, transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = m.dropHover}
                        onMouseLeave={e => e.currentTarget.style.background = m.dropBg}
                      >
                        <div style={{ fontSize: 12.5, color: m.textPri, lineHeight: 1.3 }}>
                          {(d.decision || '').length > 65 ? d.decision.slice(0, 62) + '…' : d.decision}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 10.5, color: m.textSec, fontFamily: "'JetBrains Mono', monospace", background: m.pillBg, padding: '0 5px', borderRadius: 3 }}>
                            {(d.branch_name || 'main').replace(/^what-if\//i, '⎇ ')}
                          </span>
                          <span style={{ fontSize: 10.5, color: m.textMuted }}>{timeAgo(d.timestamp)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: m.textMuted, marginBottom: 7 }}>Category</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s', border: `1px solid ${cat === c ? 'oklch(52% 0.2 260)' : m.border}`, background: cat === c ? 'oklch(52% 0.2 260)' : m.inputBg, color: cat === c ? 'white' : m.textSec }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Image attachment */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: m.textMuted, marginBottom: 7 }}>
            Reference image <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>(optional)</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          {!image ? (
            <button onClick={() => fileRef.current.click()}
              style={{ width: '100%', padding: '14px', borderRadius: 9, border: `1.5px dashed ${m.border}`, background: m.imageBg, cursor: 'pointer', color: m.textSec, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'oklch(62% 0.15 260)'; e.currentTarget.style.color = 'oklch(42% 0.2 260)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = m.border; e.currentTarget.style.color = m.textSec; }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
                <circle cx="5.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                <path d="M1.5 10.5l3.5-3 3 3 2-2 3.5 3.5" />
              </svg>
              Attach image
            </button>
          ) : (
            <div style={{ position: 'relative', borderRadius: 9, overflow: 'hidden', border: `1px solid ${m.border}` }}>
              <img src={image.url} alt="reference" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
              <button onClick={removeImage}
                style={{ position: 'absolute', top: 7, right: 7, width: 26, height: 26, borderRadius: '50%', background: 'oklch(20% 0.01 260 / 0.65)', border: 'none', color: 'white', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                ×
              </button>
              <div style={{ padding: '6px 10px', fontSize: 11, color: m.textSec, background: m.imageBg, borderTop: `1px solid ${m.borderSub}` }}>{image.file.name}</div>
            </div>
          )}
        </div>

        {/* Visibility */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: m.textMuted, marginBottom: 7 }}>Visibility</div>
          <select value={visibility} onChange={e => setVisibility(e.target.value)}
            style={{ ...iStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 34, cursor: 'pointer' }}
            onFocus={e => e.target.style.borderColor = 'oklch(52% 0.2 260)'} onBlur={e => e.target.style.borderColor = m.border}>
            {VISIBILITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label} — {opt.desc}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${m.border}`, background: m.cancelBg, fontSize: 13.5, fontWeight: 500, color: m.cancelText, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit}
            disabled={!msg.trim() || uploading || (commitType === 'whatif' && selectedBranch === '__new__' && !branchName.trim())}
            style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: (msg.trim() && !uploading && !(commitType === 'whatif' && selectedBranch === '__new__' && !branchName.trim())) ? 'oklch(52% 0.2 260)' : 'oklch(80% 0.05 260)', color: 'white', fontSize: 13.5, fontWeight: 600, cursor: (msg.trim() && !uploading && !(commitType === 'whatif' && selectedBranch === '__new__' && !branchName.trim())) ? 'pointer' : 'not-allowed', transition: 'background 0.15s', minWidth: 90 }}>{uploading ? 'Uploading…' : 'Commit'}</button>
        </div>
      </div>
    </div>
  );
}
