import { useState } from 'react';
import { Filter, Search, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { mockDrivers } from '@/lib/mockData';

interface AdvancedReportFiltersProps {
  reportType: string;
  onFilterChange: (filters: {
    search?: string;
    category?: string;
    manager?: string;
    app?: string;
    status?: string;
    carType?: string;
    endReason?: string;
  }) => void;
}

export const AdvancedReportFilters = ({ reportType, onFilterChange }: AdvancedReportFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<{
    search?: string;
    category?: string;
    manager?: string;
    app?: string;
    status?: string;
    carType?: string;
    endReason?: string;
  }>({});

  // Get unique values for filter options
  const managers = Array.from(new Set(mockDrivers.map(d => d.manager)));
  const apps = Array.from(new Set(mockDrivers.filter(d => d.app).map(d => d.app as string)));

  const updateFilter = (key: string, value: string) => {
    // Convert "all" to undefined to clear the filter
    const filterValue = value === 'all' ? undefined : value;
    const newFilters = { ...filters, [key]: filterValue };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key as keyof typeof newFilters];
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const getStatusOptions = () => {
    switch (reportType) {
      case 'reports_drivers':
        return ['نشط', 'مجمد', 'متوقف'];
      case 'reports_cars':
        return ['مفوضة', 'مسلمة', 'خارج الخدمة'];
      default:
        return [];
    }
  };

  const getCarTypeOptions = () => {
    return ['تويوتا كامري', 'نيسان التيما', 'هيونداي إلنترا', 'كيا أوبتيما'];
  };

  const getEndReasonOptions = () => {
    return ['استقالة', 'فصل', 'انتهاء عقد', 'نقل'];
  };

  const activeFiltersCount = Object.keys(filters).filter(key => filters[key as keyof typeof filters]).length;

  return (
    <Card className="glass">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                <CardTitle className="text-lg">فلاتر متقدمة</CardTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              <Filter className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Search Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">البحث الشامل</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث في جميع الحقول..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pr-10"
                />
                {filters.search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => clearFilter('search')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              {getStatusOptions().length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">الحالة</label>
                  <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الحالات</SelectItem>
                      {getStatusOptions().map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Manager Filter - For Driver Reports */}
              {(reportType === 'reports_drivers' || reportType === 'reports_archive' || reportType === 'reports_performance') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">المشرف</label>
                  <Select value={filters.manager || 'all'} onValueChange={(value) => updateFilter('manager', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المشرف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل المشرفين</SelectItem>
                      {managers.filter(manager => manager && manager.trim() !== '').map((manager) => (
                        <SelectItem key={manager} value={manager}>{manager}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* App Filter - For Driver Reports */}
              {(reportType === 'reports_drivers' || reportType === 'reports_archive' || reportType === 'reports_performance') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">التطبيق</label>
                  <Select value={filters.app || 'all'} onValueChange={(value) => updateFilter('app', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التطبيق" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل التطبيقات</SelectItem>
                      {apps.filter(app => app && app.trim() !== '').map((app) => (
                        <SelectItem key={app} value={app}>{app}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Car Type Filter - For Car Reports */}
              {reportType === 'reports_cars' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">نوع السيارة</label>
                  <Select value={filters.carType || 'all'} onValueChange={(value) => updateFilter('carType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع السيارة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأنواع</SelectItem>
                      {getCarTypeOptions().map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* End Reason Filter - For Archive Reports */}
              {reportType === 'reports_archive' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">سبب الإنهاء</label>
                  <Select value={filters.endReason || 'all'} onValueChange={(value) => updateFilter('endReason', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر سبب الإنهاء" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأسباب</SelectItem>
                      {getEndReasonOptions().map((reason) => (
                        <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">الفلاتر النشطة</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs h-6"
                  >
                    مسح الكل
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value) return null;
                    
                    const getFilterLabel = (key: string) => {
                      switch (key) {
                        case 'search': return 'البحث';
                        case 'status': return 'الحالة';
                        case 'manager': return 'المشرف';
                        case 'app': return 'التطبيق';
                        case 'carType': return 'نوع السيارة';
                        case 'endReason': return 'سبب الإنهاء';
                        default: return key;
                      }
                    };

                    return (
                      <Badge
                        key={key}
                        variant="secondary"
                        className="text-xs gap-1"
                      >
                        {getFilterLabel(key)}: {value}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-3 w-3 p-0"
                          onClick={() => clearFilter(key)}
                        >
                          <X className="w-2 h-2" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};