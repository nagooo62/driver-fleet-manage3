import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { asDate, daysBetween } from '@/lib/dateUtils';
import type {
  Driver,
  DriverDetailData,
  DriverOperationRecord,
  ExpiringDocumentItem,
  PaginatedResult,
  Profile,
} from '@/types';

export interface DriverFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

const buildPaginatedResult = <T,>(items: T[], total: number, page: number, pageSize: number): PaginatedResult<T> => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

export async function fetchExpiringDocuments(days = 30): Promise<ExpiringDocumentItem[]> {
  const { data, error } = await supabase
    .from('drivers')
    .select('id, full_name, iqama_expiry, license_expiry, medical_expiry, status')
    .neq('status', 'archived');

  if (error) throw error;

  return ((data ?? []) as Driver[])
    .flatMap((driver) => {
      const documents: ExpiringDocumentItem[] = [];
      const fields: Array<{ key: ExpiringDocumentItem['document']; value: string }> = [
        { key: 'iqama', value: driver.iqama_expiry },
        { key: 'license', value: driver.license_expiry },
        { key: 'medical', value: driver.medical_expiry },
      ];

      fields.forEach(({ key, value }) => {
        const date = asDate(value);
        if (!date) return;
        const daysLeft = daysBetween(new Date(), date);
        if (daysLeft <= days) {
          documents.push({
            driverId: driver.id,
            driverName: driver.full_name,
            document: key,
            expiresAt: value,
            daysLeft,
          });
        }
      });

      return documents;
    })
    .sort((left, right) => left.daysLeft - right.daysLeft);
}

export function useDrivers(filters: DriverFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, filters.pageSize ?? 10);

  return useQuery({
    queryKey: ['drivers', 'list', { ...filters, page, pageSize }],
    staleTime: 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from('drivers')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.search?.trim()) {
        const search = filters.search.trim().replace(/,/g, ' ');
        query = query.or(`full_name.ilike.%${search}%,iqama.ilike.%${search}%,manager.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      return buildPaginatedResult((data ?? []) as Driver[], count ?? 0, page, pageSize);
    },
  });
}

export function useDriver(id?: string) {
  return useQuery({
    queryKey: ['drivers', 'detail', id],
    enabled: !!id,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', id!)
        .single();

      if (error) throw error;
      return data as Driver;
    },
  });
}

export function useDriverDetail(id?: string) {
  return useQuery({
    queryKey: ['drivers', 'detail-bundle', id],
    enabled: !!id,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const [driverResult, operationsResult, carsResult, auditResult, applicationsResult] = await Promise.all([
        supabase.from('drivers').select('*').eq('id', id!).single(),
        supabase.from('driver_applications').select('*').eq('driver_id', id!).order('updated_at', { ascending: false }),
        supabase
          .from('cars')
          .select('*, current_delegate:drivers!current_delegate_id(id, full_name)')
          .eq('current_delegate_id', id!)
          .order('updated_at', { ascending: false }),
        supabase
          .from('audit_logs')
          .select('*')
          .eq('record_id', id!)
          .order('created_at', { ascending: false })
          .limit(25),
        supabase.from('applications').select('*'),
      ]);

      if (driverResult.error) throw driverResult.error;
      if (operationsResult.error) throw operationsResult.error;
      if (carsResult.error) throw carsResult.error;
      if (auditResult.error) throw auditResult.error;
      if (applicationsResult.error) throw applicationsResult.error;

      const applicationsMap = new Map(
        (applicationsResult.data ?? []).map((application) => [application.id, application.display_name])
      );

      const auditRows = (auditResult.data ?? []) as DriverDetailData['audit'];
      const actorIds = Array.from(new Set(auditRows.map((row) => row.user_id).filter(Boolean))) as string[];
      let actorsMap = new Map<string, string | null>();

      if (actorIds.length) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', actorIds);

        if (profilesError) throw profilesError;
        actorsMap = new Map(
          ((profilesData ?? []) as Pick<Profile, 'id' | 'full_name'>[]).map((profile) => [profile.id, profile.full_name])
        );
      }

      return {
        driver: driverResult.data as Driver,
        operations: ((operationsResult.data ?? []) as DriverOperationRecord[]).map((operation) => ({
          ...operation,
          applicationName: applicationsMap.get(operation.application_id) ?? 'غير معروف',
        })),
        assignedCars: (carsResult.data ?? []) as DriverDetailData['assignedCars'],
        audit: auditRows.map((row) => ({
          ...row,
          actorName: row.user_id ? actorsMap.get(row.user_id) ?? row.user_id : 'النظام',
        })),
      } as DriverDetailData;
    },
  });
}

export function useExpiringDocuments(days = 30) {
  return useQuery({
    queryKey: ['drivers', 'expiring-documents', days],
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchExpiringDocuments(days),
  });
}
