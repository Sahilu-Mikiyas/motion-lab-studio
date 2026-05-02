import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/studio-card';
import { Award, Film, Layers, Palette, Sparkles, Volume2, Box, MapPin, Mail } from 'lucide-react';

const badges = [
  { icon: Film, label: 'First Render' },
  { icon: Palette, label: 'Color Master' },
  { icon: Layers, label: 'Composer' },
  { icon: Volume2, label: 'Sync Wizard' },
  { icon: Box, label: '3D Initiate' },
  { icon: Sparkles, label: 'Studio MVP' },
  { icon: Award, label: 'Streak 14' },
  { icon: Film, label: '50 Frames' },
];

const timeline = [
  { date: 'Apr 28', title: 'Shipped "Apex Reveal" v3', tag: 'Branding' },
  { date: 'Apr 22', title: 'Promoted to Operator Tier III', tag: 'Milestone' },
  { date: 'Apr 14', title: 'Completed Color & Grade — Ch. 3', tag: 'Learning' },
  { date: 'Apr 03', title: 'Joined Furii Motion Labs', tag: 'Milestone' },
];

export default function Profile() {
  return (
    <>
      <Header title="Profile" subtitle="Your studio identity" />
      <div className="p-6 lg:p-10 space-y-8">
        <Card hover={false} className="p-0">
          <div className="h-40 bg-gradient-glow relative grain" />
          <div className="px-8 pb-8 -mt-12 flex flex-col md:flex-row gap-6 items-start">
            <div className="h-24 w-24 rounded-2xl bg-gradient-gold grid place-items-center text-3xl font-semibold text-primary-foreground glow-gold border-4 border-background">
              AV
            </div>
            <div className="flex-1 pt-4">
              <h2 className="font-display text-4xl">Aiden Vossberg</h2>
              <div className="text-muted-foreground text-sm font-mono">@aiden.motion · Operator Tier III</div>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Berlin, DE</span>
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> aiden@furii.lab</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 pt-4">
              {[['127', 'Frames'], ['14d', 'Streak'], ['$12.4k', 'Earned']].map(([v, k]) => (
                <div key={k} className="text-center">
                  <div className="font-display text-2xl">{v}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <section className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2" hover={false}>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Achievements</div>
            <div className="font-display text-2xl mb-5">Earned badges</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {badges.map((b, i) => (
                <motion.div
                  key={b.label}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 120, delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  className="aspect-square rounded-xl border border-border bg-secondary/40 grid place-items-center text-center p-3 hover:border-primary/40 transition-colors"
                >
                  <div>
                    <div className="h-10 w-10 mx-auto rounded-full bg-gradient-gold grid place-items-center mb-2">
                      <b.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="text-[11px] text-muted-foreground">{b.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          <Card hover={false}>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Timeline</div>
            <div className="font-display text-2xl mb-5">Recent moves</div>
            <ol className="relative border-l border-border ml-2 space-y-5">
              {timeline.map((t, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="pl-5"
                >
                  <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="text-[10px] font-mono uppercase tracking-wider text-primary">{t.tag} · {t.date}</div>
                  <div className="text-sm mt-0.5">{t.title}</div>
                </motion.li>
              ))}
            </ol>
          </Card>
        </section>
      </div>
    </>
  );
}
