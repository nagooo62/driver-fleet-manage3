import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import ProtectedRoute, { PublicOnlyRoute } from '@/components/ProtectedRoute';
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { AppLayout } from '@/components/layout/AppLayout';

/* الصفحات تُحمَّل عند الطلب (code splitting) — يقلّص الحزمة الأولى */
const Auth             = lazy(() => import('@/pages/Auth'));
const DashboardPage    = lazy(() => import('@/pages/DashboardPage'));
const DriversPage      = lazy(() => import('@/pages/DriversPage'));
const DriverDetailPage = lazy(() => import('@/pages/DriverDetailPage'));
const CarsPage         = lazy(() => import('@/pages/CarsPage'));
const AppTrackingPage  = lazy(() => import('@/pages/AppTrackingPage'));
const ReportsPage      = lazy(() => import('@/pages/ReportsPage'));
const ReportsProPage   = lazy(() => import('@/pages/ReportsProPage'));
const SettingsPage     = lazy(() => import('@/pages/SettingsPage'));
const GpsTrackingPage  = lazy(() => import('@/pages/GpsTrackingPage'));
const AiAnalyticsPage  = lazy(() => import('@/pages/AiAnalyticsPage'));
const FinancePage      = lazy(() => import('@/pages/FinancePage'));
const TestingPage      = lazy(() => import('@/pages/TestingPage'));
const NotFound         = lazy(() => import('@/pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/** مؤشر تحميل الصفحات الكسولة */
function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="جارٍ التحميل">
      <div className="progress-glow w-48" />
    </div>
  );
}

const App = () => (
  <ThemeProvider>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppErrorBoundary>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/auth" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />

                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/drivers" element={<DriversPage />} />
                  <Route path="/drivers/:id" element={<DriverDetailPage />} />
                  <Route path="/cars" element={<CarsPage />} />
                  <Route path="/apps/:slug" element={<AppTrackingPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/reports-pro" element={<ReportsProPage />} />
                  <Route path="/gps" element={<GpsTrackingPage />} />
                  <Route path="/ai" element={<AiAnalyticsPage />} />
                  <Route path="/finance" element={<FinancePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/testing" element={<TestingPage />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AppErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
