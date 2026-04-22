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
import type { Car, CarInsert, Driver } from '@/types';

interface CarFormProps {
  isOpen: boolean;
  onClose: () => void;
  car?: Car | null;
  onSave: () => void;
}

type CarFormState = Pick<
  CarInsert,
  'plate' | 'type' | 'status' | 'current_delegate_id' | 'delegation_start' | 'delegation_end'
>;

const initialState: CarFormState = {
  plate: '',
  type: '',
  status: 'available',
  current_delegate_id: null,
  delegation_start: null,
  delegation_end: null,
};

export function CarForm({ isOpen, onClose, car, onSave }: CarFormProps) {
  const [formData, setFormData] = useState<CarFormState>(initialState);
  const [drivers, setDrivers] = useState<Pick<Driver, 'id' | 'full_name'>[]>([]);
  const [loading, setLoading] = useState(false);
  const { logAction } = useAuditLog();

  useEffect(() => {
    if (car) {
      setFormData({
        plate: car.plate,
        type: car.type,
        status: car.status,
        current_delegate_id: car.current_delegate_id,
        delegation_start: car.delegation_start,
        delegation_end: car.delegation_end,
      });
    } else {
      setFormData(initialState);
    }
  }, [car, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    supabase
      .from('drivers')
      .select('id, full_name')
      .in('status', ['accepted', 'sponsored'])
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching drivers:', error);
          return;
        }
        setDrivers((data ?? []) as Pick<Driver, 'id' | 'full_name'>[]);
      });
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload: CarFormState = {
        ...formData,
        current_delegate_id: formData.current_delegate_id || null,
        delegation_start: formData.delegation_start || null,
        delegation_end: formData.delegation_end || null,
      };

      if (car?.id) {
        const { data: updatedCar, error } = await supabase
          .from('cars')
          .update(payload)
          .eq('id', car.id)
          .select('*, current_delegate:drivers!current_delegate_id(id, full_name)')
          .single();

        if (error) throw error;

        await logAction({
          action: 'car.updated',
          table_name: 'cars',
          record_id: car.id,
          old_values: car as unknown as Record<string, unknown>,
          new_values: updatedCar as Record<string, unknown>,
        });

        toast.success('تم تحديث السيارة بنجاح');
      } else {
        const { data: createdCar, error } = await supabase
          .from('cars')
          .insert(payload)
          .select('*, current_delegate:drivers!current_delegate_id(id, full_name)')
          .single();

        if (error) throw error;

        await logAction({
          action: 'car.created',
          table_name: 'cars',
          record_id: createdCar.id,
          new_values: createdCar as Record<string, unknown>,
        });

        toast.success('تم إضافة السيارة بنجاح');
      }

      onSave();
      onClose();
      setFormData(initialState);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء حفظ بيانات السيارة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-modal max-h-[90vh] max-w-[620px] border-white/10 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-right text-2xl text-white">
            {car ? 'تعديل السيارة' : 'إضافة سيارة جديدة'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-1">
          <form onSubmit={handleSubmit} className="space-y-5 px-1 pb-1 pt-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plate" className="block text-right">رقم اللوحة</Label>
                <Input
                  id="plate"
                  value={formData.plate}
                  onChange={(event) => setFormData({ ...formData, plate: event.target.value })}
                  required
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="block text-right">نوع السيارة</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(event) => setFormData({ ...formData, type: event.target.value })}
                  required
                  className="text-right"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="block text-right">الحالة</Label>
              <Select value={formData.status ?? 'available'} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">متاحة</SelectItem>
                  <SelectItem value="delegated">مفوّضة</SelectItem>
                  <SelectItem value="handed">مسلّمة</SelectItem>
                  <SelectItem value="out_of_service">خارج الخدمة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.status === 'delegated' || formData.status === 'handed') ? (
              <>
                <div className="space-y-2">
                  <Label className="block text-right">المندوب الحالي</Label>
                  <Select value={formData.current_delegate_id ?? undefined} onValueChange={(value) => setFormData({ ...formData, current_delegate_id: value || null })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المندوب" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driverItem) => (
                        <SelectItem key={driverItem.id} value={driverItem.id}>
                          {driverItem.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="delegation_start" className="block text-right">تاريخ بداية التفويض</Label>
                    <Input
                      id="delegation_start"
                      type="date"
                      value={formData.delegation_start ?? ''}
                      onChange={(event) => setFormData({ ...formData, delegation_start: event.target.value || null })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delegation_end" className="block text-right">تاريخ نهاية التفويض</Label>
                    <Input
                      id="delegation_end"
                      type="date"
                      value={formData.delegation_end ?? ''}
                      onChange={(event) => setFormData({ ...formData, delegation_end: event.target.value || null })}
                    />
                  </div>
                </div>
              </>
            ) : null}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'جارٍ الحفظ...' : car ? 'حفظ التعديلات' : 'إضافة السيارة'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

