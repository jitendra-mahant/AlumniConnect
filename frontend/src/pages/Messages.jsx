import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Circle, Loader2, MessageSquare, Send, Wifi, WifiOff } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { Avatar, EmptyState, ErrorState, PageLoader } from '../components/ui';
import { timeAgo } from '../utils/format';

export default function Messages() {
  const { user } = useAuth();
  const toast = useToast();
  const { socket, isConnected, isOnline } = useSocket();
  const [sp, setSp] = useSearchParams();
  const activeId = sp.get('with');

  const [convos, setConvos] = useState(null);
  const [error, setError] = useState('');
  const [thread, setThread] = useState({ messages: [], peer: null, loading: false, error: '' });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottom = useRef(null);

  // Deterministic conversation ID for active thread
  const conversationId = user && activeId ? [String(user._id), String(activeId)].sort().join('_') : null;

  const loadConvos = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConvos(data.data);
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  const loadThread = useCallback(async (id, silent) => {
    if (!silent) setThread((t) => ({ ...t, loading: true, error: '' }));
    try {
      const { data } = await api.get(`/messages/${id}`);
      setThread({ messages: data.data, peer: data.user, loading: false, error: '' });
      window.dispatchEvent(new Event('notifications:changed'));
    } catch (e) {
      setThread((t) => ({ ...t, loading: false, error: errorMessage(e) }));
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadConvos();
  }, [loadConvos]);

  useEffect(() => {
    if (activeId) loadThread(activeId);
  }, [activeId, loadThread]);

  // Join/leave conversation room over Socket.IO
  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit('join_conversation', { conversationId });
    return () => {
      socket.emit('leave_conversation', { conversationId });
    };
  }, [socket, conversationId]);

  // Listen for live new messages from Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (conversationId && msg.conversationId === conversationId) {
        setThread((prev) => {
          if (prev.messages.some((m) => m._id === msg._id)) return prev;
          return { ...prev, messages: [...prev.messages, msg] };
        });
        // Acknowledge read
        if (activeId) api.get(`/messages/${activeId}`).catch(() => {});
      }
      loadConvos();
      window.dispatchEvent(new Event('notifications:changed'));
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, conversationId, activeId, loadConvos]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    const msgText = text.trim();
    setSending(true);

    try {
      // Primary: Send via Socket.IO if connected, with fallback to REST API
      if (socket && isConnected) {
        socket.emit('send_message', { recipientId: activeId, text: msgText }, (response) => {
          if (response?.error) {
            toast.error(response.error);
          } else if (response?.data) {
            setThread((prev) => {
              if (prev.messages.some((m) => m._id === response.data._id)) return prev;
              return { ...prev, messages: [...prev.messages, response.data] };
            });
            setText('');
            loadConvos();
          }
        });
      } else {
        // Fallback to REST API
        const { data } = await api.post('/messages', { recipientId: activeId, text: msgText });
        setThread((prev) => ({ ...prev, messages: [...prev.messages, data.data] }));
        setText('');
        loadConvos();
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to send message'));
    } finally {
      setSending(false);
    }
  };

  const peer = thread.peer || convos?.find((c) => c.user.id === activeId)?.user;
  const peerOnline = activeId ? isOnline(activeId) : false;

  return (
    <div className="page">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 dark:text-white sm:text-3xl">Messages</h1>
        <div className="flex items-center gap-2 text-xs">
          {isConnected ? (
            <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800 flex items-center gap-1 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Real-Time Server Active
            </span>
          ) : (
            <span className="badge bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1 font-semibold">
              <WifiOff className="h-3 w-3" /> Connecting...
            </span>
          )}
        </div>
      </div>

      <div className="card grid h-[72vh] min-h-[440px] overflow-hidden md:grid-cols-[320px_1fr] dark:border-slate-800">
        {/* Conversation List */}
        <aside className={`flex-col overflow-y-auto border-slate-200 dark:border-slate-800 md:flex md:border-r ${activeId ? 'hidden' : 'flex'}`}>
          {convos === null && !error ? (
            <PageLoader />
          ) : error ? (
            <div className="p-4">
              <ErrorState message={error} onRetry={loadConvos} />
            </div>
          ) : convos.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={MessageSquare}
                title="No conversations yet"
                message={
                  user.role === 'student'
                    ? 'Reach out to verified alumni or your assigned project guide to begin.'
                    : user.role === 'teacher'
                    ? 'Messages from project group students appear here.'
                    : 'Messages from students appear here.'
                }
              />
            </div>
          ) : (
            convos.map((c) => {
              const active = activeId === c.user.id;
              const online = isOnline(c.user.id);

              return (
                <button
                  key={c.conversationId}
                  onClick={() => setSp({ with: c.user.id })}
                  className={`flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                    active ? 'bg-navy-50/80 dark:bg-slate-800' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar name={c.user.name} src={c.user.photo} />
                    {online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" title="Online" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{c.user.name}</p>
                      <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(c.lastMessage.createdAt)}</span>
                    </div>
                    <p className={`truncate text-xs ${c.unread ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      {c.lastMessage.fromMe && 'You: '}
                      {c.lastMessage.text}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </aside>

        {/* Thread View */}
        <section className={`min-h-0 flex-col ${activeId ? 'flex' : 'hidden md:flex'}`}>
          {!activeId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
              <MessageSquare className="mb-2 h-10 w-10" />
              <p className="text-sm">Select a conversation to start chatting in real time.</p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <button className="btn-ghost !p-1.5 md:hidden" onClick={() => setSp({})} aria-label="Back">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="relative">
                    <Avatar name={peer?.name || '?'} src={peer?.photo} size="sm" />
                    {peerOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {peer?.name || 'Conversation'}
                      {peerOnline ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">• Online</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-normal">• Offline</span>
                      )}
                    </p>
                    {peer?.headline && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{peer.headline}</p>}
                  </div>
                </div>
              </header>

              {/* Messages Scroll Area */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 dark:bg-slate-950 px-4 py-4">
                {thread.loading && thread.messages.length === 0 ? (
                  <PageLoader />
                ) : thread.error ? (
                  <ErrorState message={thread.error} onRetry={() => loadThread(activeId)} />
                ) : thread.messages.length === 0 ? (
                  <div className="pt-12 text-center text-sm text-slate-400 dark:text-slate-500 space-y-1">
                    <p className="font-semibold">No messages yet.</p>
                    <p className="text-xs">Say hello to start the conversation!</p>
                  </div>
                ) : (
                  thread.messages.map((m) => {
                    const mine = String(m.sender) === String(user._id);
                    return (
                      <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm transition ${
                            mine
                              ? 'rounded-br-sm bg-navy-800 text-white dark:bg-brand-600'
                              : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.text}</p>
                          <p className={`mt-1 text-[10px] ${mine ? 'text-navy-200 dark:text-brand-100' : 'text-slate-400 dark:text-slate-500'}`}>
                            {timeAgo(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottom} />
              </div>

              {/* Message Input Bar */}
              <form onSubmit={send} className="flex gap-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                <input
                  className="input dark:bg-slate-800 dark:text-white"
                  placeholder="Type a message…"
                  value={text}
                  maxLength={2000}
                  onChange={(e) => setText(e.target.value)}
                  aria-label="Message"
                />
                <button className="btn-primary" disabled={sending || !text.trim()} type="submit" aria-label="Send message">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
