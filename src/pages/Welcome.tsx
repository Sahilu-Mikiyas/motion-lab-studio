import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { fadeUp, stagger } from '@/lib/motion';
import { ArrowRight, Briefcase, GraduationCap, ShieldCheck, Sparkles, Wallet, FileSignature, Workflow, Users } from 'lucide-react';
import logo from '@/assets/furii-logo.png';

export default function Welcome() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const name = profile?.display_name || profile?.full_name || 'creator';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-16">
        <motion.div variants={stagger(0.06)} initial="initial" animate="animate">
          <motion.img variants={fadeUp} src={logo} alt="Furii Animation Studio" className="h-12 w-auto invert" />
          <motion.div variants={fadeUp} className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mt-10">
            Welcome
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-6xl mt-3 leading-[1]">
            Hello, {name}.<br />Here's everything you need to know.
          </motion.h1>
          <motion.p variants={fadeUp} className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed">
            Take a moment to read through this. It explains who we are, how we work, what we expect, and what you can expect in return.
          </motion.p>
        </motion.div>

        {/* Who we are */}
        <Block n="01" label="Who we are">
          <p>
            <span className="text-foreground">Furii Animation Studio</span> is a working studio that trains and employs the next generation of 2D and 3D animators. We are not a course platform — we are a production house that decided the only sustainable way to grow was to build our own talent pipeline.
          </p>
          <p>
            Everything inside this platform — the lessons, the tasks, the reviews, the payouts — is designed to take you from foundations to paid production work, then into a full role within the studio.
          </p>
        </Block>

        {/* The model */}
        <Block n="02" label="How the model works">
          <div className="grid sm:grid-cols-3 gap-3 mt-2">
            {[
              { i: GraduationCap, t: 'Learn first', d: 'Structured lessons. No payment required during training.' },
              { i: Briefcase, t: 'Earn next', d: 'When your level is high enough, paid task access unlocks.' },
              { i: Users, t: 'Grow with us', d: 'Top trainees move into full employment on real productions.' },
            ].map((c) => (
              <div key={c.t} className="border border-border rounded-md p-5">
                <c.i className="h-5 w-5" />
                <div className="text-sm mt-3">{c.t}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.d}</div>
              </div>
            ))}
          </div>
        </Block>

        {/* The journey */}
        <Block n="03" label="Your journey, step by step">
          <ol className="space-y-px border-y border-border">
            {[
              { t: 'Application', d: 'CV, cover letter, qualifications. You can either upload PDFs or write directly inside the form.' },
              { t: 'Questionnaire', d: 'A short preliminary interview that determines your starting level.' },
              { t: 'Legal documents', d: 'Upload an ID or passport and electronically sign the trainee agreement (minimum six months, legally binding).' },
              { t: 'Dashboard unlocks', d: 'Your structured curriculum, your tasks, your submissions, your payouts.' },
              { t: 'Training phase', d: '30-day guided curriculum. Each lesson ends in a real task that gets reviewed.' },
              { t: 'Paid status', d: 'Once you complete training and reach the required level, paid tasks unlock automatically.' },
              { t: 'Full employment', d: 'Consistent top performers are offered roles inside the studio on live productions.' },
            ].map((s, i) => (
              <li key={s.t} className="grid grid-cols-[44px_1fr] gap-4 py-4 border-t border-border first:border-t-0">
                <div className="text-xs font-mono text-muted-foreground pt-1">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div className="text-sm">{s.t}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
        </Block>

        {/* How we work together */}
        <Block n="04" label="How we work together">
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            {[
              { i: Workflow, t: 'Task-driven', d: 'You don\'t move forward by watching — you move forward by submitting work.' },
              { i: ShieldCheck, t: 'Honest feedback', d: 'Every submission is reviewed. Approved, returned for revision, or counted toward your level.' },
              { i: FileSignature, t: 'Real commitment', d: 'A six-month minimum keeps both sides serious. We invest in you, you invest in the craft.' },
              { i: Sparkles, t: 'Studio-grade standard', d: 'We don\'t lower the bar — we help you reach it.' },
            ].map((c) => (
              <div key={c.t} className="border border-border rounded-md p-5">
                <c.i className="h-5 w-5" />
                <div className="text-sm mt-3">{c.t}</div>
                <div className="text-xs text-muted-foreground mt-1">{c.d}</div>
              </div>
            ))}
          </div>
        </Block>

        {/* What we expect */}
        <Block n="05" label="What we expect from you">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>— Treat this as a job, not a course. Show up, deliver, and ask questions.</li>
            <li>— Submit honest work. Don't outsource. We can tell.</li>
            <li>— Respect deadlines. If something is in the way, say so early.</li>
            <li>— Keep client and internal materials confidential.</li>
            <li>— Stay coachable. The fastest growth comes from acting on feedback.</li>
          </ul>
        </Block>

        {/* What you get */}
        <Block n="06" label="What you get from us">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>— A clear, structured 30-day curriculum to start.</li>
            <li>— Real tasks that mirror studio production work.</li>
            <li>— Mentor feedback on every submission.</li>
            <li>— Paid task access when your level qualifies.</li>
            <li>— A direct path into full employment for top performers.</li>
          </ul>
        </Block>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-8">
          <div className="text-sm text-muted-foreground">When you're ready, continue to your application.</div>
          <button
            onClick={() => navigate('/onboarding', { replace: true })}
            className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm rounded-md hover:bg-foreground/90"
          >
            Proceed <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Block({ n, label, children }: { n: string; label: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className="mt-16"
    >
      <div className="grid lg:grid-cols-[120px_1fr] gap-6">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{n}</div>
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mt-1">{label}</div>
        </div>
        <div className="text-foreground/90 space-y-3 leading-relaxed">{children}</div>
      </div>
    </motion.section>
  );
}
