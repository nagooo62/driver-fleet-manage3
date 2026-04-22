import { useState, useEffect } from 'react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subWeeks, subMonths, subQuarters, subYears } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReportPeriodSelectorProps {
  onPeriodChange: (period: {
    type: string;
    startDate: Date;
    endDate: Date;
    label: string;
  }) => void;
}

export const ReportPeriodSelector = ({ onPeriodChange }: ReportPeriodSelectorProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [showCustomDate, setShowCustomDate] = useState(false);

  const periodOptions = [
    { value: 'today', label: 'اليوم', icon: Calendar },
    { value: 'yesterday', label: 'أمس', icon: Calendar },
    { value: 'thisWeek', label: 'هذا الأسبوع', icon: Calendar },
    { value: 'lastWeek', label: 'الأسبوع الماضي', icon: Calendar },
    { value: 'thisMonth', label: 'هذا الشهر', icon: Calendar },
    { value: 'lastMonth', label: 'الشهر الماضي', icon: Calendar },
    { value: 'thisQuarter', label: 'هذا الربع', icon: Calendar },
    { value: 'lastQuarter', label: 'الربع الماضي', icon: Calendar },
    { value: 'thisYear', label: 'هذا العام', icon: Calendar },
    { value: 'lastYear', label: 'العام الماضي', icon: Calendar },
    { value: 'custom', label: 'فترة مخصصة', icon: Clock },
  ];

  const getPeriodDates = (periodType: string) => {
    const today = new Date();
    
    switch (periodType) {
      case 'today':
        return {
          startDate: startOfDay(today),
          endDate: endOfDay(today),
          label: 'اليوم'
        };
      case 'yesterday':
        const yesterday = subDays(today, 1);
        return {
          startDate: startOfDay(yesterday),
          endDate: endOfDay(yesterday),
          label: 'أمس'
        };
      case 'thisWeek':
        return {
          startDate: startOfWeek(today, { weekStartsOn: 6 }), // Saturday
          endDate: endOfWeek(today, { weekStartsOn: 6 }),
          label: 'هذا الأسبوع'
        };
      case 'lastWeek':
        const lastWeek = subWeeks(today, 1);
        return {
          startDate: startOfWeek(lastWeek, { weekStartsOn: 6 }),
          endDate: endOfWeek(lastWeek, { weekStartsOn: 6 }),
          label: 'الأسبوع الماضي'
        };
      case 'thisMonth':
        return {
          startDate: startOfMonth(today),
          endDate: endOfMonth(today),
          label: 'هذا الشهر'
        };
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        return {
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth),
          label: 'الشهر الماضي'
        };
      case 'thisQuarter':
        return {
          startDate: startOfQuarter(today),
          endDate: endOfQuarter(today),
          label: 'هذا الربع'
        };
      case 'lastQuarter':
        const lastQuarter = subQuarters(today, 1);
        return {
          startDate: startOfQuarter(lastQuarter),
          endDate: endOfQuarter(lastQuarter),
          label: 'الربع الماضي'
        };
      case 'thisYear':
        return {
          startDate: startOfYear(today),
          endDate: endOfYear(today),
          label: 'هذا العام'
        };
      case 'lastYear':
        const lastYear = subYears(today, 1);
        return {
          startDate: startOfYear(lastYear),
          endDate: endOfYear(lastYear),
          label: 'العام الماضي'
        };
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            startDate: startOfDay(customStartDate),
            endDate: endOfDay(customEndDate),
            label: `من ${format(customStartDate, 'dd/MM/yyyy')} إلى ${format(customEndDate, 'dd/MM/yyyy')}`
          };
        }
        return {
          startDate: startOfDay(today),
          endDate: endOfDay(today),
          label: 'فترة مخصصة'
        };
      default:
        return {
          startDate: startOfDay(today),
          endDate: endOfDay(today),
          label: 'اليوم'
        };
    }
  };

  useEffect(() => {
    const periodData = getPeriodDates(selectedPeriod);
    onPeriodChange({
      type: selectedPeriod,
      ...periodData
    });
  }, [selectedPeriod, customStartDate, customEndDate]);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setShowCustomDate(value === 'custom');
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      const periodData = getPeriodDates('custom');
      onPeriodChange({
        type: 'custom',
        ...periodData
      });
    }
  };

  return (
    <div className="glass rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Clock className="w-5 h-5" />
        <span>الفترة الزمنية للتقرير</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">نوع الفترة</label>
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الفترة الزمنية" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="w-4 h-4" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPeriod !== 'custom' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">معاينة الفترة</label>
            <div className="glass rounded-md p-3 text-sm">
              {getPeriodDates(selectedPeriod).label}
            </div>
          </div>
        )}
      </div>

      {showCustomDate && (
        <div className="border-t border-border pt-4 space-y-4">
          <h4 className="font-medium">تحديد الفترة المخصصة</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">من تاريخ</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customStartDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {customStartDate ? format(customStartDate, "dd/MM/yyyy") : "اختر التاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">إلى تاريخ</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customEndDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {customEndDate ? format(customEndDate, "dd/MM/yyyy") : "اختر التاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    disabled={(date) => customStartDate ? date < customStartDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {customStartDate && customEndDate && (
            <div className="flex items-center justify-between glass rounded-md p-3">
              <div className="flex items-center gap-2 text-sm">
                <span>الفترة المحددة:</span>
                <span className="font-medium">
                  {format(customStartDate, 'dd/MM/yyyy')} 
                  <ArrowRight className="inline mx-2 w-3 h-3" />
                  {format(customEndDate, 'dd/MM/yyyy')}
                </span>
              </div>
              <Button size="sm" onClick={handleCustomDateApply}>
                تطبيق
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};