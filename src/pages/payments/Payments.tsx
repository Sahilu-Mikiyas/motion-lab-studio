import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/studio-card';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const months = [
  { m: 'Nov', v: 2100 }, { m: 'Dec', v: 3200 }, { m: 'Jan', v: 2800 },
  { m: 'Feb', v: 4100 }, { m: 'Mar', v: 3700 }, { m: 'Apr', v: 4820 },
];

const txns = [
  { d: 'Apr 28', desc: 'Apex Reveal — Final delivery', amt: 1850, type: 'in' },
  { d: 'Apr 22', desc: 'Operator Tier III bonus', amt: 500, type: 'in' },
  { d: 'Apr 18', desc: 'Plugin license — Magic Bullet', amt: -129, type: 'out' },
  { d: 'Apr 14', desc: 'Lesson royalty payout', amt: 240, type: 'in' },
  { d: 'Apr 09', desc: 'NEON Studio — milestone 2', amt: 2200, type: 'in' },
];

export default function Payments() {
  return (
    <>
      <Header title="Payments" subtitle="Earnings, payouts, and ledger" />
      <div className="p-6 lg:p-10 space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: 'Lifetime earnings', value: '$24,180', delta: '+18%' },
            { label: 'This month', value: '$4,820', delta: '+24%' },
            { label: 'Pending payout', value: '$1,640', delta: 'Apr 30' },
          ].map((s) => (
            <Card key={s.label}>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="font-display text-4xl mt-2">{s.value}</div>
              <div className="text-[11px] font-mono text-primary mt-2">{s.delta}</div>
            </Card>
          ))}
        </div>

        <Card hover={false}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Earnings</div>
              <div className="font-display text-2xl">Last 6 months</div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 text-sm bg-secondary border border-border px-3 py-2 rounded-lg">
              <Download className="h-4 w-4" /> Export CSV
            </motion.button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months}>
                <defs>
                  <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(43 80% 65%)" />
                    <stop offset="100%" stopColor="hsl(38 80% 50%)" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }}
                  cursor={{ fill: 'hsl(var(--primary) / 0.08)' }}
                />
                <Bar dataKey="v" fill="url(#bar)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card hover={false}>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Ledger</div>
          <div className="font-display text-2xl mb-4">Recent transactions</div>
          <div className="divide-y divide-border">
            {txns.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg grid place-items-center ${
                    t.type === 'in' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {t.type === 'in' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="text-sm">{t.desc}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{t.d}</div>
                  </div>
                </div>
                <div className={`font-mono text-sm ${t.amt > 0 ? 'text-success' : 'text-destructive'}`}>
                  {t.amt > 0 ? '+' : ''}${Math.abs(t.amt).toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
