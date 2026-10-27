import { io } from 'socket.io-client';
import { tokenStore } from './client';

let socket = null;

export function getSocketServerUrl() {
  const socketUrl = (import.meta.env.VITE_SOCKET_URL || '').trim().replace(/\/+$/, '');
  if (socketUrl) return socketUrl;

  const apiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (apiUrl) {
    return apiUrl.replace(/\/api$/, '');
  }

  // In Vite dev, window.location.origin proxies /socket.io to backend:5000
  return typeof window !== 'undefined' ? window.location.origin : '';
}

export function getSocket() {
  if (socket) return socket;

  const token = tokenStore.get();
  if (!token) return null;

  const serverUrl = getSocketServerUrl();

  socket = io(serverUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connection error:', err.message);
  });

  return socket;
}

export function connectSocket(token) {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  if (!token) return null;

  const serverUrl = getSocketServerUrl();
  socket = io(serverUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
