import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ page, totalPages, total, pageSize, onPageChange }: PaginationControlsProps) {
  return (
    <div className="surface-divider mt-6 flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        عرض {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} من أصل {total}
      </p>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronRight className="h-4 w-4" />
          السابق
        </Button>
        <div className="glass-pill text-xs">صفحة {page} من {Math.max(1, totalPages)}</div>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          التالي
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
