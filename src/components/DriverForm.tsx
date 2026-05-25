import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';
import { DEMO_MODE, readFileAsDataUrl, upsertDemoDriver } from '@/lib/demoMode';
import type { Driver, DriverInsert } from '@/types';

interface DriverFormProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: Driver | null;
  onSave: () => void;
}

type DriverFormState = Pick<
  DriverInsert,
  | 'full_name' | 'iqama' | 'license_expiry' | 'iqama_expiry' | 'medical_expiry'
  | 'status' | 'manager' | 'using_app'
  | 'photo_url' | 'nationality' | 'phone' | 'city' | 'profession' | 'ajeer_expiry' | 'app_name'
>;

const initialState: DriverFormState = {
  full_name: '', iqama: '', license_expiry: '', iqama_expiry: '', medical_expiry: '',
  status: 'new', manager: '', using_app: false,
  photo_url: '', nationality: '', phone: '', city: '', profession: '', ajeer_expiry: '', app_name: '',
};

const NATIONALITIES = ['سعودي', 'مصري', 'يمني', 'باكستاني', 'هندي', 'بنغلاديشي', 'سوداني', 'إثيوبي', 'نيبالي', 'فلبيني', 'إندونيسي', 'أخرى'];
const CITIES = ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الظهران', 'القصيم', 'أبها', 'تبوك', 'حائل', 'الطائف'];
const APPS = [
  { value: 'toyou',         label: 'ToYou' },
  { value: 'hungerstation', label: 'HungerStation' },
  { value: 'jahez',         label: 'جاهز' },
  { value: 'keeta',         label: 'كيتا' },
  { value: 'chefz',         label: 'The Chefz' },
];

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function DriverForm({ isOpen, onClose, driver, onSave }: DriverFormProps) {
  const [formData, setFormData] = useState<DriverFormState>(initialState);
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { logAction } = useAuditLog();

  useEffect(() => {
    if (driver) {
      setFormData({
        full_name:     driver.full_name,
        iqama:         driver.iqama,
        license_expiry: driver.license_expiry,
        iqama_expiry:  driver.iqama_expiry,
        medical_expiry: driver.medical_expiry,
        status:        driver.status,
        manager:       driver.manager ?? '',
        using_app:     driver.using_app ?? false,
        photo_url:     driver.photo_url ?? '',
        nationality:   driver.nationality ?? '',
        phone:         driver.phone ?? '',
        city:          driver.city ?? '',
        profession:    driver.profession ?? '',
        ajeer_expiry:  driver.ajeer_expiry ?? '',
        app_name:      driver.app_name ?? '',
      });
      setPhotoPreview(driver.photo_url ?? null);
    } else {
      setFormData(initialState);
      setPhotoPreview(null);
    }
  }, [driver, isOpen]);

  const set = (key: keyof DriverFormState, value: unknown) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      if (DEMO_MODE) {
        const dataUrl = await readFileAsDataUrl(file);
        set('photo_url', dataUrl);
        setPhotoPreview(dataUrl);
        toast.success('تم رفع الصورة');
        return;
      }

      const ext  = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('driver-photos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('driver-photos').getPublicUrl(path);
      set('photo_url', publicUrl);
      setPhotoPreview(publicUrl);
      toast.success('تم رفع الصورة');
    } catch (error: unknown) {
      toast.error('فشل رفع الصورة: ' + getErrorMessage(error, 'Unexpected upload error'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        ajeer_expiry: formData.ajeer_expiry || null,
        app_name: formData.app_name || null,
        city: formData.city || null,
        manager: formData.manager || null,
        nationality: formData.nationality || null,
        phone: formData.phone || null,
        photo_url: formData.photo_url || null,
        profession: formData.profession || null,
      } satisfies Partial<DriverInsert>;
      if (DEMO_MODE) {
        const saved = upsertDemoDriver(payload, driver?.id);
        await logAction({
          action: driver?.id ? 'driver.updated' : 'driver.created',
          table_name: 'drivers',
          record_id: saved.id,
          old_values: driver ?? null,
          new_values: saved,
        });
        toast.success(driver?.id ? 'تم تحديث بيانات المندوب' : 'تم إضافة المندوب بنجاح');
        onSave(); onClose(); setFormData(initialState);
        return;
      }

      if (driver?.id) {
        const { data: updated, error } = await supabase.from('drivers').update(payload).eq('id', driver.id).select('*').single();
        if (error) throw error;
        await logAction({ action: 'driver.updated', table_name: 'drivers', record_id: driver.id, old_values: driver, new_values: updated });
        toast.success('تم تحديث بيانات المندوب');
      } else {
        const { data: created, error } = await supabase.from('drivers').insert(payload).select('*').single();
        if (error) throw error;
        await logAction({ action: 'driver.created', table_name: 'drivers', record_id: created.id, new_values: created });
        toast.success('تم إضافة المندوب بنجاح');
      }
      onSave(); onClose(); setFormData(initialState);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'حدث خطأ أثناء الحفظ'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-modal max-h-[92vh] max-w-[700px] border-white/10 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-right text-2xl text-white">
            {driver ? 'تعديل بيانات المندوب' : 'إضافة مندوب جديد'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-1">
          <form onSubmit={handleSubmit} className="space-y-6 px-1 pb-2 pt-2">

            {/* صورة المندوب */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border-2 border-primary/30 bg-white/5 transition hover:border-primary/60"
                onClick={() => fileRef.current?.click()}
              >
                {photoPreview
                  ? <img src={photoPreview} alt="صورة المندوب" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center"><User className="h-10 w-10 text-muted-foreground" /></div>}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition hover:opacity-100">
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">اضغط لرفع صورة المندوب</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} />
            </div>

            {/* البيانات الشخصية */}
            <fieldset className="space-y-4 rounded-[20px] border border-white/8 p-4">
              <legend className="px-2 text-sm font-semibold text-primary">البيانات الشخصية</legend>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="block text-right">الاسم الكامل *</Label>
                  <Input value={formData.full_name} onChange={(e) => set('full_name', e.target.value)} required className="text-right" placeholder="اسم المندوب كاملًا" />
                </div>
                <div className="space-y-2">
                  <Label className="block text-right">رقم الإقامة *</Label>
                  <Input value={formData.iqama} onChange={(e) => set('iqama', e.target.value)} required className="text-right" placeholder="10 أرقام" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="block text-right">رقم الجوال</Label>
                  <Input value={formData.phone ?? ''} onChange={(e) => set('phone', e.target.value)} className="text-right" placeholder="05xxxxxxxx" />
                </div>
                <div className="space-y-2">
                  <Label className="block text-right">المهنة</Label>
                  <Input value={formData.profession ?? ''} onChange={(e) => set('profession', e.target.value)} className="text-right" placeholder="سائق / مندوب توصيل" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="block text-right">الجنسية</Label>
                  <Select value={formData.nationality ?? ''} onValueChange={(v) => set('nationality', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر الجنسية" /></SelectTrigger>
                    <SelectContent>
                      {NATIONALITIES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="block text-right">المدينة</Label>
                  <Select value={formData.city ?? ''} onValueChange={(v) => set('city', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                    <SelectContent>
                      {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>

            {/* تواريخ انتهاء الوثائق */}
            <fieldset className="space-y-4 rounded-[20px] border border-white/8 p-4">
              <legend className="px-2 text-sm font-semibold text-primary">تواريخ انتهاء الوثائق</legend>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="block text-right">انتهاء الإقامة *</Label>
                  <Input type="date" value={formData.iqama_expiry} onChange={(e) => set('iqama_expiry', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label className="block text-right">انتهاء الرخصة *</Label>
                  <Input type="date" value={formData.license_expiry} onChange={(e) => set('license_expiry', e.target.value)} required />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="block text-right">انتهاء الفحص الطبي *</Label>
                  <Input type="date" value={formData.medical_expiry} onChange={(e) => set('medical_expiry', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label className="block text-right">انتهاء تصريح أجير</Label>
                  <Input type="date" value={formData.ajeer_expiry ?? ''} onChange={(e) => set('ajeer_expiry', e.target.value)} />
                </div>
              </div>
            </fieldset>

            {/* الحالة والتطبيق */}
            <fieldset className="space-y-4 rounded-[20px] border border-white/8 p-4">
              <legend className="px-2 text-sm font-semibold text-primary">الحالة والتطبيق</legend>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="block text-right">الحالة</Label>
                  <Select value={formData.status ?? 'new'} onValueChange={(v) => set('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">جديد</SelectItem>
                      <SelectItem value="accepted">مقبول</SelectItem>
                      <SelectItem value="sponsored">على الكفالة</SelectItem>
                      <SelectItem value="frozen">مجمّد</SelectItem>
                      <SelectItem value="stopped">متوقف</SelectItem>
                      <SelectItem value="archived">مؤرشف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="block text-right">التطبيق المرتبط</Label>
                  <Select value={formData.app_name ?? ''} onValueChange={(v) => set('app_name', v)}>
                    <SelectTrigger><SelectValue placeholder="اختر التطبيق" /></SelectTrigger>
                    <SelectContent>
                      {APPS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="block text-right">المدير / المشرف</Label>
                <Input value={formData.manager ?? ''} onChange={(e) => set('manager', e.target.value)} className="text-right" placeholder="اسم المشرف المسؤول" />
              </div>

              <label className="flex items-center justify-end gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white cursor-pointer">
                <span>مرتبط بتطبيق نشط</span>
                <input type="checkbox" checked={Boolean(formData.using_app)}
                  onChange={(e) => set('using_app', e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-transparent" />
              </label>
            </fieldset>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>إلغاء</Button>
              <Button type="submit" disabled={loading || uploading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />جارٍ الحفظ...</> : driver ? 'حفظ التعديلات' : 'إضافة المندوب'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

