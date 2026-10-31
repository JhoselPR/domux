import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useHouseholdStore } from '@/stores/householdStore';
import { AuthPage } from '@/pages/AuthPage';
import { LandingPage } from '@/pages/LandingPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TasksPage } from '@/pages/TasksPage';
import { PantryPage } from '@/pages/PantryPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { LogoMark } from '@/components/ui/Logo';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-page">
      <LogoMark size={32} />
      <p className="text-sm text-ink-3">Cargando</p>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const { households, loading: householdLoading } = useHouseholdStore();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  
  // Only show full loading screen if we are fetching and have NO households yet
  if (householdLoading && households.length === 0) return <LoadingScreen />;
  
  if (households.length === 0) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}

function HomeRoute() {
  const { user } = useAuthStore();

  if (!user) return <LandingPage />;

  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
}

function JoinRedirect() {
  return <Navigate to="/onboarding" replace />;
}

export default function App() {
  const { initialize, user, loading, initialized } = useAuthStore();
  const { fetchHouseholds, reset: resetHouseholds } = useHouseholdStore();
  const [readyUserId, setReadyUserId] = useState<string | null>(null);
  const userId = user?.id;

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!initialized) return;

    if (!userId) {
      resetHouseholds();
      return;
    }

    if (initialized && userId) {
      fetchHouseholds(userId).then(() => setReadyUserId(userId));
    }
  }, [initialized, userId, fetchHouseholds, resetHouseholds]);

  if (loading || (userId && readyUserId !== userId)) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/onboarding" element={user ? <OnboardingPage /> : <Navigate to="/auth" replace />} />
        <Route path="/join/:code" element={<JoinRedirect />} />

        <Route path="/" element={<HomeRoute />}>
          <Route index element={<DashboardPage />} />
        </Route>

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/pantry" element={<PantryPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
