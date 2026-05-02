import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Check, ExternalLink, Lock } from 'lucide-react';
import { toast } from 'sonner';

type Lesson = { id: string; title: string; description: string | null; youtube_url: string | null; module: string | null; sort_order: number; required_level: number };

export default function Learning() {
  const { user, profile } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());

  const load = async () => {
    if (!user) return;
    const [{ data: ls }, { data: lp }] = await Promise.all([
      supabase.from('lessons').select('*').order('sort_order'),
      supabase.from('lesson_progress').select('lesson_id, completed').eq('user_id', user.id).eq('completed', true),
    ]);
    setLessons((ls as Lesson[]) || []);
    setDone(new Set((lp || []).map((r: any) => r.lesson_id)));
  };
  useEffect(() => { load(); }, [user]);

  const toggle = async (l: Lesson) => {
    if (!user) return;
    const isDone = done.has(l.id);
    const { error } = await supabase.from('lesson_progress').upsert({
      user_id: user.id, lesson_id: l.id, completed: !isDone, completed_at: !isDone ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,lesson_id' });
    if (error) return toast.error(error.message);
    toast.success(!isDone ? 'Marked complete' : 'Marked incomplete');
    load();
  };

  return (
    <>
      <Header title="Learning" subtitle="Structured lessons & external resources" />
      <div className="p-6 lg:p-10 space-y-3">
        {lessons.length === 0 && <div className="text-sm text-muted-foreground">No lessons yet.</div>}
        {lessons.map((l) => {
          const locked = (profile?.assigned_level ?? 0) < l.required_level;
          const isDone = done.has(l.id);
          return (
            <div key={l.id} className={`border border-border rounded-md p-5 ${locked ? 'opacity-40' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{l.module} · Level {l.required_level}</div>
                  <div className="font-display text-xl mt-1">{l.title}</div>
                  {l.description && <p className="text-sm text-muted-foreground mt-2">{l.description}</p>}
                  {l.youtube_url && !locked && (
                    <a href={l.youtube_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs mt-3 text-foreground border border-border px-3 py-1.5 rounded-md hover:bg-secondary">
                      Watch <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="shrink-0">
                  {locked ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <button onClick={() => toggle(l)} className={`h-9 px-3 rounded-md border border-border text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 ${isDone ? 'bg-foreground text-background' : 'hover:bg-secondary'}`}>
                      {isDone ? <><Check className="h-3 w-3" /> Done</> : 'Mark done'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
