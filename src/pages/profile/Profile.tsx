import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, FileText, Type, Upload, Save } from 'lucide-react';

type AppRow = {
  id: string;
  cv_url: string | null;
  qualifications: string | null;
  qualifications_url: string | null;
  cover_letter: string | null;
  cover_letter_url: string | null;
};

type DocMode = 'write' | 'upload';

export default function Profile() {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.display_name || profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [busy, setBusy] = useState(false);

  const [app, setApp] = useState<AppRow | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);

  const [qualMode, setQualMode] = useState<DocMode>('write');
  const [qualText, setQualText] = useState('');
  const [qualFile, setQualFile] = useState<File | null>(null);

  const [coverMode, setCoverMode] = useState<DocMode>('write');
  const [coverText, setCoverText] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [cvFile, setCvFile] = useState<File | null>(null);

  const loadApp = async () => {
    if (!user) return;
    setLoadingApp(true);
    const { data, error } = await supabase
      .from('applications')
      .select('id, cv_url, qualifications, qualifications_url, cover_letter, cover_letter_url')
      .eq('user_id', user.id).maybeSingle();
    if (error) toast.error(error.message);
    if (data) {
      setApp(data as AppRow);
      setQualMode(data.qualifications_url ? 'upload' : 'write');
      setQualText(data.qualifications || '');
      setCoverMode(data.cover_letter_url ? 'upload' : 'write');
      setCoverText(data.cover_letter || '');
    }
    setLoadingApp(false);
  };
  useEffect(() => { loadApp(); }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ display_name: name.trim(), bio: bio.trim() || null }).eq('user_id', user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Profile updated');
    refreshProfile();
  };

  const uploadFile = async (file: File, prefix: string) => {
    const path = `${user!.id}/${prefix}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('applications').upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  const download = async (path: string) => {
    const { data, error } = await supabase.storage.from('applications').createSignedUrl(path, 60);
    if (error || !data) return toast.error(error?.message || 'Could not get download link');
    window.open(data.signedUrl, '_blank');
  };

  const saveDocs = async () => {
    if (!user || !app) return;
    setBusy(true);
    try {
      const update: Partial<AppRow> = {};
      if (cvFile) update.cv_url = await uploadFile(cvFile, 'cv');

      if (qualMode === 'write') {
        if (qualText.trim().length < 10) throw new Error('Qualifications too short');
        update.qualifications = qualText.trim();
        update.qualifications_url = null;
      } else if (qualFile) {
        update.qualifications_url = await uploadFile(qualFile, 'qualifications');
        update.qualifications = null;
      }

      if (coverMode === 'write') {
        if (coverText.trim().length < 20) throw new Error('Cover letter too short');
        update.cover_letter = coverText.trim();
        update.cover_letter_url = null;
      } else if (coverFile) {
        update.cover_letter_url = await uploadFile(coverFile, 'cover-letter');
        update.cover_letter = null;
      }

      if (Object.keys(update).length === 0) {
        toast.info('Nothing to update');
        return;
      }

      const { error } = await supabase.from('applications').update(update).eq('id', app.id);
      if (error) throw error;
      setCvFile(null); setQualFile(null); setCoverFile(null);
      await loadApp();
      toast.success('Documents updated');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title="Profile" subtitle="Your account, status & application documents" />
      <div className="p-6 lg:p-10 max-w-3xl space-y-6">
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
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Account</div>
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

        {/* Application docs */}
        <section className="border border-border rounded-md p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Application documents</div>
              <div className="text-sm text-muted-foreground mt-1">View, update, or download what you submitted.</div>
            </div>
          </div>

          {loadingApp && <div className="text-sm text-muted-foreground">Loading…</div>}

          {!loadingApp && !app && <div className="text-sm text-muted-foreground">No application on file.</div>}

          {!loadingApp && app && (
            <>
              {/* CV */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">CV / Resume</label>
                  {app.cv_url && (
                    <button onClick={() => download(app.cv_url!)} className="inline-flex items-center gap-1 text-xs border border-border rounded-md px-2.5 py-1 hover:bg-secondary">
                      <Download className="h-3 w-3" /> Download
                    </button>
                  )}
                </div>
                <label className="flex items-center gap-2 border border-dashed border-border rounded-md px-3 py-2.5 text-sm cursor-pointer hover:bg-secondary">
                  <Upload className="h-4 w-4" />
                  <span className="truncate">{cvFile?.name || (app.cv_url ? 'Replace CV (PDF, DOC, DOCX)' : 'Upload CV')}</span>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              {/* Qualifications */}
              <DocSection
                label="Qualifications"
                mode={qualMode} setMode={setQualMode}
                text={qualText} setText={setQualText}
                file={qualFile} setFile={setQualFile}
                existingUrl={app.qualifications_url}
                onDownload={() => app.qualifications_url && download(app.qualifications_url)}
              />

              {/* Cover letter */}
              <DocSection
                label="Cover letter"
                mode={coverMode} setMode={setCoverMode}
                text={coverText} setText={setCoverText}
                file={coverFile} setFile={setCoverFile}
                existingUrl={app.cover_letter_url}
                onDownload={() => app.cover_letter_url && download(app.cover_letter_url)}
              />

              <div className="flex justify-end pt-2">
                <button onClick={saveDocs} disabled={busy} className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2 text-sm rounded-md disabled:opacity-50">
                  <Save className="h-4 w-4" /> {busy ? 'Saving…' : 'Save documents'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function DocSection({ label, mode, setMode, text, setText, file, setFile, existingUrl, onDownload }: {
  label: string;
  mode: DocMode; setMode: (m: DocMode) => void;
  text: string; setText: (v: string) => void;
  file: File | null; setFile: (f: File | null) => void;
  existingUrl: string | null;
  onDownload: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="text-xs text-muted-foreground">{label}</label>
        <div className="flex items-center gap-2">
          {existingUrl && (
            <button onClick={onDownload} className="inline-flex items-center gap-1 text-xs border border-border rounded-md px-2.5 py-1 hover:bg-secondary">
              <Download className="h-3 w-3" /> Download current
            </button>
          )}
          <div className="inline-flex items-center gap-px text-[10px] font-mono uppercase tracking-wider border border-border rounded-sm overflow-hidden">
            <button type="button" onClick={() => setMode('write')} className={`px-2.5 py-1 flex items-center gap-1 ${mode === 'write' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
              <Type className="h-3 w-3" /> Write
            </button>
            <button type="button" onClick={() => setMode('upload')} className={`px-2.5 py-1 flex items-center gap-1 ${mode === 'upload' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
              <FileText className="h-3 w-3" /> PDF
            </button>
          </div>
        </div>
      </div>
      {mode === 'write' ? (
        <textarea
          value={text} onChange={(e) => setText(e.target.value)} rows={5}
          className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      ) : (
        <label className="flex items-center gap-2 border border-dashed border-border rounded-md px-3 py-2.5 text-sm cursor-pointer hover:bg-secondary">
          <Upload className="h-4 w-4" />
          <span className="truncate">{file?.name || (existingUrl ? 'Replace PDF' : 'Upload PDF')}</span>
          <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
      )}
    </div>
  );
}
