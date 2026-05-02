import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Profile() {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.display_name || profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ display_name: name.trim(), bio: bio.trim() || null }).eq('user_id', user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Profile updated');
    refreshProfile();
  };

  return (
    <>
      <Header title="Profile" subtitle="Your account & status" />
      <div className="p-6 lg:p-10 max-w-2xl space-y-6">
        <section className="grid sm:grid-cols-3 gap-3">
          {[
            { l: 'Level', v: String(profile?.assigned_level ?? 0) },
            { l: 'Status', v: profile?.paid_status ? 'Paid' : 'Training' },
            { l: 'Role', v: isAdmin ? 'Admin' : 'Creator' },
          ].map((s) => (
            <div key={s.l} className="border border-border rounded-md p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">{s.l}</div>
              <div className="font-display text-2xl mt-1">{s.v}</div>
            </div>
          ))}
        </section>

        <section className="border border-border rounded-md p-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <div className="text-sm font-mono mt-1">{profile?.email}</div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Display name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full mt-1 bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>
          <button onClick={save} disabled={busy} className="bg-foreground text-background px-5 py-2 text-sm rounded-md disabled:opacity-50">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </section>
      </div>
    </>
  );
}
