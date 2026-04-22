import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { StatusTag } from './StatusTag';
import { formatDateArabic, daysBetween } from '@/lib/dateUtils';

interface Driver {
  id: string;
  fullName: string;
  iqama: string;
  iqamaExpiry: Date;
  licenseExpiry: Date;
  status: string;
  manager: string;
  app?: string;
  accepted: boolean;
  sponsored: boolean;
  ajer: boolean;
  archived: boolean;
  createdAt: Date;
}

interface Car {
  plate: string;
  type: string;
  status: string;
  delegateId?: string;
  delegationStart?: Date;
  delegationEnd?: Date;
  history: string[];
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any | null;
  type: 'driver' | 'car';
  drivers?: any[];
  onEdit?: (item: any) => void;
}

export const DetailModal = ({ isOpen, onClose, data, type, drivers = [], onEdit }: DetailModalProps) => {
  if (!data) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (type === 'driver') {
    const driver = data;
    const iqamaDays = daysBetween(new Date(), new Date(driver.iqama_expiry));
    const licenseDays = daysBetween(new Date(), new Date(driver.license_expiry));

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="glass max-w-2xl animate-scale-in font-cairo max-h-[90vh] flex flex-col" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">تفاصيل المندوب — {driver.full_name}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-lg p-4 space-y-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">الاسم الكامل</div>
                <div className="font-medium">{driver.full_name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">المعرف</div>
                <div className="font-medium">{driver.id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">رقم الإقامة</div>
                <div className="font-medium">{driver.iqama}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">المدير</div>
                <div className="font-medium">{driver.manager}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">يستخدم التطبيق</div>
                <div className="font-medium">{driver.using_app ? 'نعم' : 'لا'}</div>
              </div>
            </div>

            <div className="glass rounded-lg p-4 space-y-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">انتهاء الإقامة</div>
                <StatusTag 
                  status={formatDateArabic(new Date(driver.iqama_expiry))} 
                  type="date" 
                  daysLeft={iqamaDays} 
                />
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">انتهاء الرخصة</div>
                <StatusTag 
                  status={formatDateArabic(new Date(driver.license_expiry))} 
                  type="date" 
                  daysLeft={licenseDays} 
                />
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">انتهاء الطبي</div>
                <StatusTag 
                  status={formatDateArabic(new Date(driver.medical_expiry))} 
                  type="date" 
                  daysLeft={daysBetween(new Date(), new Date(driver.medical_expiry))} 
                />
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">الحالة</div>
                <StatusTag status={driver.status} type="driver" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="secondary" 
              className="glass-button-hover"
              onClick={() => onEdit && onEdit(driver)}
            >
              تعديل
            </Button>
            <Button variant="destructive" className="glass-button-hover">حذف</Button>
            <Button 
              variant="outline"
              className="glass-button-hover"
              onClick={() => copyToClipboard(driver.id)}
            >
              نسخ المعرف
            </Button>
          </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  // Car modal
  const car = data;
  const delegateDriver = car.current_delegate_id ? 
    drivers.find(d => d.id === car.current_delegate_id) : null;
  const delegateName = delegateDriver?.full_name || car.current_delegate?.full_name || '—';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass max-w-2xl animate-scale-in font-cairo max-h-[90vh] flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl">تفاصيل السيارة — {car.plate}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="glass rounded-lg p-4 space-y-3">
          <div>
            <div className="text-sm text-muted-foreground mb-1">اللوحة</div>
            <div className="font-medium">{car.plate}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">النوع</div>
            <div className="font-medium">{car.type}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">الحالة</div>
            <StatusTag status={car.status} type="car" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">المندوب الحالي</div>
            <div className="font-medium">{delegateName}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">بداية التفويض</div>
            <div className="font-medium">{car.delegation_start ? formatDateArabic(new Date(car.delegation_start)) : '—'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">نهاية التفويض</div>
            <div className="font-medium">{car.delegation_end ? formatDateArabic(new Date(car.delegation_end)) : '—'}</div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            variant="secondary" 
            className="glass-button-hover"
            onClick={() => onEdit && onEdit(car)}
          >
            تعديل
          </Button>
          <Button variant="destructive" className="glass-button-hover">وضع خارج الخدمة</Button>
          <Button variant="outline" className="glass-button-hover">إنهاء التفويض</Button>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};