import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  Users, FileText, CheckSquare, BookOpen, LayoutDashboard,
  ChevronDown, ChevronUp, ExternalLink, AlertCircle, LogOut,
  Clock, CheckCircle, XCircle, RefreshCw, DollarSign, Eye
} from 'lucide-react';
import logo from '@/assets/furii-logo.png';

type Tab = 'overview' | 'applications' | 'submissions' | 'users' | 'lessons';

const STATUS_COLORS: Record<string, string> = {
  not_started: 'text-muted-foreground',
  application_submitted: 'text-yellow-400',
  under_review: 'text-blue-400',
  legal_pending: 'text-orange-400',
  approved: 'text-emerald-400',
  complete: 'text-emerald-400',
  rejected: 'text-red-400',
  submitted: 'text-yellow-400',
  pending: 'text-muted-foreground',
  needs_revision: 'text-orange-400',
};

function Badge({ label, status }: { label: string; status: string }) {
  return (
    <span className={`text-[10px] font-mono uppercase tracking-wider ${STATUS_COLORS[status] || 'text-muted-foreground'}`}>
      {label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number | string; sub?: string }) {
  return (
    <div className="border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-3xl font-display">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function Admin() {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [apps, setApps] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [
      { data: a },
      { data: s },
      { data: u },
      { data: l },
      { data: t },
    ] = await Promise.all([
      supabase.from('applications').select('*').order('created_at', { ascending: false }),
      supabase.from('submissions').select('*, tasks(title, payout)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('lessons').select('*').order('sort_order'),
      supabase.from('tasks').select('*').order('required_level'),
    ]);
    setApps(a || []);
    setSubs((s as any) || []);
    setUsers(u || []);
    setLessons(l || []);
    setTasks(t || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approveApp = async (app: any, level: number) => {
    const { error: appErr } = await supabase.from('applications').update({ status: 'approved', assigned_level: level }).eq('id', app.id);
    if (appErr) return toast.error(appErr.message);
    const { error: profErr } = await supabase.from('profiles').update({ assigned_level: level, onboarding_status: 'approved' }).eq('user_id', app.user_id);
    if (profErr) return toast.error(profErr.message);
    toast.success(`${app.full_name} approved at level ${level}`);
    load();
  };

  const rejectApp = async (app: any) => {
    const { error: appErr } = await supabase.from('applications').update({ status: 'rejected' }).eq('id', app.id);
    if (appErr) return toast.error(appErr.message);
    const { error: profErr } = await supabase.from('profiles').update({ onboarding_status: 'rejected' }).eq('user_id', app.user_id);
    if (profErr) return toast.error(profErr.message);
    toast.success(`${app.full_name} rejected`);
    load();
  };

  const updateSub = async (id: string, status: string, feedback: string, payout: number) => {
    const { error } = await supabase.from('submissions').update({ status, feedback, payout }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Submission updated');
    load();
  };

  const updateUserLevel = async (userId: string, level: number) => {
    const { error } = await supabase.from('profiles').update({ assigned_level: level }).eq('user_id', userId);
    if (error) return toast.error(error.message);
    toast.success('Level updated');
    load();
  };

  const togglePaidStatus = async (userId: string, current: boolean) => {
    const { error } = await supabase.from('profiles').update({ paid_status: !current }).eq('user_id', userId);
    if (error) return toast.error(error.message);
    toast.success(`Paid status ${!current ? 'enabled' : 'disabled'}`);
    load();
  };

  // Stats
  const pendingApps = apps.filter(a => a.status === 'submitted').length;
  const pendingSubs = subs.filter(s => s.status === 'submitted').length;
  const totalEarned = subs.filter(s => s.status === 'approved').reduce((acc, s) => acc + (s.payout || 0), 0);
  const activeUsers = users.filter(u => u.onboarding_status === 'complete').length;

  const tabs: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'applications', label: 'Applications', icon: FileText, badge: pendingApps },
    { id: 'submissions', label: 'Submissions', icon: CheckSquare, badge: pendingSubs },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'lessons', label: 'Content', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-5 border-b border-border">
          <img src={logo} alt="Furii" className="h-7 w-auto invert" />
          <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground mt-2">Admin Console</div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${tab === id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            >
              <span className="flex items-center gap-2.5"><Icon className="h-4 w-4" />{label}</span>
              {badge ? <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tab === id ? 'bg-background/20 text-background' : 'bg-yellow-400/20 text-yellow-400'}`}>{badge}</span> : null}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={signOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="border-b border-border px-8 py-4 flex items-center justify-between sticky top-0 bg-background z-10">
          <h1 className="font-display text-xl capitalize">{tab}</h1>
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="p-8">
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Active trainees" value={activeUsers} sub={`${users.length} total accounts`} />
                <StatCard icon={FileText} label="Pending applications" value={pendingApps} sub="Awaiting review" />
                <StatCard icon={CheckSquare} label="Pending submissions" value={pendingSubs} sub="Awaiting feedback" />
                <StatCard icon={DollarSign} label="Total paid out" value={`$${totalEarned.toFixed(2)}`} sub="Approved submissions" />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent applications */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-medium">Recent Applications</span>
                    <button onClick={() => setTab('applications')} className="text-xs text-muted-foreground hover:text-foreground">View all</button>
                  </div>
                  <div className="divide-y divide-border">
                    {apps.slice(0, 5).map(a => (
                      <div key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm">{a.full_name}</div>
                          <Badge label={a.status} status={a.status} />
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {apps.length === 0 && <div className="px-5 py-4 text-sm text-muted-foreground">No applications yet.</div>}
                  </div>
                </div>

                {/* Recent submissions */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-medium">Recent Submissions</span>
                    <button onClick={() => setTab('submissions')} className="text-xs text-muted-foreground hover:text-foreground">View all</button>
                  </div>
                  <div className="divide-y divide-border">
                    {subs.slice(0, 5).map(s => (
                      <div key={s.id} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm">{s.tasks?.title || 'Task'}</div>
                          <Badge label={s.status} status={s.status} />
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {subs.length === 0 && <div className="px-5 py-4 text-sm text-muted-foreground">No submissions yet.</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* APPLICATIONS */}
          {tab === 'applications' && (
            <div className="space-y-3">
              {apps.length === 0 && <div className="text-sm text-muted-foreground">No applications yet.</div>}
              {apps.map(a => {
                const open = expandedApp === a.id;
                return (
                  <div key={a.id} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedApp(open ? null : a.id)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-secondary/50 text-left"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-mono shrink-0">
                          {a.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{a.full_name}</div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <Badge label={a.status} status={a.status} />
                            {a.country && <span className="text-[10px] text-muted-foreground font-mono">{a.country}</span>}
                            <span className="text-[10px] text-muted-foreground font-mono">{new Date(a.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </button>

                    {open && (
                      <div className="border-t border-border px-5 py-5 space-y-5">
                        <div className="grid md:grid-cols-2 gap-5">
                          {a.cover_letter && (
                            <div>
                              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Cover Letter</div>
                              <p className="text-sm leading-relaxed text-muted-foreground">{a.cover_letter}</p>
                            </div>
                          )}
                          {a.qualifications && (
                            <div>
                              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Qualifications</div>
                              <p className="text-sm leading-relaxed text-muted-foreground">{a.qualifications}</p>
                            </div>
                          )}
                        </div>

                        {a.questionnaire && Object.keys(a.questionnaire).length > 0 && (
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Questionnaire</div>
                            <div className="grid md:grid-cols-2 gap-2">
                              {Object.entries(a.questionnaire).map(([k, v]) => (
                                <div key={k} className="bg-secondary/50 rounded px-3 py-2">
                                  <div className="text-[10px] font-mono text-muted-foreground">{k.replace(/_/g, ' ')}</div>
                                  <div className="text-sm mt-0.5">{String(v)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Assign level:</span>
                            <input
                              type="number" min="0" max="10"
                              id={`lvl-${a.id}`}
                              defaultValue={a.assigned_level ?? 0}
                              className="w-16 bg-input border border-border rounded px-2 py-1 text-sm"
                            />
                          </div>
                          <button
                            onClick={() => approveApp(a, Number((document.getElementById(`lvl-${a.id}`) as HTMLInputElement)?.value || 0))}
                            className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-4 py-1.5 rounded-md hover:bg-emerald-500/20"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => rejectApp(a)}
                            className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/30 text-xs px-4 py-1.5 rounded-md hover:bg-red-500/20"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                          {a.cv_url && (
                            <a href={a.cv_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-auto">
                              <ExternalLink className="h-3.5 w-3.5" /> View CV
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* SUBMISSIONS */}
          {tab === 'submissions' && (
            <div className="space-y-3">
              {subs.length === 0 && <div className="text-sm text-muted-foreground">No submissions yet.</div>}
              {subs.map(s => {
                const open = expandedSub === s.id;
                return (
                  <div key={s.id} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedSub(open ? null : s.id)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-secondary/50 text-left"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{s.tasks?.title || 'Task'}</div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <Badge label={s.status} status={s.status} />
                            <span className="text-[10px] text-muted-foreground font-mono">{new Date(s.created_at).toLocaleDateString()}</span>
                            {s.payout > 0 && <span className="text-[10px] text-emerald-400 font-mono">${s.payout}</span>}
                          </div>
                        </div>
                      </div>
                      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </button>

                    {open && (
                      <div className="border-t border-border px-5 py-5 space-y-4">
                        {s.notes && (
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Trainee Notes</div>
                            <p className="text-sm text-muted-foreground">{s.notes}</p>
                          </div>
                        )}
                        {s.file_url && (
                          <a href={s.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded px-3 py-1.5">
                            <Eye className="h-3.5 w-3.5" /> View submitted file
                          </a>
                        )}
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">Feedback</label>
                            <textarea id={`fb-${s.id}`} defaultValue={s.feedback || ''} rows={3}
                              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm resize-none" />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">Payout ($)</label>
                            <input id={`po-${s.id}`} type="number" step="0.01" defaultValue={s.payout || 0}
                              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm" />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => updateSub(s.id, 'approved',
                            (document.getElementById(`fb-${s.id}`) as HTMLTextAreaElement)?.value || '',
                            Number((document.getElementById(`po-${s.id}`) as HTMLInputElement)?.value || 0))}
                            className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-4 py-1.5 rounded-md hover:bg-emerald-500/20">
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button onClick={() => updateSub(s.id, 'needs_revision',
                            (document.getElementById(`fb-${s.id}`) as HTMLTextAreaElement)?.value || '',
                            Number((document.getElementById(`po-${s.id}`) as HTMLInputElement)?.value || 0))}
                            className="flex items-center gap-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/30 text-xs px-4 py-1.5 rounded-md hover:bg-orange-500/20">
                            <AlertCircle className="h-3.5 w-3.5" /> Request revision
                          </button>
                          <button onClick={() => updateSub(s.id, 'pending', '', 0)}
                            className="flex items-center gap-1.5 text-muted-foreground border border-border text-xs px-4 py-1.5 rounded-md hover:bg-secondary">
                            Reset
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* USERS */}
          {tab === 'users' && (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Name</th>
                    <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Email</th>
                    <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Status</th>
                    <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Level</th>
                    <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Paid</th>
                    <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-secondary/30">
                      <td className="px-5 py-3">{u.full_name || u.display_name || '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground text-xs font-mono">{u.email}</td>
                      <td className="px-5 py-3"><Badge label={u.onboarding_status} status={u.onboarding_status} /></td>
                      <td className="px-5 py-3">
                        <input
                          type="number" min="0" max="10"
                          id={`ulvl-${u.id}`}
                          defaultValue={u.assigned_level}
                          className="w-14 bg-input border border-border rounded px-2 py-0.5 text-xs"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => togglePaidStatus(u.user_id, u.paid_status)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${u.paid_status ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-muted-foreground border-border'}`}
                        >
                          {u.paid_status ? 'Yes' : 'No'}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => updateUserLevel(u.user_id, Number((document.getElementById(`ulvl-${u.id}`) as HTMLInputElement)?.value || 0))}
                          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                        >
                          Save level
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-6 text-sm text-muted-foreground">No users yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* LESSONS / CONTENT */}
          {tab === 'lessons' && (
            <div className="space-y-6">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Lessons ({lessons.length})</div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">#</th>
                        <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Title</th>
                        <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Module</th>
                        <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Level req.</th>
                        <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Video</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {lessons.map(l => (
                        <tr key={l.id} className="hover:bg-secondary/30">
                          <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{l.sort_order}</td>
                          <td className="px-4 py-3">{l.title}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{l.module || '—'}</td>
                          <td className="px-4 py-3 text-xs font-mono">{l.required_level}</td>
                          <td className="px-4 py-3">
                            {l.youtube_url ? (
                              <a href={l.youtube_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                <ExternalLink className="h-3 w-3" /> Watch
                              </a>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Tasks ({tasks.length})</div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Title</th>
                        <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Level req.</th>
                        <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Payout</th>
                        <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Paid task</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {tasks.map(t => (
                        <tr key={t.id} className="hover:bg-secondary/30">
                          <td className="px-4 py-3">{t.title}</td>
                          <td className="px-4 py-3 text-xs font-mono">{t.required_level}</td>
                          <td className="px-4 py-3 text-xs font-mono">{t.payout > 0 ? `$${t.payout}` : '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-mono ${t.is_paid ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                              {t.is_paid ? 'Yes' : 'No'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
