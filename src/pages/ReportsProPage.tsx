import { useState } from 'react';
import { ExternalLink, FileSpreadsheet, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * لوحة تحكم المناديب Pro — أداة تحليل التقارير المضمّنة.
 * ترفع ملفات الأداء/الأسماء/المحفظة (Excel أو CSV)، تدمجها بالآيدي،
 * وتعرض النتائج: الطلبات، الساعات، التارقت، البوديوم، وتصدير Excel.
 *
 * الصفحة تعطي اللوحة كامل المساحة — شريط أدوات نحيف فقط في الأعلى.
 */
export default function ReportsProPage() {
  const [loaded, setLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className={cn(fullscreen && 'fixed inset-0 z-50 bg-background p-3')}>
      {/* شريط أدوات نحيف */}
      <div className={cn(
        'mb-3 flex items-center justify-between gap-3 rounded-[18px] glass-panel px-4 py-2.5',
        fullscreen && 'mb-2',
      )}>
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          تقارير المناديب Pro
          <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
            — ارفع ملفات التطبيق واحصل على التحليل والتصدير
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreen(!fullscreen)}
            className="press-effect gap-1.5"
            aria-label={fullscreen ? 'الخروج من ملء الشاشة' : 'عرض ملء الشاشة'}
          >
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{fullscreen ? 'تصغير' : 'ملء الشاشة'}</span>
          </Button>
          <Button variant="outline" size="sm" asChild className="press-effect gap-1.5">
            <a href="/reports-pro.html" target="_blank" rel="noreferrer" aria-label="فتح في تبويب جديد">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">تبويب جديد</span>
            </a>
          </Button>
        </div>
      </div>

      {/* اللوحة — كامل الارتفاع المتاح */}
      <section
        className={cn(
          'glass-panel relative overflow-hidden',
          fullscreen
            ? 'h-[calc(100dvh-80px)]'
            : 'h-[calc(100dvh-200px)] min-h-[500px]',
        )}
      >
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">جارٍ تحميل لوحة التحليل...</p>
          </div>
        )}

        <iframe
          src="/reports-pro.html"
          title="لوحة تحكم المناديب Pro — تحليل تقارير التطبيقات"
          className={cn('h-full w-full border-0 transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}
          onLoad={() => setLoaded(true)}
        />
      </section>
    </div>
  );
}
