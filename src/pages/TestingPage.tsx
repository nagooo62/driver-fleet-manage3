import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Play, 
  RotateCcw, 
  Wifi, 
  WifiOff, 
  ShieldAlert, 
  FileCheck, 
  AlertTriangle, 
  Database,
  CheckCircle2,
  Trash2,
  Sparkles,
  Info,
  Sliders,
  Terminal,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { useDashboardStats } from '@/hooks/useDashboard';

interface SimulatedState {
  offlineMode: boolean;
  expiringDocsCount: number;
  unregisteredVehicles: number;
  mockPerformance: number;
  testInputText: string;
}

export default function TestingPage() {
  const { toast } = useToast();
  const { refetch } = useDashboardStats();
  
  // Load initial simulated state from localStorage or defaults
  const [simState, setSimState] = useState<SimulatedState>(() => {
    const saved = localStorage.getItem('__simulated_testing_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        localStorage.removeItem('__simulated_testing_state');
      }
    }
    return {
      offlineMode: false,
      expiringDocsCount: 3,
      unregisteredVehicles: 1,
      mockPerformance: 88,
      testInputText: "أحمد محمد,REP001,2026-05-18,25,85,المدينة المنورة,+966501234567\nسارة أحمد,REP002,2026-05-18,22,78,جدة,+966507654321\nمندوب خطأ,REP-BAD,2026-05-18,abc,120,مكة,0501234567",
    };
  });

  const [validationLogs, setValidationLogs] = useState<Array<{row: number, field: string, error: string, severity: 'error' | 'warning'}>>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);

  useEffect(() => {
    localStorage.setItem('__simulated_testing_state', JSON.stringify(simState));
    // Apply network simulation override
    if (simState.offlineMode) {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    } else {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    }
  }, [simState]);

  const toggleNetwork = () => {
    setSimState(prev => ({ ...prev, offlineMode: !prev.offlineMode }));
    toast({
      title: simState.offlineMode ? "أنت الآن متصل بالشبكة" : "تم تفعيل الوضع المحلي (بلا إنترنت)",
      description: simState.offlineMode ? "تم استعادة المزامنة التلقائية مع السحابة." : "جميع البيانات تُحفظ محلياً وبشكل آمن تماماً.",
      variant: simState.offlineMode ? "default" : "destructive"
    });
  };

  const handleStatChange = <K extends keyof SimulatedState>(key: K, val: SimulatedState[K]) => {
    setSimState(prev => ({ ...prev, [key]: val }));
  };

  // Run dynamic validation rules check (mimicking ToyotaReports validation rules)
  const runValidationRulesTest = () => {
    setIsTestRunning(true);
    setValidationLogs([]);
    
    setTimeout(() => {
      const logs: Array<{row: number, field: string, error: string, severity: 'error' | 'warning'}> = [];
      const lines = simState.testInputText.split('\n');
      
      lines.forEach((line, index) => {
        if (!line.trim()) return;
        const cols = line.split(',');
        const rowNum = index + 1;

        // Rule 1: Name length
        const name = cols[0]?.trim() || '';
        if (!name) {
          logs.push({ row: rowNum, field: 'الاسم', error: 'حقل الاسم فارغ وهو مطلوب إجباريًا', severity: 'error' });
        } else if (name.length < 2) {
          logs.push({ row: rowNum, field: 'الاسم', error: 'الاسم قصير نسبياً (تحذير)', severity: 'warning' });
        }

        // Rule 2: Rep ID pattern (REPxxx)
        const repId = cols[1]?.trim() || '';
        const repIdRegex = /^REP\d{3}$/;
        if (!repId) {
          logs.push({ row: rowNum, field: 'رقم المندوب', error: 'حقل رقم المندوب مطلوب', severity: 'error' });
        } else if (!repIdRegex.test(repId)) {
          logs.push({ row: rowNum, field: 'رقم المندوب', error: `تنسيق رقم المندوب "${repId}" غير صحيح، يجب أن يطابق REPxxx (مثل REP001)`, severity: 'error' });
        }

        // Rule 3: Completed orders is integer >= 0
        const orders = cols[3]?.trim() || '';
        if (orders === '') {
          logs.push({ row: rowNum, field: 'الطلبات المكتملة', error: 'حقل الطلبات مطلوب', severity: 'error' });
        } else if (isNaN(Number(orders))) {
          logs.push({ row: rowNum, field: 'الطلبات المكتملة', error: `قيمة الطلبات "${orders}" ليست رقماً صالحاً`, severity: 'error' });
        } else if (Number(orders) < 0) {
          logs.push({ row: rowNum, field: 'الطلبات المكتملة', error: 'الطلبات لا يمكن أن تكون قيمة سالبة', severity: 'error' });
        }

        // Rule 4: Performance percentage is 0-100
        const percentage = cols[4]?.trim() || '';
        if (percentage === '') {
          logs.push({ row: rowNum, field: 'نسبة الأداء', error: 'حقل النسبة مطلوب', severity: 'error' });
        } else if (isNaN(Number(percentage))) {
          logs.push({ row: rowNum, field: 'نسبة الأداء', error: `قيمة نسبة الأداء "${percentage}" ليست رقماً`, severity: 'error' });
        } else {
          const num = Number(percentage);
          if (num < 0 || num > 100) {
            logs.push({ row: rowNum, field: 'نسبة الأداء', error: `النسبة المئوية "${num}" خارج النطاق المسموح (0 - 100%)`, severity: 'error' });
          }
        }

        // Rule 5: Phone pattern (+966xxxxx)
        const phone = cols[6]?.trim() || '';
        const phoneRegex = /^\+966\d{9}$/;
        if (phone && !phoneRegex.test(phone)) {
          logs.push({ row: rowNum, field: 'رقم الهاتف', error: `رقم الهاتف "${phone}" غير صحيح، يجب أن يبدأ بـ +966 ويتبعه 9 أرقام`, severity: 'error' });
        }
      });

      setValidationLogs(logs);
      setIsTestRunning(false);
      
      toast({
        title: "اكتمل فحص القواعد والتحسينات",
        description: logs.length > 0 ? `تم رصد ${logs.length} ملاحظات في الفحص التلقائي.` : "اجتازت جميع الأسطر اختبارات المطابقة والتحقق بنجاح!",
        variant: logs.some(l => l.severity === 'error') ? "destructive" : "default"
      });
    }, 600);
  };

  const resetAllSimulations = () => {
    setSimState({
      offlineMode: false,
      expiringDocsCount: 3,
      unregisteredVehicles: 1,
      mockPerformance: 88,
      testInputText: "أحمد محمد,REP001,2026-05-18,25,85,المدينة المنورة,+966501234567\nسارة أحمد,REP002,2026-05-18,22,78,جدة,+966507654321\nمندوب خطأ,REP-BAD,2026-05-18,abc,120,مكة,0501234567",
    });
    setValidationLogs([]);
    toast({
      title: "تم إعادة تعيين المختبر",
      description: "تم استعادة قيم المحاكاة الافتراضية بنجاح."
    });
  };

  return (
    <div className="space-y-6 text-right font-cairo" dir="rtl">
      <PageHeader
        eyebrow="مختبر فحص الأنظمة والتحسينات الذكية"
        title="مختبر الميزات والتشغيل التفاعلي (Feature Lab)"
        description="لوحة محاكاة شاملة تتيح لك اختبار كل الميزات والتحسينات المستندات، والتحقق، والاتصال غير المتصل، وصحة القواعد في الوقت الفعلي."
        actions={
          <Button variant="destructive" onClick={resetAllSimulations} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            إعادة تعيين المختبر
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── Simulation Panel ─── */}
        <Card className="glass-panel border-white/10 bg-slate-950/40">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <Sliders className="w-5 h-5" />
              <CardTitle className="text-xl font-bold text-white">لوحة التحكم في المحاكاة (Simulation Controls)</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground text-sm">
              تحكم في الحالة التشغيلية للمنصة واختبر تفاعلها التلقائي والإنذارات.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Net State Simulator */}
            <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">محاكاة الاتصال بالإنترنت</span>
                <Badge variant={simState.offlineMode ? "destructive" : "default"} className={simState.offlineMode ? "bg-red-500" : "bg-green-500"}>
                  {simState.offlineMode ? <WifiOff className="w-3 h-3 ml-1" /> : <Wifi className="w-3 h-3 ml-1" />}
                  {simState.offlineMode ? "وضع غير متصل" : "متصل بالشبكة"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-6">
                عند فصل الإنترنت، تنتقل لوحة "تويوتا" تلقائياً لوضع الأمان المحلي (Local-first state) وتخزن البيانات بالكامل بـ Session/Local storage لتجنب فقدانها.
              </p>
              <Button onClick={toggleNetwork} className="w-full flex items-center justify-center gap-2">
                {simState.offlineMode ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {simState.offlineMode ? "تفعيل وضع متصل" : "محاكاة انقطاع الإنترنت (Offline)"}
              </Button>
            </div>

            {/* Expiring Docs Simulator */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                محاكاة مناديب بوثائق منتهية / تقترب من الانتهاء
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">عدد الوثائق الحرجة</Label>
                  <Input 
                    type="number" 
                    value={simState.expiringDocsCount} 
                    onChange={(e) => handleStatChange('expiringDocsCount', parseInt(e.target.value) || 0)}
                    min="0"
                    max="50"
                    className="bg-white/5 border-white/10 text-white text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">مركبات خارج الخدمة (غير مسجلة)</Label>
                  <Input 
                    type="number" 
                    value={simState.unregisteredVehicles} 
                    onChange={(e) => handleStatChange('unregisteredVehicles', parseInt(e.target.value) || 0)}
                    min="0"
                    max="20"
                    className="bg-white/5 border-white/10 text-white text-center"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                تنعكس هذه الأرقام مباشرةً على عدادات بطاقات المؤشرات (Metric Cards) في لوحة المراقبة الرئيسية لتنذر المشرفين فوراً.
              </p>
            </div>

            {/* Performance score slider */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-white">مؤشر الأداء اليومي للفريق</span>
                <span className="text-primary font-bold text-lg">{simState.mockPerformance}%</span>
              </div>
              <Input 
                type="range" 
                min="30" 
                max="100" 
                value={simState.mockPerformance} 
                onChange={(e) => handleStatChange('mockPerformance', parseInt(e.target.value))}
                className="w-full accent-primary bg-white/10 h-1 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>أداء حرج (30%)</span>
                <span>أداء فائق (100%)</span>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ─── Rules & Validation Sandbox ─── */}
        <Card className="glass-panel border-white/10 bg-slate-950/40">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <Terminal className="w-5 h-5" />
              <CardTitle className="text-xl font-bold text-white">منصة فحص جودة البيانات (Data Integrity Sandbox)</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground text-sm">
              أدخل صفوف بيانات المناديب لاختبار خوارزمية التحقق والقواعد الذكية قبل الرفع الفعلي.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-white">البيانات كـ CSV (الاسم، المعرّف، التاريخ، الطلبات، الأداء، المدينة، الجوال)</Label>
                <Badge variant="outline" className="text-xs text-muted-foreground">Toyota format</Badge>
              </div>
              <Textarea 
                value={simState.testInputText}
                onChange={(e) => handleStatChange('testInputText', e.target.value)}
                rows={6}
                className="bg-white/5 border-white/10 text-white font-mono text-xs leading-5 p-3 rtl-textarea"
                placeholder="الاسم,REP_ID,التاريخ,الطلبات,النسبة,المدينة,الجوال"
              />
            </div>

            <Button onClick={runValidationRulesTest} disabled={isTestRunning} className="w-full flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />
              {isTestRunning ? "جاري تشغيل الفحص..." : "تشغيل فحص مطابقة البيانات والقواعد"}
            </Button>

            <div className="border-t border-white/5 pt-4">
              <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                سجل نتائج المطابقة والتحقق ({validationLogs.length})
              </h3>
              
              <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                {validationLogs.map((log, i) => (
                  <div key={i} className={`flex items-start justify-between p-3 rounded-lg border text-xs ${
                    log.severity === 'error' ? 'bg-red-500/10 border-red-500/25 text-red-300' : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                  }`}>
                    <div className="flex gap-2">
                      <span className="font-bold bg-white/10 px-1.5 py-0.5 rounded text-[10px]">سطر {log.row}</span>
                      <span><strong>{log.field}:</strong> {log.error}</span>
                    </div>
                    {log.severity === 'error' ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <Info className="w-4 h-4 flex-shrink-0" />}
                  </div>
                ))}
                
                {validationLogs.length === 0 && !isTestRunning && (
                  <div className="text-center p-6 bg-white/[0.02] border border-white/5 rounded-lg text-xs text-muted-foreground">
                    انقر فوق "تشغيل فحص مطابقة البيانات" لعرض أخطاء الصياغة أو الهواتف أو معرّفات المندوبين.
                  </div>
                )}
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* ─── Improvements Status Board ─── */}
      <Card className="glass-panel border-white/10 bg-slate-950/40">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <CardTitle className="text-xl font-bold text-white">لوحة التحسينات والمطابقة الشاملة</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground text-sm">
            حالة تفعيل وترقية كل ميزة وقدرة في هذا الإصدار المحدّث.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "فحص الوثائق والتنبيهات (MVPI & Insurance)",
                status: "مفعّلة وترقية كاملة",
                desc: "إضافة حقول تواريخ الصلاحية وتنبيه الفحص الدوري والتأمين في استمارة المركبات لتنبيه المشرف قريباً.",
                icon: FileCheck,
                color: "text-green-400 bg-green-500/10"
              },
              {
                title: "وضع الشبكة المحلي أولاً (Local-first & Storage)",
                status: "مدعوم بنشاط",
                desc: "حفظ وتوليد الرموز المميزة ومزامنة ToyotaReports مع التخزين المؤقت وحفظ الملفات محلياً عند الطوارئ.",
                icon: Database,
                color: "text-blue-400 bg-blue-500/10"
              },
              {
                title: "فلترة متقدمة وتوزيع تفاعلي",
                status: "مفعّلة وترقية كاملة",
                desc: "خيارات الفرز حسب المدن، المبيعات، ومعدل رضا العملاء، مع توزيع بياني تفاعلي للأداء العام.",
                icon: Sparkles,
                color: "text-purple-400 bg-purple-500/10"
              }
            ].map((feature, i) => (
              <div key={i} className="rounded-[24px] border border-white/8 bg-white/[0.02] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl ${feature.color}`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-[11px] font-semibold text-green-400 border-green-500/20 bg-green-500/5">
                    {feature.status}
                  </Badge>
                </div>
                <h4 className="font-bold text-white text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground leading-6">{feature.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
