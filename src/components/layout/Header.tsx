import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';

export const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (profile?.display_name || profile?.full_name || profile?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 backdrop-blur-md bg-background/70 border-b border-border">
      <div className="flex items-center gap-4 px-6 lg:px-10 h-16">
        <div className="flex-1 min-w-0">
          <motion.h1 key={title} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="font-display text-2xl truncate">
            {title}
          </motion.h1>
          {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <NotificationBell />
          <div className="text-right hidden sm:block ml-1">
            <div className="text-sm leading-tight">{profile?.display_name || profile?.full_name || 'Member'}</div>
            <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[160px]">{profile?.email}</div>
          </div>
          <div className="h-9 w-9 rounded-full bg-secondary border border-border grid place-items-center text-xs">
            {initials}
          </div>
          <button
            onClick={async () => { await signOut(); navigate('/'); }}
            className="h-9 w-9 grid place-items-center rounded-md border border-border hover:bg-secondary"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
