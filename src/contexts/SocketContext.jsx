import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);

  const [connected, setConnected] = useState(false);
  // userId → true/false
  const [onlineUsers, setOnlineUsers] = useState({});
  // conversationId → { userId, ts }
  const [typingMap, setTypingMap] = useState({});
  // Listeners registered by consumers
  const listenersRef = useRef({ new_message: [], messages_read: [], typing_start: [], typing_stop: [] });

  const typingTimers = useRef({});

  const on = useCallback((event, handler) => {
    listenersRef.current[event] = [...(listenersRef.current[event] || []), handler];
    return () => {
      listenersRef.current[event] = (listenersRef.current[event] || []).filter(h => h !== handler);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      retries: 3,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('user_online', ({ userId }) => {
      setOnlineUsers(prev => ({ ...prev, [userId]: true }));
    });

    socket.on('user_offline', ({ userId }) => {
      setOnlineUsers(prev => ({ ...prev, [userId]: false }));
    });

    socket.on('new_message', (payload) => {
      (listenersRef.current.new_message || []).forEach(h => h(payload));
    });

    socket.on('messages_read', (payload) => {
      (listenersRef.current.messages_read || []).forEach(h => h(payload));
    });

    socket.on('typing_start', ({ conversationId, userId: typer }) => {
      setTypingMap(prev => ({ ...prev, [conversationId]: typer }));
      // Auto-clear after 4 s if stop event is missed
      clearTimeout(typingTimers.current[conversationId]);
      typingTimers.current[conversationId] = setTimeout(() => {
        setTypingMap(prev => { const n = { ...prev }; delete n[conversationId]; return n; });
      }, 4000);
      (listenersRef.current.typing_start || []).forEach(h => h({ conversationId, userId: typer }));
    });

    socket.on('typing_stop', ({ conversationId }) => {
      clearTimeout(typingTimers.current[conversationId]);
      setTypingMap(prev => { const n = { ...prev }; delete n[conversationId]; return n; });
      (listenersRef.current.typing_stop || []).forEach(h => h({ conversationId }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, user]);

  // ── Emit helpers ──────────────────────────────────────────────────────────

  const sendMessage = useCallback(({ conversationId, text, sharedCommit }) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject(new Error('No socket'));
      const timeout = setTimeout(() => reject(new Error('Send timed out')), 8000);
      socketRef.current.emit('send_message', { conversationId, text, sharedCommit }, (res) => {
        clearTimeout(timeout);
        if (res?.error) reject(new Error(res.error));
        else resolve(res);
      });
    });
  }, []);

  const emitTypingStart = useCallback((conversationId) => {
    socketRef.current?.emit('typing_start', { conversationId });
  }, []);

  const emitTypingStop = useCallback((conversationId) => {
    socketRef.current?.emit('typing_stop', { conversationId });
  }, []);

  const emitMarkRead = useCallback((conversationId) => {
    socketRef.current?.emit('mark_read', { conversationId });
  }, []);

  const joinConversation = useCallback((conversationId) => {
    socketRef.current?.emit('join_conversation', conversationId);
  }, []);

  const queryOnlineUsers = useCallback((userIds) => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) return resolve([]);
      socketRef.current.emit('get_online_users', userIds, resolve);
    });
  }, []);

  return (
    <SocketContext.Provider value={{
      connected,
      onlineUsers,
      typingMap,
      on,
      sendMessage,
      emitTypingStart,
      emitTypingStop,
      emitMarkRead,
      joinConversation,
      queryOnlineUsers,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketContext;
