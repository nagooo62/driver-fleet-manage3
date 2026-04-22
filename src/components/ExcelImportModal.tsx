import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Calendar as CalendarIcon, User, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDateArabic } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  onImportComplete: () => void;
}

interface ColumnMapping {
  employeeId: string;
  driverName: string;
  ordersCount: string;
  workingDays: string;
}

interface ImportPreview {
  employeeId: string;
  driverName: string;
  ordersCount: number;
  workingDays: number;
  status: 'verified' | 'mismatch' | 'not_found';
  driverId?: string;
  matchedName?: string;
}

export const ExcelImportModal = ({ isOpen, onClose, applicationId, onImportComplete }: ExcelImportModalProps) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Preview, 4: Driver Selection, 5: Complete
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    employeeId: "",
    driverName: "",
    ordersCount: "",
    workingDays: "",
  });
  const [importPreview, setImportPreview] = useState<ImportPreview[]>([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date(),
  });
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      toast.error("يرجى رفع ملف CSV");
      return;
    }

    setFile(uploadedFile);
    
    // Parse CSV file
    const text = await uploadedFile.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    setCsvData(data);
    setStep(2);
  };

  const handleColumnMapping = () => {
    if (!columnMapping.employeeId || !columnMapping.driverName) {
      toast.error("يرجى تحديد الأعمدة المطلوبة");
      return;
    }
    setStep(3);
    generatePreview();
  };

  const generatePreview = async () => {
    setLoading(true);
    try {
      // Fetch all drivers
      const { data: driversData, error } = await supabase
        .from("drivers")
        .select("*");

      if (error) throw error;
      setDrivers(driversData || []);

      // Generate preview data
      const preview: ImportPreview[] = csvData.map(row => {
        const employeeId = row[columnMapping.employeeId];
        const driverName = row[columnMapping.driverName];
        const ordersCount = parseInt(row[columnMapping.ordersCount]) || 0;
        const workingDays = parseInt(row[columnMapping.workingDays]) || 0;

        // Try to match driver by name or employee ID
        const matchedDriver = driversData?.find(driver => 
          driver.full_name.toLowerCase().includes(driverName.toLowerCase()) ||
          driver.iqama === employeeId
        );

        let status: 'verified' | 'mismatch' | 'not_found' = 'not_found';
        if (matchedDriver) {
          // Check if employee ID matches
          status = matchedDriver.iqama === employeeId ? 'verified' : 'mismatch';
        }

        return {
          employeeId,
          driverName,
          ordersCount,
          workingDays,
          status,
          driverId: matchedDriver?.id,
          matchedName: matchedDriver?.full_name,
        };
      });

      setImportPreview(preview);
    } catch (error: any) {
      toast.error("فشل في معالجة البيانات: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDriverSelection = () => {
    if (!selectedDriver) {
      toast.error("يرجى اختيار المندوب");
      return;
    }
    setStep(4);
    
    // Auto-set date range (example: last week)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    setDateRange({ from: startDate, to: endDate });
  };

  const handleFinalImport = async () => {
    setLoading(true);
    try {
      // Import data to driver_applications table
      const importData = importPreview.map(item => ({
        driver_id: item.driverId || selectedDriver,
        application_id: applicationId,
        employee_id: item.employeeId,
        start_date: dateRange.from.toISOString().split('T')[0],
        end_date: dateRange.to.toISOString().split('T')[0],
        is_verified: item.status === 'verified',
        orders_count: item.ordersCount,
        working_days: item.workingDays,
        last_import_date: new Date().toISOString().split('T')[0],
      }));

      const { error: importError } = await supabase
        .from("driver_applications")
        .upsert(importData, {
          onConflict: 'driver_id,application_id,start_date'
        });

      if (importError) throw importError;

      // Log the import
      const { error: logError } = await supabase
        .from("import_logs")
        .insert({
          application_id: applicationId,
          imported_by: "نظام الاستيراد", // Would be actual user in real app
          file_name: file?.name,
          records_count: importPreview.length,
          mismatches_count: importPreview.filter(item => item.status === 'mismatch').length,
          start_date: dateRange.from.toISOString().split('T')[0],
          end_date: dateRange.to.toISOString().split('T')[0],
        });

      if (logError) throw logError;

      toast.success(`تم استيراد ${importPreview.length} سجل بنجاح`);
      setStep(5);
      onImportComplete();
    } catch (error: any) {
      toast.error("فشل في الاستيراد: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setFile(null);
    setCsvData([]);
    setColumnMapping({
      employeeId: "",
      driverName: "",
      ordersCount: "",
      workingDays: "",
    });
    setImportPreview([]);
    setSelectedDriver("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl glass max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            استيراد بيانات Excel - خطوة {step} من 5
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* Step 1: File Upload */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">اختر ملف Excel للاستيراد</h3>
                <p className="text-sm text-muted-foreground">
                  يجب أن يحتوي الملف على أعمدة: الرقم الوظيفي، اسم المندوب، عدد الطلبات
                </p>
              </div>

              <div className="glass rounded-lg p-6 border-2 border-dashed border-border">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-20 text-lg"
                  variant="outline"
                >
                  <Upload className="w-6 h-6 ml-3" />
                  اختر ملف Excel/CSV
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">مطابقة الأعمدة</h3>
                <p className="text-sm text-muted-foreground">
                  حدد الأعمدة المطابقة في ملف Excel
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>الرقم الوظيفي *</Label>
                  <Select value={columnMapping.employeeId} onValueChange={(value) => 
                    setColumnMapping({...columnMapping, employeeId: value})
                  }>
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="اختر العمود" />
                    </SelectTrigger>
                    <SelectContent>
                      {csvData.length > 0 && Object.keys(csvData[0]).filter(key => key && key.trim() !== '').map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>اسم المندوب *</Label>
                  <Select value={columnMapping.driverName} onValueChange={(value) => 
                    setColumnMapping({...columnMapping, driverName: value})
                  }>
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="اختر العمود" />
                    </SelectTrigger>
                    <SelectContent>
                      {csvData.length > 0 && Object.keys(csvData[0]).filter(key => key && key.trim() !== '').map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>عدد الطلبات</Label>
                  <Select value={columnMapping.ordersCount} onValueChange={(value) => 
                    setColumnMapping({...columnMapping, ordersCount: value})
                  }>
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="اختر العمود" />
                    </SelectTrigger>
                    <SelectContent>
                      {csvData.length > 0 && Object.keys(csvData[0]).filter(key => key && key.trim() !== '').map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>أيام العمل</Label>
                  <Select value={columnMapping.workingDays} onValueChange={(value) => 
                    setColumnMapping({...columnMapping, workingDays: value})
                  }>
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="اختر العمود" />
                    </SelectTrigger>
                    <SelectContent>
                      {csvData.length > 0 && Object.keys(csvData[0]).filter(key => key && key.trim() !== '').map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview sample data */}
              {csvData.length > 0 && (
                <div className="glass rounded-lg p-4">
                  <h4 className="font-semibold mb-3">معاينة البيانات (أول 3 سجلات)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          {Object.keys(csvData[0]).map(key => (
                            <th key={key} className="text-right p-2 border-b">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 3).map((row, index) => (
                          <tr key={index}>
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td key={cellIndex} className="p-2 border-b">{value}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setStep(1)}>
                  السابق
                </Button>
                <Button onClick={handleColumnMapping}>
                  التالي
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Data Preview & Validation */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">مراجعة البيانات والتحقق</h3>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    مطابق: {importPreview.filter(item => item.status === 'verified').length}
                  </span>
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    غير مطابق: {importPreview.filter(item => item.status === 'mismatch').length}
                  </span>
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    غير موجود: {importPreview.filter(item => item.status === 'not_found').length}
                  </span>
                </div>
              </div>

              <div className="glass rounded-lg p-4 max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">اسم المندوب</th>
                      <th className="text-right p-2">الرقم الوظيفي</th>
                      <th className="text-right p-2">المطابقة</th>
                      <th className="text-right p-2">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.driverName}</td>
                        <td className="p-2">{item.employeeId}</td>
                        <td className="p-2">{item.matchedName || "—"}</td>
                        <td className="p-2">
                          <Badge 
                            variant={
                              item.status === 'verified' ? 'default' : 
                              item.status === 'mismatch' ? 'secondary' : 'destructive'
                            }
                            className={cn(
                              "text-xs",
                              item.status === 'verified' && "bg-green-500/20 text-green-700",
                              item.status === 'mismatch' && "bg-yellow-500/20 text-yellow-700"
                            )}
                          >
                            {item.status === 'verified' && '✅ مطابق'}
                            {item.status === 'mismatch' && '⚠️ غير مطابق'}
                            {item.status === 'not_found' && '❌ غير موجود'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setStep(2)}>
                  السابق
                </Button>
                <Button onClick={handleDriverSelection}>
                  التالي
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Driver Selection & Date Range */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">تحديد المندوب والفترة</h3>
                <p className="text-sm text-muted-foreground">
                  اختر المندوب وحدد فترة البيانات
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>اختيار المندوب</Label>
                  <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                    <SelectTrigger className="glass">
                      <User className="w-4 h-4 ml-2" />
                      <SelectValue placeholder="اكتب اسم المندوب أو اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map(driver => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.full_name} - {driver.iqama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>فترة البيانات</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      const today = new Date();
                      setDateRange({ from: today, to: today });
                    }}>
                      اليوم
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                      setDateRange({ from: weekAgo, to: today });
                    }}>
                      الأسبوع الماضي
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                      setDateRange({ from: monthAgo, to: today });
                    }}>
                      الشهر الماضي
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>تاريخ البداية</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start glass">
                        <CalendarIcon className="w-4 h-4 ml-2" />
                        {formatDateArabic(dateRange.from)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => date && setDateRange({...dateRange, from: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>تاريخ النهاية</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start glass">
                        <CalendarIcon className="w-4 h-4 ml-2" />
                        {formatDateArabic(dateRange.to)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => date && setDateRange({...dateRange, to: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setStep(3)}>
                  السابق
                </Button>
                <Button onClick={handleFinalImport} disabled={loading}>
                  {loading ? "جارٍ الاستيراد..." : "اعتماد الاستيراد"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 5 && (
            <div className="text-center space-y-6">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
              <div>
                <h3 className="text-xl font-bold text-green-700">تم الاستيراد بنجاح!</h3>
                <p className="text-muted-foreground mt-2">
                  تم استيراد {importPreview.length} سجل بنجاح
                </p>
              </div>

              <div className="glass rounded-lg p-4">
                <h4 className="font-semibold mb-2">ملخص الاستيراد</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {importPreview.filter(item => item.status === 'verified').length}
                    </div>
                    <div className="text-sm text-muted-foreground">مطابق</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {importPreview.filter(item => item.status === 'mismatch').length}
                    </div>
                    <div className="text-sm text-muted-foreground">غير مطابق</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {importPreview.filter(item => item.status === 'not_found').length}
                    </div>
                    <div className="text-sm text-muted-foreground">غير موجود</div>
                  </div>
                </div>
              </div>

              <Button onClick={handleClose} className="w-full">
                إغلاق
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};