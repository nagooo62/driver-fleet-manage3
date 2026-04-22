import { useState } from 'react';
import { Calendar, Filter, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReportFiltersProps {
  onFilterChange: (filters: {
    startDate?: string;
    endDate?: string;
    category?: string;
    search?: string;
  }) => void;
  onExport: (format: 'excel' | 'pdf' | 'csv') => void;
  categories?: string[];
  showDateRange?: boolean;
  showSearch?: boolean;
  showExport?: boolean;
}

export const ReportFilters = ({ 
  onFilterChange, 
  onExport, 
  categories = [],
  showDateRange = true,
  showSearch = true,
  showExport = true
}: ReportFiltersProps) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [category, setCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const handleFilterChange = () => {
    onFilterChange({
      startDate: startDate?.toISOString().split('T')[0],
      endDate: endDate?.toISOString().split('T')[0],
      category: category || undefined,
      search: search || undefined,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({
      startDate: startDate?.toISOString().split('T')[0],
      endDate: endDate?.toISOString().split('T')[0],
      category: category || undefined,
      search: value || undefined,
    });
  };

  return (
    <div className="glass rounded-lg p-4 mb-6 space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Filter className="w-5 h-5" />
        <span>فلاتر التقرير</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Filter */}
        {showSearch && (
          <div className="space-y-2">
            <label className="text-sm font-medium">البحث</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث في التقرير..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">الفئة</label>
            <Select value={category || 'all'} onValueChange={(value) => {
              const filterValue = value === 'all' ? '' : value;
              setCategory(filterValue);
              setTimeout(handleFilterChange, 100);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفئات</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Start Date */}
        {showDateRange && (
          <div className="space-y-2">
            <label className="text-sm font-medium">من تاريخ</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "اختر التاريخ"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    setTimeout(handleFilterChange, 100);
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* End Date */}
        {showDateRange && (
          <div className="space-y-2">
            <label className="text-sm font-medium">إلى تاريخ</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "اختر التاريخ"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date);
                    setTimeout(handleFilterChange, 100);
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Export Buttons */}
      {showExport && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onExport('excel')}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            تصدير Excel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onExport('pdf')}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            تصدير PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onExport('csv')}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            تصدير CSV
          </Button>
        </div>
      )}
    </div>
  );
};