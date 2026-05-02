import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Lock } from 'lucide-react';

export default function Payments() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!user || !profile?.paid_status) return;
    (async () => {
      const { data } = await supabase
        .from('submissions')
        .select('id, payout, status, created_at, task_id')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      const list = data || [];
      const taskIds = list.map((r: any) => r.task_id);
      const { data: tasks } = taskIds.length
        ? await supabase.from('tasks').select('id, title').in('id', taskIds)
        : { data: [] as any[] };
      const enriched = list.map((r: any) => ({ ...r, title: tasks?.find((t) => t.id === r.task_id)?.title || 'Task' }));
      setRows(enriched);
      setTotal(enriched.reduce((a, r) => a + Number(r.payout || 0), 0));
    })();
  }, [user, profile?.paid_status]);

  if (!profile?.paid_status) {
    return (
      <>
        <Header title="Payments" subtitle="Locked during training phase" />
        <div className="p-6 lg:p-10">
          <div className="border border-border rounded-md p-10 text-center max-w-xl mx-auto">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="font-display text-2xl mt-4">Payments unlock after training</div>
            <p className="text-sm text-muted-foreground mt-2">Complete the training phase and reach paid status to start earning per task.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Payments" subtitle={`Total earned: $${total.toFixed(2)}`} />
      <div className="p-6 lg:p-10">
        <div className="border border-border rounded-md divide-y divide-border">
          {rows.length === 0 && <div className="p-6 text-sm text-muted-foreground">No approved earnings yet.</div>}
          {rows.map((r) => (
            <div key={r.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm">{r.title}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{new Date(r.created_at).toLocaleDateString()}</div>
              </div>
              <div className="font-display text-xl">${Number(r.payout).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
