import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/studio-card';
import { CheckCircle2, Lock, Play } from 'lucide-react';

const path = [
  { id: 1, title: 'Foundations of Motion', desc: 'Easing, timing, anticipation', state: 'done' },
  { id: 2, title: 'Composition & Frame', desc: 'Rule of thirds, lines, balance', state: 'done' },
  { id: 3, title: 'Typography in Motion', desc: 'Kinetic type that breathes', state: 'done' },
  { id: 4, title: 'Color & Grade', desc: 'LUTs, palettes, mood', state: 'active' },
  { id: 5, title: '3D Integration', desc: 'Cinema 4D + After Effects', state: 'locked' },
  { id: 6, title: 'Sound Design Sync', desc: 'Frame-perfect audio cues', state: 'locked' },
  { id: 7, title: 'Direction & Storyboarding', desc: 'Lead the room', state: 'locked' },
];

export default function Learning() {
  return (
    <>
      <Header title="Learning Path" subtitle="Operator track · Tier III" />
      <div className="p-6 lg:p-10">
        <Card hover={false} className="mb-8">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <div className="text-xs uppercase tracking-widest text-primary font-mono">Current chapter</div>
              <h2 className="font-display text-4xl mt-2">Color & Grade</h2>
              <p className="text-muted-foreground mt-2 max-w-lg text-sm">
                Master cinematic color science — from log footage to delivery. Unlock 3D integration when you finish.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="mt-5 bg-gradient-gold text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 glow-gold"
              >
                <Play className="h-4 w-4" /> Continue lesson 4 of 7
              </motion.button>
            </div>
            <div>
              <div className="flex items-end justify-between mb-2 text-xs text-muted-foreground">
                <span>Chapter progress</span>
                <span className="font-mono text-primary">57%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '57%' }} transition={{ duration: 1.2 }} className="h-full bg-gradient-gold" />
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full ${i < 4 ? 'bg-primary' : 'bg-secondary'}`} />
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="relative">
          {/* connector */}
          <div className="absolute left-6 top-6 bottom-6 w-px bg-border" />
          <div className="space-y-4">
            {path.map((node, i) => {
              const done = node.state === 'done';
              const active = node.state === 'active';
              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative pl-16"
                >
                  <div className={`absolute left-0 top-2 h-12 w-12 rounded-full grid place-items-center border-2 ${
                    done ? 'bg-primary/20 border-primary' :
                    active ? 'bg-gradient-gold border-primary glow-gold animate-pulse-glow' :
                    'bg-card border-border'
                  }`}>
                    {done ? <CheckCircle2 className="h-5 w-5 text-primary" /> :
                     active ? <Play className="h-5 w-5 text-primary-foreground" /> :
                     <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <Card hover={!path[i].state.includes('locked')} className={active ? 'border-primary/40' : ''}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Chapter {node.id}</div>
                        <div className="font-display text-2xl mt-0.5">{node.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">{node.desc}</div>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-1 rounded ${
                        done ? 'bg-primary/10 text-primary' :
                        active ? 'bg-primary text-primary-foreground' :
                        'bg-secondary text-muted-foreground'
                      }`}>
                        {done ? 'COMPLETE' : active ? 'IN PROGRESS' : 'LOCKED'}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
