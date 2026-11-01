import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  Users,
  WifiOff,
  X,
} from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { Avatar, EmptyState, ErrorState, PageLoader } from '../components/ui';
import { timeAgo } from '../utils/format';

const FILTERS = ['All', 'Unread', 'Students', 'Alumni', 'Teachers'];
const isValidObjectId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

export default function Messages() {
  const { user } = useAuth();
  const toast = useToast();
  const { socket, isConnected, isOnline } = useSocket();
  const [sp, setSp] = useSearchParams();
  const activeId = sp.get('with');
  const activeGroupId = sp.get('group');
  const conversationId = user && isValidObjectId(activeGroupId)
    ? `group_${activeGroupId}`
    : user && isValidObjectId(activeId)
      ? [String(user._id), String(activeId)].sort().join('_')
      : null;

  const [convos, setConvos] = useState(null);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [thread, setThread] = useState({ messages: [], peer: null, group: null, loading: false, error: '', hasMore: false });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState('people');
  const [directory, setDirectory] = useState([]);
  const [directoryQuery, setDirectoryQuery] = useState('');
  const [directoryRole, setDirectoryRole] = useState('');
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const bottom = useRef(null);
  const typingTimer = useRef(null);
  const retryThreadRequest = useRef(null);
  const loadConvos = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConvos(data.data);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/groups');
      setGroups(data.data);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not load project groups.'));
    }
  }, [toast]);

  const loadThread = useCallback(async (target, { silent = false, before } = {}) => {
    if (!target) return;
    const isGroup = target.groupId !== undefined;
    const targetId = isGroup ? target.groupId : target.userId;
    if (!isValidObjectId(targetId)) {
      retryThreadRequest.current = null;
      if (!silent) {
        setThread((current) => ({
          ...current,
          loading: false,
          error: 'This conversation link is invalid. Return to the conversation list and select it again.',
        }));
      }
      return;
    }
    retryThreadRequest.current = null;
    if (!silent) setThread((current) => ({ ...current, loading: true, error: '' }));
    try {
      const query = before ? `?before=${encodeURIComponent(before)}` : '';
      const path = isGroup
        ? `/messages/groups/${encodeURIComponent(targetId)}${query}`
        : `/messages/${encodeURIComponent(targetId)}${query}`;
      const { data } = await api.get(path);
      setThread((current) => ({
        messages: before ? [...data.data, ...current.messages] : data.data,
        peer: data.user || null,
        group: data.group || null,
        loading: false,
        error: '',
        hasMore: data.hasMore,
      }));
      retryThreadRequest.current = null;
      window.dispatchEvent(new Event('notifications:changed'));
    } catch (err) {
      const status = err.response?.status;
      const message = status === 400
        ? 'This conversation link is invalid. Return to the conversation list and select it again.'
        : status === 403
          ? 'You no longer have permission to access this conversation.'
          : status === 404
            ? 'This conversation is no longer available.'
            : status >= 500
              ? 'Could not load conversation history. Please try again.'
              : errorMessage(err, 'Could not load conversation history. Please try again.');
      retryThreadRequest.current = !err.response || status === 429 || status >= 500
        ? { target, before }
        : null;
      setThread((current) => ({ ...current, loading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    loadConvos();
    loadGroups();
  }, [loadConvos, loadGroups]);

  useEffect(() => {
    setText('');
    setTypingUser('');
    retryThreadRequest.current = null;
    setThread({ messages: [], peer: null, group: null, loading: false, error: '', hasMore: false });
    if (activeGroupId) loadThread({ groupId: activeGroupId });
    else if (activeId) loadThread({ userId: activeId });
  }, [activeId, activeGroupId, loadThread]);

  useEffect(() => {
    if (!socket || !conversationId) return undefined;
    socket.emit('join_conversation', { conversationId }, (response) => {
      if (response?.error) toast.error(response.error);
    });
    return () => socket.emit('leave_conversation', { conversationId });
  }, [socket, conversationId, toast]);

  useEffect(() => {
    if (!socket) return undefined;
    const handleNewMessage = (message) => {
      if (message.conversationId === conversationId) {
        setThread((current) => {
          if (current.messages.some((item) => item._id === message._id)) return current;
          return { ...current, messages: [...current.messages, message] };
        });
        if (activeGroupId) loadThread({ groupId: activeGroupId }, { silent: true });
        else if (activeId && String(message.sender) !== String(user._id)) {
          loadThread({ userId: activeId }, { silent: true });
        }
      }
      loadConvos();
      window.dispatchEvent(new Event('notifications:changed'));
    };
    const handleAlert = ({ conversationId: incomingId }) => {
      if (incomingId !== conversationId) loadConvos();
    };
    const handleTyping = ({ conversationId: typingConversation, userId, isTyping }) => {
      if (typingConversation === conversationId && String(userId) !== String(user._id)) {
        setTypingUser(isTyping ? String(userId) : '');
      }
    };
    const handleRead = ({ conversationId: readConversation, readerId, readAt }) => {
      if (readConversation !== conversationId) return;
      setThread((current) => ({
        ...current,
        messages: current.messages.map((message) =>
          String(message.sender) === String(user._id) &&
          (activeGroupId || String(message.recipient) === String(readerId))
            ? activeGroupId
              ? { ...message, readBy: [...(message.readBy || []), { user: readerId, readAt }] }
              : { ...message, readAt }
            : message
        ),
      }));
    };
    const handleDelivered = ({ messageId, deliveredAt }) => {
      setThread((current) => ({
        ...current,
        messages: current.messages.map((message) =>
          message._id === messageId ? { ...message, deliveredAt } : message
        ),
      }));
    };
    socket.on('new_message', handleNewMessage);
    socket.on('new_message_alert', handleAlert);
    socket.on('typing:status', handleTyping);
    socket.on('messages:read', handleRead);
    socket.on('message:delivered', handleDelivered);
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('new_message_alert', handleAlert);
      socket.off('typing:status', handleTyping);
      socket.off('messages:read', handleRead);
      socket.off('message:delivered', handleDelivered);
    };
  }, [socket, conversationId, activeId, activeGroupId, user._id, loadConvos, loadThread]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.messages.length]);

  useEffect(() => {
    if (!composerOpen || composerMode !== 'people') return undefined;
    const timer = setTimeout(async () => {
      setDirectoryLoading(true);
      try {
        const params = new URLSearchParams();
        if (directoryQuery.trim()) params.set('q', directoryQuery.trim());
        if (directoryRole) params.set('role', directoryRole);
        const { data } = await api.get(`/messages/directory?${params}`);
        setDirectory(data.data);
      } catch (err) {
        toast.error(errorMessage(err, 'Could not search authorized users.'));
      } finally {
        setDirectoryLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [composerOpen, composerMode, directoryQuery, directoryRole, toast]);

  const visibleConversations = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (convos || []).filter((conversation) => {
      const matchesSearch = !needle ||
        conversation.user.name.toLowerCase().includes(needle) ||
        conversation.lastMessage.text.toLowerCase().includes(needle);
      const matchesFilter = filter === 'All' ||
        (filter === 'Unread' && conversation.unread > 0) ||
        (filter === 'Students' && conversation.user.role === 'student') ||
        (filter === 'Alumni' && conversation.user.role === 'alumni') ||
        (filter === 'Teachers' && conversation.user.role === 'teacher');
      return matchesSearch && matchesFilter;
    });
  }, [convos, search, filter]);

  const openPerson = async (person) => {
    try {
      const { data } = await api.post('/messages/conversations', { recipientId: person.id });
      setComposerOpen(false);
      setSp({ with: String(person.id) });
      await loadConvos();
      return data.data;
    } catch (err) {
      toast.error(errorMessage(err, 'Could not open this conversation.'));
      return null;
    }
  };

  const openGroup = (group) => {
    if (!isValidObjectId(String(group.id))) {
      toast.error('This project group has an invalid identifier. Refresh the group list and try again.');
      return;
    }
    setComposerOpen(false);
    setSp({ group: String(group.id) });
  };

  const loadOlder = () => {
    if (!thread.messages.length || thread.loading) return;
    const first = thread.messages[0].createdAt;
    loadThread(
      activeGroupId ? { groupId: activeGroupId } : { userId: activeId },
      { before: first }
    );
  };

  const send = async (event) => {
    event.preventDefault();
    const messageText = text.trim();
    if (!messageText || (!activeId && !activeGroupId) || sending) return;
    setSending(true);
    try {
      let savedMessage;
      if (socket && isConnected) {
        savedMessage = await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Message delivery timed out. Please try again.')), 10000);
          socket.emit(
            'send_message',
            activeGroupId
              ? { groupId: activeGroupId, text: messageText }
              : { recipientId: activeId, text: messageText },
            (response) => {
              clearTimeout(timer);
              if (response?.error) reject(new Error(response.error));
              else resolve(response?.data);
            }
          );
        });
      } else {
        const { data } = await api.post('/messages', activeGroupId
          ? { groupId: activeGroupId, text: messageText }
          : { recipientId: activeId, text: messageText });
        savedMessage = data.data;
      }

      setThread((current) => current.messages.some((message) => message._id === savedMessage._id)
        ? current
        : { ...current, messages: [...current.messages, savedMessage] });
      setText('');
      loadConvos();
      if (socket && conversationId) socket.emit('typing_stop', { conversationId });
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to send message.'));
    } finally {
      setSending(false);
    }
  };

  const setTyping = (value) => {
    setText(value);
    if (!socket || !isConnected || !conversationId) return;
    socket.emit('typing_start', { conversationId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('typing_stop', { conversationId }), 1200);
  };

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  const peer = thread.peer || convos?.find((item) => item.user.id === activeId)?.user;
  const activeGroup = thread.group || groups.find((group) => String(group.id) === String(activeGroupId));
  const groupHasNoRecipients = Boolean(
    activeGroupId &&
    activeGroup &&
    Array.isArray(activeGroup.members) &&
    !activeGroup.members?.some((member) => String(member.id) !== String(user._id))
  );
  const retryThread = () => {
    const request = retryThreadRequest.current;
    if (request) loadThread(request.target, { before: request.before });
  };
  const peerOnline = activeId ? isOnline(activeId) : false;
  const typingName = activeGroup
    ? activeGroup.members?.find((member) => String(member.id) === typingUser)?.name || 'A member'
    : peer?.name || 'User';

  return (
    <div className="page">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-950 dark:text-white sm:text-3xl">Messages</h1>
        <div className="flex items-center gap-2 text-xs">
          {isConnected ? (
            <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800">
              Real-time connected
            </span>
          ) : (
            <span className="badge bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1">
              <WifiOff className="h-3 w-3" /> Reconnecting…
            </span>
          )}
        </div>
      </div>

      <div className="card grid h-[72vh] min-h-[440px] overflow-hidden md:grid-cols-[320px_1fr] dark:border-slate-800">
        <aside className={`min-h-0 flex-col border-slate-200 dark:border-slate-800 md:flex md:border-r ${activeId || activeGroupId ? 'hidden' : 'flex'}`}>
          <div className="space-y-3 border-b border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white">Conversations</h2>
              <button type="button" className="btn-primary !px-2.5 !py-1.5 text-xs" onClick={() => setComposerOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> New message
              </button>
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" placeholder="Search conversations" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {FILTERS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${filter === item ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {convos === null && !error ? <PageLoader /> : error ? (
              <div className="p-4"><ErrorState message={error} onRetry={loadConvos} /></div>
            ) : visibleConversations.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={MessageSquare}
                  title={convos?.length ? 'No matching conversations' : 'No conversations yet'}
                  message="Start a conversation with a verified and authorized member."
                />
              </div>
            ) : visibleConversations.map((conversation) => {
              const isGroup = conversation.kind === 'group';
              const selected = isGroup
                ? String(activeGroupId) === String(conversation.group.id)
                : activeId === String(conversation.user.id);
              const online = !isGroup && isOnline(conversation.user.id);
              return (
                <button
                  type="button"
                  key={conversation.conversationId}
                  onClick={() => isGroup ? setSp({ group: String(conversation.group.id) }) : setSp({ with: String(conversation.user.id) })}
                  className={`flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 ${selected ? 'bg-teal-50/80 dark:bg-slate-800' : ''}`}
                >
                  <div className="relative shrink-0">
                    {isGroup ? <div className="grid h-10 w-10 place-items-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><Users className="h-5 w-5" /></div> : <Avatar name={conversation.user.name} src={conversation.user.photo} />}
                    {online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{conversation.user.name}</p>
                      <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(conversation.lastMessage.createdAt)}</span>
                    </div>
                    <p className={`truncate text-xs ${conversation.unread ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      {conversation.lastMessage.fromMe && 'You: '}{conversation.lastMessage.text}
                    </p>
                  </div>
                  {conversation.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">{conversation.unread}</span>}
                </button>
              );
            })}
          </div>
        </aside>

        <section className={`min-h-0 flex-col ${activeId || activeGroupId ? 'flex' : 'hidden md:flex'}`}>
          {!activeId && !activeGroupId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
              <MessageSquare className="mb-2 h-10 w-10" />
              <p className="text-sm">Select a conversation or start a new message.</p>
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex min-w-0 items-center gap-3">
                  <button type="button" className="btn-ghost !p-1.5 md:hidden" onClick={() => setSp({})} aria-label="Back to conversations"><ArrowLeft className="h-5 w-5" /></button>
                  {activeGroupId ? <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><Users className="h-4 w-4" /></div> : <Avatar name={peer?.name || '?'} src={peer?.photo} size="sm" />}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{activeGroup?.title || peer?.name || 'Conversation'}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {activeGroupId ? `${activeGroup?.memberCount || activeGroup?.members?.length || 0} group members` : `${peer?.role || 'Member'} · ${peerOnline ? 'Online' : 'Offline'}`}
                    </p>
                  </div>
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-slate-950">
                {thread.hasMore && <button type="button" className="btn-secondary mx-auto block text-xs" onClick={loadOlder} disabled={thread.loading}>Load older messages</button>}
                {thread.loading && thread.messages.length === 0 ? <PageLoader /> : thread.error ? <ErrorState message={thread.error} onRetry={retryThreadRequest.current ? retryThread : undefined} /> : thread.messages.length === 0 ? (
                  <div className="pt-12 text-center text-sm text-slate-400 dark:text-slate-500">
                    <p className="font-semibold">{groupHasNoRecipients ? 'No linked group members.' : 'No messages yet.'}</p>
                    <p className="text-xs">{groupHasNoRecipients ? 'A coordinator must link active verified accounts to this project group before messaging.' : 'Say hello to start the conversation.'}</p>
                  </div>
                ) : thread.messages.map((message) => {
                  const mine = String(message.sender) === String(user._id);
                  const read = activeGroupId
                    ? (message.readBy || []).some((entry) => String(entry.user) !== String(user._id))
                    : Boolean(message.readAt);
                  return (
                    <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${mine ? 'rounded-br-sm bg-navy-800 text-white dark:bg-brand-600' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'}`}>
                        <p className="whitespace-pre-wrap break-words">{message.text}</p>
                        <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-navy-200 dark:text-brand-100' : 'text-slate-400 dark:text-slate-500'}`}>
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          {mine && (read ? <CheckCheck className="h-3 w-3" aria-label="Read" /> : message.deliveredAt ? <CheckCheck className="h-3 w-3" aria-label="Delivered" /> : <Check className="h-3 w-3" aria-label="Sent" />)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {typingUser && <p className="text-xs italic text-slate-500">{typingName} is typing…</p>}
                <div ref={bottom} />
              </div>

              <form onSubmit={send} className="flex gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <input
                  className="input dark:bg-slate-800 dark:text-white"
                  placeholder={groupHasNoRecipients ? 'No linked group members' : 'Type a message…'}
                  value={text}
                  maxLength={2000}
                  onChange={(event) => setTyping(event.target.value)}
                  aria-label="Message"
                  disabled={groupHasNoRecipients}
                />
                <button className="btn-primary" disabled={sending || groupHasNoRecipients || !text.trim()} type="submit" aria-label="Send message">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {composerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setComposerOpen(false); }}>
          <section className="card flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900" role="dialog" aria-modal="true" aria-labelledby="new-message-title">
            <header className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <h2 id="new-message-title" className="font-bold text-slate-900 dark:text-white">New message</h2>
              <button type="button" className="btn-ghost !p-1.5" aria-label="Close" onClick={() => setComposerOpen(false)}><X className="h-4 w-4" /></button>
            </header>
            <div className="flex gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
              <button type="button" onClick={() => setComposerMode('people')} className={`btn-secondary text-xs ${composerMode === 'people' ? 'ring-2 ring-teal-500' : ''}`}>People</button>
              <button type="button" onClick={() => setComposerMode('groups')} className={`btn-secondary text-xs ${composerMode === 'groups' ? 'ring-2 ring-teal-500' : ''}`}>Project groups</button>
            </div>
            {composerMode === 'people' ? (
              <>
                <div className="space-y-2 border-b border-slate-200 p-3 dark:border-slate-800">
                  <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input autoFocus className="input pl-9" placeholder="Search name, college email, or department" value={directoryQuery} onChange={(event) => setDirectoryQuery(event.target.value)} /></label>
                  <select className="input" value={directoryRole} onChange={(event) => setDirectoryRole(event.target.value)} aria-label="Filter by role">
                    <option value="">All roles</option><option value="student">Students</option><option value="alumni">Alumni</option><option value="teacher">Teachers</option><option value="admin">Admins</option>
                  </select>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {directoryLoading ? <PageLoader /> : directory.length === 0 ? <div className="p-6 text-center text-sm text-slate-500">No authorized verified users found.</div> : directory.map((person) => (
                    <button type="button" key={person.id} onClick={() => openPerson(person)} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                      <Avatar name={person.name} src={person.photo} />
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{person.name}</span><span className="block truncate text-xs capitalize text-slate-500">{person.role}{person.headline ? ` · ${person.headline}` : ''}</span></span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                {groups.length === 0 ? <div className="p-6 text-center text-sm text-slate-500">No project groups are assigned to your account.</div> : groups.map((group) => (
                  <button type="button" key={group.id} onClick={() => openGroup(group)} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><Users className="h-5 w-5" /></div>
                    <span><span className="block text-sm font-semibold text-slate-900 dark:text-white">{group.title}</span><span className="text-xs text-slate-500">{group.department} · {group.memberCount} members</span></span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
