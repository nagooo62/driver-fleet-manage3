import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchExpiringDocuments } from '@/hooks/useDrivers';
import {
  DEMO_MODE,
  getDemoApplications,
  getDemoApplicationRecords,
  getDemoCars,
  getDemoDrivers,
  getDemoNotifications,
} from '@/lib/demoMode';
import type { DashboardStats } from '@/types';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    staleTime: 60 * 1000,
    queryFn: async () => {
      if (DEMO_MODE) {
        const drivers = getDemoDrivers();
        const cars = getDemoCars();
        const applications = getDemoApplications().filter((application) => application.is_active);
        const notifications = getDemoNotifications();
        const expiringDocuments = await fetchExpiringDocuments(30);
        const performanceRows = getDemoApplicationRecords();
        const totalOrders = performanceRows.reduce((sum, row) => sum + (row.orders_count ?? 0), 0);
        const totalWorkingDays = performanceRows.reduce((sum, row) => sum + (row.working_days ?? 0), 0);
        const verifiedRecords = performanceRows.filter((row) => row.is_verified).length;
        const averageOrdersPerDay = totalWorkingDays > 0 ? totalOrders / totalWorkingDays : 0;

        return {
          totalDrivers: drivers.length,
          activeDrivers: drivers.filter((driver) => ['accepted', 'sponsored'].includes(driver.status)).length,
          totalCars: cars.length,
          delegatedCars: cars.filter((car) => car.status === 'delegated').length,
          outOfServiceCars: cars.filter((car) => car.status === 'out_of_service').length,
          expiringDocuments: expiringDocuments.length,
          realtimeAlerts: notifications.filter((notification) => !notification.is_read).length,
          performanceScore: Math.min(100, Math.round(averageOrdersPerDay * 10)),
          utilizationRate: performanceRows.length > 0 ? Math.round((verifiedRecords / performanceRows.length) * 100) : 0,
          totalApplications: applications.length,
        } satisfies DashboardStats;
      }

      const [
        driversTotal,
        activeDrivers,
        carsTotal,
        delegatedCars,
        outOfServiceCars,
        applicationsTotal,
        alertsTotal,
        expiringDocuments,
        performanceRows,
      ] = await Promise.all([
        supabase.from('drivers').select('*', { count: 'exact', head: true }),
        supabase.from('drivers').select('*', { count: 'exact', head: true }).in('status', ['accepted', 'sponsored']),
        supabase.from('cars').select('*', { count: 'exact', head: true }),
        supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'delegated'),
        supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'out_of_service'),
        supabase.from('applications').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
        fetchExpiringDocuments(30),
        supabase.from('driver_applications').select('orders_count, working_days, is_verified'),
      ]);

      [
        driversTotal,
        activeDrivers,
        carsTotal,
        delegatedCars,
        outOfServiceCars,
        applicationsTotal,
        alertsTotal,
        performanceRows,
      ].forEach((result) => {
        if (result.error) throw result.error;
      });

      const performanceData = performanceRows.data ?? [];
      const totalOrders = performanceData.reduce((sum, row) => sum + (row.orders_count ?? 0), 0);
      const totalWorkingDays = performanceData.reduce((sum, row) => sum + (row.working_days ?? 0), 0);
      const verifiedRecords = performanceData.filter((row) => row.is_verified).length;
      const performanceScore = totalWorkingDays > 0 ? Math.round(totalOrders / totalWorkingDays) : 0;
      const utilizationRate = performanceData.length > 0 ? Math.round((verifiedRecords / performanceData.length) * 100) : 0;

      return {
        totalDrivers: driversTotal.count ?? 0,
        activeDrivers: activeDrivers.count ?? 0,
        totalCars: carsTotal.count ?? 0,
        delegatedCars: delegatedCars.count ?? 0,
        outOfServiceCars: outOfServiceCars.count ?? 0,
        expiringDocuments: expiringDocuments.length,
        realtimeAlerts: alertsTotal.count ?? 0,
        performanceScore,
        utilizationRate,
        totalApplications: applicationsTotal.count ?? 0,
      } satisfies DashboardStats;
    },
  });
}
