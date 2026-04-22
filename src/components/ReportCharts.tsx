import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Driver, Car } from '@/lib/mockData';

interface ReportChartsProps {
  data: (Driver | Car)[];
  type: 'drivers' | 'cars' | 'performance' | 'archive';
  drivers?: Driver[];
}

export const ReportCharts = ({ data, type, drivers = [] }: ReportChartsProps) => {
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--status-ok))', 'hsl(var(--status-warn))', 'hsl(var(--status-bad))', 'hsl(var(--accent))'];

  // Helper functions for data validation and safety
  const safeValue = (value: any, defaultValue: string = "غير محدد"): string => {
    return value && value !== null && value !== undefined ? String(value) : defaultValue;
  };

  const isValidDate = (date: any): boolean => {
    if (!date) return false;
    const d = date instanceof Date ? date : new Date(date);
    return !isNaN(d.getTime());
  };

  const safeParseDate = (date: any): Date | null => {
    try {
      if (!date) return null;
      const parsed = date instanceof Date ? date : new Date(date);
      return isValidDate(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const NoDataMessage = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      <div className="text-center">
        <p className="text-lg mb-2">📊</p>
        <p>{message}</p>
      </div>
    </div>
  );

  const renderDriversCharts = () => {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        return <NoDataMessage message="لا توجد بيانات مناديب للعرض" />;
      }

      const driversData = data as Driver[];
      
      // Status distribution with null protection
      const statusData = [
        { name: 'نشط', value: driversData.filter(d => d && d.status === 'نشط').length },
        { name: 'مجمد', value: driversData.filter(d => d && d.status === 'مجمد').length },
        { name: 'متوقف', value: driversData.filter(d => d && d.status === 'متوقف').length },
      ].filter(item => item.value > 0);

      // App distribution with safe values
      const appCounts = driversData.reduce((acc: Record<string, number>, driver) => {
        if (driver && driver.app) {
          const appName = safeValue(driver.app, "تطبيق غير محدد");
          acc[appName] = (acc[appName] || 0) + 1;
        }
        return acc;
      }, {});
      const appData = Object.entries(appCounts).map(([name, value]) => ({ name, value }));

      // Manager distribution with safe values
      const managerCounts = driversData.reduce((acc: Record<string, number>, driver) => {
        if (driver) {
          const managerName = safeValue(driver.manager, "مشرف غير محدد");
          acc[managerName] = (acc[managerName] || 0) + 1;
        }
        return acc;
      }, {});
      const managerData = Object.entries(managerCounts).map(([name, value]) => ({ name, value }));

      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-4">توزيع حالات المناديب</h4>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <NoDataMessage message="لا توجد بيانات حالات للعرض" />
            )}
          </div>

          <div className="glass rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-4">توزيع التطبيقات</h4>
            {appData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={appData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoDataMessage message="لا توجد بيانات تطبيقات للعرض" />
            )}
          </div>

          <div className="glass rounded-lg p-4 lg:col-span-2">
            <h4 className="text-lg font-semibold mb-4">توزيع المشرفين</h4>
            {managerData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={managerData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--status-ok))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoDataMessage message="لا توجد بيانات مشرفين للعرض" />
            )}
          </div>
        </div>
      );
    } catch (error) {
      console.error("خطأ في عرض مخططات المناديب:", error);
      return (
        <div className="glass rounded-lg p-4">
          <div className="text-center text-red-500">
            <p>حدث خطأ في تحميل المخططات</p>
            <p className="text-sm mt-2">يرجى إعادة تحميل الصفحة</p>
          </div>
        </div>
      );
    }
  };

  const renderCarsCharts = () => {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        return <NoDataMessage message="لا توجد بيانات سيارات للعرض" />;
      }

      const carsData = data as Car[];
      
      // Status distribution with null protection
      const statusData = [
        { name: 'مفوضة', value: carsData.filter(c => c && c.status === 'مفوضة').length },
        { name: 'مسلمة', value: carsData.filter(c => c && c.status === 'مسلمة').length },
        { name: 'خارج الخدمة', value: carsData.filter(c => c && c.status === 'خارج الخدمة').length },
      ].filter(item => item.value > 0);

      // Type distribution with safe values
      const typeCounts = carsData.reduce((acc: Record<string, number>, car) => {
        if (car && car.type) {
          const carType = safeValue(car.type, "نوع غير محدد");
          acc[carType] = (acc[carType] || 0) + 1;
        }
        return acc;
      }, {});
      const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-4">توزيع حالات السيارات</h4>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <NoDataMessage message="لا توجد بيانات حالات للعرض" />
            )}
          </div>

          <div className="glass rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-4">توزيع أنواع السيارات</h4>
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--status-warn))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoDataMessage message="لا توجد بيانات أنواع للعرض" />
            )}
          </div>
        </div>
      );
    } catch (error) {
      console.error("خطأ في عرض مخططات السيارات:", error);
      return (
        <div className="glass rounded-lg p-4">
          <div className="text-center text-red-500">
            <p>حدث خطأ في تحميل المخططات</p>
            <p className="text-sm mt-2">يرجى إعادة تحميل الصفحة</p>
          </div>
        </div>
      );
    }
  };

  const renderArchiveCharts = () => {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        return <NoDataMessage message="لا توجد بيانات أرشيف للعرض" />;
      }

      const archivedDrivers = data as Driver[];
      
      // End reason distribution with safe values
      const reasonCounts = archivedDrivers.reduce((acc: Record<string, number>, driver) => {
        if (driver && driver.endReason) {
          const reason = safeValue(driver.endReason, "سبب غير محدد");
          acc[reason] = (acc[reason] || 0) + 1;
        }
        return acc;
      }, {});
      const reasonData = Object.entries(reasonCounts).map(([name, value]) => ({ name, value }));

      // Monthly archiving trend with safe date handling
      const monthlyData = [];
      for (let i = 11; i >= 0; i--) {
        try {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStr = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
          
          const count = archivedDrivers.filter(d => {
            if (!d || !d.endDate) return false;
            const endDate = safeParseDate(d.endDate);
            if (!endDate) return false;
            
            return endDate.getMonth() === date.getMonth() && 
                   endDate.getFullYear() === date.getFullYear();
          }).length;
          
          monthlyData.push({ month: monthStr, count });
        } catch (error) {
          console.warn(`خطأ في معالجة الشهر ${i}:`, error);
          monthlyData.push({ month: "شهر غير صحيح", count: 0 });
        }
      }

      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-4">أسباب انتهاء العمل</h4>
            {reasonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reasonData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reasonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <NoDataMessage message="لا توجد بيانات أسباب للعرض" />
            )}
          </div>

          <div className="glass rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-4">اتجاه الأرشفة الشهري</h4>
            {monthlyData.some(m => m.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--status-bad))" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <NoDataMessage message="لا توجد بيانات اتجاه شهري للعرض" />
            )}
          </div>
        </div>
      );
    } catch (error) {
      console.error("خطأ في عرض مخططات الأرشيف:", error);
      return (
        <div className="glass rounded-lg p-4">
          <div className="text-center text-red-500">
            <p>حدث خطأ في تحميل المخططات</p>
            <p className="text-sm mt-2">يرجى إعادة تحميل الصفحة</p>
          </div>
        </div>
      );
    }
  };

  const renderPerformanceCharts = () => {
    try {
      if (!drivers || !Array.isArray(drivers) || drivers.length === 0) {
        return <NoDataMessage message="لا توجد بيانات أداء للعرض" />;
      }

      // Performance data with safe date handling
      const performanceData = [];
      for (let i = 6; i >= 0; i--) {
        try {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStr = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short' });
          
          const validDrivers = drivers.filter(d => d && isValidDate(d.createdAt));
          
          const totalDrivers = validDrivers.filter(d => {
            const createdAt = safeParseDate(d.createdAt);
            return createdAt && createdAt <= date && !d.archived;
          }).length;
          
          const activeDrivers = validDrivers.filter(d => {
            const createdAt = safeParseDate(d.createdAt);
            const endDate = d.endDate ? safeParseDate(d.endDate) : null;
            
            return createdAt && createdAt <= date && 
              d.status === 'نشط' && 
              !d.archived &&
              (!endDate || endDate > date);
          }).length;
          
          const efficiency = totalDrivers > 0 ? Math.round((activeDrivers / totalDrivers) * 100) : 0;
          
          performanceData.push({ 
            month: monthStr, 
            total: totalDrivers, 
            active: activeDrivers,
            efficiency: efficiency
          });
        } catch (error) {
          console.warn(`خطأ في معالجة بيانات الأداء للشهر ${i}:`, error);
          performanceData.push({ 
            month: "شهر غير صحيح", 
            total: 0, 
            active: 0,
            efficiency: 0
          });
        }
      }

      const hasValidData = performanceData.some(d => d.total > 0 || d.active > 0);

      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-4">أداء المناديب عبر الوقت</h4>
            {hasValidData ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    name="إجمالي"
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="active" 
                    stroke="hsl(var(--status-ok))" 
                    strokeWidth={2} 
                    name="نشط"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <NoDataMessage message="لا توجد بيانات أداء كافية للعرض" />
            )}
          </div>

          <div className="glass rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-4">معدل الكفاءة %</h4>
            {hasValidData ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, "كفاءة"]} />
                  <Bar dataKey="efficiency" fill="hsl(var(--status-ok))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoDataMessage message="لا توجد بيانات كفاءة للعرض" />
            )}
          </div>
        </div>
      );
    } catch (error) {
      console.error("خطأ في عرض مخططات الأداء:", error);
      return (
        <div className="glass rounded-lg p-4">
          <div className="text-center text-red-500">
            <p>حدث خطأ في تحميل المخططات</p>
            <p className="text-sm mt-2">يرجى إعادة تحميل الصفحة</p>
          </div>
        </div>
      );
    }
  };

  // Main component protection
  try {
    if (!data && type !== 'performance') {
      return <NoDataMessage message="لا توجد بيانات للعرض" />;
    }

    switch (type) {
      case 'drivers':
        return renderDriversCharts();
      case 'cars':
        return renderCarsCharts();
      case 'archive':
        return renderArchiveCharts();
      case 'performance':
        return renderPerformanceCharts();
      default:
        return (
          <div className="glass rounded-lg p-4">
            <div className="text-center text-muted-foreground">
              <p>نوع التقرير غير مدعوم</p>
              <p className="text-sm mt-2">الأنواع المدعومة: drivers, cars, archive, performance</p>
            </div>
          </div>
        );
    }
  } catch (error) {
    console.error("خطأ في كومبونت ReportCharts:", error);
    return (
      <div className="glass rounded-lg p-4">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold mb-2">⚠️ خطأ في النظام</p>
          <p>حدث خطأ غير متوقع في تحميل المخططات</p>
          <p className="text-sm mt-2">يرجى إعادة تحميل الصفحة أو الاتصال بالدعم الفني</p>
        </div>
      </div>
    );
  }
};