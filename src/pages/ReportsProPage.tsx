import { useState } from 'react';
import { ExternalLink, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';

/**
 * لوحة تحكم المناديب Pro — أداة تحليل التقارير المضمّنة.
 * ترفع ملفات الأداء/الأسماء/المحفظة (Excel أو CSV)، تدمجها بالآيدي،
 * وتعرض النتائج: الطلبات، الساعات، التارقت، البوديوم، وتصدير Excel.
 */
export default function ReportsProPage() {
  const [loaded, setLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className={cn('space-y-6', fullscreen && 'fixed inset-0 z-50 space-y-0 bg-background p-4')}>
      {!fullscreen && (
        <PageHeader
          eyebrow="روائس - تحليل تقارير التطبيقات"
          title="لوحة تحكم المناديب Pro"
          description="ارفع ملفات الأداء والأسماء والمحفظة من ToYou أو HungerStation — يدمجها النظام بالآيدي ويعرض الطلبات والساعات ومقارنة التارقت مع تصدير Excel جاهز."
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setFullscreen(true)}
                className="press-effect gap-2"
                aria-label="عرض ملء الشاشة"
              >
                <Maximize2 className="h-4 w-4" /> ملء الشاشة
              </Button>
              <Button
                variant="outline"
                asChild
                className="press-effect gap-2"
              >
                <a href="/reports-pro.html" target="_blank" rel="noreferrer" aria-label="فتح في تبويب جديد">
                  <ExternalLink className="h-4 w-4" /> تبويب جديد
                </a>
              </Button>
            </div>
          }
        />
      )}

      <section
        className={cn(
          'glass-panel relative overflow-hidden',
          fullscreen ? 'h-full' : 'h-[calc(100vh-260px)] min-h-[600px]',
        )}
      >
        {fullscreen && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFullscreen(false)}
            className="absolute left-3 top-3 z-10 press-effect"
            aria-label="الخروج من ملء الشاشة"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        )}

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
