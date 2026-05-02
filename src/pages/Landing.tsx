import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, FileText, GraduationCap, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { fadeUp, stagger } from '@/lib/motion';

const Section = ({ id, label, title, children }: { id?: string; label: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="border-t border-border">
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-24">
      <div className="grid lg:grid-cols-[260px_1fr] gap-10">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
          <h2 className="font-display text-4xl mt-3 leading-tight">{title}</h2>
        </div>
        <div className="text-foreground/90">{children}</div>
      </div>
    </div>
  </section>
);

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-sm bg-foreground" />
            <span className="font-display text-xl">Furii</span>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground hidden sm:inline">Animation Studio</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#opportunities" className="hover:text-foreground">Opportunities</a>
            <a href="#process" className="hover:text-foreground">Process</a>
            <a href="#training" className="hover:text-foreground">Training</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="text-sm px-3 py-1.5 text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link to="/auth?mode=signup" className="text-sm px-4 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90">Apply Now</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-28 pb-32">
          <motion.div variants={stagger(0.08)} initial="initial" animate="animate">
            <motion.div variants={fadeUp} className="text-[10px] font-mono uppercase tracking-[0.35em] text-muted-foreground">
              Furii Animation Studio · Est. 2026
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-display text-6xl md:text-8xl leading-[0.95] mt-6 max-w-4xl">
              Building the next generation of animators.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-muted-foreground mt-8 max-w-xl text-lg leading-relaxed">
              A studio that trains and employs 2D and 3D artists through structured learning and real production work — from your first frame to your first paid task.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mt-10">
              <Link to="/auth?mode=signup" className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-3 text-sm rounded-md hover:bg-foreground/90 transition-colors">
                Apply Now <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#process" className="inline-flex items-center gap-2 border border-border px-5 py-3 text-sm rounded-md hover:bg-secondary transition-colors">
                Learn More
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <Section id="about" label="01 — About" title="A studio first. A school second.">
        <div className="space-y-5 text-muted-foreground leading-relaxed">
          <p>
            Furii is an animation studio focused on 2D and 3D craft. We exist to solve a single problem: too many artists never get the structured workflow, mentorship, and live production work they need to grow.
          </p>
          <p>
            Our mission is to train and employ the next wave of animators — through a clear pipeline that takes you from foundations to paid production work, with real feedback at every step.
          </p>
        </div>
      </Section>

      {/* Opportunities */}
      <Section id="opportunities" label="02 — Open Roles" title="Currently accepting 2D animation trainees.">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-border p-6 rounded-md">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Open</div>
            <div className="font-display text-2xl mt-2">2D Animation Trainee</div>
            <p className="text-sm text-muted-foreground mt-3">Learn the foundations, complete production-grade tasks, and grow into paid work as your skill rises.</p>
          </div>
          <div className="border border-border p-6 rounded-md opacity-60">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Coming soon</div>
            <div className="font-display text-2xl mt-2">3D Animation Trainee</div>
            <p className="text-sm text-muted-foreground mt-3">Same model, applied to character and motion in 3D pipelines.</p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-6 leading-relaxed">
          The model is simple: <span className="text-foreground">learn first, then earn</span>. Trainees who consistently deliver grow into full employment within the studio.
        </div>
      </Section>

      {/* Process */}
      <Section id="process" label="03 — Process" title="From application to dashboard, in six steps.">
        <ol className="space-y-px border-y border-border">
          {[
            { n: '01', t: 'Create your account', d: 'Sign up with email or Google. No commitment yet.' },
            { n: '02', t: 'Submit your application', d: 'CV, cover letter, and a summary of your qualifications.' },
            { n: '03', t: 'Complete the questionnaire', d: 'A short preliminary interview to understand your goals and current skill.' },
            { n: '04', t: 'Receive your assigned level', d: 'We evaluate your application and place you at the right starting level.' },
            { n: '05', t: 'Sign legal documents', d: 'Upload ID and sign the trainee agreement — minimum six-month commitment, legally binding.' },
            { n: '06', t: 'Unlock your dashboard', d: 'Access your structured learning path, tasks, and submissions.' },
          ].map((s) => (
            <li key={s.n} className="grid grid-cols-[64px_1fr] gap-6 py-6 border-t border-border first:border-t-0">
              <div className="text-xs font-mono text-muted-foreground pt-1">{s.n}</div>
              <div>
                <div className="text-lg">{s.t}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.d}</div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Training */}
      <Section id="training" label="04 — Training" title="The first month is free. The work is real.">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-border p-6 rounded-md">
            <GraduationCap className="h-5 w-5" />
            <div className="font-display text-2xl mt-3">Month one — Learning</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0" /> Structured lessons, no payment required</li>
              <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0" /> Curated external resources (including YouTube)</li>
              <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0" /> One task per lesson, evaluated by mentors</li>
            </ul>
          </div>
          <div className="border border-border p-6 rounded-md">
            <FileText className="h-5 w-5" />
            <div className="font-display text-2xl mt-3">Every lesson ends in a task</div>
            <p className="text-sm text-muted-foreground mt-3">
              You don't move forward by watching — you move forward by submitting. Each task is reviewed and either approved, returned for revision, or counted toward your level progression.
            </p>
          </div>
        </div>
      </Section>

      {/* Growth & Payment */}
      <Section label="05 — Growth & Payment" title="Get paid as you get better.">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { i: Sparkles, t: 'Reach paid status', d: 'After completing the training phase, your account unlocks paid task access.' },
            { i: Wallet, t: 'Paid per task', d: 'Each approved submission earns a payout. Rates rise with skill, speed, and consistency.' },
            { i: ShieldCheck, t: 'Grow into the studio', d: 'Top performers move into full employment with greater responsibility on real productions.' },
          ].map((c) => (
            <div key={c.t} className="border border-border p-6 rounded-md">
              <c.i className="h-5 w-5" />
              <div className="font-display text-xl mt-3">{c.t}</div>
              <p className="text-sm text-muted-foreground mt-2">{c.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-24 text-center">
          <h3 className="font-display text-5xl">Ready to start?</h3>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">Applications are open. Begin your trainee journey with Furii Animation Studio today.</p>
          <Link to="/auth?mode=signup" className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 mt-8 text-sm rounded-md hover:bg-foreground/90 transition-colors">
            Apply Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8 flex flex-wrap justify-between text-xs text-muted-foreground gap-4">
          <div>© {new Date().getFullYear()} Furii Animation Studio</div>
          <div className="font-mono">furiimotionlabs@outlook.com</div>
        </div>
      </footer>
    </div>
  );
}
