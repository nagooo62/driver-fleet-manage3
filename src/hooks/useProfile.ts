import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_MODE, getDemoProfile } from '@/lib/demoMode';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types';

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (DEMO_MODE) {
        return getDemoProfile();
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
  });
}
