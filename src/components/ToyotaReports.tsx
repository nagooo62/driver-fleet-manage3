import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
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
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Phone,
  Award,
  Target,
  BarChart3,
  PieChart,
  Settings
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
  target_orders?: number;
  sales_amount?: number;
  customer_satisfaction?: number;
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

interface FilterOptions {
  searchTerm: string;
  cityFilter: string;
  statusFilter: string;
  sortBy: 'name' | 'orders' | 'percentage' | 'date';
  sortOrder: 'asc' | 'desc';
}

const ToyotaReports: React.FC = () => {
  const [data, setData] = useState<ToyotaRecord[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dateFilter, setDateFilter] = useState('today');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    cityFilter: 'all',
    statusFilter: 'all',
    sortBy: 'percentage',
    sortOrder: 'desc'
  });

  const validationRules: ValidationRules = {
    name: { required: true, minLength: 2 },
    rep_id: { required: true, pattern: /^REP\d{3}$/ },
    completed_orders: { required: true, type: 'number', min: 0 },
    percentage: { required: true, type: 'number', min: 0, max: 100 },
    date: { required: true, type: 'date' }
  };

  // Enhanced sample data with more fields
  const generateSampleData = useCallback((): ToyotaRecord[] => {
    const cities = ['المدينة المنورة', 'جدة', 'الرياض', 'مكة المكرمة', 'الدمام'];
    const names = [
      'أحمد محمد', 'سارة أحمد', 'محمد علي', 'فاطمة حسن', 'عبدالله خالد',
      'نورا سالم', 'يوسف حسام', 'رهف عبدالعزيز', 'خالد مشعل', 'أمل فهد'
    ];
    
    return names.map((name, index) => ({
      name,
      rep_id: `REP${String(index + 1).padStart(3, '0')}`,
      date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completed_orders: Math.floor(Math.random() * 40) + 10,
      percentage: Math.floor(Math.random() * 30) + 70,
      city: cities[Math.floor(Math.random() * cities.length)],
      phone: `+9665${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      validation_status: ['valid', 'warning', 'error'][Math.floor(Math.random() * 3)] as 'valid' | 'warning' | 'error',
      target_orders: Math.floor(Math.random() * 20) + 30,
      sales_amount: (Math.random() * 500000) + 100000,
      customer_satisfaction: Math.floor(Math.random() * 20) + 80
    }));
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

  const loadLocalData = useCallback(() => {
    try {
      setLoading(true);
      // Simulate loading delay
      setTimeout(() => {
        const savedData = sessionStorage.getItem('toyotaReportsData');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setData(parsed.data || []);
          setLastUpdate(new Date(parsed.timestamp));
        } else {
          const sampleData = generateSampleData();
          setData(sampleData);
          setLastUpdate(new Date());
        }
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading data:', error);
      setData(generateSampleData());
      setLastUpdate(new Date());
      setLoading(false);
    }
  }, [generateSampleData]);

  const saveLocalData = useCallback(() => {
    try {
      const dataToSave = {
        data,
        timestamp: new Date().toISOString(),
        version: '2.1'
      };
      sessionStorage.setItem('toyotaReportsData', JSON.stringify(dataToSave));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [data]);

  const getFilteredData = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    let filtered = data;
    
    // Date filtering
    switch (dateFilter) {
      case 'today':
        filtered = data.filter(item => item.date === todayStr);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        filtered = data.filter(item => item.date === yesterday.toISOString().split('T')[0]);
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = data.filter(item => new Date(item.date) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = data.filter(item => new Date(item.date) >= monthAgo);
        break;
    }
    
    // Search filtering
    if (filters.searchTerm) {
      filtered = filtered.filter(item => 
        item.name.includes(filters.searchTerm) ||
        item.rep_id.includes(filters.searchTerm) ||
        item.city.includes(filters.searchTerm)
      );
    }
    
    // City filtering
    if (filters.cityFilter !== 'all') {
      filtered = filtered.filter(item => item.city === filters.cityFilter);
    }
    
    // Status filtering
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(item => item.validation_status === filters.statusFilter);
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'orders':
          aValue = a.completed_orders;
          bValue = b.completed_orders;
          break;
        case 'percentage':
          aValue = a.percentage;
          bValue = b.percentage;
          break;
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [data, dateFilter, filters]);

  const stats = useMemo(() => {
    const filtered = getFilteredData;
    const totalOrders = filtered.reduce((sum, item) => sum + item.completed_orders, 0);
    const totalTargetOrders = filtered.reduce((sum, item) => sum + (item.target_orders || 0), 0);
    const totalSales = filtered.reduce((sum, item) => sum + (item.sales_amount || 0), 0);
    const avgPerformance = filtered.length > 0 ? 
      Math.round(filtered.reduce((sum, item) => sum + item.percentage, 0) / filtered.length) : 0;
    const avgSatisfaction = filtered.length > 0 ? 
      Math.round(filtered.reduce((sum, item) => sum + (item.customer_satisfaction || 0), 0) / filtered.length) : 0;
    const uniqueEmployees = new Set(filtered.map(item => item.name)).size;
    const validRecords = filtered.filter(item => item.validation_status === 'valid').length;
    const warningRecords = filtered.filter(item => item.validation_status === 'warning').length;
    const errorRecords = filtered.filter(item => item.validation_status === 'error').length;
    const targetAchievement = totalTargetOrders > 0 ? Math.round((totalOrders / totalTargetOrders) * 100) : 0;

    return {
      totalOrders,
      totalTargetOrders,
      targetAchievement,
      totalSales,
      avgPerformance,
      avgSatisfaction,
      uniqueEmployees,
      totalRecords: filtered.length,
      validRecords,
      warningRecords,
      errorRecords
    };
  }, [getFilteredData]);

  const uniqueCities = useMemo(() => {
    return [...new Set(data.map(item => item.city))];
  }, [data]);

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

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen" dir="rtl">
        <Card className="glass">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-lg">جاري تحميل البيانات...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen" dir="rtl">
      {/* Status Bar */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <StatusIndicator />
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Database className="w-4 h-4" />
              المصدر: {isOnline ? 'سحابي + محلي' : 'محلي فقط'}
            </div>
            {lastUpdate && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                آخر تحديث: {lastUpdate.toLocaleString('ar-SA')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardHeader className="text-center py-8">
          <CardTitle className="text-4xl font-bold mb-2">لوحة معلومات المندوبين - تويوتا</CardTitle>
          <p className="text-blue-100 text-lg">نظام متقدم لإدارة ومتابعة أداء المندوبين مع تحليلات ذكية</p>
        </CardHeader>
      </Card>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6 text-center">
            <div className="text-4xl text-blue-500 mb-4">
              <ShoppingCart className="mx-auto" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalOrders.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mb-2">إجمالي الطلبات</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12% من الشهر الماضي
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6 text-center">
            <div className="text-4xl text-green-500 mb-4">
              <Target className="mx-auto" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.targetAchievement}%</div>
            <div className="text-sm text-muted-foreground mb-2">تحقيق الهدف</div>
            <div className="text-xs text-blue-600">
              {stats.totalOrders} / {stats.totalTargetOrders} طلب
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6 text-center">
            <div className="text-4xl text-purple-500 mb-4">
              <Award className="mx-auto" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.avgSatisfaction}%</div>
            <div className="text-sm text-muted-foreground mb-2">رضا العملاء</div>
            <div className="text-xs text-green-600 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" />
              ممتاز
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6 text-center">
            <div className="text-4xl text-orange-500 mb-4">
              <Users className="mx-auto" />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-2">{stats.uniqueEmployees}</div>
            <div className="text-sm text-muted-foreground mb-2">المندوبين النشطين</div>
            <div className="text-xs text-gray-600">
              من أصل {data.length} مندوب
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales and Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">إجمالي المبيعات</h3>
              <BarChart3 className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {stats.totalSales.toLocaleString()} ريال
            </div>
            <Progress value={75} className="mb-2" />
            <div className="text-sm text-muted-foreground">75% من الهدف السنوي</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">متوسط الأداء</h3>
              <PieChart className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-2">{stats.avgPerformance}%</div>
            <Progress value={stats.avgPerformance} className="mb-2" />
            <div className="text-sm text-muted-foreground">أداء ممتاز للفريق</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">جودة البيانات</h3>
              <Settings className="w-5 h-5 text-purple-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>صحيحة</span>
                <span className="text-green-600">{stats.validRecords}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>تحذيرات</span>
                <span className="text-orange-600">{stats.warningRecords}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>أخطاء</span>
                <span className="text-red-600">{stats.errorRecords}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-6 bg-gray-100">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                لوحة المعلومات
              </TabsTrigger>
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                المندوبين
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                التحليلات
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                رفع البيانات
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                الإعدادات
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Date Filters */}
              <div className="flex gap-2 justify-center flex-wrap">
                {[
                  { key: 'today', label: 'اليوم', icon: Calendar },
                  { key: 'yesterday', label: 'أمس', icon: Calendar },
                  { key: 'week', label: 'هذا الأسبوع', icon: Calendar },
                  { key: 'month', label: 'هذا الشهر', icon: Calendar },
                  { key: 'all', label: 'جميع البيانات', icon: Database }
                ].map(filter => (
                  <Button
                    key={filter.key}
                    variant={dateFilter === filter.key ? "default" : "outline"}
                    onClick={() => setDateFilter(filter.key)}
                    className="min-w-[120px] flex items-center gap-2"
                  >
                    <filter.icon className="w-4 h-4" />
                    {filter.label}
                  </Button>
                ))}
              </div>

              {/* Performance Chart Placeholder */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    مخطط الأداء الأسبوعي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                      <p className="text-gray-600">مخطط بياني تفاعلي للأداء</p>
                      <p className="text-sm text-gray-500 mt-2">يعرض اتجاهات الأداء والمبيعات</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Enhanced Employees Tab */}
            <TabsContent value="employees" className="space-y-6">
              {/* Search and Filter Controls */}
              <Card className="shadow-lg border-0">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="البحث في المندوبين..."
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    
                    <select
                      value={filters.cityFilter}
                      onChange={(e) => handleFilterChange('cityFilter', e.target.value)}
                      className="px-3 py-2 border rounded-md bg-white"
                    >
                      <option value="all">جميع المدن</option>
                      {uniqueCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    
                    <select
                      value={filters.statusFilter}
                      onChange={(e) => handleFilterChange('statusFilter', e.target.value)}
                      className="px-3 py-2 border rounded-md bg-white"
                    >
                      <option value="all">جميع الحالات</option>
                      <option value="valid">صحيح</option>
                      <option value="warning">تحذير</option>
                      <option value="error">خطأ</option>
                    </select>
                    
                    <select
                      value={`${filters.sortBy}-${filters.sortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        handleFilterChange('sortBy', sortBy);
                        handleFilterChange('sortOrder', sortOrder);
                      }}
                      className="px-3 py-2 border rounded-md bg-white"
                    >
                      <option value="percentage-desc">الأداء (الأعلى)</option>
                      <option value="percentage-asc">الأداء (الأقل)</option>
                      <option value="orders-desc">الطلبات (الأكثر)</option>
                      <option value="orders-asc">الطلبات (الأقل)</option>
                      <option value="name-asc">الاسم (أ-ي)</option>
                      <option value="name-desc">الاسم (ي-أ)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Employee Cards */}
              <div className="space-y-4">
                {getFilteredData.map((employee, index) => (
                  <Card key={employee.rep_id} className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {employee.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-xl">{employee.name}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  employee.validation_status === 'valid' ? 'default' :
                                  employee.validation_status === 'warning' ? 'secondary' : 'destructive'
                                }>
                                  {employee.rep_id}
                                </Badge>
                                {employee.percentage >= 90 && (
                                  <Badge variant="default" className="bg-gold text-white">
                                    <Award className="w-3 h-3 mr-1" />
                                    متميز
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span>{employee.city}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span>{employee.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="w-4 h-4 text-gray-500" />
                              <span>{employee.completed_orders} طلب</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-gray-500" />
                              <span>{employee.target_orders || 'غير محدد'} هدف</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-gray-500" />
                              <span>{employee.sales_amount?.toLocaleString() || 0} ريال</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-gray-500" />
                              <span>{employee.customer_satisfaction || 0}% رضا</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span>{new Date(employee.date).toLocaleDateString('ar-SA')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-32">
                          <div className="text-center mb-2">
                            <div className="text-2xl font-bold text-blue-600">{employee.percentage}%</div>
                          </div>
                          <Progress value={employee.percentage} className="mb-2" />
                          <div className="text-center text-sm text-muted-foreground">
                            الأداء العام
                          </div>
                          {employee.target_orders && (
                            <div className="mt-3 text-center">
                              <div className="text-sm text-gray-600">
                                {Math.round((employee.completed_orders / employee.target_orders) * 100)}% من الهدف
                              </div>
                              <Progress 
                                value={Math.min((employee.completed_orders / employee.target_orders) * 100, 100)} 
                                className="mt-1 h-2" 
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {getFilteredData.length === 0 && (
                <Card className="shadow-lg border-0">
                  <CardContent className="p-8 text-center">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600">لا توجد نتائج تطابق البحث</p>
                    <p className="text-sm text-gray-500 mt-2">جرب تغيير معايير البحث أو الفلتر</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* New Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Distribution */}
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      توزيع الأداء
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { range: '90-100%', count: getFilteredData.filter(e => e.percentage >= 90).length, color: 'bg-green-500' },
                        { range: '80-89%', count: getFilteredData.filter(e => e.percentage >= 80 && e.percentage < 90).length, color: 'bg-blue-500' },
                        { range: '70-79%', count: getFilteredData.filter(e => e.percentage >= 70 && e.percentage < 80).length, color: 'bg-yellow-500' },
                        { range: '60-69%', count: getFilteredData.filter(e => e.percentage >= 60 && e.percentage < 70).length, color: 'bg-orange-500' },
                        { range: 'أقل من 60%', count: getFilteredData.filter(e => e.percentage < 60).length, color: 'bg-red-500' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded ${item.color}`}></div>
                            <span className="text-sm">{item.range}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{item.count}</span>
                            <div className="w-20">
                              <Progress value={(item.count / getFilteredData.length) * 100} className="h-2" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* City Performance */}
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      الأداء حسب المدينة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {uniqueCities.map(city => {
                        const cityData = getFilteredData.filter(e => e.city === city);
                        const avgPerformance = cityData.length > 0 ? 
                          Math.round(cityData.reduce((sum, e) => sum + e.percentage, 0) / cityData.length) : 0;
                        const totalOrders = cityData.reduce((sum, e) => sum + e.completed_orders, 0);
                        
                        return (
                          <div key={city} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-semibold">{city}</h4>
                              <Badge variant="outline">{cityData.length} مندوب</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">متوسط الأداء: </span>
                                <span className="font-semibold">{avgPerformance}%</span>
                              </div>
                              <div>
                                <span className="text-gray-600">إجمالي الطلبات: </span>
                                <span className="font-semibold">{totalOrders}</span>
                              </div>
                            </div>
                            <Progress value={avgPerformance} className="mt-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Performers */}
                <Card className="shadow-lg border-0 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      أفضل المتفوقين
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {getFilteredData
                        .sort((a, b) => b.percentage - a.percentage)
                        .slice(0, 3)
                        .map((employee, index) => (
                          <div key={employee.rep_id} className="text-center">
                            <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                              index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                              index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                              'bg-gradient-to-br from-orange-400 to-orange-600'
                            }`}>
                              {index + 1}
                            </div>
                            <h4 className="font-bold text-lg mb-1">{employee.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{employee.city}</p>
                            <div className="text-2xl font-bold text-blue-600 mb-1">{employee.percentage}%</div>
                            <div className="text-sm text-gray-500">{employee.completed_orders} طلب</div>
                          </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Enhanced Upload Tab */}
            <TabsContent value="upload" className="space-y-6">
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-4">إدارة البيانات المتقدمة</h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    رفع وتصدير ومعالجة بيانات المندوبين بصيغ متعددة مع التحقق التلقائي من صحة البيانات
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                      <h4 className="font-semibold mb-2">رفع الملفات</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        دعم Excel, CSV, JSON
                      </p>
                      <Button className="w-full">اختيار الملف</Button>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <Download className="w-12 h-12 mx-auto mb-4 text-green-500" />
                      <h4 className="font-semibold mb-2">تصدير البيانات</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        تصدير بتنسيقات متعددة
                      </p>
                      <Button variant="outline" className="w-full">تصدير</Button>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <RefreshCw className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                      <h4 className="font-semibold mb-2">المزامنة</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        مزامنة مع السحابة
                      </p>
                      <Button variant="outline" className="w-full">مزامنة</Button>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-lg border-0 max-w-4xl mx-auto">
                  <CardHeader>
                    <CardTitle>سجل العمليات الأخيرة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { action: 'تم رفع ملف', file: 'sales_data.xlsx', time: 'منذ 5 دقائق', status: 'success' },
                        { action: 'تصدير التقرير', file: 'monthly_report.pdf', time: 'منذ 15 دقيقة', status: 'success' },
                        { action: 'فشل في المزامنة', file: '-', time: 'منذ ساعة', status: 'error' },
                      ].map((log, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {log.status === 'success' ? 
                              <CheckCircle className="w-5 h-5 text-green-500" /> : 
                              <XCircle className="w-5 h-5 text-red-500" />
                            }
                            <div>
                              <span className="font-medium">{log.action}</span>
                              {log.file !== '-' && <span className="text-sm text-gray-600 mr-2">({log.file})</span>}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">{log.time}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Enhanced Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-6 text-center">إعدادات النظام المتقدمة</h3>
                
                {/* System Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="shadow-lg border-0">
                    <CardContent className="p-6 text-center">
                      <Database className="mx-auto text-4xl text-blue-500 mb-4" />
                      <div className="text-2xl font-bold text-blue-500 mb-2">{data.length}</div>
                      <div className="text-muted-foreground">إجمالي السجلات</div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-0">
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="mx-auto text-4xl text-green-500 mb-4" />
                      <div className="text-2xl font-bold text-green-500 mb-2">{stats.validRecords}</div>
                      <div className="text-muted-foreground">سجلات صحيحة</div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-0">
                    <CardContent className="p-6 text-center">
                      <AlertCircle className="mx-auto text-4xl text-orange-500 mb-4" />
                      <div className="text-2xl font-bold text-orange-500 mb-2">{stats.warningRecords}</div>
                      <div className="text-muted-foreground">تحذيرات</div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-0">
                    <CardContent className="p-6 text-center">
                      <XCircle className="mx-auto text-4xl text-red-500 mb-4" />
                      <div className="text-2xl font-bold text-red-500 mb-2">{stats.errorRecords}</div>
                      <div className="text-muted-foreground">أخطاء</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                      <h4 className="font-semibold mb-2">تحديث البيانات</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        إعادة تحميل البيانات من المصدر
                      </p>
                      <Button onClick={loadLocalData} className="w-full">
                        تحديث الآن
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <Save className="w-12 h-12 mx-auto mb-4 text-green-500" />
                      <h4 className="font-semibold mb-2">حفظ الإعدادات</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        حفظ التغييرات والإعدادات
                      </p>
                      <Button onClick={saveLocalData} variant="outline" className="w-full">
                        حفظ
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <RotateCcw className="w-12 h-12 mx-auto mb-4 text-red-500" />
                      <h4 className="font-semibold mb-2">إعادة تعيين</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        إعادة النظام للحالة الافتراضية
                      </p>
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          if (confirm('هل أنت متأكد من إعادة تعيين النظام؟\nسيتم حذف جميع البيانات المحفوظة محلياً.')) {
                            sessionStorage.removeItem('toyotaReportsData');
                            setData(generateSampleData());
                            setLastUpdate(new Date());
                          }
                        }}
                        className="w-full"
                      >
                        إعادة تعيين
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* System Information */}
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>معلومات النظام</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">إصدار النظام:</span>
                          <span className="font-semibold">2.1</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">آخر تحديث:</span>
                          <span className="font-semibold">
                            {lastUpdate ? lastUpdate.toLocaleDateString('ar-SA') : 'غير محدد'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">حالة الاتصال:</span>
                          <span className={`font-semibold ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
                            {isOnline ? 'متصل' : 'غير متصل'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">وضع التشغيل:</span>
                          <span className="font-semibold">محلي + سحابي</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">المتصفح:</span>
                          <span className="font-semibold">
                            {navigator.userAgent.includes('Chrome') ? 'Chrome' :
                             navigator.userAgent.includes('Firefox') ? 'Firefox' :
                             navigator.userAgent.includes('Safari') ? 'Safari' : 'غير معروف'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">دعم التخزين المحلي:</span>
                          <span className="font-semibold text-green-600">مدعوم</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">المنطقة الزمنية:</span>
                          <span className="font-semibold">
                            {Intl.DateTimeFormat().resolvedOptions().timeZone}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">اللغة:</span>
                          <span className="font-semibold">العربية</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ToyotaReports;