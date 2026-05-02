import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { fadeUp, stagger } from '@/lib/motion';
import { Clock, Mail } from 'lucide-react';
import logo from '@/assets/furii-logo.png';

export default function Pending() {
  const { profile, signOut } = useAuth();
  const name = profile?.display_name || profile?.full_name || 'there';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="max-w-2xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center">
        <motion.div variants={stagger(0.07)} initial="initial" animate="animate" className="space-y-8">
          <motion.img variants={fadeUp} src={logo} alt="Furii Animation Studio" className="h-10 w-auto invert" />

          <motion.div variants={fadeUp} className="flex items-center gap-3 mt-10">
            <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center">
              <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Application Received</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-display text-4xl md:text-5xl leading-tight">
            We've got your application,<br />{name}.
          </motion.h1>

          <motion.p variants={fadeUp} className="text-muted-foreground text-lg leading-relaxed">
            Our team is reviewing your submission. This typically takes a few business days. We'll notify you by email the moment a decision has been made.
          </motion.p>

          <motion.div variants={fadeUp} className="border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="text-sm">Keep an eye on your inbox</div>
                <div className="text-xs text-muted-foreground mt-1">We'll send a decision to <span className="text-foreground">{profile?.email}</span>. Check your spam folder too.</div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Furii · Animation Studio</span>
            <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">
              Sign out
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
