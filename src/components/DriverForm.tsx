import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';
import type { Driver, DriverInsert } from '@/types';

interface DriverFormProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: Driver | null;
  onSave: () => void;
}

type DriverFormState = Pick<
  DriverInsert,
  'full_name' | 'iqama' | 'license_expiry' | 'iqama_expiry' | 'medical_expiry' | 'status' | 'manager' | 'using_app'
>;

const initialState: DriverFormState = {
  full_name: '',
  iqama: '',
  license_expiry: '',
  iqama_expiry: '',
  medical_expiry: '',
  status: 'new',
  manager: '',
  using_app: false,
};

export function DriverForm({ isOpen, onClose, driver, onSave }: DriverFormProps) {
  const [formData, setFormData] = useState<DriverFormState>(initialState);
  const [loading, setLoading] = useState(false);
  const { logAction } = useAuditLog();

  useEffect(() => {
    if (driver) {
      setFormData({
        full_name: driver.full_name,
        iqama: driver.iqama,
        license_expiry: driver.license_expiry,
        iqama_expiry: driver.iqama_expiry,
        medical_expiry: driver.medical_expiry,
        status: driver.status,
        manager: driver.manager ?? '',
        using_app: driver.using_app ?? false,
      });
    } else {
      setFormData(initialState);
    }
  }, [driver, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (driver?.id) {
        const { data: updatedDriver, error } = await supabase
          .from('drivers')
          .update(formData)
          .eq('id', driver.id)
          .select('*')
          .single();

        if (error) throw error;

        await logAction({
          action: 'driver.updated',
          table_name: 'drivers',
          record_id: driver.id,
          old_values: driver as unknown as Record<string, unknown>,
          new_values: updatedDriver as Record<string, unknown>,
        });

        toast.success('تم تحديث بيانات المندوب بنجاح');
      } else {
        const { data: createdDriver, error } = await supabase
          .from('drivers')
          .insert(formData)
          .select('*')
          .single();

        if (error) throw error;

        await logAction({
          action: 'driver.created',
          table_name: 'drivers',
          record_id: createdDriver.id,
          new_values: createdDriver as Record<string, unknown>,
        });

        toast.success('تم إضافة المندوب بنجاح');
      }

      onSave();
      onClose();
      setFormData(initialState);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء حفظ بيانات المندوب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-modal max-h-[90vh] max-w-[620px] border-white/10 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-right text-2xl text-white">
            {driver ? 'تعديل المندوب' : 'إضافة مندوب جديد'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-1">
          <form onSubmit={handleSubmit} className="space-y-5 px-1 pb-1 pt-2">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="block text-right">الاسم الكامل</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(event) => setFormData({ ...formData, full_name: event.target.value })}
                required
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iqama" className="block text-right">رقم الإقامة</Label>
              <Input
                id="iqama"
                value={formData.iqama}
                onChange={(event) => setFormData({ ...formData, iqama: event.target.value })}
                required
                className="text-right"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="license_expiry" className="block text-right">انتهاء الرخصة</Label>
                <Input
                  id="license_expiry"
                  type="date"
                  value={formData.license_expiry}
                  onChange={(event) => setFormData({ ...formData, license_expiry: event.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iqama_expiry" className="block text-right">انتهاء الإقامة</Label>
                <Input
                  id="iqama_expiry"
                  type="date"
                  value={formData.iqama_expiry}
                  onChange={(event) => setFormData({ ...formData, iqama_expiry: event.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical_expiry" className="block text-right">انتهاء الفحص الطبي</Label>
                <Input
                  id="medical_expiry"
                  type="date"
                  value={formData.medical_expiry}
                  onChange={(event) => setFormData({ ...formData, medical_expiry: event.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="block text-right">الحالة</Label>
                <Select value={formData.status ?? 'new'} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Label htmlFor="manager" className="block text-right">المدير / المشرف</Label>
                <Input
                  id="manager"
                  value={formData.manager ?? ''}
                  onChange={(event) => setFormData({ ...formData, manager: event.target.value })}
                  className="text-right"
                />
              </div>
            </div>

            <label className="flex items-center justify-end gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
              <span>مرتبط بتطبيق نشط</span>
              <input
                type="checkbox"
                checked={Boolean(formData.using_app)}
                onChange={(event) => setFormData({ ...formData, using_app: event.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-transparent"
              />
            </label>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'جارٍ الحفظ...' : driver ? 'حفظ التعديلات' : 'إضافة المندوب'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
