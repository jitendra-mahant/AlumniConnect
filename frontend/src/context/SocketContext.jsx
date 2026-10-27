import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { tokenStore } from '../api/client';
import { connectSocket, disconnectSocket, getSocket } from '../api/socket';
import { useToast } from './ToastContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    const token = tokenStore.get();
    if (!user || !token) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers(new Set());
      return;
    }

    const s = connectSocket(token);
    setSocket(s);

    const onConnect = () => {
      setIsConnected(true);
      s.emit('get_online_users', (list) => {
        if (Array.isArray(list)) setOnlineUsers(new Set(list));
      });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onPresence = ({ userId, status }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (status === 'online') next.add(String(userId));
        else next.delete(String(userId));
        return next;
      });
    };

    const onNotification = (notif) => {
      window.dispatchEvent(new Event('notifications:changed'));
      if (notif?.title) {
        toast.info(notif.title);
      }
    };

    const onNewMessageAlert = ({ sender, message }) => {
      window.dispatchEvent(new Event('notifications:changed'));
      // Don't toast if user is already looking at this thread
      const params = new URLSearchParams(window.location.search);
      if (window.location.pathname !== '/messages' || params.get('with') !== String(sender?._id)) {
        toast.info(`New message from ${sender?.name}: ${message?.text?.slice(0, 40)}…`);
      }
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('presence:update', onPresence);
    s.on('notification', onNotification);
    s.on('new_message_alert', onNewMessageAlert);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('presence:update', onPresence);
      s.off('notification', onNotification);
      s.off('new_message_alert', onNewMessageAlert);
    };
  }, [user]);

  const isOnline = (userId) => onlineUsers.has(String(userId));

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers, isOnline }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext) || { socket: null, isConnected: false, isOnline: () => false };
