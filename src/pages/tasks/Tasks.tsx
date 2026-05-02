import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/studio-card';
import { Clock, Film, MessageSquare, Upload, CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';
import { fadeUp, stagger } from '@/lib/motion';

const tasks = [
  { id: 1, title: 'Sci-Fi Title Sequence — Vol. II', client: 'NEON / Studio', tag: 'Motion', status: 'In progress', due: '2d 4h', progress: 64 },
  { id: 2, title: 'Brand Logo Reveal — Apex Audio', client: 'Apex Audio', tag: 'Branding', status: 'In progress', due: '5d 12h', progress: 28 },
  { id: 3, title: 'UI Microinteractions Pack', client: 'Internal Lab', tag: 'UI/UX', status: 'Review', due: '1d 6h', progress: 89 },
  { id: 4, title: '3D Product Loop — Nova Watch', client: 'Nova', tag: '3D', status: 'Queued', due: '7d', progress: 0 },
];

const checklist = [
  { id: 1, label: 'Reference board approved', done: true },
  { id: 2, label: 'Storyboard v2 uploaded', done: true },
  { id: 3, label: 'Animation pass — Scene 1–3', done: true },
  { id: 4, label: 'Sound design draft', done: false },
  { id: 5, label: 'Final color grade', done: false },
];

export default function Tasks() {
  const [active, setActive] = useState(tasks[0]);
  return (
    <>
      <Header title="Tasks" subtitle="Your live production queue" />
      <div className="p-6 lg:p-10 grid lg:grid-cols-[380px_1fr] gap-6">
        {/* Task list */}
        <motion.div variants={stagger(0.04)} initial="initial" animate="animate" className="space-y-3">
          {tasks.map((t) => {
            const isActive = active.id === t.id;
            return (
              <motion.button
                key={t.id} variants={fadeUp}
                onClick={() => setActive(t)}
                whileHover={{ x: 2 }}
                className={`text-left w-full p-4 rounded-xl border transition-colors surface ${
                  isActive ? 'border-primary/60' : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary">{t.tag}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{t.due}</span>
                </div>
                <div className="font-medium mt-1.5">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.client}</div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-gradient-gold" style={{ width: `${t.progress}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{t.status}</span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Task viewer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <Card hover={false} className="p-0">
              <div className="aspect-video relative bg-black overflow-hidden rounded-t-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(43_65%_53%/0.18),transparent_70%)]" />
                <div className="absolute inset-0 grid place-items-center">
                  <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
                    className="h-16 w-16 rounded-full bg-primary/20 grid place-items-center backdrop-blur">
                    <Film className="h-7 w-7 text-primary" />
                  </motion.div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-gold" style={{ width: '38%' }} />
                  </div>
                  <span className="text-[11px] font-mono text-white/70">00:38 / 01:42</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-primary">{active.tag} · {active.client}</div>
                    <h2 className="font-display text-3xl mt-1">{active.title}</h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="bg-gradient-gold text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 glow-gold"
                  >
                    <Upload className="h-4 w-4" /> Submit deliverable
                  </motion.button>
                </div>
                <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed">
                  Cinematic 90s sci-fi inspired opener. Establish tension via slow zooms and chromatic aberration.
                  Deliver 1920×1080 ProRes 4444, 24fps. Include alternate end-card without logo lockup.
                </p>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Checklist</div>
                <div className="font-display text-xl mb-4">Production milestones</div>
                <ul className="space-y-2">
                  {checklist.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 text-sm">
                      {c.done
                        ? <CheckCircle2 className="h-4 w-4 text-primary" />
                        : <Circle className="h-4 w-4 text-muted-foreground" />}
                      <span className={c.done ? 'text-muted-foreground line-through' : ''}>{c.label}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Feedback</div>
                <div className="font-display text-xl mb-4">Director thread</div>
                <div className="space-y-3">
                  {[
                    { who: 'Mara K.', txt: 'Love the pacing in scene 2. Push contrast a touch.' },
                    { who: 'You', txt: 'On it — pushing grade and re-rendering tonight.' },
                  ].map((m, i) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary/60 border border-border">
                      <div className="text-[11px] font-mono text-primary">{m.who}</div>
                      <div className="text-sm mt-1">{m.txt}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input className="flex-1 bg-input border border-border focus:border-primary outline-none rounded-lg px-3 py-2 text-sm" placeholder="Reply…" />
                  <button className="h-9 w-9 grid place-items-center rounded-lg bg-gradient-gold text-primary-foreground">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
