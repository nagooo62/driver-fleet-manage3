import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Bell, Calendar, Type, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AlertSetting {
  id: string;
  alert_type: string;
  days_before: number;
  is_enabled: boolean;
  message_template: string;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAlertSettings();
    }
  }, [isOpen]);

  const fetchAlertSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("alert_settings")
        .select("*")
        .order("alert_type");

      if (error) throw error;
      setAlertSettings(data || []);
    } catch (error: any) {
      toast.error("فشل في تحميل الإعدادات: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAlertSetting = async (id: string, updates: Partial<AlertSetting>) => {
    try {
      const { error } = await supabase
        .from("alert_settings")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setAlertSettings(prev => 
        prev.map(setting => 
          setting.id === id ? { ...setting, ...updates } : setting
        )
      );

      toast.success("تم حفظ الإعدادات");
    } catch (error: any) {
      toast.error("فشل في حفظ الإعدادات: " + error.message);
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      license_expiry: "انتهاء رخصة القيادة",
      iqama_expiry: "انتهاء الإقامة",
      medical_expiry: "انتهاء الفحص الطبي",
      vehicle_maintenance: "صيانة السيارات",
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl glass max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">إعدادات النظام</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="alerts" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4 glass">
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              التنبيهات
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              القوالب
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              العرض
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              الصلاحيات
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 mt-6 overflow-y-auto max-h-[60vh] pr-4">
            <TabsContent value="alerts" className="space-y-6 mt-0">
              <div>
                <h3 className="text-lg font-semibold mb-4">قواعد التنبيه</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  تحديد متى يتم إرسال التنبيهات قبل انتهاء صلاحية الوثائق
                </p>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alertSettings.map((setting) => (
                      <div key={setting.id} className="glass rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">{getAlertTypeLabel(setting.alert_type)}</h4>
                            <p className="text-sm text-muted-foreground">
                              إرسال تنبيه قبل {setting.days_before} أيام من الانتهاء
                            </p>
                          </div>
                          <Switch
                            checked={setting.is_enabled}
                            onCheckedChange={(enabled) => 
                              updateAlertSetting(setting.id, { is_enabled: enabled })
                            }
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>عدد الأيام قبل الانتهاء</Label>
                            <Select
                              value={setting.days_before.toString()}
                              onValueChange={(value) => 
                                updateAlertSetting(setting.id, { days_before: parseInt(value) })
                              }
                            >
                              <SelectTrigger className="glass">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="7">7 أيام</SelectItem>
                                <SelectItem value="14">14 يوم</SelectItem>
                                <SelectItem value="30">30 يوم</SelectItem>
                                <SelectItem value="60">60 يوم</SelectItem>
                                <SelectItem value="90">90 يوم</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6 mt-0">
              <div>
                <h3 className="text-lg font-semibold mb-4">قوالب الرسائل</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  تخصيص نصوص الإشعارات والتنبيهات
                </p>

                <div className="space-y-4">
                  {alertSettings.map((setting) => (
                    <div key={setting.id} className="glass rounded-lg p-4">
                      <Label className="font-semibold">
                        {getAlertTypeLabel(setting.alert_type)}
                      </Label>
                      <Textarea
                        value={setting.message_template || ""}
                        onChange={(e) => 
                          setAlertSettings(prev => 
                            prev.map(s => 
                              s.id === setting.id 
                                ? { ...s, message_template: e.target.value }
                                : s
                            )
                          )
                        }
                        onBlur={() => 
                          updateAlertSetting(setting.id, { 
                            message_template: setting.message_template 
                          })
                        }
                        className="glass mt-2"
                        rows={3}
                        placeholder="نص الرسالة..."
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        يمكن استخدام المتغيرات: {"{driver_name}"}, {"{days}"}, {"{plate}"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="display" className="space-y-6 mt-0">
              <div>
                <h3 className="text-lg font-semibold mb-4">خيارات العرض</h3>
                
                <div className="space-y-6">
                  <div className="glass rounded-lg p-4">
                    <h4 className="font-semibold mb-4">التاريخ والوقت</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>تنسيق التاريخ</Label>
                        <Select defaultValue="gregorian">
                          <SelectTrigger className="glass">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gregorian">ميلادي (DD/MM/YYYY)</SelectItem>
                            <SelectItem value="hijri">هجري</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>اللغة</Label>
                        <Select defaultValue="ar">
                          <SelectTrigger className="glass">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ar">العربية</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="glass rounded-lg p-4">
                    <h4 className="font-semibold mb-4">خطوط الواجهة</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>خط النصوص</Label>
                        <Select defaultValue="cairo">
                          <SelectTrigger className="glass">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cairo">Cairo</SelectItem>
                            <SelectItem value="tajawal">Tajawal</SelectItem>
                            <SelectItem value="amiri">Amiri</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>حجم الخط</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger className="glass">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">صغير</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="large">كبير</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-6 mt-0">
              <div>
                <h3 className="text-lg font-semibold mb-4">صلاحيات الوصول</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  تحديد من يمكنه الوصول لكل قسم من أقسام النظام
                </p>

                <div className="space-y-4">
                  <div className="glass rounded-lg p-4">
                    <h4 className="font-semibold mb-4">صلاحيات البيانات</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>استيراد البيانات</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>اعتماد البيانات</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>تصدير التقارير</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>تعديل بيانات المناديب</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div className="glass rounded-lg p-4">
                    <h4 className="font-semibold mb-4">صلاحيات النظام</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>إدارة الإعدادات</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>إدارة المستخدمين</span>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>مراجعة سجلات النظام</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};