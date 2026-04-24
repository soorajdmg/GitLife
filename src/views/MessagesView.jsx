import { useState, useEffect, useRef } from 'react';
import { USERS, CONVOS, THREAD_MSGS } from '../data/gitlife';
import BranchPill from '../components/ui/BranchPill';

export default function MessagesView() {
  const [active, setActive] = useState('cv1');
  const [input, setInput] = useState('');
  const [threads, setThreads] = useState(THREAD_MSGS);
  const bottomRef = useRef();

  const convo = CONVOS.find(c => c.id === active);
  const user = convo ? USERS[convo.userId] : null;
  const msgs = threads[active] || [];

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [threads, active]);

  const send = () => {
    if (!input.trim()) return;
    const newMsg = { id: `msg_${Date.now()}`, from: 'alex', text: input.trim(), ts: 'just now' };
    setThreads(p => ({ ...p, [active]: [...(p[active] || []), newMsg] }));
    setInput('');
  };

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
      {/* Conversation list */}
      <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid oklch(91% 0.006 80)', overflowY: 'auto', background: 'white' }}>
        <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid oklch(94% 0.004 80)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'oklch(32% 0.01 260)', marginBottom: 10 }}>Messages</div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'oklch(65% 0.01 260)' }}>⌕</span>
            <input placeholder="Search messages..." style={{ width: '100%', padding: '7px 10px 7px 28px', borderRadius: 8, border: '1px solid oklch(90% 0.008 260)', fontSize: 12.5, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', background: 'oklch(98.5% 0.005 80)' }} />
          </div>
        </div>
        {CONVOS.map(cv => {
          const u = USERS[cv.userId];
          const isActive = cv.id === active;
          return (
            <div key={cv.id} onClick={() => setActive(cv.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', cursor: 'pointer', background: isActive ? 'oklch(95% 0.015 260)' : 'white', borderBottom: '1px solid oklch(96% 0.004 80)', transition: 'background 0.12s' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>{u.ini}</div>
                {cv.unread > 0 && <div style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: 'oklch(52% 0.2 260)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white', border: '2px solid white' }}>{cv.unread}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: cv.unread ? 700 : 500, color: 'oklch(18% 0.015 260)' }}>{u.name}</span>
                  <span style={{ fontSize: 10.5, color: 'oklch(62% 0.01 260)', flexShrink: 0 }}>{cv.ts}</span>
                </div>
                <div style={{ fontSize: 12, color: 'oklch(52% 0.01 260)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: cv.unread ? 500 : 400 }}>{cv.lastMsg}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {user && (
          <div style={{ flexShrink: 0, padding: '14px 20px', borderBottom: '1px solid oklch(91% 0.006 80)', background: 'white', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>{user.ini}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: 11.5, color: 'oklch(58% 0.01 260)', fontFamily: "'JetBrains Mono', monospace" }}>{user.handle}</div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(() => {
            const groups = [];
            msgs.forEach(msg => {
              const last = groups[groups.length - 1];
              if (last && last.from === msg.from && last.ts === msg.ts) {
                last.messages.push(msg);
              } else {
                groups.push({ from: msg.from, ts: msg.ts, messages: [msg] });
              }
            });
            return groups.map((g, gi) => {
              const isMe = g.from === 'alex';
              const sender = USERS[g.from];
              return (
                <div key={gi} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                  {!isMe && <div style={{ width: 28, height: 28, borderRadius: '50%', background: sender?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white', flexShrink: 0, alignSelf: 'flex-end' }}>{sender?.ini}</div>}
                  <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', gap: 3, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    {g.messages.map((msg, mi) => (
                      <div key={msg.id}>
                        {msg.sharedCommit && (
                          <div style={{ background: 'white', border: '1px solid oklch(88% 0.008 260)', borderRadius: 10, padding: '10px 12px', marginBottom: 4 }}>
                            <div style={{ fontSize: 10, color: 'oklch(58% 0.01 260)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><span>⎇</span> Shared commit</div>
                            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4, color: 'oklch(18% 0.015 260)' }}>{msg.sharedCommit.message}</div>
                            <BranchPill name={msg.sharedCommit.branch} wi={false} merged={false} />
                          </div>
                        )}
                        <div style={{
                          padding: '9px 14px',
                          borderRadius: (() => {
                            const only = g.messages.length === 1, first = mi === 0, last = mi === g.messages.length - 1;
                            if (only) return '14px';
                            if (isMe) {
                              if (first) return '14px 14px 4px 14px';
                              if (last) return '14px 14px 14px 4px';
                              return '14px 14px 4px 4px';
                            } else {
                              if (first) return '14px 14px 14px 4px';
                              if (last) return '4px 14px 14px 14px';
                              return '4px 14px 14px 4px';
                            }
                          })(),
                          background: isMe ? 'oklch(52% 0.2 260)' : 'white',
                          color: isMe ? 'white' : 'oklch(18% 0.015 260)',
                          fontSize: 13.5, lineHeight: 1.5,
                          border: isMe ? 'none' : '1px solid oklch(91% 0.006 80)',
                          boxShadow: '0 1px 4px oklch(70% 0.01 260 / 0.06)',
                        }}>{msg.text}</div>
                      </div>
                    ))}
                    <div style={{ fontSize: 10.5, color: 'oklch(65% 0.01 260)', marginTop: 2, textAlign: isMe ? 'right' : 'left' }}>{g.ts}</div>
                  </div>
                </div>
              );
            });
          })()}
          <div ref={bottomRef} />
        </div>

        <div style={{ flexShrink: 0, padding: '14px 20px', borderTop: '1px solid oklch(91% 0.006 80)', background: 'white', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, border: '1px solid oklch(88% 0.008 260)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'oklch(98.5% 0.005 80)' }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Send a message..."
              style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13.5, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'oklch(18% 0.015 260)' }} />
            <button style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: 'oklch(65% 0.01 260)', padding: 0 }}>📎</button>
          </div>
          <button onClick={send}
            style={{ width: 40, height: 40, borderRadius: 11, border: 'none', background: 'oklch(52% 0.2 260)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 16 }}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
