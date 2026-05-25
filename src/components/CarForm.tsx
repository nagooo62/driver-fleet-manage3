import { useEffect, useRef, useState } from 'react';
import { Camera, Car as CarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useDrivers } from '@/hooks/useDrivers';
import { DEMO_MODE, readFileAsDataUrl, upsertDemoCar } from '@/lib/demoMode';
import type { Car, CarInsert } from '@/types';

interface CarFormProps {
  isOpen: boolean;
  onClose: () => void;
  car?: Car | null;
  onSave: () => void;
}

type CarFormState = Pick<
  CarInsert,
  | 'plate' | 'type' | 'status' | 'current_delegate_id' | 'delegation_start' | 'delegation_end'
  | 'photo_url' | 'brand' | 'model' | 'year' | 'color' | 'chassis_number'
  | 'inspection_expiry' | 'insurance_expiry' | 'operation_card_expiry'
>;

const initialState: CarFormState = {
  plate: '', type: '', status: 'available',
  current_delegate_id: null, delegation_start: null, delegation_end: null,
  photo_url: '', brand: '', model: '', year: undefined, color: '', chassis_number: '',
  inspection_expiry: null, insurance_expiry: null, operation_card_expiry: null,
};

const BRANDS = ['Toyota', 'Nissan', 'Hyundai', 'Kia', 'Ford', 'Mitsubishi', 'Suzuki', 'Honda', 'أخرى'];
const COLORS = ['أبيض', 'أسود', 'فضي', 'رمادي', 'أزرق', 'أحمر', 'أخضر', 'بيج', 'أخرى'];
const YEARS  = Array.from({ length: 15 }, (_, i) => 2024 - i);
const UNASSIGNED_DRIVER = '__unassigned__';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function CarForm({ isOpen, onClose, car, onSave }: CarFormProps) {
  const [formData, setFormData] = useState<CarFormState>(initialState);
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { logAction } = useAuditLog();
  const { data: driversData } = useDrivers({ page: 1, pageSize: 100, search: '', status: 'accepted' });

  useEffect(() => {
    if (car) {
      setFormData({
        plate: car.plate, type: car.type, status: car.status,
        current_delegate_id: car.current_delegate_id,
        delegation_start: car.delegation_start, delegation_end: car.delegation_end,
        photo_url: car.photo_url ?? '',
        brand: car.brand ?? '', model: car.model ?? '',
        year: car.year ?? undefined, color: car.color ?? '',
        chassis_number: car.chassis_number ?? '',
        inspection_expiry: car.inspection_expiry ?? null,
        insurance_expiry:  car.insurance_expiry  ?? null,
        operation_card_expiry: car.operation_card_expiry ?? null,
      });
      setPhotoPreview(car.photo_url ?? null);
    } else {
      setFormData(initialState);
      setPhotoPreview(null);
    }
  }, [car, isOpen]);

  const set = (key: keyof CarFormState, value: unknown) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      if (DEMO_MODE) {
        const dataUrl = await readFileAsDataUrl(file);
        set('photo_url', dataUrl);
        setPhotoPreview(dataUrl);
        toast.success('تم رفع صورة السيارة');
        return;
      }

      const ext  = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('car-photos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('car-photos').getPublicUrl(path);
      set('photo_url', publicUrl);
      setPhotoPreview(publicUrl);
      toast.success('تم رفع صورة السيارة');
    } catch (error: unknown) {
      toast.error('فشل الرفع: ' + getErrorMessage(error, 'Unexpected upload error'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (DEMO_MODE) {
        const saved = upsertDemoCar(formData, car?.id);
        await logAction({
          action: car?.id ? 'car.updated' : 'car.created',
          table_name: 'cars',
          record_id: saved.id,
          old_values: car ?? null,
          new_values: saved,
        });
        toast.success(car?.id ? 'تم تحديث بيانات السيارة' : 'تم إضافة السيارة بنجاح');
        onSave(); onClose(); setFormData(initialState);
        return;
      }

      if (car?.id) {
        const { data: updated, error } = await supabase.from('cars').update(formData).eq('id', car.id).select('*').single();
        if (error) throw error;
        await logAction({ action: 'car.updated', table_name: 'cars', record_id: car.id, old_values: car, new_values: updated });
        toast.success('تم تحديث بيانات السيارة');
      } else {
        const { data: created, error } = await supabase.from('cars').insert(formData).select('*').single();
        if (error) throw error;
        await logAction({ action: 'car.created', table_name: 'cars', record_id: created.id, new_values: created });
        toast.success('تم إضافة السيارة بنجاح');
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
            {car ? 'تعديل بيانات السيارة' : 'إضافة سيارة جديدة'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-1">
          <form onSubmit={handleSubmit} className="space-y-6 px-1 pb-2 pt-2">

            {/* صورة السيارة */}
            <div className="relative h-40 cursor-pointer overflow-hidden rounded-[20px] border border-white/10 bg-white/5"
              onClick={() => fileRef.current?.click()}>
              {photoPreview
                ? <img src={photoPreview} alt="السيارة" className="h-full w-full object-cover" />
                : <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <CarIcon className="h-10 w-10" />
                    <span className="text-sm">اضغط لرفع صورة السيارة</span>
                  </div>}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100 rounded-[20px]">
                {uploading ? <Loader2 className="h-8 w-8 animate-spin text-white" /> : <Camera className="h-8 w-8 text-white" />}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} />
            </div>

            {/* بيانات السيارة الأساسية */}
            <fieldset className="space-y-4 rounded-[20px] border border-white/8 p-4">
              <legend className="px-2 text-sm font-semibold text-primary">بيانات السيارة</legend>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="block text-right">رقم اللوحة *</Label>
                  <Input value={formData.plate} onChange={(e) => set('plate', e.target.value)} required className="text-right" placeholder="ABC 1234" />
                </div>
                <div className="space-y-2">
                  <Label className="block text-right">نوع السيارة *</Label>
                  <Input value={formData.type} onChange={(e) => set('type', e.target.value)} required className="text-right" placeholder="هايلوكس / H1 / ..." />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="block text-right">الماركة</Label>
                  <Select value={formData.brand ?? ''} onValueChange={(v) => set('brand', v)}>
                    <SelectTrigger><SelectValue placeholder="الماركة" /></SelectTrigger>
                    <SelectContent>{BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="block text-right">الموديل</Label>
                  <Input value={formData.model ?? ''} onChange={(e) => set('model', e.target.value)} className="text-right" placeholder="هايلوكس 2.7" />
                </div>
                <div className="space-y-2">
                  <Label className="block text-right">سنة الصنع</Label>
                  <Select value={formData.year?.toString() ?? ''} onValueChange={(v) => set('year', parseInt(v))}>
                    <SelectTrigger><SelectValue placeholder="السنة" /></SelectTrigger>
                    <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="block text-right">اللون</Label>
                  <Select value={formData.color ?? ''} onValueChange={(v) => set('color', v)}>
                    <SelectTrigger><SelectValue placeholder="اللون" /></SelectTrigger>
                    <SelectContent>{COLORS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="block text-right">رقم الهيكل (VIN)</Label>
                  <Input value={formData.chassis_number ?? ''} onChange={(e) => set('chassis_number', e.target.value)} className="text-right" placeholder="17 حرف/رقم" />
                </div>
              </div>
            </fieldset>

            {/* تواريخ الانتهاء */}
            <fieldset className="space-y-4 rounded-[20px] border border-white/8 p-4">
              <legend className="px-2 text-sm font-semibold text-primary">تواريخ انتهاء الوثائق</legend>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="block text-right">انتهاء الفحص الدوري</Label>
                  <Input type="date" value={formData.inspection_expiry ?? ''} onChange={(e) => set('inspection_expiry', e.target.value || null)} />
                </div>
                <div className="space-y-2">
                  <Label className="block text-right">انتهاء التأمين</Label>
                  <Input type="date" value={formData.insurance_expiry ?? ''} onChange={(e) => set('insurance_expiry', e.target.value || null)} />
                </div>
                <div className="space-y-2">
                  <Label className="block text-right">انتهاء كرت التشغيل</Label>
                  <Input type="date" value={formData.operation_card_expiry ?? ''} onChange={(e) => set('operation_card_expiry', e.target.value || null)} />
                </div>
              </div>
            </fieldset>

            {/* الحالة والتفويض */}
            <fieldset className="space-y-4 rounded-[20px] border border-white/8 p-4">
              <legend className="px-2 text-sm font-semibold text-primary">الحالة والتفويض</legend>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="block text-right">حالة السيارة</Label>
                  <Select value={formData.status ?? 'available'} onValueChange={(v) => set('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">متاحة</SelectItem>
                      <SelectItem value="delegated">مفوّضة</SelectItem>
                      <SelectItem value="maintenance">في الصيانة</SelectItem>
                      <SelectItem value="out_of_service">خارج الخدمة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="block text-right">المندوب المفوّض</Label>
                  <Select value={formData.current_delegate_id ?? UNASSIGNED_DRIVER} onValueChange={(v) => set('current_delegate_id', v === UNASSIGNED_DRIVER ? null : v)}>
                    <SelectTrigger><SelectValue placeholder="اختر مندوبًا" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED_DRIVER}>بدون مندوب</SelectItem>
                      {driversData?.items.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="block text-right">تاريخ بدء التفويض</Label>
                  <Input type="date" value={formData.delegation_start ?? ''} onChange={(e) => set('delegation_start', e.target.value || null)} />
                </div>
                <div className="space-y-2">
                  <Label className="block text-right">تاريخ نهاية التفويض</Label>
                  <Input type="date" value={formData.delegation_end ?? ''} onChange={(e) => set('delegation_end', e.target.value || null)} />
                </div>
              </div>
            </fieldset>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>إلغاء</Button>
              <Button type="submit" disabled={loading || uploading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />جارٍ الحفظ...</> : car ? 'حفظ التعديلات' : 'إضافة السيارة'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

