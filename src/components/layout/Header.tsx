import { motion } from 'framer-motion';
import { Bell, Search, Command } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

export const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const user = useUserStore((s) => s.user);
  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="flex items-center gap-4 px-6 lg:px-10 h-16">
        <div className="flex-1 min-w-0">
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl truncate"
          >
            {title}
          </motion.h1>
          {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 h-9 rounded-lg bg-input border border-border text-sm text-muted-foreground w-72">
          <Search className="h-4 w-4" />
          <span className="flex-1">Search tasks, lessons, people…</span>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border flex items-center gap-1">
            <Command className="h-3 w-3" /> K
          </kbd>
        </div>

        <button className="h-9 w-9 grid place-items-center rounded-lg bg-secondary hover:bg-secondary/70 transition-colors relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-border">
          <div className="text-right hidden sm:block">
            <div className="text-sm leading-tight">{user.name}</div>
            <div className="text-[10px] text-muted-foreground font-mono">{user.handle}</div>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-gold grid place-items-center text-primary-foreground text-sm font-semibold">
            {user.avatar}
          </div>
        </div>
      </div>
    </header>
  );
};
