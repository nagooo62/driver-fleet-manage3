import { StatsCard } from './StatsCard';
import { Driver } from '@/lib/mockData';

interface ArchiveStatsProps {
  archivedDrivers: Driver[];
}

export const ArchiveStats = ({ archivedDrivers }: ArchiveStatsProps) => {
  // حساب إجمالي المؤرشفين
  const totalArchived = archivedDrivers.length;

  // حساب متوسط مدة العمل
  const validDrivers = archivedDrivers.filter(driver => driver.startDate && driver.endDate);
  const avgDuration = validDrivers.length > 0 
    ? validDrivers.reduce((acc, driver) => {
        const duration = Math.ceil((driver.endDate!.getTime() - driver.startDate!.getTime()) / (1000 * 60 * 60 * 24));
        return acc + duration;
      }, 0) / validDrivers.length
    : 0;

  // التطبيق الأكثر ظهوراً
  const appCounts = archivedDrivers.reduce((acc: Record<string, number>, driver) => {
    if (driver.app) {
      acc[driver.app] = (acc[driver.app] || 0) + 1;
    }
    return acc;
  }, {});
  const mostFrequentApp = Object.entries(appCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || '—';

  // المشرف الأكثر تسجيلاً للخروج
  const supervisorCounts = archivedDrivers.reduce((acc: Record<string, number>, driver) => {
    acc[driver.manager] = (acc[driver.manager] || 0) + 1;
    return acc;
  }, {});
  const topExitSupervisor = Object.entries(supervisorCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || '—';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatsCard 
        title="إجمالي المؤرشفين"
        value={totalArchived}
      />
      <StatsCard 
        title="متوسط مدة العمل"
        value={Math.round(avgDuration) || 0}
        subtitle="يوم"
      />
      <StatsCard 
        title="التطبيق الأكثر ظهوراً"
        value={mostFrequentApp}
      />
      <StatsCard 
        title="المشرف الأكثر تسجيلاً"
        value={topExitSupervisor}
      />
    </div>
  );
};