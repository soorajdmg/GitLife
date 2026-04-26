import { useState, useRef, useEffect } from 'react';
import { CATEGORIES } from '../../data/gitlife';
import { api } from '../../config/api';

const VISIBILITY_OPTIONS = [
  { value: 'public',    label: 'Public',     desc: 'Anyone can see this' },
  { value: 'followers', label: 'Followers',  desc: 'Only your followers' },
  { value: 'private',   label: 'Only me',    desc: 'Completely private'  },
];

export default function NewCommitModal({ onClose, onSubmit }) {
  const [commitType, setCommitType] = useState('main');
  const [msg, setMsg] = useState('');
  const [body, setBody] = useState('');
  const [cat, setCat] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchMode, setBranchMode] = useState('new');       // 'existing' | 'new'
  const [existingBranches, setExistingBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [image, setImage] = useState(null);   // { file, url }
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (commitType !== 'whatif') return;
    setLoadingBranches(true);
    api.getDecisions().then(decisions => {
      const names = [...new Set(
        decisions
          .filter(d => /^what-if\//i.test(d.branch_name || d.branch))
          .map(d => d.branch_name || d.branch)
      )];
      setExistingBranches(names);
      setBranchMode(names.length > 0 ? 'existing' : 'new');
      if (names.length > 0) setSelectedBranch(names[0]);
    }).catch(() => {}).finally(() => setLoadingBranches(false));
  }, [commitType]);

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
      : branchMode === 'existing'
        ? selectedBranch
        : `what-if/${branchName || 'untitled'}`;

    onSubmit({
      message: msg.trim(),
      body: body.trim() || null,
      category: cat || 'Career',
      branch: resolvedBranch,
      wi: commitType === 'whatif',
      isNewBranch: commitType === 'whatif' && branchMode === 'new',
      visibility,
      image: imageUrl,
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

  const iStyle = {
    width: '100%', padding: '9px 13px',
    border: '1px solid oklch(88% 0.008 260)', borderRadius: 9,
    fontSize: 13.5, color: 'oklch(18% 0.015 260)', background: 'white',
    outline: 'none', transition: 'border-color 0.15s', fontFamily: "'Plus Jakarta Sans', sans-serif",
    boxSizing: 'border-box',
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'oklch(15% 0.02 260 / 0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 18, padding: 28, width: 520, maxWidth: 'calc(100vw - 32px)', boxShadow: '0 24px 64px oklch(25% 0.05 260 / 0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 22, display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: 'oklch(93% 0.05 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'oklch(42% 0.2 260)' }}>+</span>
          New commit
        </div>

        {/* Branch type */}
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
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'oklch(50% 0.01 260)', marginBottom: 7 }}>Branch</div>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {[['existing', 'Existing branch'], ['new', 'New branch']].map(([mode, lbl]) => {
                const disabled = mode === 'existing' && existingBranches.length === 0;
                const active = branchMode === mode;
                return (
                  <button key={mode} onClick={() => !disabled && setBranchMode(mode)} disabled={disabled}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.12s', border: active ? '1px solid oklch(60% 0.19 55)' : '1px solid oklch(88% 0.008 260)', background: active ? 'oklch(60% 0.19 55)' : disabled ? 'oklch(96% 0.004 260)' : 'white', color: active ? 'white' : disabled ? 'oklch(72% 0.01 260)' : 'oklch(48% 0.01 260)' }}>
                    {lbl}
                  </button>
                );
              })}
            </div>

            {loadingBranches && (
              <div style={{ fontSize: 12, color: 'oklch(58% 0.01 260)', marginBottom: 8 }}>Loading branches…</div>
            )}

            {branchMode === 'existing' && !loadingBranches && (
              <>
                <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
                  style={{ ...iStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 34, cursor: 'pointer' }}
                  onFocus={e => e.target.style.borderColor = 'oklch(60% 0.19 55)'} onBlur={e => e.target.style.borderColor = 'oklch(88% 0.008 260)'}>
                  <option value="">— select a branch —</option>
                  {existingBranches.map(b => (
                    <option key={b} value={b}>{b.replace(/^what-if\//i, '')}</option>
                  ))}
                </select>
                {selectedBranch && (
                  <div style={{ fontSize: 11, color: 'oklch(60% 0.01 260)', marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{selectedBranch}</div>
                )}
              </>
            )}

            {branchMode === 'new' && !loadingBranches && (
              <>
                <input style={iStyle} placeholder="e.g. move-to-berlin" value={branchName} onChange={e => setBranchName(e.target.value)}
                  onFocus={e => e.target.style.borderColor = 'oklch(60% 0.19 55)'} onBlur={e => e.target.style.borderColor = 'oklch(88% 0.008 260)'} />
                <div style={{ fontSize: 11, color: 'oklch(60% 0.01 260)', marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>what-if/{branchName || 'branch-name'}</div>
              </>
            )}
          </div>
        )}

        {/* Commit message */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'oklch(50% 0.01 260)', marginBottom: 7 }}>Commit message</div>
          <input style={iStyle} placeholder="What decision did you make (or imagine)?" value={msg} onChange={e => setMsg(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'oklch(52% 0.2 260)'} onBlur={e => e.target.style.borderColor = 'oklch(88% 0.008 260)'} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'oklch(50% 0.01 260)', marginBottom: 7 }}>
            Description <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>(optional)</span>
          </div>
          <textarea style={{ ...iStyle, resize: 'vertical' }} rows={3} placeholder="Context, reasoning, how it felt..." value={body} onChange={e => setBody(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'oklch(52% 0.2 260)'} onBlur={e => e.target.style.borderColor = 'oklch(88% 0.008 260)'} />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
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

        {/* Image attachment */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'oklch(50% 0.01 260)', marginBottom: 7 }}>
            Reference image <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>(optional)</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          {!image ? (
            <button onClick={() => fileRef.current.click()}
              style={{ width: '100%', padding: '14px', borderRadius: 9, border: '1.5px dashed oklch(82% 0.012 260)', background: 'oklch(98% 0.005 260)', cursor: 'pointer', color: 'oklch(52% 0.01 260)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'oklch(62% 0.15 260)'; e.currentTarget.style.color = 'oklch(42% 0.2 260)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'oklch(82% 0.012 260)'; e.currentTarget.style.color = 'oklch(52% 0.01 260)'; }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
                <circle cx="5.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                <path d="M1.5 10.5l3.5-3 3 3 2-2 3.5 3.5" />
              </svg>
              Attach image
            </button>
          ) : (
            <div style={{ position: 'relative', borderRadius: 9, overflow: 'hidden', border: '1px solid oklch(88% 0.008 260)' }}>
              <img src={image.url} alt="reference" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
              <button onClick={removeImage}
                style={{ position: 'absolute', top: 7, right: 7, width: 26, height: 26, borderRadius: '50%', background: 'oklch(20% 0.01 260 / 0.65)', border: 'none', color: 'white', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                ×
              </button>
              <div style={{ padding: '6px 10px', fontSize: 11, color: 'oklch(52% 0.01 260)', background: 'oklch(97% 0.004 80)', borderTop: '1px solid oklch(91% 0.006 80)' }}>{image.file.name}</div>
            </div>
          )}
        </div>

        {/* Visibility */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'oklch(50% 0.01 260)', marginBottom: 7 }}>Visibility</div>
          <select value={visibility} onChange={e => setVisibility(e.target.value)}
            style={{ ...iStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 34, cursor: 'pointer' }}
            onFocus={e => e.target.style.borderColor = 'oklch(52% 0.2 260)'} onBlur={e => e.target.style.borderColor = 'oklch(88% 0.008 260)'}>
            {VISIBILITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label} — {opt.desc}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid oklch(88% 0.008 260)', background: 'white', fontSize: 13.5, fontWeight: 500, color: 'oklch(44% 0.01 260)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit}
            disabled={!msg.trim() || uploading || (commitType === 'whatif' && branchMode === 'existing' && !selectedBranch)}
            style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: (msg.trim() && !uploading && !(commitType === 'whatif' && branchMode === 'existing' && !selectedBranch)) ? 'oklch(52% 0.2 260)' : 'oklch(80% 0.05 260)', color: 'white', fontSize: 13.5, fontWeight: 600, cursor: (msg.trim() && !uploading && !(commitType === 'whatif' && branchMode === 'existing' && !selectedBranch)) ? 'pointer' : 'not-allowed', transition: 'background 0.15s', minWidth: 90 }}>{uploading ? 'Uploading…' : 'Commit'}</button>
        </div>
      </div>
    </div>
  );
}
