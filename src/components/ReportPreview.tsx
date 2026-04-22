import { FileText, Users, Car, TrendingUp, Archive, Download, Eye, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ReportPreviewProps {
  reportType: string;
  period: {
    type: string;
    startDate: Date;
    endDate: Date;
    label: string;
  };
  filters: {
    search?: string;
    category?: string;
  };
  dataCount: number;
  onGenerate: () => void;
  onExport: (format: 'excel' | 'pdf' | 'csv') => void;
  isGenerating?: boolean;
  progress?: number;
}

export const ReportPreview = ({ 
  reportType, 
  period, 
  filters, 
  dataCount, 
  onGenerate, 
  onExport,
  isGenerating = false,
  progress = 0
}: ReportPreviewProps) => {
  
  const getReportIcon = () => {
    switch (reportType) {
      case 'reports_drivers':
        return Users;
      case 'reports_cars':
        return Car;
      case 'reports_performance':
        return TrendingUp;
      case 'reports_archive':
        return Archive;
      default:
        return FileText;
    }
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'reports_drivers':
        return 'تقرير المناديب';
      case 'reports_cars':
        return 'تقرير السيارات';
      case 'reports_performance':
        return 'تقرير الأداء';
      case 'reports_archive':
        return 'تقرير الأرشيف';
      default:
        return 'تقرير عام';
    }
  };

  const getReportDescription = () => {
    switch (reportType) {
      case 'reports_drivers':
        return 'يتضمن إحصائيات شاملة عن المناديب، توزيع الحالات، والتحليلات التفصيلية';
      case 'reports_cars':
        return 'يشمل بيانات السيارات، التفويضات، الصيانة، والتوزيع حسب الأنواع';
      case 'reports_performance':
        return 'مؤشرات الأداء الرئيسية، كفاءة المشرفين، ومعدلات النمو';
      case 'reports_archive':
        return 'تحليل أسباب انتهاء العمل، الاتجاهات الزمنية، والإحصائيات التاريخية';
      default:
        return 'تقرير تفصيلي شامل';
    }
  };

  const getExpectedContent = () => {
    const content = [
      'إحصائيات عامة ومؤشرات رئيسية',
      'رسوم بيانية تفاعلية وتحليلية',
      'جداول بيانات تفصيلية قابلة للفرز',
    ];

    switch (reportType) {
      case 'reports_drivers':
        content.push('توزيع المناديب حسب الحالة والتطبيق');
        content.push('تحليل أداء المشرفين');
        break;
      case 'reports_cars':
        content.push('حالة السيارات والتفويضات');
        content.push('تقارير الصيانة والاستخدام');
        break;
      case 'reports_performance':
        content.push('مؤشرات الكفاءة والإنتاجية');
        content.push('اتجاهات النمو والتطوير');
        break;
      case 'reports_archive':
        content.push('أسباب انتهاء العمل والإحصائيات');
        content.push('التحليل الزمني للأرشفة');
        break;
    }

    return content;
  };

  const IconComponent = getReportIcon();

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconComponent className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{getReportTitle()}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {getReportDescription()}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            معاينة التقرير
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Period and Filters Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              الفترة الزمنية
            </label>
            <div className="glass rounded-md p-3 text-sm">
              {period.label}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">عدد السجلات المتوقعة</label>
            <div className="glass rounded-md p-3 text-sm font-medium">
              {dataCount.toLocaleString('ar-SA')} سجل
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.search || filters.category) && (
          <div className="space-y-2">
            <label className="text-sm font-medium">الفلاتر النشطة</label>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="outline" className="text-xs">
                  البحث: {filters.search}
                </Badge>
              )}
              {filters.category && (
                <Badge variant="outline" className="text-xs">
                  الفئة: {filters.category}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Expected Content */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Eye className="w-4 h-4" />
            محتويات التقرير المتوقعة
          </label>
          <div className="space-y-2">
            {getExpectedContent().map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>جاري إنشاء التقرير...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4 border-t border-border">
          <Button 
            onClick={onGenerate} 
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                جاري الإنشاء...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                إنشاء التقرير
              </div>
            )}
          </Button>

          {!isGenerating && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('excel')}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('pdf')}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('csv')}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};