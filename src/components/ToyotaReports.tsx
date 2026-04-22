import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { 
  ShoppingCart, 
  Users, 
  Percent, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Save,
  RotateCcw,
  Wifi,
  WifiOff,
  FileX,
  Shield,
  AlertTriangle
} from 'lucide-react';

interface ToyotaRecord {
  name: string;
  rep_id: string;
  date: string;
  completed_orders: number;
  percentage: number;
  city: string;
  phone: string;
  validation_status: 'valid' | 'warning' | 'error';
  validation_errors?: string[];
  validation_warnings?: string[];
  file_info?: {
    name: string;
    size: number;
    lastModified: number;
  };
}

interface ValidationRules {
  [key: string]: {
    required?: boolean;
    type?: string;
    min?: number;
    max?: number;
    minLength?: number;
    pattern?: RegExp;
  };
}

const ToyotaReports: React.FC = () => {
  const [data, setData] = useState<ToyotaRecord[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dateFilter, setDateFilter] = useState('today');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationResults, setValidationResults] = useState<{[key: string]: string[]}>({});

  const validationRules: ValidationRules = {
    name: { required: true, minLength: 2 },
    rep_id: { required: true, pattern: /^REP\d{3}$/ },
    completed_orders: { required: true, type: 'number', min: 0 },
    percentage: { required: true, type: 'number', min: 0, max: 100 },
    date: { required: true, type: 'date' },
    phone: { pattern: /^\+966\d{9}$/ },
    city: { required: true, minLength: 2 }
  };

  // Enhanced validation function
  const validateRecord = useCallback((record: any): { status: 'valid' | 'warning' | 'error', errors: string[], warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    Object.entries(validationRules).forEach(([field, rules]) => {
      const value = record[field];
      
      if (rules.required && (!value || value === '')) {
        errors.push(`الحقل "${field}" مطلوب`);
        return;
      }

      if (value && rules.type === 'number' && isNaN(Number(value))) {
        errors.push(`الحقل "${field}" يجب أن يكون رقم`);
        return;
      }

      if (value && rules.type === 'number') {
        const numValue = Number(value);
        if (rules.min !== undefined && numValue < rules.min) {
          errors.push(`الحقل "${field}" يجب أن يكون أكبر من ${rules.min}`);
        }
        if (rules.max !== undefined && numValue > rules.max) {
          errors.push(`الحقل "${field}" يجب أن يكون أقل من ${rules.max}`);
        }
      }

      if (value && rules.minLength && value.length < rules.minLength) {
        warnings.push(`الحقل "${field}" قصير نسبياً`);
      }

      if (value && rules.pattern && !rules.pattern.test(value)) {
        errors.push(`الحقل "${field}" غير صحيح`);
      }
    });

    const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';
    return { status, errors, warnings };
  }, [validationRules]);

  // File validation function
  const validateFile = useCallback((file: File): { valid: boolean, error?: string } => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'نوع الملف غير مدعوم. يرجى استخدام Excel أو CSV' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'حجم الملف كبير جداً. الحد الأقصى 10MB' };
    }
    
    return { valid: true };
  }, []);

  useEffect(() => {
    loadLocalData();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadLocalData = () => {
    try {
      const savedData = localStorage.getItem('toyotaReportsData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setData(parsed.data || []);
        setLastUpdate(new Date(parsed.timestamp));
      } else {
        loadSampleData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      loadSampleData();
    }
  };

  const loadSampleData = () => {
    const sampleData: ToyotaRecord[] = [
      {
        name: "أحمد محمد",
        rep_id: "REP001",
        date: new Date().toISOString().split('T')[0],
        completed_orders: 25,
        percentage: 85,
        city: "المدينة المنورة",
        phone: "+966501234567",
        validation_status: "valid"
      },
      {
        name: "سارة أحمد",
        rep_id: "REP002",
        date: new Date().toISOString().split('T')[0],
        completed_orders: 22,
        percentage: 78,
        city: "جدة",
        phone: "+966507654321",
        validation_status: "valid"
      },
      {
        name: "محمد علي",
        rep_id: "REP003",
        date: new Date().toISOString().split('T')[0],
        completed_orders: 30,
        percentage: 92,
        city: "المدينة المنورة",
        phone: "+966509876543",
        validation_status: "valid"
      },
      {
        name: "فاطمة حسن",
        rep_id: "REP004",
        date: new Date().toISOString().split('T')[0],
        completed_orders: 18,
        percentage: 72,
        city: "جدة",
        phone: "+966502468135",
        validation_status: "warning"
      },
      {
        name: "عبدالله خالد",
        rep_id: "REP005",
        date: new Date().toISOString().split('T')[0],
        completed_orders: 27,
        percentage: 88,
        city: "المدينة المنورة",
        phone: "+966508642097",
        validation_status: "valid"
      }
    ];
    setData(sampleData);
    setLastUpdate(new Date());
  };

  const saveLocalData = useCallback(() => {
    try {
      const dataToSave = {
        data,
        timestamp: new Date().toISOString(),
        version: '2.1',
        checksums: data.map(record => JSON.stringify(record).length) // Simple integrity check
      };
      localStorage.setItem('toyotaReportsData', JSON.stringify(dataToSave));
      setLastUpdate(new Date());
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      setUploadError('فشل في حفظ البيانات محلياً');
      return false;
    }
  }, [data]);

  // Enhanced file processing
  const processUploadedFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setUploadError(null);
    
    try {
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadError(validation.error || 'ملف غير صالح');
        return;
      }

      // Simulate file processing (replace with actual file parsing)
      const text = await file.text();
      const lines = text.split('\n').slice(1); // Skip header
      
      const newRecords: ToyotaRecord[] = [];
      const validationResults: {[key: string]: string[]} = {};
      
      lines.forEach((line, index) => {
        if (line.trim()) {
          const columns = line.split(',');
          const validation = validateRecord({
            name: columns[0]?.trim() || '',
            rep_id: columns[1]?.trim() || '',
            date: columns[2]?.trim() || new Date().toISOString().split('T')[0],
            completed_orders: parseInt(columns[3]?.trim()) || 0,
            percentage: parseFloat(columns[4]?.trim()) || 0,
            city: columns[5]?.trim() || '',
            phone: columns[6]?.trim() || ''
          });

          const record: ToyotaRecord = {
            name: columns[0]?.trim() || '',
            rep_id: columns[1]?.trim() || '',
            date: columns[2]?.trim() || new Date().toISOString().split('T')[0],
            completed_orders: parseInt(columns[3]?.trim()) || 0,
            percentage: parseFloat(columns[4]?.trim()) || 0,
            city: columns[5]?.trim() || '',
            phone: columns[6]?.trim() || '',
            validation_status: validation.status,
            validation_errors: validation.errors,
            validation_warnings: validation.warnings,
            file_info: {
              name: file.name,
              size: file.size,
              lastModified: file.lastModified
            }
          };
          
          if (validation.errors.length > 0) {
            validationResults[`row_${index + 2}`] = validation.errors;
          }
          
          newRecords.push(record);
        }
      });

      setData(prevData => [...prevData, ...newRecords]);
      setValidationResults(validationResults);
      saveLocalData();
      
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadError('خطأ في معالجة الملف. تأكد من صحة تنسيق البيانات');
    } finally {
      setIsLoading(false);
    }
  }, [validateFile, validateRecord, saveLocalData]);

  // Export functionality with error handling
  const exportData = useCallback(() => {
    try {
      const currentData = getFilteredData();
      const csvContent = [
        'الاسم,رقم المندوب,التاريخ,الطلبات المكتملة,النسبة المئوية,المدينة,الهاتف',
        ...currentData.map(record => 
          `${record.name},${record.rep_id},${record.date},${record.completed_orders},${record.percentage},${record.city},${record.phone}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `toyota_reports_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Export failed:', error);
      setUploadError('فشل في تصدير البيانات');
    }
  }, [data, dateFilter]);

  const getFilteredData = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (dateFilter) {
      case 'today':
        return data.filter(item => item.date === todayStr);
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return data.filter(item => item.date === yesterday.toISOString().split('T')[0]);
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return data.filter(item => new Date(item.date) >= weekAgo);
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return data.filter(item => new Date(item.date) >= monthAgo);
      default:
        return data;
    }
  };

  const getStats = () => {
    const filteredData = getFilteredData();
    const totalOrders = filteredData.reduce((sum, item) => sum + item.completed_orders, 0);
    const avgPerformance = filteredData.length > 0 ? 
      Math.round(filteredData.reduce((sum, item) => sum + item.percentage, 0) / filteredData.length) : 0;
    const uniqueEmployees = new Set(filteredData.map(item => item.name)).size;
    const validRecords = filteredData.filter(item => item.validation_status === 'valid').length;
    const warningRecords = filteredData.filter(item => item.validation_status === 'warning').length;
    const errorRecords = filteredData.filter(item => item.validation_status === 'error').length;

    return {
      totalOrders,
      avgPerformance,
      uniqueEmployees,
      totalRecords: filteredData.length,
      validRecords,
      warningRecords,
      errorRecords
    };
  };

  const filteredData = getFilteredData();
  const stats = getStats();

  const StatusIndicator = () => (
    <div className="flex items-center gap-2 text-sm">
      {isOnline ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>متصل - جاهز للمزامنة</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span>وضع محلي - البيانات آمنة</span>
        </>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Status Bar */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <StatusIndicator />
            <div className="text-sm text-muted-foreground">
              المصدر: {isOnline ? 'سحابي + محلي' : 'محلي فقط'}
            </div>
            {lastUpdate && (
              <div className="text-sm text-muted-foreground">
                آخر تحديث: {lastUpdate.toLocaleString('ar-SA')}
              </div>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={saveLocalData}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              حفظ محلي
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Validation Results */}
      {Object.keys(validationResults).length > 0 && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            تم العثور على {Object.keys(validationResults).length} مشاكل في التحقق من البيانات. 
            يرجى مراجعة السجلات في قسم المندوبين.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card className="glass">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">لوحة معلومات المندوبين - تويوتا</CardTitle>
          <p className="text-muted-foreground">نظام متقدم لإدارة ومتابعة أداء المندوبين</p>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="text-4xl text-blue-500 mb-4">
              <ShoppingCart className="mx-auto" />
            </div>
            <div className="text-3xl font-bold text-blue-500 mb-2">{stats.totalOrders}</div>
            <div className="text-muted-foreground">إجمالي الطلبات</div>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="text-4xl text-green-500 mb-4">
              <Users className="mx-auto" />
            </div>
            <div className="text-3xl font-bold text-green-500 mb-2">{stats.uniqueEmployees}</div>
            <div className="text-muted-foreground">عدد المندوبين</div>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="text-4xl text-orange-500 mb-4">
              <Percent className="mx-auto" />
            </div>
            <div className="text-3xl font-bold text-orange-500 mb-2">{stats.avgPerformance}%</div>
            <div className="text-muted-foreground">متوسط الأداء</div>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="text-4xl text-purple-500 mb-4">
              <Database className="mx-auto" />
            </div>
            <div className="text-3xl font-bold text-purple-500 mb-2">{stats.totalRecords}</div>
            <div className="text-muted-foreground">إجمالي السجلات</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="glass">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-6">
              <TabsTrigger value="dashboard">لوحة المعلومات</TabsTrigger>
              <TabsTrigger value="employees">المندوبين</TabsTrigger>
              <TabsTrigger value="upload">رفع البيانات</TabsTrigger>
              <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Date Filters */}
              <div className="flex gap-2 justify-center flex-wrap">
                {[
                  { key: 'today', label: 'اليوم' },
                  { key: 'yesterday', label: 'أمس' },
                  { key: 'week', label: 'هذا الأسبوع' },
                  { key: 'month', label: 'هذا الشهر' },
                  { key: 'all', label: 'جميع البيانات' }
                ].map(filter => (
                  <Button
                    key={filter.key}
                    variant={dateFilter === filter.key ? "default" : "outline"}
                    onClick={() => setDateFilter(filter.key)}
                    className="min-w-[120px]"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              {/* Validation Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="mx-auto text-4xl text-green-500 mb-4" />
                    <div className="text-2xl font-bold text-green-500 mb-2">{stats.validRecords}</div>
                    <div className="text-muted-foreground">سجلات صحيحة</div>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardContent className="p-6 text-center">
                    <AlertCircle className="mx-auto text-4xl text-orange-500 mb-4" />
                    <div className="text-2xl font-bold text-orange-500 mb-2">{stats.warningRecords}</div>
                    <div className="text-muted-foreground">تحذيرات</div>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardContent className="p-6 text-center">
                    <XCircle className="mx-auto text-4xl text-red-500 mb-4" />
                    <div className="text-2xl font-bold text-red-500 mb-2">{stats.errorRecords}</div>
                    <div className="text-muted-foreground">أخطاء</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Employees Tab */}
            <TabsContent value="employees" className="space-y-6">
              <div className="space-y-4">
                {filteredData.map((employee, index) => (
                  <Card key={employee.rep_id} className="glass">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{employee.name}</h3>
                            <Badge variant={
                              employee.validation_status === 'valid' ? 'default' :
                              employee.validation_status === 'warning' ? 'secondary' : 'destructive'
                            }>
                              {employee.rep_id}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">المدينة: </span>
                              <span>{employee.city}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">الطلبات: </span>
                              <span className="font-semibold">{employee.completed_orders}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">الأداء: </span>
                              <span className="font-semibold">{employee.percentage}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">التاريخ: </span>
                              <span>{new Date(employee.date).toLocaleDateString('ar-SA')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-24">
                          <Progress value={employee.percentage} className="mb-2" />
                          <div className="text-center text-sm text-muted-foreground">
                            {employee.percentage}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-6">
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">رفع وتصدير البيانات</h3>
                  <p className="text-muted-foreground mb-6">
                    يمكنك رفع ملفات Excel أو CSV مع بيانات المندوبين الجديدة
                  </p>
                  <div className="bg-muted p-4 rounded-lg mb-6 text-sm">
                    <h4 className="font-semibold mb-2">متطلبات الملف:</h4>
                    <ul className="text-right space-y-1">
                      <li>• نوع الملف: Excel (.xlsx) أو CSV</li>
                      <li>• الحد الأقصى للحجم: 10MB</li>
                      <li>• الأعمدة المطلوبة: الاسم، رقم المندوب، التاريخ، الطلبات، النسبة، المدينة، الهاتف</li>
                      <li>• رقم الهاتف يجب أن يبدأ بـ +966</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex justify-center gap-4 flex-wrap">
                  <div>
                    <Input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processUploadedFile(file);
                      }}
                      className="hidden"
                      id="file-upload"
                      disabled={isLoading}
                    />
                    <Button 
                      asChild 
                      className="flex items-center gap-2"
                      disabled={isLoading}
                    >
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-4 h-4" />
                        {isLoading ? 'جارٍ المعالجة...' : 'رفع الملف'}
                      </label>
                    </Button>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={exportData}
                    disabled={filteredData.length === 0}
                  >
                    <Download className="w-4 h-4" />
                    تصدير البيانات ({filteredData.length} سجل)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من مسح جميع البيانات؟')) {
                        setData([]);
                        localStorage.removeItem('toyotaReportsData');
                        setLastUpdate(null);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    مسح البيانات
                  </Button>
                </div>

                {/* File Processing Status */}
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جارٍ معالجة الملف...</span>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-6 text-center">إعدادات النظام المتقدمة</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="glass">
                    <CardContent className="p-6 text-center">
                      <Database className="mx-auto text-4xl text-blue-500 mb-4" />
                      <div className="text-2xl font-bold text-blue-500 mb-2">{data.length}</div>
                      <div className="text-muted-foreground">سجلات البيانات</div>
                    </CardContent>
                  </Card>

                  <Card className="glass">
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="mx-auto text-4xl text-green-500 mb-4" />
                      <div className="text-2xl font-bold text-green-500 mb-2">{stats.validRecords}</div>
                      <div className="text-muted-foreground">سجلات صحيحة</div>
                    </CardContent>
                  </Card>

                  <Card className="glass">
                    <CardContent className="p-6 text-center">
                      <AlertCircle className="mx-auto text-4xl text-orange-500 mb-4" />
                      <div className="text-2xl font-bold text-orange-500 mb-2">{stats.warningRecords}</div>
                      <div className="text-muted-foreground">تحذيرات</div>
                    </CardContent>
                  </Card>

                  <Card className="glass">
                    <CardContent className="p-6 text-center">
                      <XCircle className="mx-auto text-4xl text-red-500 mb-4" />
                      <div className="text-2xl font-bold text-red-500 mb-2">{stats.errorRecords}</div>
                      <div className="text-muted-foreground">أخطاء</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center gap-4 flex-wrap">
                  <Button onClick={loadLocalData} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    تحديث البيانات
                  </Button>
                  <Button onClick={saveLocalData} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    حفظ الإعدادات
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      if (confirm('هل أنت متأكد من إعادة تعيين النظام؟')) {
                        localStorage.removeItem('toyotaReportsData');
                        loadSampleData();
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    إعادة تعيين النظام
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ToyotaReports;