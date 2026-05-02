import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ReactNode } from 'react';

export function ProtectedRoute({ children, requireAdmin = false, requireOnboarded = true }: { children: ReactNode; requireAdmin?: boolean; requireOnboarded?: boolean }) {
  const { user, profile, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-muted-foreground text-sm font-mono">Loading…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;

  // Onboarding gate — admins skip it
  if (requireOnboarded && !isAdmin && profile && profile.onboarding_status !== 'complete') {
    // Brand-new users see the welcome/intro page first
    if (profile.onboarding_status === 'not_started') {
      if (location.pathname !== '/welcome') return <Navigate to="/welcome" replace />;
    } else if (location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}
