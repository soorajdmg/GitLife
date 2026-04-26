import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../config/api';
import { useToast } from '../contexts/ToastContext';

/* ─── UI PRIMITIVES ─── */
function Toggle({ checked, onChange, disabled }) {
  return (
    <div onClick={() => !disabled && onChange(!checked)}
      style={{ width: 36, height: 20, borderRadius: 10, background: checked ? 'oklch(52% 0.2 260)' : 'oklch(85% 0.008 260)', cursor: disabled ? 'not-allowed' : 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, opacity: disabled ? 0.5 : 1 }}>
      <div style={{ position: 'absolute', top: 3, left: checked ? 17 : 3, width: 14, height: 14, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px oklch(0% 0 0 / 0.2)' }} />
    </div>
  );
}

function Row({ label, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid oklch(96% 0.004 80)' }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'oklch(20% 0.01 260)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: 'oklch(58% 0.01 260)', marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function SelectInput({ value, onChange, opts }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid oklch(88% 0.008 260)', fontSize: 12.5, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'oklch(25% 0.01 260)', background: 'white', cursor: 'pointer', outline: 'none' }}>
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid oklch(91% 0.006 80)', padding: '22px 24px', marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'oklch(22% 0.01 260)', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid oklch(94% 0.004 80)' }}>{title}</div>
      {children}
    </div>
  );
}

function FieldInput({ value, onChange, placeholder, type = 'text', disabled }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid oklch(88% 0.008 260)', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'oklch(20% 0.01 260)', background: disabled ? 'oklch(97% 0.004 80)' : 'white', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
      onFocus={e => { if (!disabled) e.target.style.borderColor = 'oklch(60% 0.15 260)'; }}
      onBlur={e => e.target.style.borderColor = 'oklch(88% 0.008 260)'}
    />
  );
}

function Btn({ children, onClick, variant = 'default', disabled, loading }) {
  const styles = {
    default: { border: '1px solid oklch(88% 0.008 260)', background: 'white', color: 'oklch(42% 0.01 260)' },
    primary: { border: '1px solid oklch(52% 0.2 260)', background: 'oklch(52% 0.2 260)', color: 'white' },
    danger: { border: '1px solid oklch(75% 0.15 20)', background: 'oklch(97% 0.015 20)', color: 'oklch(48% 0.2 20)' },
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
function EditProfileModal({ user, onClose, onSaved }) {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const avatarColor = 'oklch(52% 0.2 260)';
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
        avatarUrl = null; // intentionally removed
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
      <div style={{ background: 'white', borderRadius: 16, width: 420, padding: '28px 28px 24px', boxShadow: '0 16px 60px oklch(25% 0.05 260 / 0.2)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 22 }}>Edit Profile</div>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid oklch(91% 0.006 80)' }} />
              : <div style={{ width: 72, height: 72, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white' }}>{ini}</div>
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <Btn onClick={() => fileRef.current.click()}>Upload photo</Btn>
            {(avatarPreview || user?.avatarUrl) && (
              <button onClick={handleRemoveAvatar}
                style={{ fontSize: 12, color: 'oklch(50% 0.18 20)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                Remove photo
              </button>
            )}
            <div style={{ fontSize: 11, color: 'oklch(62% 0.01 260)' }}>JPG, PNG · max 5MB</div>
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'oklch(42% 0.01 260)', marginBottom: 5 }}>Full Name</div>
            <FieldInput value={fullName} onChange={setFullName} placeholder="Your full name" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'oklch(42% 0.01 260)', marginBottom: 5 }}>Username</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'oklch(60% 0.01 260)', fontSize: 13 }}>@</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="username"
                style={{ padding: '7px 12px 7px 24px', borderRadius: 8, border: '1px solid oklch(88% 0.008 260)', fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'oklch(20% 0.01 260)', background: 'white', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {error && <div style={{ fontSize: 12.5, color: 'oklch(48% 0.2 20)', background: 'oklch(97% 0.015 20)', borderRadius: 7, padding: '8px 12px', marginBottom: 14 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave} loading={saving}>Save changes</Btn>
        </div>
      </div>
    </div>
  );
}

/* ─── CHANGE EMAIL MODAL ─── */
function ChangeEmailModal({ user, onClose, onSaved }) {
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
      <div style={{ background: 'white', borderRadius: 16, width: 380, padding: '28px 28px 24px', boxShadow: '0 16px 60px oklch(25% 0.05 260 / 0.2)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Change Email</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'oklch(42% 0.01 260)', marginBottom: 5 }}>New email address</div>
        <FieldInput value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
        {error && <div style={{ fontSize: 12.5, color: 'oklch(48% 0.2 20)', background: 'oklch(97% 0.015 20)', borderRadius: 7, padding: '8px 12px', marginTop: 10 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <Btn onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave} loading={saving}>Update email</Btn>
        </div>
      </div>
    </div>
  );
}

/* ─── CHANGE PASSWORD MODAL ─── */
function ChangePasswordModal({ onClose }) {
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
      <div style={{ background: 'white', borderRadius: 16, width: 380, padding: '28px 28px 24px', boxShadow: '0 16px 60px oklch(25% 0.05 260 / 0.2)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Change Password</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {[['Current password', current, setCurrent], ['New password', next, setNext], ['Confirm new password', confirm, setConfirm]].map(([label, val, setter]) => (
            <div key={label}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'oklch(42% 0.01 260)', marginBottom: 5 }}>{label}</div>
              <FieldInput value={val} onChange={setter} type="password" placeholder="••••••••" />
            </div>
          ))}
        </div>
        {error && <div style={{ fontSize: 12.5, color: 'oklch(48% 0.2 20)', background: 'oklch(97% 0.015 20)', borderRadius: 7, padding: '8px 12px', marginBottom: 12 }}>{error}</div>}
        {success && <div style={{ fontSize: 12.5, color: 'oklch(40% 0.18 155)', background: 'oklch(96% 0.04 155)', borderRadius: 7, padding: '8px 12px', marginBottom: 12 }}>Password updated!</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave} loading={saving}>Update password</Btn>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN SETTINGS VIEW ─── */
export default function SettingsView() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [modal, setModal] = useState(null); // 'editProfile' | 'changeEmail' | 'changePassword'

  const username = user?.username || user?.email?.split('@')[0] || 'You';
  const fullName = user?.fullName || username;
  const email = user?.email || '';
  const ini = fullName.slice(0, 2).toUpperCase();

  const handleProfileSaved = (updatedUser) => {
    updateUser(updatedUser);
    addToast({ message: 'Profile updated', type: 'success' });
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 28px 60px' }}>

        {/* Account Section */}
        <Section title="Account">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="avatar" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid oklch(91% 0.006 80)' }} referrerPolicy="no-referrer" />
              : <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'oklch(52% 0.2 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0 }}>{ini}</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</div>
              <div style={{ fontSize: 12, color: 'oklch(55% 0.01 260)', fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>@{username}</div>
            </div>
            <Btn onClick={() => setModal('editProfile')}>Edit profile</Btn>
          </div>

          <Row
            label="Email"
            sub={email}
            right={<Btn onClick={() => setModal('changeEmail')}>Change</Btn>}
          />
          <Row
            label="Password"
            sub="Update your login password"
            right={<Btn onClick={() => setModal('changePassword')}>Update</Btn>}
          />
          <Row
            label="Member since"
            sub={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            right={null}
          />
        </Section>

        {/* Notifications Section */}
        <Section title="Notifications">
          <div style={{ fontSize: 12, color: 'oklch(60% 0.01 260)', marginBottom: 10, background: 'oklch(96% 0.008 80)', borderRadius: 8, padding: '8px 12px' }}>
            Notification preferences coming soon — stay tuned.
          </div>
          {[
            ['reactions', 'Reactions on your commits', 'When someone forks, merges or supports your decisions'],
            ['follows',   'New followers',             'When someone starts following your life'],
            ['whatifs',   'Branch activity',           'Updates on your what-if branches'],
            ['digest',    'Weekly digest',             'A summary of what people in your network are up to'],
          ].map(([key, label, sub]) => (
            <Row key={key} label={label} sub={sub} right={<Toggle checked={true} onChange={() => {}} disabled />} />
          ))}
        </Section>

        {/* Privacy Section */}
        <Section title="Privacy">
          <div style={{ fontSize: 12, color: 'oklch(60% 0.01 260)', marginBottom: 10, background: 'oklch(96% 0.008 80)', borderRadius: 8, padding: '8px 12px' }}>
            Privacy controls coming soon.
          </div>
          {[
            ['mainPublic',     'Public main branch',      'Anyone can see your real-life decisions'],
            ['branchesPublic', 'Public what-if branches', 'Anyone can see your hypothetical branches'],
            ['activityPublic', 'Show activity graph',     'Display your commit activity on your profile'],
          ].map(([key, label, sub]) => (
            <Row key={key} label={label} sub={sub} right={<Toggle checked={true} onChange={() => {}} disabled />} />
          ))}
        </Section>

        {/* Preferences Section */}
        <Section title="Preferences">
          <Row label="Appearance" sub="Interface theme (coming soon)" right={<SelectInput value="system" onChange={() => {}} opts={[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']]} />} />
          <Row label="Language" sub="Interface language" right={<SelectInput value="en" onChange={() => {}} opts={[['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'], ['ja', '日本語']]} />} />
        </Section>

        {/* Data & Export Section */}
        <Section title="Data & Export">
          <Row label="Export my life data" sub="Download all your commits and branches as JSON" right={<Btn>Export</Btn>} />
          <Row
            label="Delete account"
            sub="Permanently remove your account and all data"
            right={<Btn variant="danger">Delete</Btn>}
          />
        </Section>

      </div>

      {/* Modals */}
      {modal === 'editProfile' && (
        <EditProfileModal user={user} onClose={() => setModal(null)} onSaved={handleProfileSaved} />
      )}
      {modal === 'changeEmail' && (
        <ChangeEmailModal user={user} onClose={() => setModal(null)} onSaved={handleProfileSaved} />
      )}
      {modal === 'changePassword' && (
        <ChangePasswordModal onClose={() => setModal(null)} />
      )}
    </div>
  );
}
