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

  // Admins bypass all onboarding gates and pre-onboarding pages
  if (isAdmin) {
    if (!requireOnboarded) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
  }

  const status = profile?.onboarding_status;

  // Gate for pages that require full onboarding (dashboard, tasks, etc.)
  if (requireOnboarded) {
    if (!status || status === 'not_started') return <Navigate to="/welcome" replace />;
    if (status === 'application_submitted' || status === 'under_review') return <Navigate to="/pending" replace />;
    if (status === 'legal_pending') return <Navigate to="/onboarding" replace />;
    if (status === 'approved') return <Navigate to="/approved" replace />;
    if (status === 'rejected') return <Navigate to="/pending" replace />;
    // status === 'complete' → allow through
  }

  // Gate for pre-onboarding pages — redirect away if already complete or approved
  if (!requireOnboarded) {
    if (status === 'complete') return <Navigate to="/dashboard" replace />;
    // Route-specific guards to prevent wrong-status access
    if (location.pathname === '/pending' && status !== 'application_submitted' && status !== 'under_review' && status !== 'rejected') {
      return <Navigate to="/welcome" replace />;
    }
    if (location.pathname === '/approved' && status !== 'approved') {
      return <Navigate to="/dashboard" replace />;
    }
    if (location.pathname === '/onboarding' && status !== 'not_started' && status !== 'application_submitted' && status !== 'under_review' && status !== 'legal_pending') {
      return <Navigate to="/dashboard" replace />;
    }
    if (location.pathname === '/welcome' && status && status !== 'not_started') {
      return <Navigate to="/pending" replace />;
    }
  }

  return <>{children}</>;
}
