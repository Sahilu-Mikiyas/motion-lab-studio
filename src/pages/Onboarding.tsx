import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Check, Upload, AlertCircle, X, FileText, Type } from 'lucide-react';

const stepLabels = ['Application', 'Questionnaire', 'Legal & Agreement', 'Complete'];

const appSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name required').max(100),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  country: z.string().trim().max(80).optional().or(z.literal('')),
});

type Mode = 'upload' | 'write';

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const initialStep = profile?.onboarding_status === 'application_submitted' || profile?.onboarding_status === 'under_review' ? 1
    : profile?.onboarding_status === 'legal_pending' ? 2
    : 0;

  const [step, setStep] = useState(initialStep);
  const [busy, setBusy] = useState(false);

  // Application
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: '',
    country: '',
  });
  const [cvFile, setCvFile] = useState<File | null>(null);

  const [qualMode, setQualMode] = useState<Mode>('write');
  const [qualText, setQualText] = useState('');
  const [qualFile, setQualFile] = useState<File | null>(null);

  const [coverMode, setCoverMode] = useState<Mode>('write');
  const [coverText, setCoverText] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Questionnaire
  const [q, setQ] = useState({
    years_experience: '',
    specialty: '',
    weekly_hours: '',
    why_furii: '',
    portfolio_url: '',
  });

  // Legal
  const [idFile, setIdFile] = useState<File | null>(null);
  const [signedName, setSignedName] = useState(profile?.full_name || '');
  const [agreed, setAgreed] = useState(false);
  const [showIdPopup, setShowIdPopup] = useState(false);
  const idSectionRef = useRef<HTMLDivElement>(null);
  const idPulse = !idFile && agreed;

  useEffect(() => {
    if (agreed && !idFile) {
      setShowIdPopup(true);
      setTimeout(() => idSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  }, [agreed, idFile]);

  if (!user) return null;

  const uploadIfFile = async (file: File | null, prefix: string) => {
    if (!file) return null;
    const path = `${user.id}/${prefix}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('applications').upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  const submitApplication = async () => {
    setBusy(true);
    try {
      const v = appSchema.safeParse(form);
      if (!v.success) throw new Error(v.error.issues[0].message);
      if (!cvFile) throw new Error('Upload your CV');

      // Each of qualifications/cover letter must be provided in at least one form
      if (qualMode === 'write' && qualText.trim().length < 10) throw new Error('Tell us about your qualifications (min 10 chars) or upload a PDF');
      if (qualMode === 'upload' && !qualFile) throw new Error('Upload a qualifications PDF or write it instead');
      if (coverMode === 'write' && coverText.trim().length < 20) throw new Error('Cover letter is too short — write more or upload a PDF');
      if (coverMode === 'upload' && !coverFile) throw new Error('Upload a cover letter PDF or write it instead');

      const cvPath = await uploadIfFile(cvFile, 'cv');
      const qualPath = qualMode === 'upload' ? await uploadIfFile(qualFile, 'qualifications') : null;
      const coverPath = coverMode === 'upload' ? await uploadIfFile(coverFile, 'cover-letter') : null;

      const { error } = await supabase.from('applications').upsert({
        user_id: user.id,
        full_name: v.data.full_name,
        phone: v.data.phone || null,
        country: v.data.country || null,
        cv_url: cvPath,
        qualifications: qualMode === 'write' ? qualText.trim() : null,
        qualifications_url: qualPath,
        cover_letter: coverMode === 'write' ? coverText.trim() : null,
        cover_letter_url: coverPath,
        questionnaire: {},
        status: 'submitted',
      }, { onConflict: 'user_id' });
      if (error) throw error;

      await supabase.from('profiles').update({ onboarding_status: 'application_submitted', full_name: v.data.full_name }).eq('user_id', user.id);
      await refreshProfile();
      setStep(1);
      toast.success('Application saved');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitQuestionnaire = async () => {
    setBusy(true);
    try {
      if (!q.why_furii || q.why_furii.trim().length < 10) throw new Error('Tell us why Furii');
      const yrs = parseFloat(q.years_experience || '0') || 0;
      const assigned = yrs >= 4 ? 3 : yrs >= 2 ? 2 : yrs >= 1 ? 1 : 0;

      const { error } = await supabase.from('applications').update({
        questionnaire: q,
        assigned_level: assigned,
        status: 'approved',
      }).eq('user_id', user.id);
      if (error) throw error;

      await supabase.from('profiles').update({
        onboarding_status: 'legal_pending',
        assigned_level: assigned,
      }).eq('user_id', user.id);
      await refreshProfile();
      setStep(2);
      toast.success(`Level ${assigned} assigned`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitLegal = async () => {
    setBusy(true);
    try {
      if (!idFile) {
        setShowIdPopup(true);
        idSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        throw new Error('Please upload your ID or passport');
      }
      if (!signedName.trim()) throw new Error('Type your full legal name to sign');
      if (!agreed) throw new Error('You must accept the agreement');

      const idPath = `${user.id}/id-${Date.now()}-${idFile.name}`;
      const { error: upErr } = await supabase.storage.from('legal-docs').upload(idPath, idFile, { upsert: true });
      if (upErr) throw upErr;

      const { error } = await supabase.from('legal_documents').insert({
        user_id: user.id,
        id_document_url: idPath,
        signed_name: signedName.trim(),
        agreement_version: 'v1.0',
      });
      if (error) throw error;

      await supabase.from('profiles').update({ onboarding_status: 'complete' }).eq('user_id', user.id);
      await refreshProfile();
      setStep(3);
      toast.success('Onboarding complete');
      setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Onboarding</div>
        <h1 className="font-display text-5xl mt-2">Welcome to Furii.</h1>
        <p className="text-muted-foreground mt-3">Complete the four steps below to unlock your dashboard.</p>

        {/* Stepper */}
        <ol className="mt-10 grid grid-cols-4 gap-2">
          {stepLabels.map((l, i) => (
            <li key={l} className="flex flex-col gap-2">
              <div className={`h-px ${i <= step ? 'bg-foreground' : 'bg-border'}`} />
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em]">
                {i < step ? <Check className="h-3 w-3" /> : <span className="font-mono">{String(i + 1).padStart(2, '0')}</span>}
                <span className={i === step ? 'text-foreground' : 'text-muted-foreground'}>{l}</span>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 border border-border rounded-md p-6 lg:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl">Application</h2>
              <p className="text-sm text-muted-foreground">Submit your CV and tell us about your background.</p>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
                <Field label="Phone (optional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              </div>
              <Field label="Country (optional)" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />

              <div>
                <label className="text-xs text-muted-foreground">CV / Resume</label>
                <FileDrop file={cvFile} setFile={setCvFile} accept=".pdf,.doc,.docx" hint="Upload PDF, DOC or DOCX" />
              </div>

              <DualInput
                label="Qualifications"
                helper="Education, prior work, software you use, etc."
                mode={qualMode} setMode={setQualMode}
                text={qualText} setText={setQualText}
                file={qualFile} setFile={setQualFile}
              />

              <DualInput
                label="Cover letter"
                helper="Why animation? Why Furii?"
                mode={coverMode} setMode={setCoverMode}
                text={coverText} setText={setCoverText}
                file={coverFile} setFile={setCoverFile}
              />

              <div className="flex justify-end pt-2">
                <button onClick={submitApplication} disabled={busy} className="bg-foreground text-background px-5 py-2 text-sm rounded-md disabled:opacity-50">
                  {busy ? 'Saving…' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl">Preliminary questionnaire</h2>
              <p className="text-sm text-muted-foreground">Used to assign your starting level.</p>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Years of experience" value={q.years_experience} onChange={(v) => setQ({ ...q, years_experience: v })} type="number" />
                <Field label="Primary specialty" value={q.specialty} onChange={(v) => setQ({ ...q, specialty: v })} placeholder="2D character, motion, etc." />
              </div>
              <Field label="Weekly hours available" value={q.weekly_hours} onChange={(v) => setQ({ ...q, weekly_hours: v })} type="number" />
              <Field label="Portfolio URL (optional)" value={q.portfolio_url} onChange={(v) => setQ({ ...q, portfolio_url: v })} />
              <Textarea label="Why Furii?" value={q.why_furii} onChange={(v) => setQ({ ...q, why_furii: v })} />

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(0)} className="text-sm text-muted-foreground">Back</button>
                <button onClick={submitQuestionnaire} disabled={busy} className="bg-foreground text-background px-5 py-2 text-sm rounded-md disabled:opacity-50">
                  {busy ? 'Evaluating…' : 'Submit & assign level'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl">Legal documents & agreement</h2>
              <p className="text-sm text-muted-foreground">Upload your ID or passport, then sign the trainee agreement.</p>

              {/* ID upload — visually loud, in red */}
              <motion.div
                ref={idSectionRef}
                animate={idPulse ? { scale: [1, 1.01, 1] } : {}}
                transition={idPulse ? { duration: 1.2, repeat: Infinity } : {}}
                className="rounded-md border-2 p-5 space-y-3"
                style={{
                  borderColor: idFile ? 'hsl(var(--border))' : 'hsl(var(--destructive))',
                  background: idFile ? 'transparent' : 'hsl(var(--destructive) / 0.06)',
                }}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: idFile ? 'hsl(var(--muted-foreground))' : 'hsl(var(--destructive))' }} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: idFile ? 'hsl(var(--foreground))' : 'hsl(var(--destructive))' }}>
                      Required: Upload your government ID or passport
                    </div>
                    <p className="text-xs mt-1" style={{ color: idFile ? 'hsl(var(--muted-foreground))' : 'hsl(var(--destructive) / 0.85)' }}>
                      We need to verify your identity before activating the trainee agreement. Accepted: PDF or image. This is private and only visible to Furii admins.
                    </p>
                  </div>
                </div>
                <FileDrop
                  file={idFile} setFile={setIdFile}
                  accept=".pdf,image/*"
                  hint="Upload ID or passport (PDF or image)"
                  variant={idFile ? 'normal' : 'alert'}
                />
              </motion.div>

              <div className="border border-border rounded-md p-4 max-h-56 overflow-auto text-xs text-muted-foreground leading-relaxed">
                <div className="font-display text-base text-foreground mb-2">Furii Trainee Agreement (v1.0)</div>
                <p>By signing, you commit to a minimum six (6) month trainee period with Furii Animation Studio. During this period you agree to: (a) complete assigned lessons and tasks in good faith, (b) honor confidentiality of internal materials and client work, (c) not concurrently train or work for a directly competing studio, and (d) accept the level evaluation and payment structure as outlined in the platform.</p>
                <p className="mt-2">Furii commits to: (a) provide structured training and timely feedback, (b) unlock paid task access upon successful completion of the training phase, and (c) consider top performers for full employment.</p>
                <p className="mt-2">This agreement is legally binding upon signature. Either party may terminate with thirty (30) days written notice after the initial six-month period.</p>
              </div>

              <Field label="Sign by typing your full legal name" value={signedName} onChange={setSignedName} />

              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
                I have read and agree to the Furii Trainee Agreement v1.0.
              </label>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="text-sm text-muted-foreground">Back</button>
                <button onClick={submitLegal} disabled={busy} className="bg-foreground text-background px-5 py-2 text-sm rounded-md disabled:opacity-50">
                  {busy ? 'Submitting…' : 'Sign & finish'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-10">
              <Check className="h-10 w-10 mx-auto" />
              <h2 className="font-display text-3xl mt-4">You're in.</h2>
              <p className="text-muted-foreground mt-2">Redirecting to your dashboard…</p>
            </div>
          )}
        </div>
      </div>

      {/* ID popup reminder */}
      <AnimatePresence>
        {showIdPopup && step === 2 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowIdPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full rounded-md p-6 border-2"
              style={{ borderColor: 'hsl(var(--destructive))', background: 'hsl(var(--card))' }}
            >
              <button onClick={() => setShowIdPopup(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
              <AlertCircle className="h-6 w-6" style={{ color: 'hsl(var(--destructive))' }} />
              <div className="font-display text-2xl mt-3">One more thing</div>
              <p className="text-sm text-muted-foreground mt-2">
                Before you can finish the agreement, you need to upload your <span style={{ color: 'hsl(var(--destructive))' }} className="font-medium">government ID or passport</span>. Look for the red section at the top of this step.
              </p>
              <button
                onClick={() => setShowIdPopup(false)}
                className="mt-5 w-full rounded-md py-2 text-sm font-medium text-background"
                style={{ background: 'hsl(var(--destructive))' }}
              >
                Got it — take me there
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FileDrop({ file, setFile, accept, hint, variant = 'normal' }: { file: File | null; setFile: (f: File | null) => void; accept: string; hint: string; variant?: 'normal' | 'alert' }) {
  const alert = variant === 'alert';
  return (
    <label
      className="flex items-center gap-2 border border-dashed rounded-md px-3 py-3 text-sm cursor-pointer hover:bg-secondary"
      style={alert ? { borderColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive))' } : undefined}
    >
      <Upload className="h-4 w-4" />
      <span className="truncate">{file?.name || hint}</span>
      <input type="file" accept={accept} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
    </label>
  );
}

function DualInput({ label, helper, mode, setMode, text, setText, file, setFile }: {
  label: string; helper?: string;
  mode: Mode; setMode: (m: Mode) => void;
  text: string; setText: (v: string) => void;
  file: File | null; setFile: (f: File | null) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">{label}</label>
        <div className="inline-flex items-center gap-px text-[10px] font-mono uppercase tracking-wider border border-border rounded-sm overflow-hidden">
          <button type="button" onClick={() => setMode('write')} className={`px-2.5 py-1 flex items-center gap-1 ${mode === 'write' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
            <Type className="h-3 w-3" /> Write
          </button>
          <button type="button" onClick={() => setMode('upload')} className={`px-2.5 py-1 flex items-center gap-1 ${mode === 'upload' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
            <FileText className="h-3 w-3" /> PDF
          </button>
        </div>
      </div>
      {mode === 'write' ? (
        <textarea
          value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={helper}
          className="w-full mt-1 bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      ) : (
        <div className="mt-1">
          <FileDrop file={file} setFile={setFile} accept=".pdf,.doc,.docx" hint="Upload PDF, DOC or DOCX" />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full mt-1 bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4}
        className="w-full mt-1 bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
      />
    </div>
  );
}
