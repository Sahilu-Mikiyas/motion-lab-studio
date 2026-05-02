import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ListChecks, GraduationCap, FileText,
  User as UserIcon, Wallet, Shield, Sparkles
} from 'lucide-react';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/learning', label: 'Learning', icon: GraduationCap },
  { to: '/application', label: 'Application', icon: FileText },
  { to: '/profile', label: 'Profile', icon: UserIcon },
  { to: '/payments', label: 'Payments', icon: Wallet },
  { to: '/admin', label: 'Admin', icon: Shield },
];

export const Sidebar = () => {
  const { pathname } = useLocation();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl sticky top-0 h-screen">
      <div className="px-5 py-6 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-md bg-gradient-gold grid place-items-center">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-xl">Furii</div>
          <div className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Motion Labs</div>
        </div>
      </div>

      <nav className="px-3 mt-2 flex-1 space-y-0.5">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} className="block">
              <motion.div
                whileHover={{ x: 2 }}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'text-foreground bg-sidebar-accent'
                    : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/60'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="active-pill"
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      <div className="m-3 p-4 rounded-xl border border-sidebar-border bg-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-60" />
        <div className="relative">
          <div className="text-xs text-muted-foreground">Studio Pass</div>
          <div className="font-display text-lg mt-1">Tier III · Operator</div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '71%' }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="h-full bg-gradient-gold"
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1.5 font-mono">2,840 / 4,000 XP</div>
        </div>
      </div>
    </aside>
  );
};
