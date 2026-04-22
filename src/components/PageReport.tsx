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

interface PageReportProps {
  currentView: string;
  data: (Driver | Car)[];
  drivers: Driver[];
}

export const PageReport = ({ currentView, data, drivers }: PageReportProps) => {
  const getReportForView = () => {
    const now = new Date();
    
    if (currentView.startsWith('drivers')) {
      const driversData = data as Driver[];
      
      switch (currentView) {
        case 'drivers_new': {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const newThisWeek = driversData.length;
          const previousWeek = drivers.filter(d => {
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            return d.createdAt >= twoWeeksAgo && d.createdAt < weekAgo;
          }).length;
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{newThisWeek}</div>
                <div className="text-sm text-muted-foreground">متقدمين هذا الأسبوع</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{previousWeek}</div>
                <div className="text-sm text-muted-foreground">متقدمين الأسبوع الماضي</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {newThisWeek - previousWeek > 0 ? '+' : ''}{newThisWeek - previousWeek}
                </div>
                <div className="text-sm text-muted-foreground">الفرق</div>
              </div>
            </div>
          );
        }
        
        case 'drivers_accepted': {
          const accepted = driversData.filter(d => d.accepted).length;
          const pending = drivers.filter(d => !d.accepted && !d.archived).length;
          const acceptanceRate = drivers.length > 0 ? ((accepted / drivers.length) * 100).toFixed(1) : '0';
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{accepted}</div>
                <div className="text-sm text-muted-foreground">مقبولين</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{pending}</div>
                <div className="text-sm text-muted-foreground">في الانتظار</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{acceptanceRate}%</div>
                <div className="text-sm text-muted-foreground">معدل القبول</div>
              </div>
            </div>
          );
        }
        
        case 'drivers_sponsored': {
          const sponsored = driversData.filter(d => d.sponsored).length;
          const notSponsored = driversData.filter(d => !d.sponsored).length;
          const sponsorshipRate = driversData.length > 0 ? ((sponsored / driversData.length) * 100).toFixed(1) : '0';
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{sponsored}</div>
                <div className="text-sm text-muted-foreground">على الكفالة</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{notSponsored}</div>
                <div className="text-sm text-muted-foreground">بدون كفالة</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{sponsorshipRate}%</div>
                <div className="text-sm text-muted-foreground">معدل الكفالة</div>
              </div>
            </div>
          );
        }
        
        case 'drivers_ajer': {
          const ajerDrivers = driversData.filter(d => d.ajer).length;
          const nonAjer = driversData.filter(d => !d.ajer).length;
          const ajerRate = driversData.length > 0 ? ((ajerDrivers / driversData.length) * 100).toFixed(1) : '0';
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{ajerDrivers}</div>
                <div className="text-sm text-muted-foreground">عقود أجير</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{nonAjer}</div>
                <div className="text-sm text-muted-foreground">عقود أخرى</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{ajerRate}%</div>
                <div className="text-sm text-muted-foreground">نسبة عقود أجير</div>
              </div>
            </div>
          );
        }
        
        case 'drivers_archived': {
          const archivedDrivers = driversData.filter(d => d.archived).length;
          const totalDrivers = drivers.length;
          const archiveRate = totalDrivers > 0 ? ((archivedDrivers / totalDrivers) * 100).toFixed(1) : '0';
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{archivedDrivers}</div>
                <div className="text-sm text-muted-foreground">مناديب مؤرشفين</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{totalDrivers - archivedDrivers}</div>
                <div className="text-sm text-muted-foreground">مناديب نشطين</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{archiveRate}%</div>
                <div className="text-sm text-muted-foreground">معدل الأرشفة</div>
              </div>
            </div>
          );
        }
        
        default: {
          const active = driversData.filter(d => d.status === 'نشط').length;
          const frozen = driversData.filter(d => d.status === 'مجمد').length;
          const stopped = driversData.filter(d => d.status === 'متوقف').length;
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{active}</div>
                <div className="text-sm text-muted-foreground">نشط</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{frozen}</div>
                <div className="text-sm text-muted-foreground">مجمد</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{stopped}</div>
                <div className="text-sm text-muted-foreground">متوقف</div>
              </div>
            </div>
          );
        }
      }
    }
    
    if (currentView.startsWith('cars')) {
      const carsData = data as Car[];
      
      switch (currentView) {
        case 'cars_delegated': {
          const delegated = carsData.filter(c => c.status === 'مفوضة').length;
          const nearExpiry = carsData.filter(c => {
            if (c.status !== 'مفوضة' || !c.delegationEnd) return false;
            const delegationEndDate = c.delegationEnd instanceof Date ? c.delegationEnd : new Date(c.delegationEnd);
            const daysBetween = Math.ceil((delegationEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return daysBetween <= 3;
          }).length;
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{delegated}</div>
                <div className="text-sm text-muted-foreground">سيارات مفوضة</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{nearExpiry}</div>
                <div className="text-sm text-muted-foreground">قرب انتهاء التفويض</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{delegated - nearExpiry}</div>
                <div className="text-sm text-muted-foreground">تفويضات آمنة</div>
              </div>
            </div>
          );
        }
        
        case 'cars_handed': {
          const handed = carsData.filter(c => c.status === 'مسلمة').length;
          const availableForDelegation = handed;
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{handed}</div>
                <div className="text-sm text-muted-foreground">سيارات مسلمة</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{availableForDelegation}</div>
                <div className="text-sm text-muted-foreground">جاهزة للتفويض</div>
              </div>
            </div>
          );
        }
        
        case 'cars_oos': {
          const outOfService = carsData.filter(c => c.status === 'خارج الخدمة').length;
          const totalCars = carsData.length;
          const oosRate = totalCars > 0 ? ((outOfService / totalCars) * 100).toFixed(1) : '0';
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{outOfService}</div>
                <div className="text-sm text-muted-foreground">خارج الخدمة</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{totalCars - outOfService}</div>
                <div className="text-sm text-muted-foreground">في الخدمة</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{oosRate}%</div>
                <div className="text-sm text-muted-foreground">معدل التعطل</div>
              </div>
            </div>
          );
        }
        
        default: {
          const delegated = carsData.filter(c => c.status === 'مفوضة').length;
          const handed = carsData.filter(c => c.status === 'مسلمة').length;
          const oos = carsData.filter(c => c.status === 'خارج الخدمة').length;
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{delegated}</div>
                <div className="text-sm text-muted-foreground">مفوضة</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{handed}</div>
                <div className="text-sm text-muted-foreground">مسلمة</div>
              </div>
              <div className="glass rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{oos}</div>
                <div className="text-sm text-muted-foreground">خارج الخدمة</div>
              </div>
            </div>
          );
        }
      }
    }
    
    return null;
  };

  if (currentView === 'drivers_all' || currentView === 'cars_all') {
    return null; // لا نعرض تقرير في الصفحة الرئيسية
  }

  return (
    <div className="glass rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">تقرير الصفحة</h3>
      {getReportForView()}
    </div>
  );
};