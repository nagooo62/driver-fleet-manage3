import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Filter, Download, Calendar, Search, FileSpreadsheet } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { ExcelImportModal } from "@/components/ExcelImportModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDateArabic } from "@/lib/dateUtils";

interface Application {
  id: string;
  name: string;
  display_name: string;
  icon_url?: string;
  is_active: boolean;
}

interface DriverApplication {
  id: string;
  driver_id: string;
  application_id: string;
  employee_id?: string;
  start_date: string;
  end_date?: string;
  is_verified: boolean;
  orders_count: number;
  working_days: number;
  last_import_date?: string;
  driver?: {
    full_name: string;
    iqama: string;
  } | null;
  application?: {
    display_name: string;
  } | null;
}

interface ApplicationsSectionProps {
  selectedApp: string;
  onAppChange: (appId: string) => void;
}

export const ApplicationsSection = ({ selectedApp, onAppChange }: ApplicationsSectionProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [driverApplications, setDriverApplications] = useState<DriverApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (selectedApp) {
      fetchDriverApplications();
    }
  }, [selectedApp]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("is_active", true)
        .order("display_name");

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast.error("فشل في تحميل التطبيقات: " + error.message);
    }
  };

  const fetchDriverApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("driver_applications")
        .select(`
          *,
          driver:drivers(full_name, iqama),
          application:applications(display_name)
        `)
        .eq("application_id", selectedApp)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDriverApplications(data?.map(item => ({
        ...item,
        driver: item.driver ? {
          full_name: (item.driver as any).full_name || '',
          iqama: (item.driver as any).iqama || ''
        } : null,
        application: item.application ? {
          display_name: (item.application as any).display_name || ''
        } : null
      })) || []);
    } catch (error: any) {
      toast.error("فشل في تحميل بيانات المناديب: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = driverApplications.filter(item => {
    // Search filter
    if (searchQuery) {
      const matchesSearch = 
        item.driver?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.driver?.iqama?.includes(searchQuery) ||
        item.employee_id?.includes(searchQuery);
      if (!matchesSearch) return false;
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const itemDate = new Date(item.start_date);
      
      switch (dateFilter) {
        case "today":
          if (itemDate.toDateString() !== now.toDateString()) return false;
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (itemDate < weekAgo) return false;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (itemDate < monthAgo) return false;
          break;
      }
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "verified" && !item.is_verified) return false;
      if (statusFilter === "pending" && item.is_verified) return false;
    }

    return true;
  });

  const selectedApplication = applications.find(app => app.id === selectedApp);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "اسم المندوب,رقم الإقامة,الرقم الوظيفي,عدد الطلبات,أيام العمل,الحالة,تاريخ البداية,آخر استيراد\n" +
      filteredData.map(item => 
        `"${item.driver?.full_name}","${item.driver?.iqama}","${item.employee_id || ''}","${item.orders_count}","${item.working_days}","${item.is_verified ? 'مطابق' : 'يحتاج مراجعة'}","${formatDateArabic(new Date(item.start_date))}","${item.last_import_date ? formatDateArabic(new Date(item.last_import_date)) : ''}"`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedApplication?.display_name}_data_${Date.now()}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Application Selection */}
      <div className="glass rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">التطبيقات</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {applications.map((app) => (
            <Button
              key={app.id}
              variant={selectedApp === app.id ? "default" : "outline"}
              onClick={() => onAppChange(app.id)}
              className="h-16 flex flex-col gap-1 glass-button-hover"
            >
              <div className="text-lg">📱</div>
              <span className="text-xs">{app.display_name}</span>
            </Button>
          ))}
        </div>
      </div>

      {selectedApp && (
        <div className="glass rounded-lg p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold">{selectedApplication?.display_name}</h3>
              <p className="text-sm text-muted-foreground">
                إجمالي المناديب: {filteredData.length}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setIsImportModalOpen(true)}
                className="glass-button-hover"
              >
                <Upload className="w-4 h-4 ml-2" />
                استيراد شيت Excel
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={filteredData.length === 0}
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير Excel
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو رقم الإقامة أو الرقم الوظيفي..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 glass"
              />
            </div>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48 glass">
                <Calendar className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفترات</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">آخر 7 أيام</SelectItem>
                <SelectItem value="month">آخر 30 يوم</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 glass">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="verified">مطابق ✅</SelectItem>
                <SelectItem value="pending">يحتاج مراجعة 🚩</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-right p-3 font-semibold">الاسم</th>
                    <th className="text-right p-3 font-semibold">رقم الإقامة</th>
                    <th className="text-right p-3 font-semibold">الرقم الوظيفي</th>
                    <th className="text-right p-3 font-semibold">عدد الطلبات</th>
                    <th className="text-right p-3 font-semibold">أيام العمل</th>
                    <th className="text-right p-3 font-semibold">الحالة</th>
                    <th className="text-right p-3 font-semibold">آخر تحديث</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="border-b border-border/20 hover:bg-accent/30">
                      <td className="p-3 font-medium">{item.driver?.full_name}</td>
                      <td className="p-3 text-sm">{item.driver?.iqama}</td>
                      <td className="p-3 text-sm">{item.employee_id || "—"}</td>
                      <td className="p-3 text-sm">{item.orders_count}</td>
                      <td className="p-3 text-sm">{item.working_days}</td>
                      <td className="p-3">
                        <Badge 
                          variant={item.is_verified ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {item.is_verified ? "مطابق ✅" : "يحتاج مراجعة 🚩"}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {item.last_import_date 
                          ? formatDateArabic(new Date(item.last_import_date))
                          : "—"
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات لعرضها
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        applicationId={selectedApp}
        onImportComplete={fetchDriverApplications}
      />
    </div>
  );
};