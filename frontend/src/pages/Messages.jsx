import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, MessageSquare, Send } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, EmptyState, ErrorState, PageLoader } from '../components/ui';
import { timeAgo } from '../utils/format';

export default function Messages() {
  const { user } = useAuth();
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const activeId = sp.get('with');

  const [convos, setConvos] = useState(null);
  const [error, setError] = useState('');
  const [thread, setThread] = useState({ messages: [], peer: null, loading: false, error: '' });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottom = useRef(null);

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

  // Initial load + polling (simple, no websockets).
  useEffect(() => {
    loadConvos();
    const t = setInterval(() => { loadConvos(); if (activeId) loadThread(activeId, true); }, 8000);
    return () => clearInterval(t);
  }, [loadConvos, loadThread, activeId]);

  useEffect(() => { if (activeId) loadThread(activeId); }, [activeId, loadThread]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread.messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post('/messages', { recipientId: activeId, text });
      setText('');
      await Promise.all([loadThread(activeId, true), loadConvos()]);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const peer = thread.peer || convos?.find((c) => c.user.id === activeId)?.user;

  return (
    <div className="page">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">Messages</h1>
      <div className="card grid h-[70vh] min-h-[420px] overflow-hidden md:grid-cols-[320px_1fr]">
        {/* conversation list */}
        <aside className={`flex-col overflow-y-auto border-slate-200 md:flex md:border-r ${activeId ? 'hidden' : 'flex'}`}>
          {convos === null && !error ? <PageLoader /> : error ? <div className="p-4"><ErrorState message={error} onRetry={loadConvos} /></div> : convos.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={MessageSquare} title="No conversations yet" message={user.role === 'student' ? 'Open an alumni profile and tap Message to start.' : 'Messages from students appear here.'} />
            </div>
          ) : (
            convos.map((c) => (
              <button
                key={c.conversationId}
                onClick={() => setSp({ with: c.user.id })}
                className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${activeId === c.user.id ? 'bg-navy-50' : ''}`}
              >
                <Avatar name={c.user.name} src={c.user.photo} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-slate-900">{c.user.name}</p>
                    <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(c.lastMessage.createdAt)}</span>
                  </div>
                  <p className={`truncate text-xs ${c.unread ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                    {c.lastMessage.fromMe && 'You: '}{c.lastMessage.text}
                  </p>
                </div>
                {c.unread > 0 && <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
              </button>
            ))
          )}
        </aside>

        {/* thread */}
        <section className={`min-h-0 flex-col ${activeId ? 'flex' : 'hidden md:flex'}`}>
          {!activeId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare className="mb-2 h-10 w-10" />
              <p className="text-sm">Select a conversation</p>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                <button className="btn-ghost !p-1.5 md:hidden" onClick={() => setSp({})} aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>
                <Avatar name={peer?.name || '?'} src={peer?.photo} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{peer?.name || 'Conversation'}</p>
                  {peer?.headline && <p className="truncate text-xs text-slate-500">{peer.headline}</p>}
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
                {thread.loading && thread.messages.length === 0 ? <PageLoader /> : thread.error ? <ErrorState message={thread.error} onRetry={() => loadThread(activeId)} /> : thread.messages.length === 0 ? (
                  <p className="pt-10 text-center text-sm text-slate-400">No messages yet. Say hello!</p>
                ) : thread.messages.map((m) => {
                  const mine = m.sender === user._id;
                  return (
                    <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${mine ? 'rounded-br-sm bg-navy-800 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'}`}>
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <p className={`mt-1 text-[10px] ${mine ? 'text-navy-200' : 'text-slate-400'}`}>{timeAgo(m.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottom} />
              </div>

              <form onSubmit={send} className="flex gap-2 border-t border-slate-200 bg-white p-3">
                <input className="input" placeholder="Type a message…" value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} aria-label="Message" />
                <button className="btn-primary" disabled={sending || !text.trim()} type="submit" aria-label="Send">
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
