import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Check, Upload } from 'lucide-react';

const stepLabels = ['Application', 'Questionnaire', 'Legal & Agreement', 'Complete'];

const appSchema = z.object({
  full_name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  qualifications: z.string().trim().min(10, 'Tell us about your background').max(2000),
  cover_letter: z.string().trim().min(20, 'A bit more please').max(4000),
});

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const initialStep = profile?.onboarding_status === 'application_submitted' || profile?.onboarding_status === 'under_review' ? 2
    : profile?.onboarding_status === 'legal_pending' ? 2
    : 0;

  const [step, setStep] = useState(initialStep);
  const [busy, setBusy] = useState(false);

  // Application form
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: '',
    country: '',
    qualifications: '',
    cover_letter: '',
  });
  const [cvFile, setCvFile] = useState<File | null>(null);

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

  if (!user) return null;

  const submitApplication = async () => {
    setBusy(true);
    try {
      const v = appSchema.safeParse(form);
      if (!v.success) throw new Error(v.error.issues[0].message);
      if (!cvFile) throw new Error('Upload your CV');

      const cvPath = `${user.id}/cv-${Date.now()}-${cvFile.name}`;
      const { error: upErr } = await supabase.storage.from('applications').upload(cvPath, cvFile, { upsert: true });
      if (upErr) throw upErr;

      const { error } = await supabase.from('applications').upsert({
        user_id: user.id,
        full_name: v.data.full_name,
        phone: v.data.phone || null,
        country: v.data.country || null,
        cv_url: cvPath,
        cover_letter: v.data.cover_letter,
        qualifications: v.data.qualifications,
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
      // Pseudo-evaluation: assign a starting level based on years_experience
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
      if (!idFile) throw new Error('Upload an ID or passport');
      if (!signedName.trim()) throw new Error('Type your full legal name to sign');
      if (!agreed) throw new Error('You must accept the agreement');

      const idPath = `${user.id}/id-${Date.now()}-${idFile.name}`;
      const { error: upErr } = await supabase.storage.from('legal-docs').upload(idPath, idFile, { upsert: true });
      if (upErr) throw upErr;

      const { error } = await supabase.from('legal_documents').upsert({
        user_id: user.id,
        id_document_url: idPath,
        signed_name: signedName.trim(),
        agreement_version: 'v1.0',
      }, { onConflict: 'user_id' });
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
            <div className="space-y-4">
              <h2 className="font-display text-2xl">Application</h2>
              <p className="text-sm text-muted-foreground">Submit your CV and tell us about your background.</p>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
                <Field label="Phone (optional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              </div>
              <Field label="Country (optional)" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />

              <div>
                <label className="text-xs text-muted-foreground">CV / Resume</label>
                <label className="mt-1 flex items-center gap-2 border border-dashed border-border rounded-md px-3 py-3 text-sm cursor-pointer hover:bg-secondary">
                  <Upload className="h-4 w-4" />
                  <span className="truncate">{cvFile?.name || 'Upload PDF, DOC or DOCX'}</span>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <Textarea label="Qualifications" value={form.qualifications} onChange={(v) => setForm({ ...form, qualifications: v })} placeholder="Education, prior work, software, etc." />
              <Textarea label="Cover letter" value={form.cover_letter} onChange={(v) => setForm({ ...form, cover_letter: v })} placeholder="Why animation? Why Furii?" />

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
            <div className="space-y-4">
              <h2 className="font-display text-2xl">Legal documents & agreement</h2>
              <p className="text-sm text-muted-foreground">Upload your ID or passport, then sign the trainee agreement.</p>

              <div>
                <label className="text-xs text-muted-foreground">ID or passport</label>
                <label className="mt-1 flex items-center gap-2 border border-dashed border-border rounded-md px-3 py-3 text-sm cursor-pointer hover:bg-secondary">
                  <Upload className="h-4 w-4" />
                  <span className="truncate">{idFile?.name || 'Upload PDF or image'}</span>
                  <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
                </label>
              </div>

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
