import { useEffect, useRef, useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Send } from 'lucide-react';

const ADMIN_EMAIL = 'furiimotionlabs@outlook.com';

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
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get admin user_id from profiles
  useEffect(() => {
    supabase.from('profiles').select('user_id').eq('email', ADMIN_EMAIL).maybeSingle()
      .then(({ data }) => { if (data) setAdminId(data.user_id); });
  }, []);

  const load = useCallback(async () => {
    if (!user || !adminId) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${adminId}),and(sender_id.eq.${adminId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) || []);

    // Mark admin messages as read
    await supabase.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', adminId)
      .eq('recipient_id', user.id)
      .is('read_at', null);
  }, [user, adminId]);

  useEffect(() => { load(); }, [load]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !adminId) return;
    const channel = supabase
      .channel(`chat:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, payload => {
        const msg = payload.new as Message;
        const relevant = (msg.sender_id === user.id && msg.recipient_id === adminId) ||
                         (msg.sender_id === adminId && msg.recipient_id === user.id);
        if (relevant) setMessages(prev => [...prev, msg]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, adminId]);

  // Scroll to bottom on new messages
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || !user || !adminId || sending) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    await supabase.from('messages').insert({ sender_id: user.id, recipient_id: adminId, content });
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Group messages by date
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
      <div className="flex-1 overflow-y-auto px-4 lg:px-10 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground mt-20">
            No messages yet. Send one to start the conversation.
          </div>
        )}
        {grouped.map(group => (
          <div key={group.date} className="space-y-2">
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{group.date}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {group.msgs.map((m, i) => {
              const isMe = m.sender_id === user?.id;
              const showTime = i === group.msgs.length - 1 || group.msgs[i + 1]?.sender_id !== m.sender_id;
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                      ? 'bg-foreground text-background rounded-br-sm'
                      : 'bg-secondary text-foreground rounded-bl-sm border border-border'}`}>
                      {m.content}
                    </div>
                    {showTime && (
                      <span className="text-[10px] text-muted-foreground font-mono px-1">
                        {fmt(m.created_at)}{isMe && m.read_at ? ' · Read' : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 lg:px-10 py-4 bg-background">
        <div className="flex items-end gap-3 max-w-4xl">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Message Furii team…"
            className="flex-1 bg-input border border-border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring max-h-32 overflow-y-auto"
            style={{ height: 'auto' }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending || !adminId}
            className="h-10 w-10 rounded-xl bg-foreground text-background grid place-items-center hover:bg-foreground/90 disabled:opacity-40 shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
