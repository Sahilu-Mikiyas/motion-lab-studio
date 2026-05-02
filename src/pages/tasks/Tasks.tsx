import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

type Task = { id: string; title: string; brief: string; payout: number; required_level: number; lesson_id: string | null };
type Sub = { id: string; task_id: string; status: string; feedback: string | null; created_at: string };

export default function Tasks() {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [active, setActive] = useState<Task | null>(null);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase.from('tasks').select('*').order('required_level'),
      supabase.from('submissions').select('id, task_id, status, feedback, created_at').eq('user_id', user.id),
    ]);
    setTasks((t as Task[]) || []);
    setSubs((s as Sub[]) || []);
  };
  useEffect(() => { load(); }, [user]);

  const subFor = (tid: string) => subs.find((s) => s.task_id === tid);

  const submit = async () => {
    if (!active || !user) return;
    setBusy(true);
    try {
      let filePath: string | null = null;
      if (file) {
        filePath = `${user.id}/${active.id}-${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('submissions').upload(filePath, file, { upsert: true });
        if (error) throw error;
      }
      const existing = subFor(active.id);
      if (existing) {
        const { error } = await supabase.from('submissions').update({
          file_url: filePath ?? undefined,
          notes,
          status: 'submitted',
        }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('submissions').insert({
          user_id: user.id, task_id: active.id, file_url: filePath, notes, status: 'submitted',
        });
        if (error) throw error;
      }
      toast.success('Submission sent');
      setNotes(''); setFile(null);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title="Tasks" subtitle="Submit work to progress" />
      <div className="p-6 lg:p-10 grid lg:grid-cols-[1fr_400px] gap-6">
        <div className="border border-border rounded-md divide-y divide-border">
          {tasks.length === 0 && <div className="p-6 text-sm text-muted-foreground">No tasks yet.</div>}
          {tasks.map((t) => {
            const s = subFor(t.id);
            const locked = (profile?.assigned_level ?? 0) < t.required_level;
            return (
              <button
                key={t.id}
                disabled={locked}
                onClick={() => { setActive(t); setNotes(s ? '' : ''); setFile(null); }}
                className={`w-full text-left p-5 hover:bg-secondary/50 transition-colors ${active?.id === t.id ? 'bg-secondary/60' : ''} ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Level {t.required_level} {t.payout > 0 && `· $${Number(t.payout).toFixed(2)}`}</div>
                    <div className="text-sm mt-1 truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.brief}</div>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground shrink-0">{s?.status || 'pending'}</span>
                </div>
              </button>
            );
          })}
        </div>

        <aside className="border border-border rounded-md p-5 h-fit sticky top-20">
          {!active && <div className="text-sm text-muted-foreground">Select a task to begin.</div>}
          {active && (
            <>
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Task</div>
              <div className="font-display text-xl mt-1">{active.title}</div>
              <p className="text-sm text-muted-foreground mt-3">{active.brief}</p>

              {subFor(active.id)?.feedback && (
                <div className="mt-4 border border-border rounded-md p-3 text-sm">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Mentor feedback</div>
                  <div className="mt-1">{subFor(active.id)?.feedback}</div>
                </div>
              )}

              <div className="mt-4 space-y-3">
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Notes (optional)"
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
                <label className="flex items-center gap-2 border border-dashed border-border rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-secondary">
                  <Upload className="h-4 w-4" />
                  <span className="truncate">{file?.name || 'Attach file'}</span>
                  <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
                <button onClick={submit} disabled={busy} className="w-full bg-foreground text-background rounded-md py-2 text-sm disabled:opacity-50">
                  {busy ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
