import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { appendDemoAuditLog, DEMO_MODE } from '@/lib/demoMode';

interface AuditLogEntry {
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Json;
  new_values?: Json;
  ip_address?: unknown;
  user_agent?: string;
}

export function useAuditLog() {
  const { user } = useAuth();

  const logAction = async (entry: AuditLogEntry) => {
    if (!user) return;

    try {
      if (DEMO_MODE) {
        appendDemoAuditLog({
          action: entry.action,
          table_name: entry.table_name,
          record_id: entry.record_id,
          old_values: entry.old_values ?? null,
          new_values: entry.new_values ?? null,
          ip_address: entry.ip_address ?? null,
          user_agent: entry.user_agent ?? navigator.userAgent,
          user_id: user.id,
        });
        return;
      }

      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: entry.action,
          table_name: entry.table_name,
          record_id: entry.record_id,
          old_values: entry.old_values ?? null,
          new_values: entry.new_values ?? null,
          ip_address: entry.ip_address ?? null,
          user_agent: entry.user_agent ?? navigator.userAgent,
        });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  };

  return { logAction };
}
