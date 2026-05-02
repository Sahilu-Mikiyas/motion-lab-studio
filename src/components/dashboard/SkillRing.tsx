import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const SkillRing = ({
  progress,
  level,
  size = 220,
}: { progress: number; level: number; size?: number }) => {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(progress), 150);
    return () => clearTimeout(t);
  }, [progress]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(43 80% 65%)" />
            <stop offset="100%" stopColor="hsl(38 80% 50%)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--border))" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring-gold)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * shown) / 100 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Level</div>
          <div className="font-display text-6xl leading-none mt-1">{level}</div>
          <div className="mt-2 text-xs font-mono text-primary">{progress}%</div>
        </div>
      </div>
    </div>
  );
};
