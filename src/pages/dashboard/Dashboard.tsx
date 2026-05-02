import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, Film, Flame, Play, TrendingUp, Trophy } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/studio-card';
import { SkillRing } from '@/components/dashboard/SkillRing';
import { fadeUp, stagger } from '@/lib/motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const chart = [
  { d: 'Mon', v: 22 }, { d: 'Tue', v: 38 }, { d: 'Wed', v: 31 },
  { d: 'Thu', v: 54 }, { d: 'Fri', v: 47 }, { d: 'Sat', v: 68 }, { d: 'Sun', v: 82 },
];

const tasks = [
  { id: 1, title: 'Sci-Fi Title Sequence — Vol. II', client: 'NEON / Studio', due: '2d 4h', tag: 'Motion', progress: 64 },
  { id: 2, title: 'Brand Logo Reveal — Apex Audio', client: 'Apex Audio', due: '5d 12h', tag: 'Branding', progress: 28 },
  { id: 3, title: 'UI Microinteractions Pack', client: 'Internal Lab', due: '1d 6h', tag: 'UI/UX', progress: 89 },
];

export default function Dashboard() {
  return (
    <>
      <Header title="Studio Dashboard" subtitle="Saturday · production window open" />
      <div className="p-6 lg:p-10 space-y-8">
        {/* Hero */}
        <motion.section
          variants={stagger(0.06)}
          initial="initial"
          animate="animate"
          className="relative grid lg:grid-cols-[1fr_auto] gap-8 p-8 lg:p-10 rounded-2xl border border-border surface overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-glow opacity-80 pointer-events-none" />
          <div className="relative">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-primary font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Active session
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-5xl lg:text-6xl mt-4 leading-[1.05]">
              Welcome back, <span className="text-gradient-gold">Aiden</span>.
              <br />Your craft is moving.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground mt-4 max-w-xl">
              Three live tasks, one review pending, and a new production drop scheduled for tonight.
              Stay in flow — the studio is yours.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mt-7">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="bg-gradient-gold text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium glow-gold flex items-center gap-2"
              >
                <Play className="h-4 w-4" /> Resume current task
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="border border-border bg-card px-5 py-2.5 rounded-lg text-sm flex items-center gap-2"
              >
                Open studio queue <ArrowUpRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          </div>

          <div className="relative grid place-items-center">
            <SkillRing progress={71} level={7} />
          </div>
        </motion.section>

        {/* Stats */}
        <motion.section variants={stagger()} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Tasks active', value: '3', delta: '+1', icon: Film },
            { label: 'Streak', value: '14d', delta: '+2', icon: Flame },
            { label: 'Earnings (mo)', value: '$4,820', delta: '+18%', icon: TrendingUp },
            { label: 'Achievements', value: '27', delta: '+3', icon: Trophy },
          ].map((s) => (
            <motion.div key={s.label} variants={fadeUp}>
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className="font-display text-3xl mt-2">{s.value}</div>
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-secondary grid place-items-center">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-mono text-success">{s.delta} this week</div>
              </Card>
            </motion.div>
          ))}
        </motion.section>

        {/* Lower grid */}
        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2" hover={false}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Production output</div>
                <div className="font-display text-2xl">Last 7 days</div>
              </div>
              <div className="text-xs font-mono text-primary">+34% vs prior week</div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }}
                    cursor={{ stroke: 'hsl(var(--primary))', strokeOpacity: 0.3 }}
                  />
                  <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#area)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card hover={false}>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Active tasks</div>
            <div className="font-display text-2xl mb-4">In your studio</div>
            <div className="space-y-3">
              {tasks.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="p-3 rounded-lg bg-secondary/60 border border-border hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary">{t.tag}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {t.due}</span>
                  </div>
                  <div className="text-sm mt-1.5 leading-tight">{t.title}</div>
                  <div className="text-[11px] text-muted-foreground">{t.client}</div>
                  <div className="mt-2 h-1 rounded-full bg-background overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${t.progress}%` }}
                      transition={{ duration: 1, delay: 0.1 * i }}
                      className="h-full bg-gradient-gold"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
