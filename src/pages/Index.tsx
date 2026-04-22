import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ApplicationsSection } from "@/components/ApplicationsSection";
import { DataTable } from "@/components/DataTable";
import { DetailModal } from "@/components/DetailModal";
import { DriverForm } from "@/components/DriverForm";
import { CarForm } from "@/components/CarForm";
import { StatsCard } from "@/components/StatsCard";
import { Charts } from "@/components/Charts";
import { PageReport } from "@/components/PageReport";
import { ArchiveStats } from "@/components/ArchiveStats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockInternalAds } from "@/lib/mockData";
import { formatDateArabic } from "@/lib/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Download, X, Menu, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import ToyotaReports from "@/components/ToyotaReports";

export default function Index() {
  const [currentView, setCurrentView] = useState("drivers_all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'driver' | 'car'>('driver');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDriverFormOpen, setIsDriverFormOpen] = useState(false);
  const [isCarFormOpen, setIsCarFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [editingCar, setEditingCar] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [driversResult, carsResult] = await Promise.all([
        supabase.from("drivers").select("*"),
        supabase.from("cars").select("*, current_delegate:drivers!current_delegate_id(full_name)")
      ]);

      if (driversResult.error) throw driversResult.error;
      if (carsResult.error) throw carsResult.error;

      setDrivers(driversResult.data || []);
      setCars(carsResult.data || []);
    } catch (error: any) {
      toast.error("فشل في تحميل البيانات: " + error.message);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  // Filter and process data based on current view
  const filteredData = useMemo(() => {
    let data: any[] = [];
    
    if (currentView.startsWith("drivers_")) {
      data = drivers;
      
      if (currentView === "drivers_new") {
        data = data.filter(driver => driver.status === "new");
      } else if (currentView === "drivers_accepted") {
        data = data.filter(driver => driver.status === "accepted");
      } else if (currentView === "drivers_sponsored") {
        data = data.filter(driver => driver.status === "sponsored");
      } else if (currentView === "drivers_archived") {
        data = data.filter(driver => driver.status === "archived");
      }
    } else if (currentView.startsWith("cars_")) {
      data = cars;
      
      if (currentView === "cars_delegated") {
        data = data.filter(car => car.status === "delegated");
      } else if (currentView === "cars_handed") {
        data = data.filter(car => car.status === "handed");
      } else if (currentView === "cars_out_of_service") {
        data = data.filter(car => car.status === "out_of_service");
      }
    }

    // Apply search filter
    if (searchQuery) {
      data = data.filter(item => {
        if (currentView.startsWith("drivers_")) {
          return item.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 item.iqama?.includes(searchQuery) ||
                 item.manager?.toLowerCase().includes(searchQuery.toLowerCase());
        } else {
          return item.plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 item.type?.toLowerCase().includes(searchQuery.toLowerCase());
        }
      });
    }

    return data;
  }, [currentView, searchQuery, drivers, cars]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => d.status === "accepted" || d.status === "sponsored").length;
    const totalCars = cars.length;
    const activeDelegations = cars.filter(c => c.status === "delegated").length;
    
    // Count documents expiring in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringDocuments = drivers.reduce((count, driver) => {
      const dates = [
        driver.license_expiry,
        driver.iqama_expiry,
        driver.medical_expiry
      ].filter(Boolean); // Remove null/undefined values

      dates.forEach(dateStr => {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime()) && date <= thirtyDaysFromNow) {
          count++;
        }
      });

      return count;
    }, 0);

    return {
      totalDrivers,
      activeDrivers,
      totalCars,
      activeDelegations,
      expiringDocuments,
    };
  }, [drivers, cars]);

  // Show notification for expiring documents
  useEffect(() => {
    if (stats.expiringDocuments > 0) {
      toast.warning(`لديك ${stats.expiringDocuments} مستند على وشك الانتهاء خلال 30 يوم!`, {
        duration: 8000,
        action: {
          label: "عرض",
          onClick: () => setCurrentView('drivers_all'),
        },
      });
    }
  }, [stats.expiringDocuments]);

  const getViewTitle = (view: string) => {
    const titles: Record<string, string> = {
      drivers_all: 'إجمالي المناديب',
      drivers_new: 'المتقدمين الجدد',
      drivers_accepted: 'تم قبولهم',
      drivers_sponsored: 'على الكفالة',
      drivers_archived: 'الأرشيف',
      cars_all: 'كل السيارات',
      cars_delegated: 'السيارات المفوضة',
      cars_handed: 'السيارات المسلمة',
      cars_out_of_service: 'السيارات خارج الخدمة',
      ads_all: 'الإعلانات الداخلية',
    };
    return titles[view] || '—';
  };

  const handleRowClick = (item: any) => {
    // Close any open modals first
    closeAllModals();
    
    setSelectedItem(item);
    setModalType(currentView.startsWith("drivers_") ? "driver" : "car");
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    // Close any open modals first
    closeAllModals();
    
    if (currentView.startsWith("drivers_")) {
      setEditingDriver(null);
      setIsDriverFormOpen(true);
    } else if (currentView.startsWith("cars_")) {
      setEditingCar(null);
      setIsCarFormOpen(true);
    }
  };

  const closeAllModals = () => {
    setIsModalOpen(false);
    setIsDriverFormOpen(false);
    setIsCarFormOpen(false);
  };

  const handleEdit = (item: any) => {
    // Close any open modals first
    closeAllModals();
    
    if (currentView.startsWith("drivers_")) {
      setEditingDriver(item);
      setIsDriverFormOpen(true);
    } else {
      setEditingCar(item);
      setIsCarFormOpen(true);
    }
  };

  const handleExport = () => {
    if (currentView === 'drivers_archived') {
      handleArchiveExport();
    } else {
      const dataStr = JSON.stringify(filteredData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `export-${currentView}-${Date.now()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const handleArchiveExport = () => {
    const archivedDrivers = filteredData;
    const csvContent = "data:text/csv;charset=utf-8," + 
      "الاسم الكامل,رقم الإقامة,المدير,تاريخ النهاية,سبب الإنهاء\n" +
      archivedDrivers.map(d => 
        `"${d.full_name}","${d.iqama}","${d.manager || ''}","${d.end_date || ''}","${d.archived_reason || ''}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `archived_drivers_${Date.now()}.csv`);
    link.click();
  };

  const isDriverView = currentView.startsWith('drivers');
  const isCarView = currentView.startsWith('cars');
  const isAdsView = currentView.startsWith('ads');

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <Header onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex flex-1">
        <Sidebar 
          currentView={currentView}
          onViewChange={setCurrentView}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          closeAllModals={closeAllModals}
        />
        
        <main className="flex-1 flex flex-col gap-6 p-6 lg:pr-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="w-4 h-4 ml-2" />
            القائمة
          </Button>
          
          <div className="flex-1 relative max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث فوري... الاسم / رقم الإقامة / رقم اللوحة"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 glass"
            />
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <div className="glass px-3 py-2 rounded-lg font-cairo">
              اليوم: {formatDateArabic(new Date())}
            </div>
            <div className="glass px-3 py-2 rounded-lg font-cairo text-xs">
              آخر تحديث: {lastUpdated.toLocaleTimeString('ar-SA')}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddNew}
              className="glass-button-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              إضافة جديد
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {currentView === 'drivers_archived' ? (
          <ArchiveStats archivedDrivers={filteredData} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard 
              title="عدد المناديب"
              value={stats.totalDrivers}
              subtitle={`نشط: ${stats.activeDrivers}`}
            />
            <StatsCard 
              title="عدد السيارات"
              value={stats.totalCars}
              subtitle={`مفوضة: ${cars.filter(c => c.status === 'delegated').length}`}
            />
            <StatsCard 
              title="التفويضات النشطة"
              value={stats.activeDelegations}
              subtitle="—"
            />
            <StatsCard 
              title="وثائق على وشك الانتهاء (≤ 30 يوم)"
              value={stats.expiringDocuments}
              subtitle="إقامة / رخصة / طبي"
            />
          </div>
        )}

        {/* Charts - Only show on main dashboard */}
        {(currentView === 'drivers_all' || currentView === 'cars_all') && !isAdsView && (
          <Charts drivers={drivers.filter(d => d.status !== 'archived')} cars={cars} />
        )}

        {/* Page Report - Show on sub-pages */}
        {currentView !== 'drivers_all' && currentView !== 'cars_all' && !isAdsView && (
          <PageReport 
            currentView={currentView}
            data={filteredData}
            drivers={drivers}
          />
        )}

        {/* Applications Section - NEW FEATURE */}
        {currentView.startsWith('applications_') ? (
          <ApplicationsSection 
            selectedApp={selectedApp} 
            onAppChange={setSelectedApp}
          />
        ) : currentView === 'toyota_reports' ? (
          <ToyotaReports />
        ) : currentView.startsWith('reports_') ? (
          <div className="glass rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">التقارير</h3>
              <Button variant="secondary">تصدير التقرير</Button>
            </div>
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>قسم التقارير قيد التطوير</p>
            </div>
          </div>
        ) : isAdsView ? (
          <div className="glass rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">الإعلانات الداخلية</h3>
              <Button variant="secondary">إضافة إعلان</Button>
            </div>
            <div className="space-y-3">
              {mockInternalAds.map((ad) => (
                <div key={ad.id} className="glass rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{ad.title}</h4>
                    <span className="text-sm text-muted-foreground">{ad.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{ad.body}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass rounded-lg p-6">
            {/* Archive Filters - Show only for archive page */}
            {currentView === 'drivers_archived' && (
              <ArchiveStats archivedDrivers={filteredData} />
            )}
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-xl font-semibold">{getViewTitle(currentView)}</h3>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleExport}>
                  <Download className="w-4 h-4 ml-2" />
                  {currentView === 'drivers_archived' ? 'تصدير Excel' : 'تصدير JSON'}
                </Button>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="w-4 h-4 ml-2" />
                    مسح البحث
                  </Button>
                )}
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <DataTable
                data={filteredData}
                type={currentView.startsWith("drivers_") ? "drivers" : "cars"}
                onRowClick={handleRowClick}
                drivers={drivers}
              />
            )}
          </div>
        )}
        </main>
      </div>

      <DetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={selectedItem}
          type={modalType}
          drivers={drivers}
          onEdit={handleEdit}
        />

        <DriverForm
          isOpen={isDriverFormOpen}
          onClose={() => {
            setIsDriverFormOpen(false);
            setEditingDriver(null); // Reset editing driver
          }}
          driver={editingDriver}
          onSave={fetchData}
        />

        <CarForm
          isOpen={isCarFormOpen}
          onClose={() => setIsCarFormOpen(false)}
          car={editingCar}
          onSave={fetchData}
        />
    </div>
  );
}