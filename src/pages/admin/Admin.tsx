import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Admin() {
  const [tab, setTab] = useState<'apps' | 'subs'>('apps');
  const [apps, setApps] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);

  const load = async () => {
    const [{ data: a }, { data: s }] = await Promise.all([
      supabase.from('applications').select('*').order('created_at', { ascending: false }),
      supabase.from('submissions').select('*, tasks(title)').order('created_at', { ascending: false }).limit(100),
    ]);
    setApps(a || []);
    setSubs((s as any) || []);
  };
  useEffect(() => { load(); }, []);

  const setAppStatus = async (id: string, user_id: string, status: string, level?: number) => {
    const { error } = await supabase.from('applications').update({ status, ...(level !== undefined ? { assigned_level: level } : {}) }).eq('id', id);
    if (error) return toast.error(error.message);
    if (level !== undefined) {
      await supabase.from('profiles').update({ assigned_level: level }).eq('user_id', user_id);
    }
    toast.success('Updated');
    load();
  };

  const setSubStatus = async (id: string, status: string, feedback?: string, payout?: number) => {
    const upd: any = { status };
    if (feedback !== undefined) upd.feedback = feedback;
    if (payout !== undefined) upd.payout = payout;
    const { error } = await supabase.from('submissions').update(upd).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Submission updated');
    load();
  };

  return (
    <>
      <Header title="Admin" subtitle="Review applications & submissions" />
      <div className="p-6 lg:p-10">
        <div className="flex gap-1 border border-border rounded-md p-1 w-fit text-sm mb-6">
          <button onClick={() => setTab('apps')} className={`px-4 py-1.5 rounded ${tab === 'apps' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}>Applications</button>
          <button onClick={() => setTab('subs')} className={`px-4 py-1.5 rounded ${tab === 'subs' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}>Submissions</button>
        </div>

        {tab === 'apps' && (
          <div className="border border-border rounded-md divide-y divide-border">
            {apps.length === 0 && <div className="p-6 text-sm text-muted-foreground">No applications.</div>}
            {apps.map((a) => (
              <div key={a.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-display text-lg">{a.full_name}</div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
                      {a.country || '—'} · status: {a.status} · level: {a.assigned_level ?? '—'}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{a.cover_letter}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <input type="number" placeholder="Level" className="w-20 bg-input border border-border rounded-md px-2 py-1 text-sm" id={`lvl-${a.id}`} defaultValue={a.assigned_level ?? ''} />
                    <button onClick={() => {
                      const lvl = Number((document.getElementById(`lvl-${a.id}`) as HTMLInputElement).value);
                      setAppStatus(a.id, a.user_id, 'approved', isNaN(lvl) ? 0 : lvl);
                    }} className="bg-foreground text-background text-xs px-3 py-1.5 rounded-md">Approve</button>
                    <button onClick={() => setAppStatus(a.id, a.user_id, 'rejected')} className="border border-border text-xs px-3 py-1.5 rounded-md hover:bg-secondary">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'subs' && (
          <div className="border border-border rounded-md divide-y divide-border">
            {subs.length === 0 && <div className="p-6 text-sm text-muted-foreground">No submissions.</div>}
            {subs.map((s) => (
              <div key={s.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm">{s.tasks?.title || 'Task'}</div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">status: {s.status}</div>
                    {s.notes && <p className="text-xs text-muted-foreground mt-2">{s.notes}</p>}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 w-44">
                    <input id={`fb-${s.id}`} placeholder="Feedback" className="bg-input border border-border rounded-md px-2 py-1 text-xs" defaultValue={s.feedback || ''} />
                    <input id={`po-${s.id}`} type="number" step="0.01" placeholder="Payout" className="bg-input border border-border rounded-md px-2 py-1 text-xs" defaultValue={s.payout || 0} />
                    <div className="flex gap-1">
                      <button onClick={() => setSubStatus(s.id, 'approved',
                        (document.getElementById(`fb-${s.id}`) as HTMLInputElement).value,
                        Number((document.getElementById(`po-${s.id}`) as HTMLInputElement).value))}
                        className="flex-1 bg-foreground text-background text-xs px-2 py-1 rounded-md">Approve</button>
                      <button onClick={() => setSubStatus(s.id, 'needs_revision', (document.getElementById(`fb-${s.id}`) as HTMLInputElement).value)}
                        className="flex-1 border border-border text-xs px-2 py-1 rounded-md hover:bg-secondary">Revise</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
