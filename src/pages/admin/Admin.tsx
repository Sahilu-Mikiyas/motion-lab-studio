import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/studio-card';
import { Users, Film, DollarSign, Clock } from 'lucide-react';

const columns = [
  { id: 'review', title: 'In Review', color: 'warning' },
  { id: 'progress', title: 'In Progress', color: 'info' },
  { id: 'done', title: 'Delivered', color: 'success' },
];

const board: Record<string, { id: number; title: string; owner: string; tag: string }[]> = {
  review: [
    { id: 1, title: 'Apex Reveal — v3', owner: 'AV', tag: 'Branding' },
    { id: 2, title: 'Nova UI loop', owner: 'MR', tag: 'UI/UX' },
  ],
  progress: [
    { id: 3, title: 'Sci-Fi Title Sequence', owner: 'AV', tag: 'Motion' },
    { id: 4, title: 'Vinyl Record promo', owner: 'JL', tag: 'Motion' },
    { id: 5, title: 'Crypto explainer', owner: 'KS', tag: 'Edu' },
  ],
  done: [
    { id: 6, title: 'Founders deck', owner: 'AV', tag: 'Pitch' },
    { id: 7, title: 'Holiday spot — Loom', owner: 'MR', tag: 'Motion' },
  ],
};

const applicants = [
  { name: 'Sora Kim', loc: 'Seoul', tier: 'Senior', score: 92 },
  { name: 'Felix Marr', loc: 'Lisbon', tier: 'Mid', score: 81 },
  { name: 'Ines Roca', loc: 'Mexico City', tier: 'Senior', score: 88 },
];

export default function Admin() {
  return (
    <>
      <Header title="Admin · Studio Operations" subtitle="Pipeline, talent and ledger" />
      <div className="p-6 lg:p-10 space-y-8">
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: 'Active operators', value: '124', icon: Users },
            { label: 'Live tasks', value: '38', icon: Film },
            { label: 'Monthly revenue', value: '$84.2k', icon: DollarSign },
            { label: 'Avg turnaround', value: '4.2d', icon: Clock },
          ].map((s) => (
            <Card key={s.label}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="font-display text-3xl mt-2">{s.value}</div>
                </div>
                <div className="h-9 w-9 grid place-items-center rounded-lg bg-secondary">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Production board</div>
              <div className="font-display text-2xl">Live pipeline</div>
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            {columns.map((col) => (
              <div key={col.id} className="surface border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium">{col.title}</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                    {board[col.id].length}
                  </span>
                </div>
                <div className="space-y-2">
                  {board[col.id].map((card, i) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -2 }}
                      className="p-3 rounded-lg bg-card border border-border cursor-grab hover:border-primary/40 transition-colors"
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary">{card.tag}</div>
                      <div className="text-sm mt-1">{card.title}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="h-6 w-6 rounded-full bg-gradient-gold grid place-items-center text-[10px] text-primary-foreground font-semibold">
                          {card.owner}
                        </div>
                        <span className="text-[10px] text-muted-foreground">#{card.id.toString().padStart(4, '0')}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <Card hover={false}>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Applicants</div>
          <div className="font-display text-2xl mb-4">Awaiting review</div>
          <div className="grid md:grid-cols-3 gap-3">
            {applicants.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -3 }}
                className="p-4 rounded-xl border border-border bg-secondary/40"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-gold grid place-items-center text-sm text-primary-foreground font-semibold">
                    {a.name.split(' ').map((p) => p[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{a.name}</div>
                    <div className="text-[11px] text-muted-foreground">{a.tier} · {a.loc}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-primary text-sm">{a.score}</div>
                    <div className="text-[10px] text-muted-foreground">score</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 text-xs bg-gradient-gold text-primary-foreground py-1.5 rounded-md">Approve</button>
                  <button className="flex-1 text-xs border border-border py-1.5 rounded-md hover:bg-secondary">Pass</button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
