import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE, getDemoDocuments, getDemoDrivers } from '@/lib/demoMode';

export interface AppDistribution {
  app: string;
  label: string;
  count: number;
  color: string;
}

export interface DocStatusSummary {
  valid: number;
  expiring_soon: number;
  expired: number;
  missing: number;
}

const APP_META: Record<string, { label: string; color: string }> = {
  toyou: { label: 'ToYou', color: '#f59e0b' },
  hungerstation: { label: 'HungerStation', color: '#f97316' },
  jahez: { label: 'جاهز', color: '#10b981' },
  keeta: { label: 'كيتا', color: '#0ea5e9' },
  chefz: { label: 'The Chefz', color: '#a855f7' },
};

export function useAppDistribution() {
  return useQuery({
    queryKey: ['dashboard', 'app-distribution'],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<AppDistribution[]> => {
      if (DEMO_MODE) {
        const counts: Record<string, number> = {};
        getDemoDrivers().forEach((driver) => {
          if (driver.app_name) counts[driver.app_name] = (counts[driver.app_name] ?? 0) + 1;
        });

        return Object.entries(APP_META).map(([key, meta]) => ({
          app: key,
          label: meta.label,
          count: counts[key] ?? 0,
          color: meta.color,
        }));
      }

      const { data, error } = await supabase
        .from('drivers')
        .select('app_name')
        .not('app_name', 'is', null);
      if (error) throw error;

      const counts: Record<string, number> = {};
      (data ?? []).forEach((row) => {
        if (row.app_name) counts[row.app_name] = (counts[row.app_name] ?? 0) + 1;
      });

      return Object.entries(APP_META).map(([key, meta]) => ({
        app: key,
        label: meta.label,
        count: counts[key] ?? 0,
        color: meta.color,
      }));
    },
  });
}

export function useDocStatusSummary() {
  return useQuery({
    queryKey: ['dashboard', 'doc-status'],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<DocStatusSummary> => {
      if (DEMO_MODE) {
        const counts = { valid: 0, expiring_soon: 0, expired: 0, missing: 0 };
        getDemoDocuments().forEach((row) => {
          const status = row.status as keyof typeof counts;
          if (status in counts) counts[status] += 1;
          else counts.missing += 1;
        });
        return counts;
      }

      const { data, error } = await supabase
        .from('driver_documents')
        .select('status');
      if (error) throw error;

      const counts = { valid: 0, expiring_soon: 0, expired: 0, missing: 0 };
      (data ?? []).forEach((row) => {
        const s = row.status as keyof typeof counts;
        if (s in counts) counts[s]++;
        else counts.missing++;
      });
      return counts;
    },
  });
}
