import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Car, PaginatedResult } from '@/types';

export interface CarFilters {
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

export function useCars(filters: CarFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, filters.pageSize ?? 10);

  return useQuery({
    queryKey: ['cars', 'list', { ...filters, page, pageSize }],
    staleTime: 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from('cars')
        .select('*, current_delegate:drivers!current_delegate_id(id, full_name)', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.search?.trim()) {
        const search = filters.search.trim().replace(/,/g, ' ');
        query = query.or(`plate.ilike.%${search}%,type.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      return buildPaginatedResult((data ?? []) as Car[], count ?? 0, page, pageSize);
    },
  });
}

export function useCarStats() {
  return useQuery({
    queryKey: ['cars', 'stats'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from('cars').select('status');
      if (error) throw error;

      const cars = data ?? [];
      return {
        total: cars.length,
        delegated: cars.filter((car) => car.status === 'delegated').length,
        outOfService: cars.filter((car) => car.status === 'out_of_service').length,
        available: cars.filter((car) => car.status === 'available').length,
      };
    },
  });
}
