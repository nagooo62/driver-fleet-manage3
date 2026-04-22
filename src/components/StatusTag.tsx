import { cn } from '@/lib/utils';

interface StatusTagProps {
  status: string;
  type?: 'driver' | 'car' | 'date';
  daysLeft?: number;
}

export const StatusTag = ({ status, type = 'driver', daysLeft }: StatusTagProps) => {
  const getStatusClass = () => {
    if (type === 'date' && daysLeft !== undefined) {
      if (daysLeft <= 3) return 'bg-status-bad/20 text-red-200 border-status-bad/40';
      if (daysLeft <= 7) return 'bg-status-warn/20 text-yellow-200 border-status-warn/40';
      return 'bg-status-info/20 text-blue-200 border-status-info/40';
    }

    if (type === 'driver') {
      switch (status) {
        case 'نشط': return 'bg-status-ok/20 text-green-200 border-status-ok/40';
        case 'مجمد': return 'bg-status-warn/20 text-yellow-200 border-status-warn/40';
        case 'متوقف': return 'bg-status-bad/20 text-red-200 border-status-bad/40';
        default: return 'bg-status-info/20 text-blue-200 border-status-info/40';
      }
    }

    if (type === 'car') {
      switch (status) {
        case 'مفوضة': return 'bg-status-ok/20 text-green-200 border-status-ok/40';
        case 'مسلمة': return 'bg-status-info/20 text-blue-200 border-status-info/40';
        case 'خارج الخدمة': return 'bg-status-bad/20 text-red-200 border-status-bad/40';
        default: return 'bg-status-info/20 text-blue-200 border-status-info/40';
      }
    }

    return 'bg-status-info/20 text-blue-200 border-status-info/40';
  };

  return (
    <span className={cn(
      "inline-block px-2 py-1 rounded-full text-xs font-semibold border",
      getStatusClass()
    )}>
      {status}
      {type === 'date' && daysLeft !== undefined && ` • ${daysLeft}يوم`}
    </span>
  );
};