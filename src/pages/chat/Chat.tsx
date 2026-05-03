import { useEffect, useRef, useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Send, MessageSquare, Pencil, Trash2, Check, X, Paperclip, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

const IMG_PREFIX = '__img__:';
const MAX_BYTES = 500 * 1024; // 500 KB

function isImgMsg(content: string) { return content.startsWith(IMG_PREFIX); }
function imgUrl(content: string) { return content.slice(IMG_PREFIX.length); }

function fmt(d: string) {
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}
function isWithin24h(created_at: string) {
  return Date.now() - new Date(created_at).getTime() < 24 * 60 * 60 * 1000;
}

function MsgBubble({ content, isMe }: { content: string; isMe: boolean }) {
  const baseClass = isMe
    ? 'bg-foreground text-background rounded-br-sm'
    : 'bg-secondary text-foreground rounded-bl-sm border border-border';

  if (isImgMsg(content)) {
    return (
      <div className={`rounded-2xl overflow-hidden ${baseClass} p-1`}>
        <img
          src={imgUrl(content)}
          alt="shared image"
          className="max-w-[260px] max-h-[300px] rounded-xl object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
    );
  }
  return (
    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${baseClass}`}>
      {content}
    </div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.rpc('get_admin_id').then(({ data }) => {
      if (data) setAdminId(data as string);
    });
  }, []);

  const load = useCallback(async () => {
    if (!user || !adminId) return;
    const { data, error: err } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${adminId}),and(sender_id.eq.${adminId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    if (err) { setError(err.message); return; }
    setMessages((data as Message[]) || []);
    if (data && data.length > 0) {
      await supabase.from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', adminId)
        .eq('recipient_id', user.id)
        .is('read_at', null);
    }
  }, [user, adminId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user || !adminId) return;
    const channel = supabase
      .channel(`chat:${user.id}:${adminId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new as Message;
        const mine = msg.sender_id === user.id && msg.recipient_id === adminId;
        const theirs = msg.sender_id === adminId && msg.recipient_id === user.id;
        if (mine || theirs) setMessages(prev => [...prev, msg]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new as Message;
        setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, adminId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || !user || !adminId || sending) return;
    setSending(true);
    setError(null);
    const content = input.trim();
    setInput('');
    const { error: err } = await supabase.from('messages').insert({ sender_id: user.id, recipient_id: adminId, content });
    if (err) { setError(err.message); setInput(content); }
    setSending(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !adminId) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(`Image too large (${(file.size / 1024).toFixed(0)} KB). Please upload an image under 500 KB.`);
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('chat-media').upload(path, file, { upsert: false });
    if (upErr) { toast.error('Upload failed: ' + upErr.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
    const content = IMG_PREFIX + urlData.publicUrl;
    const { error: msgErr } = await supabase.from('messages').insert({ sender_id: user.id, recipient_id: adminId, content });
    if (msgErr) toast.error(msgErr.message);
    setUploading(false);
  };

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return;
    await supabase.from('messages').update({ content: editText.trim() }).eq('id', id);
    setEditingId(null);
  };

  const deleteMsg = async (id: string) => {
    const msg = messages.find(m => m.id === id);
    if (msg && isImgMsg(msg.content)) {
      const path = imgUrl(msg.content).split('/chat-media/')[1];
      if (path) await supabase.storage.from('chat-media').remove([path]);
    }
    await supabase.from('messages').delete().eq('id', id);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const d = fmtDate(m.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === d) last.msgs.push(m);
    else grouped.push({ date: d, msgs: [m] });
  });

  return (
    <div className="flex flex-col h-screen">
      <Header title="Messages" subtitle="Chat with the Furii team" />

      {!adminId && (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Connecting…</div>
      )}

      {adminId && (
        <>
          <div className="flex-1 overflow-y-auto px-4 lg:px-10 py-6 space-y-1">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <MessageSquare className="h-10 w-10 opacity-20" />
                <p className="text-sm">No messages yet. Say hello!</p>
              </div>
            )}
            {grouped.map(group => (
              <div key={group.date}>
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest shrink-0">{group.date}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-1">
                  {group.msgs.map((m, i) => {
                    const isMe = m.sender_id === user?.id;
                    const showMeta = i === group.msgs.length - 1 || group.msgs[i + 1]?.sender_id !== m.sender_id;
                    const canEdit = isMe && isWithin24h(m.created_at) && !isImgMsg(m.content);
                    const canDelete = isMe && isWithin24h(m.created_at);
                    const isEditing = editingId === m.id;

                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        onMouseEnter={() => setHoveredId(m.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                          {isMe && (canEdit || canDelete) && hoveredId === m.id && !isEditing && (
                            <div className="flex items-center gap-1 mb-0.5">
                              {canEdit && (
                                <button onClick={() => { setEditingId(m.id); setEditText(m.content); }}
                                  className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary border border-border" title="Edit">
                                  <Pencil className="h-3 w-3" />
                                </button>
                              )}
                              {canDelete && (
                                <button onClick={() => deleteMsg(m.id)}
                                  className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-border" title="Delete">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )}

                          {isEditing ? (
                            <div className="flex flex-col gap-1.5 w-full min-w-[200px]">
                              <textarea value={editText} onChange={e => setEditText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(m.id); } if (e.key === 'Escape') setEditingId(null); }}
                                autoFocus rows={2}
                                className="w-full bg-input border border-ring rounded-xl px-3 py-2 text-sm resize-none focus:outline-none" />
                              <div className="flex gap-1.5 justify-end">
                                <button onClick={() => setEditingId(null)} className="h-7 px-2.5 rounded-md border border-border text-xs text-muted-foreground hover:bg-secondary flex items-center gap-1">
                                  <X className="h-3 w-3" /> Cancel
                                </button>
                                <button onClick={() => saveEdit(m.id)} className="h-7 px-2.5 rounded-md bg-foreground text-background text-xs flex items-center gap-1 hover:bg-foreground/90">
                                  <Check className="h-3 w-3" /> Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <MsgBubble content={m.content} isMe={isMe} />
                          )}

                          {showMeta && !isEditing && (
                            <span className="text-[10px] text-muted-foreground font-mono px-1">
                              {fmt(m.created_at)}{isMe && m.read_at ? ' · Read' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {error && <div className="mx-4 lg:mx-10 mb-2 text-xs text-red-400 font-mono">{error}</div>}

          <div className="border-t border-border px-4 lg:px-10 py-4 bg-background shrink-0">
            <div className="flex items-end gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="h-10 w-10 rounded-xl border border-border grid place-items-center text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-40 shrink-0 transition-colors"
                title="Send image (max 500 KB)"
              >
                {uploading ? <ImageIcon className="h-4 w-4 animate-pulse" /> : <Paperclip className="h-4 w-4" />}
              </button>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                placeholder="Message Furii team…"
                className="flex-1 bg-input border border-border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring overflow-y-auto"
                style={{ maxHeight: '128px' }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = Math.min(t.scrollHeight, 128) + 'px';
                }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="h-10 w-10 rounded-xl bg-foreground text-background grid place-items-center hover:bg-foreground/90 disabled:opacity-40 shrink-0 transition-opacity"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">Enter to send · Shift+Enter for new line · 📎 images up to 500 KB</p>
          </div>
        </>
      )}
    </div>
  );
}
