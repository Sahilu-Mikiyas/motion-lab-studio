import { useEffect, useRef, useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Send, MessageSquare } from 'lucide-react';

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

function fmt(d: string) {
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function Chat() {
  const { user } = useAuth();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Resolve admin user_id via SECURITY DEFINER function (bypasses RLS safely)
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

    // Mark incoming messages as read
    if (data && data.length > 0) {
      await supabase.from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', adminId)
        .eq('recipient_id', user.id)
        .is('read_at', null);
    }
  }, [user, adminId]);

  useEffect(() => { load(); }, [load]);

  // Realtime
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
    const { error: err } = await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: adminId,
      content,
    });
    if (err) { setError(err.message); setInput(content); }
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Group by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const d = fmtDate(m.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === d) last.msgs.push(m);
    else grouped.push({ date: d, msgs: [m] });
  });

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>
      <Header title="Messages" subtitle="Chat with the Furii team" />

      {!adminId && (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Connecting…
        </div>
      )}

      {adminId && (
        <>
          <div className="flex-1 overflow-y-auto px-4 lg:px-10 py-6 space-y-2">
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
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                            isMe ? 'bg-foreground text-background rounded-br-sm' : 'bg-secondary text-foreground rounded-bl-sm border border-border'
                          }`}>
                            {m.content}
                          </div>
                          {showMeta && (
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
            <div className="flex items-end gap-3">
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
            <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">Enter to send · Shift+Enter for new line</p>
          </div>
        </>
      )}
    </div>
  );
}
