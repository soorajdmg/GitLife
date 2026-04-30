import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../config/api';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';

/* ─── DARK TOKENS HELPER ─── */
function makeDk(isDark) {
  return {
    surface:   isDark ? 'oklch(18% 0.01 260)'  : 'white',
    elevated:  isDark ? 'oklch(21% 0.012 260)' : 'white',
    border:    isDark ? 'oklch(28% 0.012 260)' : 'oklch(91% 0.006 80)',
    borderSub: isDark ? 'oklch(25% 0.01 260)'  : 'oklch(96% 0.004 80)',
    borderRow: isDark ? 'oklch(25% 0.01 260)'  : 'oklch(96% 0.004 80)',
    textPri:   isDark ? 'oklch(94% 0.008 260)' : 'oklch(20% 0.01 260)',
    textSec:   isDark ? 'oklch(68% 0.01 260)'  : 'oklch(58% 0.01 260)',
    textMuted: isDark ? 'oklch(52% 0.01 260)'  : 'oklch(42% 0.01 260)',
    inputBg:   isDark ? 'oklch(22% 0.01 260)'  : 'white',
    inputBgDis:isDark ? 'oklch(20% 0.008 260)' : 'oklch(97% 0.004 80)',
    inputBdr:  isDark ? 'oklch(32% 0.012 260)' : 'oklch(88% 0.008 260)',
    btnBg:     isDark ? 'oklch(24% 0.012 260)' : 'white',
    btnBdr:    isDark ? 'oklch(34% 0.012 260)' : 'oklch(88% 0.008 260)',
    btnText:   isDark ? 'oklch(80% 0.008 260)' : 'oklch(42% 0.01 260)',
    toggleOff: isDark ? 'oklch(35% 0.01 260)'  : 'oklch(85% 0.008 260)',
    isDarkMode: isDark,
  };
}

/* ─── UI PRIMITIVES ─── */
function Toggle({ checked, onChange, disabled, dk }) {
  const offBg = dk?.toggleOff || 'oklch(85% 0.008 260)';
  return (
    <div onClick={() => !disabled && onChange(!checked)}
      style={{ width: 36, height: 20, borderRadius: 10, background: checked ? 'oklch(52% 0.2 260)' : offBg, cursor: disabled ? 'not-allowed' : 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, opacity: disabled ? 0.5 : 1 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 17 : 3, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px oklch(0% 0 0 / 0.2)' }} />
    </div>
  );
}

function Row({ label, sub, right, dk }) {
  const t = dk || {};
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: `1px solid ${t.borderRow || 'oklch(96% 0.004 80)'}` }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: t.textPri || 'oklch(20% 0.01 260)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: t.textSec || 'oklch(58% 0.01 260)', marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function SelectInput({ value, onChange, opts, disabled, dk }) {
  const t = dk || {};
  return (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
      style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${t.inputBdr || 'oklch(88% 0.008 260)'}`, fontSize: 12.5, fontFamily: "'Plus Jakarta Sans', sans-serif", color: t.textPri || 'oklch(25% 0.01 260)', background: disabled ? (t.inputBgDis || 'oklch(97% 0.004 80)') : (t.inputBg || 'white'), cursor: disabled ? 'not-allowed' : 'pointer', outline: 'none' }}>
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function Section({ title, children, dk }) {
  const t = dk || {};
  return (
    <div style={{ background: t.surface || 'white', borderRadius: 14, border: `1px solid ${t.border || 'oklch(91% 0.006 80)'}`, padding: '22px 24px', marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: t.textPri || 'oklch(22% 0.01 260)', marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${t.borderSub || 'oklch(94% 0.004 80)'}` }}>{title}</div>
      {children}
    </div>
  );
}

function FieldInput({ value, onChange, placeholder, type = 'text', disabled, dk }) {
  const t = dk || {};
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${t.inputBdr || 'oklch(88% 0.008 260)'}`, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: t.textPri || 'oklch(20% 0.01 260)', background: disabled ? (t.inputBgDis || 'oklch(97% 0.004 80)') : (t.inputBg || 'white'), outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
      onFocus={e => { if (!disabled) e.target.style.borderColor = 'oklch(60% 0.15 260)'; }}
      onBlur={e => e.target.style.borderColor = t.inputBdr || 'oklch(88% 0.008 260)'}
    />
  );
}

function Btn({ children, onClick, variant = 'default', disabled, loading, dk }) {
  const t = dk || {};
  const styles = {
    default: { border: `1px solid ${t.btnBdr || 'oklch(88% 0.008 260)'}`, background: t.btnBg || 'white', color: t.btnText || 'oklch(42% 0.01 260)' },
    primary: { border: '1px solid oklch(52% 0.2 260)', background: 'oklch(52% 0.2 260)', color: 'white' },
    danger: t.isDarkMode
      ? { border: '1px solid oklch(42% 0.2 20)', background: 'oklch(30% 0.14 20)', color: 'oklch(78% 0.18 20)' }
      : { border: '1px solid oklch(75% 0.15 20)', background: 'oklch(97% 0.015 20)', color: 'oklch(48% 0.2 20)' },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{ padding: '7px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: disabled || loading ? 'not-allowed' : 'pointer', transition: 'all 0.12s', opacity: disabled || loading ? 0.6 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif", ...styles[variant] }}>
      {loading ? 'Saving…' : children}
    </button>
  );
}

/* ─── AVATAR UPLOAD ─── */
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Image upload failed');
  const data = await res.json();
  return data.secure_url;
}

/* ─── EDIT PROFILE MODAL ─── */
function EditProfileModal({ user, onClose, onSaved, isDark }) {
  const dk = makeDk(isDark);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const ini = (user?.fullName || user?.username || '?').slice(0, 2).toUpperCase();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSave = async () => {
    setError('');
    if (!fullName.trim()) { setError('Full name is required'); return; }
    if (username.trim().length < 3) { setError('Username must be at least 3 characters'); return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) { setError('Username: letters, numbers, _ and - only'); return; }

    setSaving(true);
    try {
      let avatarUrl = avatarPreview;
      if (avatarFile) {
        avatarUrl = await uploadToCloudinary(avatarFile);
      } else if (avatarPreview === null && user?.avatarUrl) {
        avatarUrl = null;
      }

      const payload = { fullName: fullName.trim(), username: username.trim() };
      if (avatarUrl !== user?.avatarUrl) payload.avatarUrl = avatarUrl;

      const result = await api.updateProfile(payload);
      onSaved(result.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'oklch(0% 0 0 / 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: dk.surface, borderRadius: 16, width: 420, padding: '28px 28px 24px', boxShadow: isDark ? '0 16px 60px oklch(5% 0.01 260 / 0.6)' : '0 16px 60px oklch(25% 0.05 260 / 0.2)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 22, color: dk.textPri }}>Edit Profile</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${dk.border}` }} />
              : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'oklch(52% 0.2 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white' }}>{ini}</div>
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <Btn dk={dk} onClick={() => fileRef.current.click()}>Upload photo</Btn>
            {(avatarPreview || user?.avatarUrl) && (
              <button onClick={handleRemoveAvatar}
                style={{ fontSize: 12, color: 'oklch(50% 0.18 20)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                Remove photo
              </button>
            )}
            <div style={{ fontSize: 11, color: dk.textMuted }}>JPG, PNG · max 5MB</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: dk.textSec, marginBottom: 5 }}>Full Name</div>
            <FieldInput dk={dk} value={fullName} onChange={setFullName} placeholder="Your full name" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: dk.textSec, marginBottom: 5 }}>Username</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: dk.textMuted, fontSize: 13 }}>@</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="username"
                style={{ padding: '7px 12px 7px 24px', borderRadius: 8, border: `1px solid ${dk.inputBdr}`, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: dk.textPri, background: dk.inputBg, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'oklch(60% 0.15 260)'}
                onBlur={e => e.target.style.borderColor = dk.inputBdr}
              />
            </div>
          </div>
        </div>

        {error && <div style={{ fontSize: 12.5, color: 'oklch(48% 0.2 20)', background: isDark ? 'oklch(20% 0.06 20)' : 'oklch(97% 0.015 20)', borderRadius: 7, padding: '8px 12px', marginBottom: 14 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn dk={dk} onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn variant="primary" dk={dk} onClick={handleSave} loading={saving}>Save changes</Btn>
        </div>
      </div>
    </div>
  );
}

/* ─── CHANGE EMAIL MODAL ─── */
function ChangeEmailModal({ user, onClose, onSaved, isDark }) {
  const dk = makeDk(isDark);
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address'); return;
    }
    setSaving(true);
    try {
      const result = await api.updateProfile({ email: email.trim() });
      onSaved(result.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update email');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'oklch(0% 0 0 / 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: dk.surface, borderRadius: 16, width: 380, padding: '28px 28px 24px', boxShadow: isDark ? '0 16px 60px oklch(5% 0.01 260 / 0.6)' : '0 16px 60px oklch(25% 0.05 260 / 0.2)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: dk.textPri }}>Change Email</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: dk.textSec, marginBottom: 5 }}>New email address</div>
        <FieldInput dk={dk} value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
        {error && <div style={{ fontSize: 12.5, color: 'oklch(48% 0.2 20)', background: isDark ? 'oklch(20% 0.06 20)' : 'oklch(97% 0.015 20)', borderRadius: 7, padding: '8px 12px', marginTop: 10 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <Btn dk={dk} onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn variant="primary" dk={dk} onClick={handleSave} loading={saving}>Update email</Btn>
        </div>
      </div>
    </div>
  );
}

/* ─── CHANGE PASSWORD MODAL ─── */
function ChangePasswordModal({ onClose, isDark }) {
  const dk = makeDk(isDark);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { addToast } = useToast();

  const handleSave = async () => {
    setError('');
    if (!current) { setError('Enter your current password'); return; }
    if (next.length < 6) { setError('New password must be at least 6 characters'); return; }
    if (next !== confirm) { setError('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.changePassword(current, next);
      setSuccess(true);
      addToast({ message: 'Password updated successfully', type: 'success' });
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'oklch(0% 0 0 / 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: dk.surface, borderRadius: 16, width: 380, padding: '28px 28px 24px', boxShadow: isDark ? '0 16px 60px oklch(5% 0.01 260 / 0.6)' : '0 16px 60px oklch(25% 0.05 260 / 0.2)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: dk.textPri }}>Change Password</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {[['Current password', current, setCurrent], ['New password', next, setNext], ['Confirm new password', confirm, setConfirm]].map(([label, val, setter]) => (
            <div key={label}>
              <div style={{ fontSize: 12, fontWeight: 600, color: dk.textSec, marginBottom: 5 }}>{label}</div>
              <FieldInput dk={dk} value={val} onChange={setter} type="password" placeholder="••••••••" />
            </div>
          ))}
        </div>
        {error && <div style={{ fontSize: 12.5, color: 'oklch(48% 0.2 20)', background: isDark ? 'oklch(20% 0.06 20)' : 'oklch(97% 0.015 20)', borderRadius: 7, padding: '8px 12px', marginBottom: 12 }}>{error}</div>}
        {success && <div style={{ fontSize: 12.5, color: isDark ? 'oklch(65% 0.18 155)' : 'oklch(40% 0.18 155)', background: isDark ? 'oklch(20% 0.08 155)' : 'oklch(96% 0.04 155)', borderRadius: 7, padding: '8px 12px', marginBottom: 12 }}>Password updated!</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn dk={dk} onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn variant="primary" dk={dk} onClick={handleSave} loading={saving}>Update password</Btn>
        </div>
      </div>
    </div>
  );
}

/* ─── DELETE ACCOUNT MODAL ─── */
function DeleteAccountModal({ user, onClose, onDeleted, isDark }) {
  const dk = makeDk(isDark);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const expected = user?.username || '';

  const handleDelete = async () => {
    if (confirmText !== expected) {
      setError(`Type your username "${expected}" to confirm`);
      return;
    }
    setDeleting(true);
    try {
      await api.deleteAccount();
      onDeleted();
    } catch (err) {
      setError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'oklch(0% 0 0 / 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}
      onClick={e => { if (e.target === e.currentTarget && !deleting) onClose(); }}>
      <div style={{ background: dk.surface, borderRadius: 16, width: 420, padding: '28px 28px 24px', boxShadow: isDark ? '0 16px 60px oklch(5% 0.01 260 / 0.6)' : '0 16px 60px oklch(25% 0.05 260 / 0.2)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: isDark ? 'oklch(65% 0.2 20)' : 'oklch(35% 0.18 20)' }}>Delete account</div>
        <div style={{ fontSize: 13, color: dk.textSec, marginBottom: 20, lineHeight: 1.6 }}>
          This will permanently delete your account, all your commits, branches, and data. This cannot be undone.
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: dk.textSec, marginBottom: 5 }}>
          Type <span style={{ fontFamily: "'JetBrains Mono', monospace", background: isDark ? 'oklch(24% 0.01 260)' : 'oklch(96% 0.006 80)', padding: '1px 5px', borderRadius: 4, color: dk.textPri }}>{expected}</span> to confirm
        </div>
        <FieldInput dk={dk} value={confirmText} onChange={setConfirmText} placeholder={expected} />
        {error && <div style={{ fontSize: 12.5, color: 'oklch(48% 0.2 20)', background: isDark ? 'oklch(20% 0.06 20)' : 'oklch(97% 0.015 20)', borderRadius: 7, padding: '8px 12px', marginTop: 10 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <Btn dk={dk} onClick={onClose} disabled={deleting}>Cancel</Btn>
          <Btn variant="danger" dk={dk} onClick={handleDelete} loading={deleting}>Delete my account</Btn>
        </div>
      </div>
    </div>
  );
}

/* ─── DEFAULT PREFERENCES ─── */
const DEFAULT_PREFS = {
  notifications: { reactions: true, follows: true, whatifs: true, digest: false },
  privacy: { mainPublic: true, branchesPublic: true, activityPublic: true },
  appearance: 'light',
  language: 'en',
};

/* ─── MAIN SETTINGS VIEW ─── */
export default function SettingsView({ saveRef, onHasChanges }) {
  const { user, updateUser, logout } = useAuth();
  const { addToast } = useToast();
  const { setTheme, isDark } = useTheme();
  const dk = makeDk(isDark);

  const [modal, setModal] = useState(null);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [savedPrefs, setSavedPrefs] = useState(DEFAULT_PREFS); // last-saved snapshot
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const username = user?.username || user?.email?.split('@')[0] || 'You';
  const fullName = user?.fullName || username;
  const email = user?.email || '';
  const ini = fullName.slice(0, 2).toUpperCase();

  // Load preferences on mount
  useEffect(() => {
    let cancelled = false;
    api.getPreferences()
      .then(res => {
        if (!cancelled) {
          setPrefs(res.preferences);
          setSavedPrefs(res.preferences);
          if (res.preferences.appearance) setTheme(res.preferences.appearance);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPrefsLoading(false); });
    return () => { cancelled = true; };
  }, [setTheme]);

  // Keep dirty flag in sync with parent
  useEffect(() => {
    const dirty = JSON.stringify(prefs) !== JSON.stringify(savedPrefs);
    onHasChanges?.(dirty);
  }, [prefs, savedPrefs, onHasChanges]);

  // Register save function into parent's ref
  useEffect(() => {
    if (!saveRef) return;
    saveRef.current = async () => {
      try {
        await api.updatePreferences(prefs);
        setSavedPrefs(prefs);
        addToast({ message: 'Preferences saved', type: 'success' });
      } catch {
        addToast({ message: 'Failed to save preferences', type: 'error' });
        throw new Error('save failed');
      }
    };
  }, [prefs, saveRef, addToast]);

  // Reset dirty state when navigating away
  useEffect(() => {
    return () => { onHasChanges?.(false); };
  }, [onHasChanges]);

  const handleProfileSaved = (updatedUser) => {
    updateUser(updatedUser);
    addToast({ message: 'Profile updated', type: 'success' });
  };

  const setNotif = (key, val) =>
    setPrefs(p => ({ ...p, notifications: { ...p.notifications, [key]: val } }));

  const setPrivacy = (key, val) =>
    setPrefs(p => ({ ...p, privacy: { ...p.privacy, [key]: val } }));

  const setAppearance = (val) => {
    setPrefs(p => ({ ...p, appearance: val }));
    setTheme(val);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gitlife-export-${username}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ message: 'Data exported successfully', type: 'success' });
    } catch {
      addToast({ message: 'Export failed', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleAccountDeleted = () => {
    addToast({ message: 'Account deleted', type: 'info' });
    logout();
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: isDark ? 'oklch(14% 0.008 260)' : 'oklch(98.5% 0.005 80)' }}>
      <div style={{ maxWidth: 'clamp(600px, 60vw, 780px)', margin: '0 auto', padding: 'clamp(20px, 3vw, 36px) clamp(20px, 3vw, 40px) 60px' }}>

        {/* Account Section */}
        <Section title="Account" dk={dk}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="avatar" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${dk.border}` }} referrerPolicy="no-referrer" />
              : <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'oklch(52% 0.2 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0 }}>{ini}</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: dk.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</div>
              <div style={{ fontSize: 12, color: dk.textSec, fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>@{username}</div>
            </div>
            <Btn dk={dk} onClick={() => setModal('editProfile')}>Edit profile</Btn>
          </div>

          <Row dk={dk}
            label="Email"
            sub={email}
            right={<Btn dk={dk} onClick={() => setModal('changeEmail')}>Change</Btn>}
          />
          <Row dk={dk}
            label="Password"
            sub="Update your login password"
            right={<Btn dk={dk} onClick={() => setModal('changePassword')}>Update</Btn>}
          />
          <Row dk={dk}
            label="Member since"
            sub={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            right={null}
          />
          <Row dk={dk}
            label="Sign out"
            sub="Log out of your account on this device"
            right={<Btn variant="danger" dk={dk} onClick={logout}>Sign out</Btn>}
          />
        </Section>

        {/* Notifications Section — coming soon */}
        <Section title="Notifications" dk={dk}>
          <div style={{ fontSize: 12, color: isDark ? 'oklch(60% 0.15 260)' : 'oklch(48% 0.18 260)', background: isDark ? 'oklch(20% 0.06 260)' : 'oklch(95% 0.02 260)', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
            Notification delivery is coming soon. Your preferences will be saved and applied when it launches.
          </div>
          {[
            ['reactions', 'Reactions on your commits', 'When someone forks, merges or supports your decisions'],
            ['follows',   'New followers',             'When someone starts following your life'],
            ['whatifs',   'Branch activity',           'Updates on your what-if branches'],
            ['digest',    'Weekly digest',             'A summary of what people in your network are up to'],
          ].map(([key, label, sub]) => (
            <Row key={key} dk={dk} label={label} sub={sub} right={
              <Toggle
                dk={dk}
                checked={prefs.notifications[key]}
                onChange={val => setNotif(key, val)}
                disabled={prefsLoading}
              />
            } />
          ))}
        </Section>

        {/* Privacy Section */}
        <Section title="Privacy" dk={dk}>
          {[
            ['mainPublic',     'Public main branch',      'Anyone can see your real-life decisions'],
            ['branchesPublic', 'Public what-if branches', 'Anyone can see your hypothetical branches'],
            ['activityPublic', 'Show activity graph',     'Display your commit activity on your profile'],
          ].map(([key, label, sub]) => (
            <Row key={key} dk={dk} label={label} sub={sub} right={
              <Toggle
                dk={dk}
                checked={prefs.privacy[key]}
                onChange={val => setPrivacy(key, val)}
                disabled={prefsLoading}
              />
            } />
          ))}
        </Section>

        {/* Preferences Section */}
        <Section title="Preferences" dk={dk}>
          <Row dk={dk}
            label="Appearance"
            sub="Interface theme"
            right={
              <SelectInput
                dk={dk}
                value={prefs.appearance}
                onChange={setAppearance}
                disabled={prefsLoading}
                opts={[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']]}
              />
            }
          />
        </Section>

        {/* Data & Export Section */}
        <Section title="Data & Export" dk={dk}>
          <Row dk={dk}
            label="Export my life data"
            sub="Download all your commits and branches as JSON"
            right={<Btn dk={dk} onClick={handleExport} loading={exporting}>Export</Btn>}
          />
          <Row dk={dk}
            label="Delete account"
            sub="Permanently remove your account and all data"
            right={<Btn variant="danger" dk={dk} onClick={() => setModal('deleteAccount')}>Delete</Btn>}
          />
        </Section>

      </div>

      {/* Modals */}
      {modal === 'editProfile' && (
        <EditProfileModal user={user} onClose={() => setModal(null)} onSaved={handleProfileSaved} isDark={isDark} />
      )}
      {modal === 'changeEmail' && (
        <ChangeEmailModal user={user} onClose={() => setModal(null)} onSaved={handleProfileSaved} isDark={isDark} />
      )}
      {modal === 'changePassword' && (
        <ChangePasswordModal onClose={() => setModal(null)} isDark={isDark} />
      )}
      {modal === 'deleteAccount' && (
        <DeleteAccountModal user={user} onClose={() => setModal(null)} onDeleted={handleAccountDeleted} isDark={isDark} />
      )}
    </div>
  );
}
