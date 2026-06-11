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
import Auth from '@/pages/Auth';
import DashboardPage from '@/pages/DashboardPage';
import DriversPage from '@/pages/DriversPage';
import DriverDetailPage from '@/pages/DriverDetailPage';
import CarsPage from '@/pages/CarsPage';
import AppTrackingPage from '@/pages/AppTrackingPage';
import ReportsPage from '@/pages/ReportsPage';
import ReportsProPage from '@/pages/ReportsProPage';
import SettingsPage from '@/pages/SettingsPage';
import GpsTrackingPage from '@/pages/GpsTrackingPage';
import AiAnalyticsPage from '@/pages/AiAnalyticsPage';
import FinancePage from '@/pages/FinancePage';
import TestingPage from '@/pages/TestingPage';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <ThemeProvider>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppErrorBoundary>
          <BrowserRouter>
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
          </BrowserRouter>
        </AppErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
