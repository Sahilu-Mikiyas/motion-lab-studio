import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Mail, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const ADMIN_EMAIL = 'furiimotionlabs@outlook.com';

export default function Contact() {
  const { profile } = useAuth();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const send = () => {
    if (!subject.trim() || !body.trim()) return;
    const from = profile?.email ? `\n\n— ${profile.full_name || profile.display_name || ''} (${profile.email})` : '';
    const mailto = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + from)}`;
    window.location.href = mailto;
  };

  return (
    <>
      <Header title="Contact" subtitle="Reach out to the Furii team" />
      <div className="p-6 lg:p-10 max-w-2xl space-y-8">

        {/* Info card */}
        <div className="border border-border rounded-lg p-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center shrink-0">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="text-sm font-medium">Studio email</div>
            <a href={`mailto:${ADMIN_EMAIL}`} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 mt-0.5 block">
              {ADMIN_EMAIL}
            </a>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Use the form below or email us directly for questions about your training, submissions, payments, or anything else. We typically respond within 24–48 hours.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Send a message</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Question about my submission"
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              placeholder="Write your message here…"
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <button
            onClick={send}
            disabled={!subject.trim() || !body.trim()}
            className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-md text-sm hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" /> Open in mail app
          </button>
          <p className="text-xs text-muted-foreground">This will open your default email client with the message pre-filled.</p>
        </div>

      </div>
    </>
  );
}
