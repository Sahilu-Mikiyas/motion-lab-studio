import { NavLink } from 'react-router-dom';
import { Film, GraduationCap, LayoutDashboard, ListChecks, Lock, ShieldCheck, User, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/learning', label: 'Learning', icon: GraduationCap },
  { to: '/payments', label: 'Payments', icon: Wallet, paidOnly: true },
  { to: '/profile', label: 'Profile', icon: User },
];

export const Sidebar = () => {
  const { profile, isAdmin } = useAuth();
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="px-5 h-16 flex items-center gap-2 border-b border-border">
        <div className="h-6 w-6 rounded-sm bg-foreground" />
        <span className="font-display text-lg">Furii</span>
        <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Studio</span>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {items.map((it) => {
          const locked = it.paidOnly && !profile?.paid_status;
          return (
            <NavLink
              key={it.to}
              to={locked ? '#' : it.to}
              onClick={(e) => locked && e.preventDefault()}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  locked ? 'text-muted-foreground/60 cursor-not-allowed' : isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`
              }
            >
              <it.icon className="h-4 w-4" />
              <span className="flex-1">{it.label}</span>
              {locked && <Lock className="h-3 w-3" />}
            </NavLink>
          );
        })}
        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) =>
            `mt-4 flex items-center gap-3 px-3 py-2 rounded-md text-sm border border-border ${isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`
          }>
            <ShieldCheck className="h-4 w-4" /> Admin
          </NavLink>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-border text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
        <Film className="h-3 w-3" /> Level {profile?.assigned_level ?? 0}
      </div>
    </aside>
  );
};
