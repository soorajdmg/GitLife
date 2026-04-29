import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../config/api';
import { QUERY_KEYS } from '../../config/queryClient';
import Avatar from './Avatar';
import { useAuth } from '../../contexts/AuthContext';

function renderMentions(text, onProfile) {
  if (!text || !onProfile) return text;
  const parts = text.split(/(@[\w.]+)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (/^@[\w.]+$/.test(part)) {
      const username = part.slice(1);
      return (
        <span
          key={i}
          onClick={e => { e.stopPropagation(); onProfile(username); }}
          style={{ color: 'oklch(42% 0.2 260)', fontWeight: 500, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >{part}</span>
      );
    }
    return part;
  });
}

function formatTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function CommentInput({ onSubmit, placeholder = 'Write a reply...', autoFocus = false }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef();

  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    await onSubmit(trimmed);
    setText('');
    setSubmitting(false);
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); }}
        placeholder={placeholder}
        maxLength={500}
        rows={2}
        style={{
          flex: 1, resize: 'none', border: '1px solid oklch(90% 0.006 260)',
          borderRadius: 8, padding: '7px 10px', fontSize: 12.5,
          fontFamily: 'inherit', lineHeight: 1.5, outline: 'none',
          color: 'oklch(22% 0.015 260)', background: 'oklch(98.5% 0.005 80)',
        }}
        onFocus={e => e.target.style.borderColor = 'oklch(52% 0.2 260)'}
        onBlur={e => e.target.style.borderColor = 'oklch(90% 0.006 260)'}
      />
      <button
        onClick={submit}
        disabled={!text.trim() || submitting}
        style={{
          padding: '7px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
          background: text.trim() ? 'oklch(52% 0.2 260)' : 'oklch(90% 0.005 260)',
          color: text.trim() ? 'white' : 'oklch(65% 0.01 260)',
          cursor: text.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.12s',
        }}
      >
        {submitting ? '…' : 'Post'}
      </button>
    </div>
  );
}

function CommentItem({ comment, currentUserId, onDelete, onReply, onProfile, onLike, isReply = false }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const authorName = comment.author?.fullName || comment.author?.username || 'User';
  const authorHandle = comment.author?.username ? `@${comment.author.username}` : '';
  const user = {
    name: authorName,
    handle: authorHandle,
    ini: authorName.slice(0, 2).toUpperCase(),
    color: 'oklch(52% 0.2 260)',
    avatarUrl: comment.author?.avatarUrl || null,
  };

  const isOwn = comment.authorId === currentUserId;
  const likeCount = comment.likeCount || 0;
  const liked = comment.likedByMe || false;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div style={{ display: 'flex', gap: 9, marginBottom: isReply ? 8 : 12 }}>
      <div style={{ flexShrink: 0, marginTop: 2, cursor: onProfile && comment.authorId ? 'pointer' : 'default' }} onClick={() => onProfile && comment.authorId && onProfile(comment.authorId)}>
        <Avatar u={user} size={28} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: 'oklch(97.5% 0.005 80)', borderRadius: 10, padding: '8px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
            <span
              onClick={() => onProfile && comment.authorId && onProfile(comment.authorId)}
              style={{ fontSize: 12.5, fontWeight: 600, color: 'oklch(22% 0.015 260)', cursor: onProfile && comment.authorId ? 'pointer' : 'default' }}
              onMouseEnter={e => { if (onProfile && comment.authorId) e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
            >{authorName}</span>
            <span style={{ fontSize: 11, color: 'oklch(58% 0.01 260)' }}>{formatTime(comment.createdAt)}</span>
          </div>
          <div style={{ fontSize: 13, color: 'oklch(28% 0.012 260)', lineHeight: 1.55, wordBreak: 'break-word' }}>{renderMentions(comment.text, onProfile)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, paddingLeft: 4 }}>
          {/* Like button */}
          <button
            onClick={() => onLike && onLike(comment.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: liked ? 'oklch(52% 0.2 260)' : 'oklch(55% 0.01 260)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500, transition: 'color 0.12s' }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 13.7C7.4 13.3 1 9.2 1 5.5 1 3.6 2.6 2 4.5 2c1 0 2 .5 2.7 1.3L8 4.2l.8-.9C9.5 2.5 10.5 2 11.5 2 13.4 2 15 3.6 15 5.5c0 3.7-6.4 7.8-7 8.2z"/>
            </svg>
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          {!isReply && (
            <button
              onClick={() => setReplyOpen(p => !p)}
              style={{ fontSize: 11, color: 'oklch(52% 0.01 260)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}
            >
              Reply
            </button>
          )}
          {/* Three-dots menu (only for own comments) */}
          {isOwn && (
            <div ref={menuRef} style={{ position: 'relative', marginLeft: 'auto' }}>
              <button
                onClick={() => setMenuOpen(p => !p)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, color: 'oklch(60% 0.01 260)', padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.background = 'oklch(93% 0.005 80)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/>
                </svg>
              </button>
              {menuOpen && (
                <div style={{ position: 'absolute', right: 0, top: 26, background: 'white', border: '1px solid oklch(90% 0.006 80)', borderRadius: 8, boxShadow: '0 4px 16px oklch(0% 0 0 / 0.1)', zIndex: 100, minWidth: 110, overflow: 'hidden' }}>
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(comment.id); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 12.5, color: 'oklch(50% 0.18 25)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'oklch(97% 0.005 25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {replyOpen && (
          <div style={{ marginTop: 8 }}>
            <CommentInput
              placeholder={`Reply to ${authorName}...`}
              autoFocus
              onSubmit={async text => {
                await onReply(comment.id, text);
                setReplyOpen(false);
              }}
            />
          </div>
        )}
        {/* Nested replies */}
        {!isReply && comment.replies?.length > 0 && (
          <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '2px solid oklch(92% 0.006 80)' }}>
            {comment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                onDelete={onDelete}
                onReply={() => {}}
                onProfile={onProfile}
                onLike={onLike}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentThread({ decisionId, currentUserId, initialCount = 0, onCountChange, onProfile }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: comments = [], isLoading: loading, isError } = useQuery({
    queryKey: QUERY_KEYS.comments(decisionId),
    queryFn: () => api.getComments(decisionId),
    staleTime: 30_000,
  });
  const error = isError ? 'Failed to load replies' : null;

  const handlePost = async (text) => {
    try {
      const comment = await api.postComment(decisionId, text);
      const withReplies = {
        ...comment,
        replies: [],
        author: comment.author || {
          username: user?.username,
          fullName: user?.fullName,
          avatarUrl: user?.avatarUrl,
        },
      };
      queryClient.setQueryData(QUERY_KEYS.comments(decisionId), (old = []) => [...old, withReplies]);
      onCountChange?.(1);
    } catch {
      // silent fail — user can retry
    }
  };

  const handleReply = async (parentCommentId, text) => {
    try {
      const reply = await api.postComment(decisionId, text, parentCommentId);
      const replyWithAuthor = {
        ...reply,
        author: reply.author || {
          username: user?.username,
          fullName: user?.fullName,
          avatarUrl: user?.avatarUrl,
        },
      };
      queryClient.setQueryData(QUERY_KEYS.comments(decisionId), (old = []) =>
        old.map(c => c.id === parentCommentId ? { ...c, replies: [...(c.replies || []), replyWithAuthor] } : c)
      );
      onCountChange?.(1);
    } catch {}
  };

  const handleLike = async (commentId) => {
    // Optimistic update
    queryClient.setQueryData(QUERY_KEYS.comments(decisionId), (old = []) =>
      old.map(c => {
        if (c.id === commentId) {
          const liked = !c.likedByMe;
          return { ...c, likedByMe: liked, likeCount: (c.likeCount || 0) + (liked ? 1 : -1) };
        }
        return {
          ...c,
          replies: (c.replies || []).map(r => {
            if (r.id === commentId) {
              const liked = !r.likedByMe;
              return { ...r, likedByMe: liked, likeCount: (r.likeCount || 0) + (liked ? 1 : -1) };
            }
            return r;
          }),
        };
      })
    );
    try {
      await api.likeComment(decisionId, commentId);
    } catch {
      // Revert on failure
      queryClient.setQueryData(QUERY_KEYS.comments(decisionId), (old = []) =>
        old.map(c => {
          if (c.id === commentId) {
            const liked = !c.likedByMe;
            return { ...c, likedByMe: liked, likeCount: (c.likeCount || 0) + (liked ? 1 : -1) };
          }
          return {
            ...c,
            replies: (c.replies || []).map(r => {
              if (r.id === commentId) {
                const liked = !r.likedByMe;
                return { ...r, likedByMe: liked, likeCount: (r.likeCount || 0) + (liked ? 1 : -1) };
              }
              return r;
            }),
          };
        })
      );
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.deleteComment(decisionId, commentId);
      let delta = -1;
      queryClient.setQueryData(QUERY_KEYS.comments(decisionId), (old = []) => {
        const topLevel = old.find(c => c.id === commentId);
        if (topLevel) {
          delta = -1 - (topLevel.replies?.length || 0);
          return old.filter(c => c.id !== commentId);
        }
        return old.map(c => ({
          ...c,
          replies: (c.replies || []).filter(r => {
            if (r.id === commentId) { delta = -1; return false; }
            return true;
          })
        }));
      });
      onCountChange?.(delta);
    } catch {}
  };

  return (
    <div style={{ paddingTop: 12, borderTop: '1px solid oklch(94% 0.004 80)', marginTop: 4 }}>
      {loading && (
        <div style={{ fontSize: 12, color: 'oklch(62% 0.008 260)', padding: '4px 0 12px' }}>Loading replies…</div>
      )}
      {error && (
        <div style={{ fontSize: 12, color: 'oklch(50% 0.18 25)', padding: '4px 0 12px' }}>{error}</div>
      )}
      {!loading && !error && comments.length === 0 && (
        <div style={{ fontSize: 12, color: 'oklch(65% 0.008 260)', marginBottom: 12 }}>No replies yet. Be the first.</div>
      )}
      {!loading && comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          onDelete={handleDelete}
          onReply={handleReply}
          onProfile={onProfile}
          onLike={handleLike}
        />
      ))}
      <CommentInput onSubmit={handlePost} placeholder="Add a reply… (Ctrl+Enter to submit)" />
    </div>
  );
}
