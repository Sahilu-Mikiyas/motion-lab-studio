import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const emailSchema = z.string().trim().email('Invalid email').max(255);
const passwordSchema = z.string().min(8, 'Min 8 characters').max(72);
const nameSchema = z.string().trim().min(1, 'Required').max(100);

export default function Auth() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true });
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const ev = emailSchema.safeParse(email);
      const pv = passwordSchema.safeParse(password);
      if (!ev.success) throw new Error(ev.error.issues[0].message);
      if (!pv.success) throw new Error(pv.error.issues[0].message);

      if (mode === 'signup') {
        const nv = nameSchema.safeParse(name);
        if (!nv.success) throw new Error(nv.error.issues[0].message);
        const { error } = await supabase.auth.signUp({
          email: ev.data,
          password: pv.data,
          options: {
            data: { full_name: nv.data },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        toast.success('Account created');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: ev.data, password: pv.data });
        if (error) throw error;
        toast.success('Welcome back');
      }
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: `${window.location.origin}/dashboard` });
      if (result.error) throw new Error((result.error as Error).message || 'Google sign-in failed');
      if (result.redirected) return;
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-10 border-r border-border">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
        <div>
          <div className="font-display text-5xl leading-tight max-w-md">Begin your trainee journey with Furii Animation Studio.</div>
          <div className="text-muted-foreground mt-6 max-w-md text-sm">Learn structured. Submit real work. Grow into paid production.</div>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Furii · Animation Studio</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-6">
            <Link to="/" className="text-sm text-muted-foreground inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Home</Link>
          </div>
          <h1 className="font-display text-4xl">{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === 'signin' ? 'Welcome back. Continue your training.' : 'Start your application to Furii Studio.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-3">
            {mode === 'signup' && (
              <input
                type="text" required maxLength={100}
                placeholder="Full name"
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            )}
            <input
              type="email" required maxLength={255}
              placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              type="password" required minLength={8} maxLength={72}
              placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="submit" disabled={busy}
              className="w-full bg-foreground text-background rounded-md py-2.5 text-sm hover:bg-foreground/90 disabled:opacity-50"
            >
              {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={handleGoogle} disabled={busy}
            className="w-full border border-border rounded-md py-2.5 text-sm hover:bg-secondary disabled:opacity-50"
          >
            Continue with Google
          </button>

          <div className="mt-6 text-sm text-muted-foreground text-center">
            {mode === 'signin' ? "No account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => { const m = mode === 'signin' ? 'signup' : 'signin'; setMode(m); setParams({ mode: m }); }}
              className="text-foreground underline underline-offset-4"
            >
              {mode === 'signin' ? 'Apply now' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
