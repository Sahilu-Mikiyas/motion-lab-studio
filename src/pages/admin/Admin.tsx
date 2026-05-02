import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  Users, FileText, CheckSquare, BookOpen, LayoutDashboard,
  ChevronDown, ChevronUp, ExternalLink, AlertCircle, LogOut,
  CheckCircle, XCircle, RefreshCw, DollarSign, Eye, Activity,
  TrendingUp, Clock, UserCheck, Folder, Download, MessageSquare, Send, Bell,
} from 'lucide-react';
import logo from '@/assets/furii-logo.png';
import { useNotifications } from '@/hooks/useNotifications';

type Tab = 'overview' | 'applications' | 'submissions' | 'users' | 'files' | 'content' | 'messages';

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

const STATUS_BG: Record<string, string> = {
  application_submitted: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
  under_review: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
  approved: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  complete: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  rejected: 'bg-red-400/10 text-red-400 border-red-400/30',
  submitted: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
  needs_revision: 'bg-orange-400/10 text-orange-400 border-orange-400/30',
  not_started: 'bg-secondary text-muted-foreground border-border',
  legal_pending: 'bg-orange-400/10 text-orange-400 border-orange-400/30',
  pending: 'bg-secondary text-muted-foreground border-border',
};

function Pill({ label, status }: { label: string; status: string }) {
  return (
    <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_BG[status] || 'bg-secondary text-muted-foreground border-border'}`}>
      {label.replace(/_/g, ' ')}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: number | string; sub?: string; accent?: string }) {
  return (
    <div className="border border-border rounded-lg p-5 bg-background">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className={`h-8 w-8 rounded-md flex items-center justify-center ${accent || 'bg-secondary'}`}>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="text-3xl font-display">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function ActivityRow({ icon: Icon, text, time, accent }: { icon: any; text: string; time: string; accent?: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${accent || 'bg-secondary'}`}>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">{text}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

async function getSignedUrl(path: string): Promise<string> {
  const bucket = 'submissions';
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error || !data) return path;
  return data.signedUrl;
}

async function openFile(url: string) {
  if (!url) return;
  const isStoragePath = !url.startsWith('http');
  const finalUrl = isStoragePath ? await getSignedUrl(url) : url;
  window.open(finalUrl, '_blank');
}

export default function Admin() {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [apps, setApps] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [storageFiles, setStorageFiles] = useState<any[]>([]);
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
      supabase.from('submissions').select('*, tasks(title, payout), profiles(full_name, email, display_name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('lessons').select('*').order('sort_order'),
      supabase.from('tasks').select('*').order('required_level'),
    ]);
    setApps(a || []);
    setSubs((s as any) || []);
    setUsers(u || []);
    setLessons(l || []);
    setTasks(t || []);

    // Load storage files
    const { data: files } = await supabase.storage.from('submissions').list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
    setStorageFiles(files || []);

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approveApp = async (app: any, level: number) => {
    const { error: e1 } = await supabase.from('applications').update({ status: 'approved', assigned_level: level }).eq('id', app.id);
    if (e1) return toast.error(e1.message);
    const { error: e2 } = await supabase.from('profiles').update({ assigned_level: level, onboarding_status: 'approved' }).eq('user_id', app.user_id);
    if (e2) return toast.error(e2.message);
    toast.success(`${app.full_name} approved at level ${level}`);
    load();
  };

  const rejectApp = async (app: any) => {
    const { error: e1 } = await supabase.from('applications').update({ status: 'rejected' }).eq('id', app.id);
    if (e1) return toast.error(e1.message);
    const { error: e2 } = await supabase.from('profiles').update({ onboarding_status: 'rejected' }).eq('user_id', app.user_id);
    if (e2) return toast.error(e2.message);
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

  const updateOnboardingStatus = async (userId: string, status: string) => {
    const { error } = await supabase.from('profiles').update({ onboarding_status: status }).eq('user_id', userId);
    if (error) return toast.error(error.message);
    toast.success('Status updated');
    load();
  };

  // Stats
  const pendingApps = apps.filter(a => a.status === 'submitted').length;
  const pendingSubs = subs.filter(s => s.status === 'submitted').length;
  const totalEarned = subs.filter(s => s.status === 'approved').reduce((acc, s) => acc + (s.payout || 0), 0);
  const activeUsers = users.filter(u => u.onboarding_status === 'complete').length;
  const approvedApps = apps.filter(a => a.status === 'approved').length;
  const approvedSubs = subs.filter(s => s.status === 'approved').length;

  // Activity feed — merge and sort recent events
  const activity: { icon: any; text: string; time: string; accent?: string }[] = [
    ...apps.slice(0, 6).map(a => ({
      icon: FileText,
      text: `${a.full_name} submitted an application`,
      time: fmtTime(a.created_at),
      accent: a.status === 'approved' ? 'bg-emerald-500/10' : a.status === 'rejected' ? 'bg-red-500/10' : 'bg-yellow-500/10',
    })),
    ...subs.slice(0, 6).map(s => ({
      icon: CheckSquare,
      text: `${s.profiles?.full_name || s.profiles?.display_name || 'A trainee'} submitted "${s.tasks?.title || 'a task'}"`,
      time: fmtTime(s.created_at),
      accent: s.status === 'approved' ? 'bg-emerald-500/10' : s.status === 'needs_revision' ? 'bg-orange-500/10' : 'bg-blue-500/10',
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

  // Messages state
  const { user: adminUser } = useAuth();
  const { unreadCount: adminUnread, notifications: adminNotifs, markRead: markAdminRead, markAllRead: markAllAdminRead } = useNotifications();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [convoMessages, setConvoMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadMessages = conversations.reduce((acc, c) => acc + (c.unread || 0), 0);

  const loadConversations = useCallback(async () => {
    if (!adminUser) return;
    const { data: msgs } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(full_name, display_name, email, user_id), recipient:profiles!messages_recipient_id_fkey(full_name, display_name, email, user_id)')
      .or(`sender_id.eq.${adminUser.id},recipient_id.eq.${adminUser.id}`)
      .order('created_at', { ascending: false });

    if (!msgs) return;
    const map = new Map<string, any>();
    for (const m of msgs) {
      const other = m.sender_id === adminUser.id ? m.recipient : m.sender;
      if (!other) continue;
      const uid = other.user_id;
      if (!map.has(uid)) {
        map.set(uid, { user_id: uid, name: other.full_name || other.display_name || other.email, email: other.email, lastMsg: m.content, lastAt: m.created_at, unread: 0 });
      }
      if (m.sender_id !== adminUser.id && !m.read_at) {
        map.get(uid).unread += 1;
      }
    }
    setConversations(Array.from(map.values()));
  }, [adminUser]);

  const loadConvoMessages = useCallback(async (otherUserId: string) => {
    if (!adminUser) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${adminUser.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${adminUser.id})`)
      .order('created_at', { ascending: true });
    setConvoMessages(data || []);
    // Mark as read
    await supabase.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', otherUserId)
      .eq('recipient_id', adminUser.id)
      .is('read_at', null);
    setConversations(prev => prev.map(c => c.user_id === otherUserId ? { ...c, unread: 0 } : c));
  }, [adminUser]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (activeConvo) loadConvoMessages(activeConvo);
  }, [activeConvo, loadConvoMessages]);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [convoMessages]);

  // Realtime for admin messages
  useEffect(() => {
    if (!adminUser) return;
    const channel = supabase.channel('admin-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        loadConversations();
        if (activeConvo) loadConvoMessages(activeConvo);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [adminUser, activeConvo, loadConversations, loadConvoMessages]);

  const sendAdminMsg = async () => {
    if (!msgInput.trim() || !adminUser || !activeConvo || msgSending) return;
    setMsgSending(true);
    const content = msgInput.trim();
    setMsgInput('');
    await supabase.from('messages').insert({ sender_id: adminUser.id, recipient_id: activeConvo, content });
    setMsgSending(false);
  };

  const handleMsgKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAdminMsg(); }
  };

  function fmtMsg(d: string) {
    return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  function fmtMsgDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  const tabs: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'applications', label: 'Applications', icon: FileText, badge: pendingApps },
    { id: 'submissions', label: 'Submissions', icon: CheckSquare, badge: pendingSubs },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'files', label: 'Files', icon: Folder },
    { id: 'content', label: 'Content', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-5 border-b border-border">
          <img src={logo} alt="Furii" className="h-7 w-auto invert" />
          <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground mt-1.5">Admin Console</div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${tab === id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            >
              <span className="flex items-center gap-2.5"><Icon className="h-4 w-4" />{label}</span>
              {badge ? (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-background/20 text-background' : 'bg-yellow-400/20 text-yellow-400'}`}>
                  {badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-0.5">
          <div className="px-3 py-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Studio admin</div>
          <button onClick={signOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="border-b border-border px-8 py-4 flex items-center justify-between sticky top-0 bg-background z-10">
          <div>
            <h1 className="font-display text-xl capitalize">{tab}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Furii Animation Studio · Admin Console</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Admin notification bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="relative h-9 w-9 grid place-items-center rounded-md border border-border hover:bg-secondary"
              >
                <Bell className="h-4 w-4" />
                {adminUnread > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-foreground text-background text-[9px] font-mono flex items-center justify-center">
                    {adminUnread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-11 w-72 bg-background border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-medium">Notifications</span>
                    {adminUnread > 0 && (
                      <button onClick={markAllAdminRead} className="text-xs text-muted-foreground hover:text-foreground">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-border">
                    {adminNotifs.length === 0 && <div className="px-4 py-6 text-sm text-muted-foreground text-center">No notifications.</div>}
                    {adminNotifs.map(n => (
                      <button key={n.id} onClick={() => { markAdminRead(n.id); setNotifOpen(false); if (n.link === '/chat') { setTab('messages'); } }}
                        className={`w-full flex gap-3 px-4 py-3 text-left hover:bg-secondary/50 ${!n.read ? 'bg-secondary/20' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!n.read ? 'font-medium' : ''}`}>{n.title}</p>
                          {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                        </div>
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-foreground shrink-0 mt-2" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-md">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        <div className="p-8">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-8">
              {/* Stat grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={UserCheck} label="Active trainees" value={activeUsers} sub={`${users.length} total accounts`} accent="bg-emerald-500/10" />
                <StatCard icon={Clock} label="Pending applications" value={pendingApps} sub={`${approvedApps} approved total`} accent="bg-yellow-500/10" />
                <StatCard icon={Activity} label="Pending submissions" value={pendingSubs} sub={`${approvedSubs} approved total`} accent="bg-blue-500/10" />
                <StatCard icon={DollarSign} label="Total paid out" value={`$${totalEarned.toFixed(2)}`} sub="Approved submissions" accent="bg-emerald-500/10" />
              </div>

              {/* Secondary stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border border-border rounded-lg p-4 text-center">
                  <div className="text-2xl font-display">{apps.length}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">Total applications</div>
                </div>
                <div className="border border-border rounded-lg p-4 text-center">
                  <div className="text-2xl font-display">{subs.length}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">Total submissions</div>
                </div>
                <div className="border border-border rounded-lg p-4 text-center">
                  <div className="text-2xl font-display">{users.filter(u => u.paid_status).length}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">Paid trainees</div>
                </div>
                <div className="border border-border rounded-lg p-4 text-center">
                  <div className="text-2xl font-display">{lessons.length}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">Total lessons</div>
                </div>
              </div>

              {/* Quick actions */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Quick actions</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Review applications', sub: `${pendingApps} waiting`, icon: FileText, go: () => setTab('applications') },
                    { label: 'Grade submissions', sub: `${pendingSubs} waiting`, icon: CheckSquare, go: () => setTab('submissions') },
                    { label: 'Manage users', sub: `${users.length} accounts`, icon: Users, go: () => setTab('users') },
                    { label: 'Browse files', sub: `${storageFiles.length} files`, icon: Folder, go: () => setTab('files') },
                  ].map(({ label, sub, icon: Icon, go }) => (
                    <button key={label} onClick={go} className="border border-border rounded-lg p-4 text-left hover:bg-secondary/50 transition-colors group">
                      <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground mb-3 transition-colors" />
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Activity feed */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Recent activity</span>
                  </div>
                  <div className="px-5 divide-y divide-border">
                    {activity.length === 0 && <p className="py-4 text-sm text-muted-foreground">No activity yet.</p>}
                    {activity.map((a, i) => <ActivityRow key={i} {...a} />)}
                  </div>
                </div>

                {/* Trainee status breakdown */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Trainee pipeline</span>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      { label: 'Applied', count: apps.filter(a => a.status === 'submitted').length, color: 'bg-yellow-400' },
                      { label: 'Under review', count: apps.filter(a => a.status === 'under_review').length, color: 'bg-blue-400' },
                      { label: 'Approved (pending accept)', count: users.filter(u => u.onboarding_status === 'approved').length, color: 'bg-emerald-300' },
                      { label: 'Active trainees', count: activeUsers, color: 'bg-emerald-500' },
                      { label: 'Rejected', count: apps.filter(a => a.status === 'rejected').length, color: 'bg-red-400' },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${color}`} />
                        <div className="flex-1 text-sm text-muted-foreground">{label}</div>
                        <div className="text-sm font-mono font-medium">{count}</div>
                      </div>
                    ))}
                  </div>

                  {/* Level distribution */}
                  <div className="px-5 pb-5">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3 pt-3 border-t border-border">Level distribution</div>
                    <div className="space-y-2">
                      {Array.from({ length: 5 }, (_, i) => i + 1).map(lvl => {
                        const count = users.filter(u => u.assigned_level === lvl && u.onboarding_status === 'complete').length;
                        const max = Math.max(...Array.from({ length: 10 }, (_, i) => users.filter(u => u.assigned_level === i + 1).length), 1);
                        return (
                          <div key={lvl} className="flex items-center gap-3">
                            <span className="text-xs font-mono text-muted-foreground w-8">Lv{lvl}</span>
                            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-foreground rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                            </div>
                            <span className="text-xs font-mono text-muted-foreground w-4 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MESSAGES ── */}
          {tab === 'messages' && (
            <div className="flex gap-0 border border-border rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>
              {/* Conversation list */}
              <div className="w-72 shrink-0 border-r border-border flex flex-col">
                <div className="px-4 py-3 border-b border-border">
                  <span className="text-sm font-medium">Conversations</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{conversations.length} trainees</p>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-border">
                  {conversations.length === 0 && (
                    <div className="px-4 py-8 text-sm text-muted-foreground text-center">No messages yet.</div>
                  )}
                  {conversations.map(c => (
                    <button
                      key={c.user_id}
                      onClick={() => setActiveConvo(c.user_id)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors ${activeConvo === c.user_id ? 'bg-secondary' : ''}`}
                    >
                      <div className="h-9 w-9 rounded-full bg-secondary border border-border flex items-center justify-center text-sm font-display shrink-0">
                        {(c.name || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{c.name}</span>
                          {c.unread > 0 && (
                            <span className="h-5 min-w-5 px-1 rounded-full bg-foreground text-background text-[9px] font-mono flex items-center justify-center shrink-0">
                              {c.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMsg}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{fmtMsgDate(c.lastAt)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat area */}
              <div className="flex-1 flex flex-col min-w-0">
                {!activeConvo ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <MessageSquare className="h-10 w-10 opacity-20" />
                    <p className="text-sm">Select a conversation</p>
                  </div>
                ) : (
                  <>
                    {/* Chat header */}
                    <div className="px-5 py-3 border-b border-border shrink-0">
                      <div className="text-sm font-medium">{conversations.find(c => c.user_id === activeConvo)?.name || 'Trainee'}</div>
                      <div className="text-xs text-muted-foreground font-mono">{conversations.find(c => c.user_id === activeConvo)?.email}</div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                      {convoMessages.map((m, i) => {
                        const isAdmin = m.sender_id === adminUser?.id;
                        const showTime = i === convoMessages.length - 1 || convoMessages[i + 1]?.sender_id !== m.sender_id;
                        return (
                          <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] flex flex-col gap-0.5 ${isAdmin ? 'items-end' : 'items-start'}`}>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isAdmin
                                ? 'bg-foreground text-background rounded-br-sm'
                                : 'bg-secondary text-foreground rounded-bl-sm border border-border'}`}>
                                {m.content}
                              </div>
                              {showTime && (
                                <span className="text-[10px] text-muted-foreground font-mono px-1">
                                  {fmtMsg(m.created_at)}{isAdmin && m.read_at ? ' · Read' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Input */}
                    <div className="px-5 py-3 border-t border-border shrink-0">
                      <div className="flex items-end gap-2">
                        <textarea
                          value={msgInput}
                          onChange={e => setMsgInput(e.target.value)}
                          onKeyDown={handleMsgKey}
                          rows={1}
                          placeholder="Reply…"
                          className="flex-1 bg-input border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring max-h-24 overflow-y-auto"
                          onInput={e => {
                            const t = e.target as HTMLTextAreaElement;
                            t.style.height = 'auto';
                            t.style.height = Math.min(t.scrollHeight, 96) + 'px';
                          }}
                        />
                        <button
                          onClick={sendAdminMsg}
                          disabled={!msgInput.trim() || msgSending}
                          className="h-9 w-9 rounded-xl bg-foreground text-background grid place-items-center hover:bg-foreground/90 disabled:opacity-40 shrink-0"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── APPLICATIONS ── */}
          {tab === 'applications' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-5">
                <div className="text-sm text-muted-foreground">{apps.length} total · {pendingApps} pending review</div>
              </div>
              {apps.length === 0 && <div className="text-sm text-muted-foreground">No applications yet.</div>}
              {apps.map(a => {
                const open = expandedApp === a.id;
                return (
                  <div key={a.id} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedApp(open ? null : a.id)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-secondary/30 text-left"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-sm font-display shrink-0">
                          {a.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{a.full_name}</div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Pill label={a.status} status={a.status} />
                            {a.country && <span className="text-[10px] text-muted-foreground font-mono">{a.country}</span>}
                            <span className="text-[10px] text-muted-foreground font-mono">{fmt(a.created_at)}</span>
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
                              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{a.cover_letter}</p>
                            </div>
                          )}
                          {a.qualifications && (
                            <div>
                              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Qualifications</div>
                              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{a.qualifications}</p>
                            </div>
                          )}
                        </div>

                        {a.questionnaire && Object.keys(a.questionnaire).length > 0 && (
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Questionnaire</div>
                            <div className="grid md:grid-cols-2 gap-2">
                              {Object.entries(a.questionnaire).map(([k, v]) => (
                                <div key={k} className="bg-secondary/40 rounded-md px-3 py-2.5">
                                  <div className="text-[10px] font-mono text-muted-foreground mb-0.5">{k.replace(/_/g, ' ')}</div>
                                  <div className="text-sm">{String(v)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Level:</span>
                            <input
                              type="number" min="0" max="10"
                              id={`lvl-${a.id}`}
                              defaultValue={a.assigned_level ?? 1}
                              className="w-16 bg-input border border-border rounded-md px-2 py-1.5 text-sm"
                            />
                          </div>
                          <button
                            onClick={() => approveApp(a, Number((document.getElementById(`lvl-${a.id}`) as HTMLInputElement)?.value || 1))}
                            className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-4 py-2 rounded-md hover:bg-emerald-500/20"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => rejectApp(a)}
                            className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/30 text-xs px-4 py-2 rounded-md hover:bg-red-500/20"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                          {a.cv_url && (
                            <button onClick={() => openFile(a.cv_url)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-2 rounded-md ml-auto">
                              <Eye className="h-3.5 w-3.5" /> View CV
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SUBMISSIONS ── */}
          {tab === 'submissions' && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground mb-5">{subs.length} total · {pendingSubs} awaiting review · ${totalEarned.toFixed(2)} paid out</div>
              {subs.length === 0 && <div className="text-sm text-muted-foreground">No submissions yet.</div>}
              {subs.map(s => {
                const open = expandedSub === s.id;
                const name = s.profiles?.full_name || s.profiles?.display_name || 'Unknown';
                return (
                  <div key={s.id} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedSub(open ? null : s.id)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-secondary/30 text-left"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-sm font-display shrink-0">
                          {name[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{s.tasks?.title || 'Task'}</div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Pill label={s.status} status={s.status} />
                            <span className="text-[10px] text-muted-foreground font-mono">{name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{fmt(s.created_at)}</span>
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
                            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Trainee notes</div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.notes}</p>
                          </div>
                        )}
                        {s.file_url && (
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Submitted file</div>
                            <button
                              onClick={() => openFile(s.file_url)}
                              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-4 py-2 hover:bg-secondary"
                            >
                              <Eye className="h-3.5 w-3.5" /> Open file
                            </button>
                          </div>
                        )}
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Feedback</label>
                            <textarea id={`fb-${s.id}`} defaultValue={s.feedback || ''} rows={4}
                              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm resize-none" />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Payout ($)</label>
                            <input id={`po-${s.id}`} type="number" step="0.01" min="0" defaultValue={s.payout || 0}
                              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm" />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button onClick={() => updateSub(s.id, 'approved',
                            (document.getElementById(`fb-${s.id}`) as HTMLTextAreaElement)?.value || '',
                            Number((document.getElementById(`po-${s.id}`) as HTMLInputElement)?.value || 0))}
                            className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-4 py-2 rounded-md hover:bg-emerald-500/20">
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button onClick={() => updateSub(s.id, 'needs_revision',
                            (document.getElementById(`fb-${s.id}`) as HTMLTextAreaElement)?.value || '',
                            Number((document.getElementById(`po-${s.id}`) as HTMLInputElement)?.value || 0))}
                            className="flex items-center gap-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/30 text-xs px-4 py-2 rounded-md hover:bg-orange-500/20">
                            <AlertCircle className="h-3.5 w-3.5" /> Request revision
                          </button>
                          <button onClick={() => updateSub(s.id, 'pending', '', 0)}
                            className="flex items-center gap-1.5 text-muted-foreground border border-border text-xs px-4 py-2 rounded-md hover:bg-secondary">
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

          {/* ── USERS ── */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">{users.length} accounts · {activeUsers} active trainees</div>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left bg-secondary/20">
                        <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Name</th>
                        <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Email</th>
                        <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Status</th>
                        <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Level</th>
                        <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Paid</th>
                        <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Joined</th>
                        <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-secondary/20">
                          <td className="px-5 py-3 font-medium">{u.full_name || u.display_name || '—'}</td>
                          <td className="px-5 py-3 text-muted-foreground text-xs font-mono">{u.email}</td>
                          <td className="px-5 py-3">
                            <select
                              defaultValue={u.onboarding_status}
                              onChange={e => updateOnboardingStatus(u.user_id, e.target.value)}
                              className="bg-input border border-border rounded px-2 py-1 text-xs font-mono"
                            >
                              {['not_started','application_submitted','under_review','legal_pending','approved','complete','rejected'].map(s => (
                                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-3">
                            <input
                              type="number" min="0" max="10"
                              id={`ulvl-${u.id}`}
                              defaultValue={u.assigned_level}
                              className="w-14 bg-input border border-border rounded px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => togglePaidStatus(u.user_id, u.paid_status)}
                              className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${u.paid_status ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-muted-foreground border-border hover:bg-secondary'}`}
                            >
                              {u.paid_status ? 'Yes' : 'No'}
                            </button>
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground font-mono">{fmt(u.created_at)}</td>
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
                        <tr><td colSpan={7} className="px-5 py-6 text-sm text-muted-foreground">No users yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── FILES ── */}
          {tab === 'files' && (
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground">{storageFiles.length} files in storage</div>

              {/* Submissions with files */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Submission files</div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/20">
                          <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal text-left">Trainee</th>
                          <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal text-left">Task</th>
                          <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal text-left">Status</th>
                          <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal text-left">Date</th>
                          <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal text-left">File</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {subs.filter(s => s.file_url).map(s => {
                          const name = s.profiles?.full_name || s.profiles?.display_name || 'Unknown';
                          return (
                            <tr key={s.id} className="hover:bg-secondary/20">
                              <td className="px-5 py-3">{name}</td>
                              <td className="px-5 py-3 text-muted-foreground">{s.tasks?.title || '—'}</td>
                              <td className="px-5 py-3"><Pill label={s.status} status={s.status} /></td>
                              <td className="px-5 py-3 text-xs text-muted-foreground font-mono">{fmt(s.created_at)}</td>
                              <td className="px-5 py-3">
                                <button
                                  onClick={() => openFile(s.file_url)}
                                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded px-3 py-1.5 hover:bg-secondary"
                                >
                                  <Download className="h-3 w-3" /> Open
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {subs.filter(s => s.file_url).length === 0 && (
                          <tr><td colSpan={5} className="px-5 py-6 text-sm text-muted-foreground">No submitted files yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* CV uploads from applications */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">CV uploads</div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/20">
                          <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal text-left">Applicant</th>
                          <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal text-left">Status</th>
                          <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal text-left">Date</th>
                          <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal text-left">File</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {apps.filter(a => a.cv_url).map(a => (
                          <tr key={a.id} className="hover:bg-secondary/20">
                            <td className="px-5 py-3">{a.full_name}</td>
                            <td className="px-5 py-3"><Pill label={a.status} status={a.status} /></td>
                            <td className="px-5 py-3 text-xs text-muted-foreground font-mono">{fmt(a.created_at)}</td>
                            <td className="px-5 py-3">
                              <button
                                onClick={() => openFile(a.cv_url)}
                                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded px-3 py-1.5 hover:bg-secondary"
                              >
                                <Download className="h-3 w-3" /> Open CV
                              </button>
                            </td>
                          </tr>
                        ))}
                        {apps.filter(a => a.cv_url).length === 0 && (
                          <tr><td colSpan={4} className="px-5 py-6 text-sm text-muted-foreground">No CV uploads yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CONTENT ── */}
          {tab === 'content' && (
            <div className="space-y-8">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Lessons ({lessons.length})</div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/20 text-left">
                          <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">#</th>
                          <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Title</th>
                          <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Module</th>
                          <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Req. level</th>
                          <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Video</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {lessons.map(l => (
                          <tr key={l.id} className="hover:bg-secondary/20">
                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{l.sort_order}</td>
                            <td className="px-4 py-3">{l.title}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{l.module || '—'}</td>
                            <td className="px-4 py-3"><span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded">Lv{l.required_level}</span></td>
                            <td className="px-4 py-3">
                              {l.youtube_url ? (
                                <a href={l.youtube_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
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
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Tasks ({tasks.length})</div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/20 text-left">
                          <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Title</th>
                          <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Req. level</th>
                          <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Payout</th>
                          <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-normal">Paid task</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {tasks.map(t => (
                          <tr key={t.id} className="hover:bg-secondary/20">
                            <td className="px-4 py-3">{t.title}</td>
                            <td className="px-4 py-3"><span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded">Lv{t.required_level}</span></td>
                            <td className="px-4 py-3 text-xs font-mono">{t.payout > 0 ? `$${t.payout}` : '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${t.is_paid ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-muted-foreground border-border'}`}>
                                {t.is_paid ? 'Paid' : 'Free'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
