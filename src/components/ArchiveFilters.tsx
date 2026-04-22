import { useState } from 'react';
import { Calendar, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Driver } from '@/lib/mockData';

interface ArchiveFiltersProps {
  onFilterChange: (filters: { startDate?: string; endDate?: string; reason?: string }) => void;
  onExport: () => void;
  data: Driver[];
}

export const ArchiveFilters = ({ onFilterChange, onExport, data }: ArchiveFiltersProps) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleFilterApply = () => {
    onFilterChange({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      reason: reason || undefined
    });
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setReason('');
    onFilterChange({});
  };

  return (
    <div className="glass rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">فلترة حسب تاريخ الانتهاء:</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">من:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">إلى:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-auto"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">سبب الانتهاء:</span>
            <Input
              placeholder="استقالة، فصل، انتهاء هوية..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 mr-auto">
          <Button onClick={handleFilterApply} variant="secondary" size="sm">
            <Filter className="w-4 h-4 ml-2" />
            تطبيق
          </Button>
          <Button onClick={handleClearFilters} variant="outline" size="sm">
            مسح
          </Button>
          <Button onClick={onExport} variant="secondary" size="sm">
            <Download className="w-4 h-4 ml-2" />
            تصدير Excel
          </Button>
        </div>
      </div>
    </div>
  );
};