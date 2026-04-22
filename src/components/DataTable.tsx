import { StatusTag } from './StatusTag';
import { Button } from './ui/button';
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
  startDate?: Date;
  endDate?: Date;
  endReason?: string;
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

interface DataTableProps {
  data: (Driver | Car)[];
  type: 'drivers' | 'cars';
  onRowClick: (item: Driver | Car) => void;
  drivers?: Driver[]; // For car table to resolve delegate names
}

export const DataTable = ({ data, type, onRowClick, drivers = [] }: DataTableProps) => {

  if (type === 'drivers') {
    const driversData = data as Driver[];
    
    return (
      <div className="glass rounded-lg overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full font-cairo">
            <thead className="bg-accent/20 border-b border-border">
              <tr>
                <th className="text-right p-3 font-semibold text-sm">الاسم الكامل</th>
                <th className="text-right p-3 font-semibold text-sm">الرقم الوظيفي</th>
                <th className="text-right p-3 font-semibold text-sm">رقم الهوية</th>
                <th className="text-right p-3 font-semibold text-sm">انتهاء الهوية</th>
                <th className="text-right p-3 font-semibold text-sm">انتهاء الرخصة</th>
                <th className="text-right p-3 font-semibold text-sm">الحالة</th>
                <th className="text-right p-3 font-semibold text-sm">المدير</th>
                <th className="text-right p-3 font-semibold text-sm">التطبيق</th>
                {driversData.some(d => d.archived) && (
                  <>
                    <th className="text-right p-3 font-semibold text-sm">تاريخ الانتهاء</th>
                    <th className="text-right p-3 font-semibold text-sm">سبب الانتهاء</th>
                  </>
                )}
                <th className="text-right p-3 font-semibold text-sm">تفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {driversData.map((driver, index) => {
                const iqamaDays = daysBetween(new Date(), driver.iqamaExpiry);
                const licenseDays = daysBetween(new Date(), driver.licenseExpiry);
                
                return (
                  <tr key={driver.id} className={index % 2 === 0 ? 'bg-accent/5' : ''}>
                    <td className="p-3 text-sm">{driver.fullName}</td>
                    <td className="p-3 text-sm">{driver.id}</td>
                    <td className="p-3 text-sm">{driver.iqama}</td>
                    <td className="p-3">
                      <StatusTag 
                        status={formatDateArabic(driver.iqamaExpiry)} 
                        type="date" 
                        daysLeft={iqamaDays} 
                      />
                    </td>
                    <td className="p-3">
                      <StatusTag 
                        status={formatDateArabic(driver.licenseExpiry)} 
                        type="date" 
                        daysLeft={licenseDays} 
                      />
                    </td>
                    <td className="p-3">
                      <StatusTag status={driver.status} type="driver" />
                    </td>
                    <td className="p-3 text-sm">{driver.manager}</td>
                    <td className="p-3 text-sm">{driver.app || '—'}</td>
                    {driver.archived && (
                      <>
                        <td className="p-3 text-sm">
                          {formatDateArabic(driver.endDate)}
                        </td>
                        <td className="p-3 text-sm">{driver.endReason || '—'}</td>
                      </>
                    )}
                    <td className="p-3">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="glass-button-hover"
                        onClick={() => onRowClick(driver)}
                      >
                        عرض
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Cars table
  const carsData = data as Car[];
  
  return (
    <div className="glass rounded-lg overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full font-cairo">
          <thead className="bg-accent/20 border-b border-border">
            <tr>
              <th className="text-right p-3 font-semibold text-sm">رقم اللوحة</th>
              <th className="text-right p-3 font-semibold text-sm">نوع السيارة</th>
              <th className="text-right p-3 font-semibold text-sm">الحالة</th>
              <th className="text-right p-3 font-semibold text-sm">المندوب الحالي</th>
              <th className="text-right p-3 font-semibold text-sm">بداية التفويض</th>
              <th className="text-right p-3 font-semibold text-sm">نهاية التفويض</th>
              <th className="text-right p-3 font-semibold text-sm">تنبيه تعدد مفوضين</th>
              <th className="text-right p-3 font-semibold text-sm">تفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {carsData.map((car, index) => {
              const delegateDriver = car.delegateId ? 
                drivers.find(d => d.id === car.delegateId) : null;
              const delegateName = delegateDriver?.fullName || car.delegateId || '—';
              const hasMultipleDelegates = car.history.length > 1;
              const delegationDays = car.delegationEnd ? 
                daysBetween(new Date(), car.delegationEnd instanceof Date ? car.delegationEnd : new Date(car.delegationEnd)) : null;
              
              return (
                <tr key={car.plate} className={index % 2 === 0 ? 'bg-accent/5' : ''}>
                  <td className="p-3 text-sm">{car.plate}</td>
                  <td className="p-3 text-sm">{car.type}</td>
                  <td className="p-3">
                    <StatusTag status={car.status} type="car" />
                  </td>
                  <td className="p-3 text-sm">{delegateName}</td>
                  <td className="p-3 text-sm">{formatDateArabic(car.delegationStart)}</td>
                  <td className="p-3">
                    {car.delegationEnd ? (
                      <StatusTag 
                        status={formatDateArabic(car.delegationEnd)} 
                        type="date" 
                        daysLeft={delegationDays || 0} 
                      />
                    ) : '—'}
                  </td>
                  <td className="p-3">
                    {hasMultipleDelegates ? (
                      <StatusTag status="تنبيه" type="date" daysLeft={0} />
                    ) : '—'}
                  </td>
                  <td className="p-3">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="glass-button-hover"
                      onClick={() => onRowClick(car)}
                    >
                      عرض
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};