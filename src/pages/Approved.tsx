import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { fadeUp, stagger } from '@/lib/motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/furii-logo.png';

export default function Approved() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const name = profile?.display_name || profile?.full_name || 'there';

  const proceed = async () => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_status: 'complete' })
        .eq('user_id', profile?.user_id);
      if (error) throw error;
      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="max-w-2xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center">
        <motion.div variants={stagger(0.07)} initial="initial" animate="animate" className="space-y-8">
          <motion.img variants={fadeUp} src={logo} alt="Furii Animation Studio" className="h-10 w-auto invert" />

          <motion.div variants={fadeUp} className="flex items-center gap-3 mt-10">
            <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Application Decision</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-display text-4xl md:text-5xl leading-tight">
            We loved your application,<br />{name}.
          </motion.h1>

          <motion.p variants={fadeUp} className="text-muted-foreground text-lg leading-relaxed">
            After reviewing your submission, we're excited to welcome you into the Furii Animation Studio program. Your training begins now — complete the lessons, submit your work, and grow into a paid production role.
          </motion.p>

          <motion.div variants={fadeUp} className="border border-border rounded-lg p-6 space-y-3">
            <div className="text-sm font-medium">What happens next</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><span className="text-foreground mt-0.5">→</span> Access structured lessons from Day 1</li>
              <li className="flex items-start gap-2"><span className="text-foreground mt-0.5">→</span> Submit task work for admin review</li>
              <li className="flex items-start gap-2"><span className="text-foreground mt-0.5">→</span> Unlock paid tasks as your level grows</li>
              <li className="flex items-start gap-2"><span className="text-foreground mt-0.5">→</span> Earn and get hired into the studio</li>
            </ul>
          </motion.div>

          <motion.div variants={fadeUp}>
            <button
              onClick={proceed}
              disabled={busy}
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-md text-sm hover:bg-foreground/90 disabled:opacity-50"
            >
              {busy ? 'Loading…' : 'Proceed to my account'} <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <motion.div variants={fadeUp} className="pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Furii · Animation Studio</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
