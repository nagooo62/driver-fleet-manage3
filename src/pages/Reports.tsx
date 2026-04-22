import { useState, useMemo, useEffect } from 'react';
import { ReportPeriodSelector } from '@/components/ReportPeriodSelector';
import { AdvancedReportFilters } from '@/components/AdvancedReportFilters';
import { ReportPreview } from '@/components/ReportPreview';
import { ReportCharts } from '@/components/ReportCharts';
import { DataTable } from '@/components/DataTable';
import { StatsCard } from '@/components/StatsCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Settings, Eye, BarChart3 } from 'lucide-react';
import { mockDrivers, mockCars, mockInternalAds, type Driver, type Car } from '@/lib/mockData';

interface ReportsProps {
  reportType: string;
}

export const Reports = ({ reportType }: ReportsProps) => {
  const [period, setPeriod] = useState<{
    type: string;
    startDate: Date;
    endDate: Date;
    label: string;
  }>({
    type: 'today',
    startDate: new Date(),
    endDate: new Date(),
    label: 'اليوم'
  });
  
  const [advancedFilters, setAdvancedFilters] = useState<{
    search?: string;
    category?: string;
    manager?: string;
    app?: string;
    status?: string;
    carType?: string;
    endReason?: string;
  }>({});

  const [showReportPreview, setShowReportPreview] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('setup');
  // Calculate statistics function - moved before useMemo
  const calculateStats = (data: (Driver | Car)[], type: string) => {
    switch (type) {
      case 'reports_drivers':
        const drivers = data as Driver[];
        return {
          total: drivers.length,
          active: drivers.filter(d => d.status === 'نشط').length,
          frozen: drivers.filter(d => d.status === 'مجمد').length,
          stopped: drivers.filter(d => d.status === 'متوقف').length,
        };
      case 'reports_cars':
        const cars = data as Car[];
        return {
          total: cars.length,
          delegated: cars.filter(c => c.status === 'مفوضة').length,
          handed: cars.filter(c => c.status === 'مسلمة').length,
          outOfService: cars.filter(c => c.status === 'خارج الخدمة').length,
        };
      case 'reports_archive':
        const archived = data as Driver[];
        const validArchivedDrivers = archived.filter(driver => driver.startDate && driver.endDate);
        const avgDuration = validArchivedDrivers.length > 0
          ? validArchivedDrivers.reduce((acc, driver) => {
              const duration = Math.ceil((driver.endDate!.getTime() - driver.startDate!.getTime()) / (1000 * 60 * 60 * 24));
              return acc + duration;
            }, 0) / validArchivedDrivers.length
          : 0;
        
        return {
          total: archived.length,
          avgDuration: Math.round(avgDuration),
          resigned: archived.filter(d => d.endReason === 'استقالة').length,
          terminated: archived.filter(d => d.endReason === 'فصل').length,
        };
      case 'reports_performance':
        const allDrivers = mockDrivers;
        const totalActive = allDrivers.filter(d => d.status === 'نشط' && !d.archived).length;
        const totalDrivers = allDrivers.filter(d => !d.archived).length;
        const efficiency = totalDrivers > 0 ? Math.round((totalActive / totalDrivers) * 100) : 0;
        
        return {
          totalDrivers,
          activeDrivers: totalActive,
          efficiency,
          totalCars: mockCars.length,
        };
      default:
        return { total: data.length };
    }
  };

  // Get filtered data based on report type, period, and filters

  // Get filtered data based on report type, period, and filters
  const { data, stats, title } = useMemo(() => {
    let baseData: (Driver | Car)[] = [];
    let reportTitle = '';

    switch (reportType) {
      case 'reports_drivers':
        baseData = mockDrivers.filter(d => !d.archived);
        reportTitle = 'تقرير المناديب';
        break;
      case 'reports_cars':
        baseData = mockCars;
        reportTitle = 'تقرير السيارات';
        break;
      case 'reports_ads':
        reportTitle = 'تقرير الإعلانات';
        break;
      case 'reports_archive':
        baseData = mockDrivers.filter(d => d.archived);
        reportTitle = 'تقرير الأرشيف';
        break;
      case 'reports_performance':
        baseData = mockDrivers;
        reportTitle = 'تقرير الأداء';
        break;
      default:
        baseData = [];
        reportTitle = 'تقرير غير محدد';
    }

    // Apply period filter
    let filteredData = baseData.filter(item => {
      const date = 'createdAt' in item ? item.createdAt : new Date();
      return date >= period.startDate && date <= period.endDate;
    });

    // Apply advanced filters
    if (advancedFilters.search) {
      const query = advancedFilters.search.toLowerCase();
      filteredData = filteredData.filter(item => {
        if ('fullName' in item) {
          const driver = item as Driver;
          return (
            driver.fullName.toLowerCase().includes(query) ||
            driver.iqama.includes(query) ||
            driver.id.toLowerCase().includes(query) ||
            driver.manager.toLowerCase().includes(query) ||
            (driver.app && driver.app.toLowerCase().includes(query))
          );
        } else {
          const car = item as Car;
          return (
            car.plate.toLowerCase().includes(query) ||
            car.type.toLowerCase().includes(query) ||
            car.status.toLowerCase().includes(query)
          );
        }
      });
    }

    if (advancedFilters.status) {
      filteredData = filteredData.filter(item => {
        if ('status' in item) {
          return item.status === advancedFilters.status;
        }
        return true;
      });
    }

    if (advancedFilters.manager) {
      filteredData = filteredData.filter(item => {
        if ('manager' in item) {
          const driver = item as Driver;
          return driver.manager === advancedFilters.manager;
        }
        return true;
      });
    }

    if (advancedFilters.app) {
      filteredData = filteredData.filter(item => {
        if ('app' in item) {
          const driver = item as Driver;
          return driver.app === advancedFilters.app;
        }
        return true;
      });
    }

    if (advancedFilters.carType) {
      filteredData = filteredData.filter(item => {
        if ('type' in item) {
          const car = item as Car;
          return car.type === advancedFilters.carType;
        }
        return true;
      });
    }

    if (advancedFilters.endReason) {
      filteredData = filteredData.filter(item => {
        if ('endReason' in item) {
          const driver = item as Driver;
          return driver.endReason === advancedFilters.endReason;
        }
        return true;
      });
    }

    // Calculate statistics
    const reportStats = calculateStats(filteredData, reportType);

    return {
      data: filteredData,
      stats: reportStats,
      title: reportTitle
    };
  }, [reportType, period, advancedFilters]);


  // Simulate report generation
  const handleGenerateReport = () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setActiveTab('report');
    
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleExport = (format: 'excel' | 'pdf' | 'csv') => {
    // Create export content based on format
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'csv':
        if (reportType === 'reports_drivers' || reportType === 'reports_archive') {
          const drivers = data as Driver[];
          content = "data:text/csv;charset=utf-8," + 
            "الاسم الكامل,رقم الهوية,رقم الموظف,الحالة,التطبيق,المشرف,تاريخ الإنشاء\n" +
            drivers.map(d => 
              `"${d.fullName}","${d.iqama}","${d.id}","${d.status}","${d.app || ''}","${d.manager}","${d.createdAt.toLocaleDateString('en-GB')}"`
            ).join("\n");
        } else if (reportType === 'reports_cars') {
          const cars = data as Car[];
          content = "data:text/csv;charset=utf-8," + 
            "رقم اللوحة,النوع,الحالة,المفوض إليه,تاريخ التفويض,تاريخ انتهاء التفويض\n" +
            cars.map(c => {
              const delegateDriver = c.delegateId ? mockDrivers.find(d => d.id === c.delegateId) : null;
              return `"${c.plate}","${c.type}","${c.status}","${delegateDriver?.fullName || ''}","${c.delegationStart || ''}","${c.delegationEnd || ''}"`;
            }).join("\n");
        }
        filename = `${reportType}_${Date.now()}.csv`;
        break;
      case 'excel':
        // For demo purposes, export as JSON with Excel extension
        content = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        filename = `${reportType}_${Date.now()}.xlsx`;
        break;
      case 'pdf':
        // For demo purposes, export as JSON with PDF extension
        content = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        filename = `${reportType}_${Date.now()}.pdf`;
        break;
    }

    const encodedUri = format === 'csv' ? encodeURI(content) : content;
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    link.click();
  };

  const renderStats = () => {
    switch (reportType) {
      case 'reports_drivers':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard title="إجمالي المناديب" value={stats.total} />
            <StatsCard title="النشطين" value={stats.active} />
            <StatsCard title="المجمدين" value={stats.frozen} />
            <StatsCard title="المتوقفين" value={stats.stopped} />
          </div>
        );
      case 'reports_cars':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard title="إجمالي السيارات" value={stats.total} />
            <StatsCard title="المفوضة" value={stats.delegated} />
            <StatsCard title="المسلمة" value={stats.handed} />
            <StatsCard title="خارج الخدمة" value={stats.outOfService} />
          </div>
        );
      case 'reports_archive':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard title="إجمالي المؤرشفين" value={stats.total} />
            <StatsCard title="متوسط مدة العمل" value={stats.avgDuration} subtitle="يوم" />
            <StatsCard title="الاستقالات" value={stats.resigned} />
            <StatsCard title="الفصل" value={stats.terminated} />
          </div>
        );
      case 'reports_performance':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard title="إجمالي المناديب" value={stats.totalDrivers} />
            <StatsCard title="المناديب النشطين" value={stats.activeDrivers} />
            <StatsCard title="معدل الكفاءة" value={stats.efficiency} subtitle="%" />
            <StatsCard title="إجمالي السيارات" value={stats.totalCars} />
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 gap-4 mb-6">
            <StatsCard title="إجمالي العناصر" value={stats.total} />
          </div>
        );
    }
  };

  const getChartType = () => {
    switch (reportType) {
      case 'reports_drivers':
        return 'drivers';
      case 'reports_cars':
        return 'cars';
      case 'reports_archive':
        return 'archive';
      case 'reports_performance':
        return 'performance';
      default:
        return 'drivers';
    }
  };

  if (reportType === 'reports_ads') {
    return (
      <div className="space-y-6">
        <div className="glass rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatsCard title="إجمالي الإعلانات" value={mockInternalAds.length} />
            <StatsCard title="الإعلانات النشطة" value={mockInternalAds.length} />
            <StatsCard title="متوسط المشاهدات" value="—" />
          </div>
          <div className="space-y-4">
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>نظام التقارير المتقدم</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              إعداد التقرير
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              معاينة التقرير
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              التقرير النهائي
            </TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            <ReportPeriodSelector onPeriodChange={setPeriod} />
            <AdvancedReportFilters 
              reportType={reportType}
              onFilterChange={setAdvancedFilters}
            />
            
            <div className="flex justify-end">
              <Button onClick={() => setActiveTab('preview')} size="lg">
                معاينة التقرير
              </Button>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <ReportPreview
              reportType={reportType}
              period={period}
              filters={advancedFilters}
              dataCount={data.length}
              onGenerate={handleGenerateReport}
              onExport={handleExport}
              isGenerating={isGenerating}
              progress={generationProgress}
            />
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="space-y-6">
            {renderStats()}

            <ReportCharts
              data={data}
              type={getChartType() as 'drivers' | 'cars' | 'performance' | 'archive'}
              drivers={mockDrivers}
            />

            {data.length > 0 && (
              <div className="glass rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">بيانات التقرير التفصيلية</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                      تصدير Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                      تصدير PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                      تصدير CSV
                    </Button>
                  </div>
                </div>
                <DataTable
                  data={data}
                  type={reportType.includes('drivers') || reportType.includes('archive') ? 'drivers' : 'cars'}
                  onRowClick={() => {}}
                  drivers={mockDrivers}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};