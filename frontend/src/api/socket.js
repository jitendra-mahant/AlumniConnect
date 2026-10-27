import { io } from 'socket.io-client';
import { tokenStore } from './client';

let socket = null;

export function getSocket() {
  if (socket) return socket;

  const token = tokenStore.get();
  if (!token) return null;

  // In Vite dev, window.location.origin proxies /socket.io to backend:5000
  // Or connect directly to backend URL
  const serverUrl = window.location.origin;

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

  const serverUrl = window.location.origin;
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
