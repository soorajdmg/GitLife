import { useState } from 'react';
import { ME } from '../data/gitlife';

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)}
      style={{ width: 36, height: 20, borderRadius: 10, background: checked ? 'oklch(52% 0.2 260)' : 'oklch(85% 0.008 260)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
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

export default function SettingsView() {
  const [notifs, setNotifs] = useState({ reactions: true, follows: true, whatifs: false, digest: true });
  const [privacy, setPrivacy] = useState({ mainPublic: true, branchesPublic: false, activityPublic: true });
  const [theme, setTheme] = useState('system');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [language, setLanguage] = useState('en');

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 28px 60px' }}>

        <Section title="Account">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: ME.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white' }}>{ME.ini}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{ME.name}</div>
              <div style={{ fontSize: 12, color: 'oklch(55% 0.01 260)', fontFamily: "'JetBrains Mono', monospace" }}>{ME.handle}</div>
            </div>
            <button style={{ marginLeft: 'auto', padding: '7px 16px', borderRadius: 8, border: '1px solid oklch(88% 0.008 260)', background: 'white', fontSize: 13, fontWeight: 500, color: 'oklch(42% 0.01 260)', cursor: 'pointer' }}>Edit profile</button>
          </div>
          <Row label="Email" sub="alex@gitlife.app" right={<button style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid oklch(88% 0.008 260)', background: 'white', fontSize: 12, color: 'oklch(42% 0.01 260)', cursor: 'pointer' }}>Change</button>} />
          <Row label="Password" sub="Last changed 3 months ago" right={<button style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid oklch(88% 0.008 260)', background: 'white', fontSize: 12, color: 'oklch(42% 0.01 260)', cursor: 'pointer' }}>Update</button>} />
          <Row label="Two-factor authentication" sub="Add extra security to your account" right={<button style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid oklch(52% 0.2 260)', background: 'oklch(93% 0.05 260)', fontSize: 12, color: 'oklch(42% 0.2 260)', cursor: 'pointer', fontWeight: 500 }}>Enable</button>} />
        </Section>

        <Section title="Notifications">
          {[
            ['reactions', 'Reactions on your commits', 'When someone forks, merges or supports your decisions'],
            ['follows',   'New followers',             'When someone starts following your life'],
            ['whatifs',   'Branch activity',           'Updates on your what-if branches'],
            ['digest',    'Weekly digest',             'A summary of what people in your network are up to'],
          ].map(([key, label, sub]) => (
            <Row key={key} label={label} sub={sub} right={<Toggle checked={notifs[key]} onChange={v => setNotifs(p => ({ ...p, [key]: v }))} />} />
          ))}
        </Section>

        <Section title="Privacy">
          {[
            ['mainPublic',     'Public main branch',      'Anyone can see your real-life decisions'],
            ['branchesPublic', 'Public what-if branches', 'Anyone can see your hypothetical branches'],
            ['activityPublic', 'Show activity graph',     'Display your commit activity on your profile'],
          ].map(([key, label, sub]) => (
            <Row key={key} label={label} sub={sub} right={<Toggle checked={privacy[key]} onChange={v => setPrivacy(p => ({ ...p, [key]: v }))} />} />
          ))}
        </Section>

        <Section title="Preferences">
          <Row label="Appearance" sub="Choose your interface theme" right={<SelectInput value={theme} onChange={setTheme} opts={[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']]} />} />
          <Row label="Default branch" sub="Where new commits are added by default" right={<SelectInput value={defaultBranch} onChange={setDefaultBranch} opts={[['main', 'main'], ['prompt', 'Ask each time']]} />} />
          <Row label="Language" sub="Interface language" right={<SelectInput value={language} onChange={setLanguage} opts={[['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'], ['ja', '日本語']]} />} />
        </Section>

        <Section title="Data & Export">
          <Row label="Export my life data" sub="Download all your commits and branches as JSON" right={<button style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid oklch(88% 0.008 260)', background: 'white', fontSize: 12, color: 'oklch(42% 0.01 260)', cursor: 'pointer' }}>Export</button>} />
          <Row label="Delete account" sub="Permanently remove your account and all data" right={<button style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid oklch(75% 0.15 20)', background: 'oklch(97% 0.015 20)', fontSize: 12, color: 'oklch(48% 0.2 20)', cursor: 'pointer', fontWeight: 500 }}>Delete</button>} />
        </Section>

      </div>
    </div>
  );
}
