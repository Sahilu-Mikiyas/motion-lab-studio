import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ lessonsTotal: 0, lessonsDone: 0, tasksOpen: 0, submissionsApproved: 0, earnings: 0 });
  const [recent, setRecent] = useState<{ id: string; title: string; status: string; created_at: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: lessonsTotal }, { count: lessonsDone }, { data: subs }, { count: tasksOpen }] = await Promise.all([
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('lesson_progress').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
        supabase.from('submissions').select('id, status, payout, created_at, task_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
      ]);
      const approved = subs?.filter((s) => s.status === 'approved') ?? [];
      const earnings = approved.reduce((a, s: any) => a + Number(s.payout || 0), 0);

      // hydrate task titles
      let recentRows: any[] = [];
      if (subs && subs.length) {
        const taskIds = subs.map((s: any) => s.task_id);
        const { data: tasks } = await supabase.from('tasks').select('id, title').in('id', taskIds);
        recentRows = subs.map((s: any) => ({
          id: s.id,
          title: tasks?.find((t) => t.id === s.task_id)?.title || 'Task',
          status: s.status,
          created_at: s.created_at,
        }));
      }

      setStats({
        lessonsTotal: lessonsTotal || 0,
        lessonsDone: lessonsDone || 0,
        tasksOpen: tasksOpen || 0,
        submissionsApproved: approved.length,
        earnings,
      });
      setRecent(recentRows);
    })();
  }, [user]);

  const progressPct = stats.lessonsTotal ? Math.round((stats.lessonsDone / stats.lessonsTotal) * 100) : 0;

  return (
    <>
      <Header title={`Welcome, ${profile?.full_name || 'Trainee'}`} subtitle={`Level ${profile?.assigned_level ?? 0} · ${profile?.paid_status ? 'Paid status' : 'Training phase'}`} />
      <div className="p-6 lg:p-10 space-y-8">
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { l: 'Assigned level', v: String(profile?.assigned_level ?? 0) },
            { l: 'Lessons completed', v: `${stats.lessonsDone} / ${stats.lessonsTotal}` },
            { l: 'Tasks approved', v: String(stats.submissionsApproved) },
            { l: 'Earnings', v: profile?.paid_status ? `$${stats.earnings.toFixed(2)}` : '—' },
          ].map((s) => (
            <div key={s.l} className="border border-border rounded-md p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">{s.l}</div>
              <div className="font-display text-3xl mt-2">{s.v}</div>
            </div>
          ))}
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-border rounded-md p-6">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Training progress</div>
            <div className="font-display text-2xl mt-1">{progressPct}% complete</div>
            <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-foreground transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
            <Link to="/learning" className="inline-flex items-center gap-2 mt-6 text-sm border border-border rounded-md px-4 py-2 hover:bg-secondary">
              Continue learning <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="border border-border rounded-md p-6">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Recent submissions</div>
            <div className="mt-3 divide-y divide-border">
              {recent.length === 0 && <div className="text-sm text-muted-foreground py-3">No submissions yet.</div>}
              {recent.map((r) => (
                <div key={r.id} className="py-3">
                  <div className="text-sm truncate">{r.title}</div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{r.status}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
