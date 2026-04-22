import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, User, Database, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateArabic } from "@/lib/dateUtils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SecurityAuditPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export const SecurityAuditPanel = ({ isOpen, onClose }: SecurityAuditPanelProps) => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAuditLogs();
    }
  }, [isOpen]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      // Fetch audit logs without join first, then get profile names separately
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set(logs?.map(log => log.user_id).filter(Boolean))];
      
      // Fetch profiles for these users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      // Combine data
      const logsWithProfiles = logs?.map(log => ({
        ...log,
        profiles: profiles?.find(p => p.id === log.user_id) || null
      })) || [];

      setAuditLogs(logsWithProfiles as AuditLog[]);
    } catch (error: any) {
      toast.error("فشل في تحميل سجل الأمان: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE') || action.includes('INSERT')) {
      return <User className="w-4 h-4 text-green-500" />;
    } else if (action.includes('UPDATE') || action.includes('EDIT')) {
      return <Database className="w-4 h-4 text-blue-500" />;
    } else if (action.includes('DELETE') || action.includes('DEACTIVATE')) {
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    }
    return <Shield className="w-4 h-4 text-primary" />;
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('CREATE')) return 'default';
    if (action.includes('UPDATE')) return 'secondary';
    if (action.includes('DELETE')) return 'destructive';
    return 'outline';
  };

  const formatAction = (action: string) => {
    const actionMap: Record<string, string> = {
      'CREATE_USER': 'إنشاء مستخدم جديد',
      'UPDATE_USER': 'تحديث بيانات مستخدم',
      'DEACTIVATE_USER': 'إلغاء تفعيل مستخدم',
      'CREATE_DRIVER': 'إضافة سائق جديد',
      'UPDATE_DRIVER': 'تحديث بيانات سائق',
      'DELETE_DRIVER': 'حذف سائق',
      'LOGIN': 'تسجيل دخول',
      'LOGOUT': 'تسجيل خروج'
    };
    return actionMap[action] || action;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl glass max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            سجل الأمان والمراجعة
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              لا توجد سجلات أمان
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <Card key={log.id} className="glass">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getActionIcon(log.action)}
                        <div>
                          <CardTitle className="text-base">
                            {formatAction(log.action)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            بواسطة: {log.profiles?.full_name || 'مستخدم غير معروف'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.table_name || 'نظام'}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDateArabic(new Date(log.created_at))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {log.ip_address && (
                        <div>
                          <span className="font-medium">عنوان IP:</span>
                          <span className="ml-2 text-muted-foreground">{log.ip_address}</span>
                        </div>
                      )}
                      {log.record_id && (
                        <div>
                          <span className="font-medium">معرف السجل:</span>
                          <span className="ml-2 text-muted-foreground font-mono">{log.record_id.slice(-8)}</span>
                        </div>
                      )}
                    </div>
                    
                    {(log.new_values || log.old_values) && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <div className="text-xs font-medium mb-2">تفاصيل التغيير:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {log.old_values && (
                            <div>
                              <div className="font-medium text-destructive mb-1">القيم السابقة:</div>
                              <pre className="text-muted-foreground whitespace-pre-wrap">
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_values && (
                            <div>
                              <div className="font-medium text-green-600 mb-1">القيم الجديدة:</div>
                              <pre className="text-muted-foreground whitespace-pre-wrap">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};