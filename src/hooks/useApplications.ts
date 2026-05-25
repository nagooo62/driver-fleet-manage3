import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DEMO_MODE,
  getDemoApplicationRecords,
  getDemoApplications,
} from '@/lib/demoMode';
import type { AppTrackingSummary, Application, Driver, DriverOperationRecord, PaginatedResult } from '@/types';

export function useApplications() {
  return useQuery({
    queryKey: ['applications', 'all'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (DEMO_MODE) {
        return [...getDemoApplications()].sort((left, right) => left.display_name.localeCompare(right.display_name));
      }

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('display_name', { ascending: true });

      if (error) throw error;
      return (data ?? []) as Application[];
    },
  });
}

export function useAppTracking(slug?: string, page = 1, pageSize = 12) {
  return useQuery({
    queryKey: ['applications', 'tracking', slug, page, pageSize],
    enabled: !!slug,
    staleTime: 60 * 1000,
    queryFn: async () => {
      if (DEMO_MODE) {
        const application = getDemoApplications().find((item) => item.name === slug) ?? null;
        if (!application) {
          return {
            application: null,
            summary: {
              application: null,
              totalDrivers: 0,
              verifiedDrivers: 0,
              totalOrders: 0,
              totalWorkingDays: 0,
            } satisfies AppTrackingSummary,
            records: {
              items: [],
              total: 0,
              page,
              pageSize,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            } satisfies PaginatedResult<DriverOperationRecord>,
          };
        }

        const allRecords = getDemoApplicationRecords().filter((record) => record.application_id === application.id);
        const from = (page - 1) * pageSize;
        const items = allRecords.slice(from, from + pageSize);
        const totalPages = Math.max(1, Math.ceil(allRecords.length / pageSize));

        return {
          application,
          summary: {
            application,
            totalDrivers: allRecords.length,
            verifiedDrivers: allRecords.filter((row) => row.is_verified).length,
            totalOrders: allRecords.reduce((sum, row) => sum + (row.orders_count ?? 0), 0),
            totalWorkingDays: allRecords.reduce((sum, row) => sum + (row.working_days ?? 0), 0),
          } satisfies AppTrackingSummary,
          records: {
            items,
            total: allRecords.length,
            page,
            pageSize,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          } satisfies PaginatedResult<DriverOperationRecord>,
        };
      }

      const appResult = await supabase
        .from('applications')
        .select('*')
        .eq('name', slug!)
        .maybeSingle();

      if (appResult.error) throw appResult.error;

      const application = (appResult.data as Application | null) ?? null;
      if (!application) {
        return {
          application: null,
          summary: {
            application: null,
            totalDrivers: 0,
            verifiedDrivers: 0,
            totalOrders: 0,
            totalWorkingDays: 0,
          } satisfies AppTrackingSummary,
          records: {
            items: [],
            total: 0,
            page,
            pageSize,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          } satisfies PaginatedResult<DriverOperationRecord>,
        };
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const [recordsResult, summaryResult] = await Promise.all([
        supabase
          .from('driver_applications')
          .select('*', { count: 'exact' })
          .eq('application_id', application.id)
          .order('updated_at', { ascending: false })
          .range(from, to),
        supabase
          .from('driver_applications')
          .select('driver_id, is_verified, orders_count, working_days')
          .eq('application_id', application.id),
      ]);

      if (recordsResult.error) throw recordsResult.error;
      if (summaryResult.error) throw summaryResult.error;

      const driverIds = Array.from(new Set((recordsResult.data ?? []).map((record) => record.driver_id)));
      let driversMap = new Map<string, Driver>();

      if (driverIds.length) {
        const { data: driversData, error: driversError } = await supabase
          .from('drivers')
          .select('*')
          .in('id', driverIds);

        if (driversError) throw driversError;
        driversMap = new Map(((driversData ?? []) as Driver[]).map((driver) => [driver.id, driver]));
      }

      const items = ((recordsResult.data ?? []) as DriverOperationRecord[]).map((record) => ({
        ...record,
        applicationName: application.display_name,
        driverName: driversMap.get(record.driver_id)?.full_name ?? 'غير معروف',
      }));

      const total = recordsResult.count ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const summaryRows = summaryResult.data ?? [];

      return {
        application,
        summary: {
          application,
          totalDrivers: total,
          verifiedDrivers: summaryRows.filter((row) => row.is_verified).length,
          totalOrders: summaryRows.reduce((sum, row) => sum + (row.orders_count ?? 0), 0),
          totalWorkingDays: summaryRows.reduce((sum, row) => sum + (row.working_days ?? 0), 0),
        } satisfies AppTrackingSummary,
        records: {
          items,
          total,
          page,
          pageSize,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        } satisfies PaginatedResult<DriverOperationRecord>,
      };
    },
  });
}
