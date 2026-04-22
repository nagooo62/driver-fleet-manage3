// Mock data for the logistics management system

export interface Driver {
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

export interface Car {
  plate: string;
  type: string;
  status: string;
  delegateId?: string;
  delegationStart?: Date;
  delegationEnd?: Date;
  history: string[];
}

export interface InternalAd {
  id: number;
  title: string;
  body: string;
  date: string;
}

const addDays = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const mockDrivers: Driver[] = [
  {
    id: "EMP-1001",
    fullName: "محمد علي محمد",
    iqama: "2456789123",
    iqamaExpiry: addDays(2), // قريب الانتهاء
    licenseExpiry: addDays(15),
    status: "نشط",
    accepted: true,
    sponsored: true,
    ajer: true,
    archived: false,
    manager: "الوليد",
    app: "ToYou",
    createdAt: addDays(-30)
  },
  {
    id: "EMP-1002",
    fullName: "أحمد ياسر",
    iqama: "2456789345",
    iqamaExpiry: addDays(50),
    licenseExpiry: addDays(2), // قريب الانتهاء
    status: "مجمد",
    accepted: true,
    sponsored: false,
    ajer: false,
    archived: false,
    manager: "خالد",
    app: "جاهز",
    createdAt: addDays(-3)
  },
  {
    id: "EMP-1003",
    fullName: "معتز بدري",
    iqama: "2460011223",
    iqamaExpiry: addDays(120),
    licenseExpiry: addDays(180),
    status: "متوقف",
    accepted: false,
    sponsored: false,
    ajer: false,
    archived: false,
    manager: "عطا",
    app: "ذا شيفز",
    createdAt: addDays(-1) // متقدم جديد
  },
  {
    id: "EMP-1004",
    fullName: "عبدالإله وافي",
    iqama: "2477011223",
    iqamaExpiry: addDays(5),
    licenseExpiry: addDays(6),
    status: "نشط",
    accepted: true,
    sponsored: true,
    ajer: false,
    archived: false,
    manager: "الوليد",
    app: "جاهز",
    createdAt: addDays(-14)
  },
  {
    id: "EMP-1005",
    fullName: "رامي سر الختم",
    iqama: "2488811223",
    iqamaExpiry: addDays(400),
    licenseExpiry: addDays(400),
    status: "نشط",
    accepted: true,
    sponsored: true,
    ajer: true,
    archived: false,
    manager: "الوليد",
    app: "ToYou",
    createdAt: addDays(-60)
  },
  // مناديب مؤرشفين
  {
    id: "EMP-1006",
    fullName: "سامي أحمد",
    iqama: "2400011223",
    iqamaExpiry: addDays(-30), // منتهية
    licenseExpiry: addDays(-10),
    status: "متوقف",
    accepted: true,
    sponsored: false,
    ajer: false,
    archived: true,
    manager: "خالد",
    app: "جاهز",
    createdAt: addDays(-120),
    startDate: addDays(-120),
    endDate: addDays(-30),
    endReason: "انتهاء الهوية"
  },
  {
    id: "EMP-1007",
    fullName: "عمر الطيب",
    iqama: "2411122334",
    iqamaExpiry: addDays(-60),
    licenseExpiry: addDays(-45),
    status: "متوقف",
    accepted: true,
    sponsored: true,
    ajer: false,
    archived: true,
    manager: "عطا",
    app: "ToYou",
    createdAt: addDays(-200),
    startDate: addDays(-200),
    endDate: addDays(-60),
    endReason: "استقالة"
  },
  {
    id: "EMP-1008",
    fullName: "علي حسن محمد",
    iqama: "2422334455",
    iqamaExpiry: addDays(-15),
    licenseExpiry: addDays(-20),
    status: "متوقف",
    accepted: true,
    sponsored: true,
    ajer: true,
    archived: true,
    manager: "الوليد",
    app: "ToYou",
    createdAt: addDays(-180),
    startDate: addDays(-180),
    endDate: addDays(-15),
    endReason: "فصل"
  },
  {
    id: "EMP-1009",
    fullName: "بشير عثمان",
    iqama: "2433445566",
    iqamaExpiry: addDays(-90),
    licenseExpiry: addDays(-85),
    status: "متوقف",
    accepted: true,
    sponsored: false,
    ajer: false,
    archived: true,
    manager: "خالد",
    app: "جاهز",
    createdAt: addDays(-250),
    startDate: addDays(-250),
    endDate: addDays(-90),
    endReason: "نقل لشركة أخرى"
  }
];

export const mockCars: Car[] = [
  {
    plate: "ح ل ج 1234",
    type: "هيونداي أكسنت 2021",
    status: "مفوضة",
    delegateId: "EMP-1001",
    delegationStart: addDays(-20),
    delegationEnd: addDays(10),
    history: ["EMP-1004", "EMP-1001"]
  },
  {
    plate: "ن ع ر 5521",
    type: "تويوتا يارس 2020",
    status: "مسلمة",
    delegateId: undefined,
    delegationStart: undefined,
    delegationEnd: undefined,
    history: []
  },
  {
    plate: "د و س 7788",
    type: "كيا ريو 2019",
    status: "خارج الخدمة",
    delegateId: undefined,
    delegationStart: undefined,
    delegationEnd: undefined,
    history: ["EMP-1002", "EMP-1003", "EMP-1004"]
  },
  {
    plate: "ع س ي 6677",
    type: "هيونداي إلينترا 2022",
    status: "مفوضة",
    delegateId: "EMP-1004",
    delegationStart: addDays(-3),
    delegationEnd: addDays(2), // على وشك النهاية
    history: ["EMP-1004"]
  }
];

export const mockInternalAds: InternalAd[] = [
  {
    id: 1,
    title: "تحديث لائحة السلامة",
    body: "يرجى التأكد من وجود طفاية الحريق في كل مركبة.",
    date: new Date().toLocaleDateString('en-GB')
  },
  {
    id: 2,
    title: "تجديد الرخص",
    body: "أي رخصة تنتهي خلال أسبوع يجب رفع صورة التجديد.",
    date: new Date().toLocaleDateString('en-GB')
  }
];