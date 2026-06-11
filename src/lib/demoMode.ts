import type { Session, User } from '@supabase/supabase-js';
import { mockCars, mockDrivers } from '@/lib/mockData';
import toyouDriversData from '@/data/toyouDrivers.json';
import toyouArchiveData from '@/data/toyouArchive.json';
import type {
  Application,
  AuditLog,
  Car,
  CarInsert,
  CompanySettings,
  Driver,
  DriverDocument,
  DriverDocumentInsert,
  DriverOperationRecord,
  DriverInsert,
  NotificationItem,
  Profile,
  UserRole,
} from '@/types';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const STORAGE_KEYS = {
  user: 'rawaes-demo-user',
  drivers: 'rawaes-demo-drivers',
  cars: 'rawaes-demo-cars',
  documents: 'rawaes-demo-documents',
  notifications: 'rawaes-demo-notifications',
  audit: 'rawaes-demo-audit',
} as const;

const APPS: Application[] = [
  { id: 'app-toyou', name: 'toyou', display_name: 'ToYou', icon_url: null, is_active: true, created_at: nowIso(), updated_at: nowIso() },
  { id: 'app-hungerstation', name: 'hungerstation', display_name: 'HungerStation', icon_url: null, is_active: true, created_at: nowIso(), updated_at: nowIso() },
  { id: 'app-jahez', name: 'jahez', display_name: 'جاهز', icon_url: null, is_active: true, created_at: nowIso(), updated_at: nowIso() },
  { id: 'app-keeta', name: 'keeta', display_name: 'كيتا', icon_url: null, is_active: true, created_at: nowIso(), updated_at: nowIso() },
  { id: 'app-chefz', name: 'chefz', display_name: 'The Chefz', icon_url: null, is_active: true, created_at: nowIso(), updated_at: nowIso() },
];

const DEMO_COMPANY_SETTINGS: CompanySettings = {
  id: 'demo-company',
  company_name: 'روائس',
  legal_name: 'روائس للخدمات اللوجستية',
  official_email: 'ops@rawaes.local',
  headquarters_location: 'الرياض',
  phone_numbers: ['0550000000', '920000000'],
  commercial_register: '1010XXXXXX',
  tax_number: '3100XXXXXX',
  created_at: nowIso(),
  updated_at: nowIso(),
};

function nowIso() {
  return new Date().toISOString();
}

function toDateOnly(value: Date | string | null | undefined, fallbackDays = 90) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' && value) return value.slice(0, 10);
  const date = new Date();
  date.setDate(date.getDate() + fallbackDays);
  return date.toISOString().slice(0, 10);
}

function normalizeAppName(value?: string | null) {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes('toyou')) return 'toyou';
  if (normalized.includes('hunger')) return 'hungerstation';
  if (normalized.includes('جاهز') || normalized.includes('jahez')) return 'jahez';
  if (normalized.includes('كيتا') || normalized.includes('keeta')) return 'keeta';
  if (normalized.includes('chefz') || normalized.includes('شيف')) return 'chefz';
  return null;
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function hasMojibake(value: string | null | undefined) {
  return typeof value === 'string' && /[ØÙÃð]/.test(value);
}

function computeDocumentStatus(expiryDate: string | null | undefined): DriverDocument['status'] {
  if (!expiryDate) return 'missing';
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return 'expired';
  if (daysLeft <= 30) return 'expiring_soon';
  return 'valid';
}

interface RealToyouDriver {
  toyouId: string;
  name: string;
  nameEn: string;
  phone: string | null;
  city: string | null;
  status: string;
  carState: string;
  startDate: string | null;
  plate: string | null;
  notes: string | null;
}

interface RealToyouArchived {
  toyouId: string | null;
  name: string;
  nameEn: string;
  phone: string | null;
  city: string | null;
  startDate: string | null;
  endDate: string | null;
}

/** تاريخ مستقبلي بإزاحة أيام — للوثائق الافتراضية */
function futureDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** زرع المناديب الحقيقيين من دليل تشغيل المناديب (تطبيق تويو + الأرشيف) */
function seedDrivers(): Driver[] {
  const drivers: Driver[] = [];

  (toyouDriversData as RealToyouDriver[]).forEach((r, index) => {
    const st = r.status;
    const status = st.includes('فعال') && !st.includes('غير')
      ? 'sponsored'
      : st.includes('انتظار') ? 'new'
      : st.includes('متوقف') ? 'stopped'
      : 'accepted';
    drivers.push({
      id: `toyou-${r.toyouId}`,
      archived_reason: null,
      created_at: r.startDate ? `${r.startDate}T08:00:00.000Z` : nowIso(),
      end_date: null,
      full_name: r.name,
      iqama: `24${r.toyouId.padStart(8, '0')}`,
      iqama_expiry: futureDate(60 + (index * 13) % 300),
      license_expiry: futureDate(30 + (index * 17) % 320),
      manager: 'روائس',
      medical_expiry: futureDate(90 + (index * 11) % 240),
      status,
      updated_at: nowIso(),
      using_app: true,
      photo_url: null,
      nationality: 'سوداني',
      phone: r.phone ?? null,
      city: r.city ?? 'المدينة المنورة',
      profession: 'مندوب توصيل',
      ajeer_expiry: index % 3 === 0 ? futureDate(45 + (index * 7) % 200) : null,
      performance_score: 62 + ((index * 7) % 34),
      working_hours: 7 + (index % 5),
      orders_count: 12 + (index * 5) % 28,
      app_name: 'toyou',
    } satisfies Driver);
  });

  (toyouArchiveData as RealToyouArchived[]).slice(0, 60).forEach((r, index) => {
    if (!r.name) return;
    drivers.push({
      id: `toyou-arch-${r.toyouId ?? index}`,
      archived_reason: 'انتهاء التعاقد - أرشيف تويو',
      created_at: r.startDate ? `${r.startDate}T08:00:00.000Z` : nowIso(),
      end_date: r.endDate,
      full_name: r.name,
      iqama: `25${String(r.toyouId ?? 10000000 + index).padStart(8, '0')}`,
      iqama_expiry: futureDate(-30 - (index * 9) % 120),
      license_expiry: futureDate(-10 - (index * 13) % 90),
      manager: 'روائس',
      medical_expiry: futureDate(-5 - (index * 7) % 60),
      status: 'archived',
      updated_at: nowIso(),
      using_app: false,
      photo_url: null,
      nationality: 'سوداني',
      phone: r.phone ?? null,
      city: r.city ?? 'جدة',
      profession: 'مندوب توصيل',
      ajeer_expiry: null,
      performance_score: null,
      working_hours: null,
      orders_count: null,
      app_name: 'toyou',
    } satisfies Driver);
  });

  return drivers;
}

/** الزرع القديم من البيانات الوهمية — محفوظ كاحتياط غير مستخدم */
function seedMockDrivers(): Driver[] {
  return mockDrivers.map((driver, index) => {
    const status = driver.archived
      ? 'archived'
      : driver.sponsored
        ? 'sponsored'
        : driver.accepted
          ? 'accepted'
          : driver.status.includes('مجمد')
            ? 'frozen'
            : driver.status.includes('متوقف')
              ? 'stopped'
              : 'new';

    return {
      id: `demo-driver-${index + 1}`,
      archived_reason: driver.endReason ?? null,
      created_at: driver.createdAt.toISOString(),
      end_date: driver.endDate ? driver.endDate.toISOString().slice(0, 10) : null,
      full_name: decodeText(driver.fullName),
      iqama: driver.iqama,
      iqama_expiry: toDateOnly(driver.iqamaExpiry),
      license_expiry: toDateOnly(driver.licenseExpiry),
      manager: decodeText(driver.manager),
      medical_expiry: toDateOnly(driver.licenseExpiry, 120),
      status,
      updated_at: nowIso(),
      using_app: Boolean(driver.app),
      photo_url: null,
      nationality: 'سوداني',
      phone: `05${String(10000000 + index * 111111).slice(0, 8)}`,
      city: index % 2 === 0 ? 'الرياض' : 'جدة',
      profession: 'مندوب توصيل',
      ajeer_expiry: driver.ajer ? toDateOnly(driver.licenseExpiry, 60) : null,
      performance_score: 72 + ((index * 7) % 24),
      working_hours: 8 + (index % 4),
      orders_count: 18 + index * 3,
      app_name: normalizeAppName(driver.app),
    } satisfies Driver;
  });
}

function seedCars(): Car[] {
  const drivers = getDemoDrivers();
  const delegateMap = new Map(drivers.map((driver) => [driver.id.replace('demo-driver-', 'EMP-'), driver]));

  return mockCars.map((car, index) => {
    const status =
      car.status.includes('خارج') ? 'out_of_service' :
      car.status.includes('مفو') ? 'delegated' :
      'available';

    const currentDelegate = car.delegateId ? delegateMap.get(car.delegateId) : null;
    return {
      id: `demo-car-${index + 1}`,
      created_at: nowIso(),
      current_delegate_id: currentDelegate?.id ?? null,
      delegation_end: car.delegationEnd ? toDateOnly(car.delegationEnd) : null,
      delegation_start: car.delegationStart ? toDateOnly(car.delegationStart) : null,
      downtime_end: null,
      downtime_reason: null,
      downtime_start: null,
      plate: decodeText(car.plate),
      status,
      temporary_end_date: null,
      temporary_start_date: null,
      temporary_vehicle_plate: null,
      temporary_vehicle_type: null,
      type: decodeText(car.type),
      updated_at: nowIso(),
      photo_url: null,
      brand: null,
      model: null,
      year: null,
      color: null,
      chassis_number: null,
      inspection_expiry: toDateOnly(null, 120),
      insurance_expiry: toDateOnly(null, 180),
      operation_card_expiry: toDateOnly(null, 90),
      current_delegate: currentDelegate ? { id: currentDelegate.id, full_name: currentDelegate.full_name } : null,
    } satisfies Car;
  });
}

function seedDocuments(): DriverDocument[] {
  return getDemoDrivers().flatMap((driver) => {
    const rows: Array<{ docType: DriverDocument['doc_type']; expiry: string | null }> = [
      { docType: 'iqama_doc', expiry: driver.iqama_expiry },
      { docType: 'license_doc', expiry: driver.license_expiry },
      { docType: 'medical_doc', expiry: driver.medical_expiry },
    ];
    return rows.map((row, index) => ({
      id: `${driver.id}-${index + 1}`,
      driver_id: driver.id,
      doc_type: row.docType,
      file_url: null,
      file_name: null,
      file_size: null,
      mime_type: null,
      expiry_date: row.expiry,
      status: computeDocumentStatus(row.expiry),
      notes: null,
      uploaded_by: 'demo-user',
      created_at: nowIso(),
      updated_at: nowIso(),
    }));
  });
}

function seedNotifications(): NotificationItem[] {
  const items = getDemoDrivers()
    .slice(0, 5)
    .map((driver, index) => ({
      id: `demo-note-${index + 1}`,
      created_at: nowIso(),
      is_read: index > 1,
      message: `متابعة وثائق ${driver.full_name} وحالة التطبيق المرتبط به ضمن الوضع التجريبي المحلي.`,
      target_id: driver.id,
      target_type: 'driver',
      title: `تنبيه تشغيلي - ${driver.full_name}`,
      type: index % 2 === 0 ? 'iqama_expiry' : 'import_complete',
      updated_at: nowIso(),
      user_id: null,
      severity: index % 2 === 0 ? 'warning' : 'success',
      link: `/drivers/${driver.id}`,
    }));

  return [
    {
      id: 'demo-note-welcome',
      created_at: nowIso(),
      is_read: false,
      message: 'أنت الآن داخل وضع تجريبي محلي لأن مشروع Supabase الحالي غير متاح. يمكنك اختبار الواجهة والتنقل والعمليات الأساسية.',
      target_id: null,
      target_type: null,
      title: 'تم تفعيل الوضع التجريبي',
      type: 'success',
      updated_at: nowIso(),
      user_id: null,
      severity: 'success',
    },
    ...items,
  ];
}

function decodeText(value: string) {
  return value;
}

/** نسخة الزرع — ارفعها عند تغيير مصدر البيانات لإعادة الزرع تلقائياً */
const SEED_VERSION = '2-real-toyou';
const SEED_VERSION_KEY = 'rawaes-demo-seed-version';

export function getDemoDrivers() {
  const currentVersion = typeof window !== 'undefined'
    ? window.localStorage.getItem(SEED_VERSION_KEY)
    : SEED_VERSION;

  if (currentVersion !== SEED_VERSION) {
    const drivers = seedDrivers();
    writeStorage(STORAGE_KEYS.drivers, drivers);
    if (typeof window !== 'undefined') window.localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
    return drivers;
  }

  const fallback = seedDrivers();
  const drivers = readStorage<Driver[]>(STORAGE_KEYS.drivers, fallback);
  if (!readStorage<Driver[] | null>(STORAGE_KEYS.drivers, null)) writeStorage(STORAGE_KEYS.drivers, drivers);
  return drivers;
}

export function saveDemoDrivers(drivers: Driver[]) {
  writeStorage(STORAGE_KEYS.drivers, drivers);
}

export function upsertDemoDriver(payload: Partial<DriverInsert>, existingId?: string) {
  const drivers = getDemoDrivers();
  const current = existingId ? drivers.find((driver) => driver.id === existingId) : undefined;
  const driver: Driver = {
    archived_reason: payload.archived_reason ?? current?.archived_reason ?? null,
    created_at: current?.created_at ?? nowIso(),
    end_date: payload.end_date ?? current?.end_date ?? null,
    full_name: payload.full_name ?? current?.full_name ?? 'مندوب تجريبي',
    id: current?.id ?? existingId ?? `demo-driver-${Date.now()}`,
    iqama: payload.iqama ?? current?.iqama ?? `${Date.now()}`.slice(-10),
    iqama_expiry: payload.iqama_expiry ?? current?.iqama_expiry ?? toDateOnly(null, 60),
    license_expiry: payload.license_expiry ?? current?.license_expiry ?? toDateOnly(null, 90),
    manager: payload.manager ?? current?.manager ?? 'إدارة التشغيل',
    medical_expiry: payload.medical_expiry ?? current?.medical_expiry ?? toDateOnly(null, 120),
    status: payload.status ?? current?.status ?? 'new',
    updated_at: nowIso(),
    using_app: payload.using_app ?? current?.using_app ?? false,
    photo_url: payload.photo_url ?? current?.photo_url ?? null,
    nationality: payload.nationality ?? current?.nationality ?? 'سوداني',
    phone: payload.phone ?? current?.phone ?? null,
    city: payload.city ?? current?.city ?? 'الرياض',
    profession: payload.profession ?? current?.profession ?? 'مندوب توصيل',
    ajeer_expiry: payload.ajeer_expiry ?? current?.ajeer_expiry ?? null,
    performance_score: current?.performance_score ?? 80,
    working_hours: current?.working_hours ?? 8,
    orders_count: current?.orders_count ?? 0,
    app_name: payload.app_name ?? current?.app_name ?? null,
  };

  const next = current
    ? drivers.map((item) => (item.id === driver.id ? driver : item))
    : [driver, ...drivers];
  saveDemoDrivers(next);
  return driver;
}

export function getDemoCars() {
  const fallback = seedCars();
  const cars = readStorage<Car[]>(STORAGE_KEYS.cars, fallback);
  if (!readStorage<Car[] | null>(STORAGE_KEYS.cars, null)) writeStorage(STORAGE_KEYS.cars, cars);
  return cars;
}

export function saveDemoCars(cars: Car[]) {
  writeStorage(STORAGE_KEYS.cars, cars);
}

export function upsertDemoCar(payload: Partial<CarInsert>, existingId?: string) {
  const cars = getDemoCars();
  const current = existingId ? cars.find((car) => car.id === existingId) : undefined;
  const delegate = payload.current_delegate_id ? getDemoDrivers().find((driver) => driver.id === payload.current_delegate_id) : null;
  const car: Car = {
    id: current?.id ?? existingId ?? `demo-car-${Date.now()}`,
    created_at: current?.created_at ?? nowIso(),
    current_delegate_id: payload.current_delegate_id ?? current?.current_delegate_id ?? null,
    delegation_end: payload.delegation_end ?? current?.delegation_end ?? null,
    delegation_start: payload.delegation_start ?? current?.delegation_start ?? null,
    downtime_end: current?.downtime_end ?? null,
    downtime_reason: current?.downtime_reason ?? null,
    downtime_start: current?.downtime_start ?? null,
    plate: payload.plate ?? current?.plate ?? 'لوحة تجريبية',
    status: payload.status ?? current?.status ?? 'available',
    temporary_end_date: current?.temporary_end_date ?? null,
    temporary_start_date: current?.temporary_start_date ?? null,
    temporary_vehicle_plate: current?.temporary_vehicle_plate ?? null,
    temporary_vehicle_type: current?.temporary_vehicle_type ?? null,
    type: payload.type ?? current?.type ?? 'سيارة تجريبية',
    updated_at: nowIso(),
    photo_url: payload.photo_url ?? current?.photo_url ?? null,
    brand: payload.brand ?? current?.brand ?? null,
    model: payload.model ?? current?.model ?? null,
    year: payload.year ?? current?.year ?? null,
    color: payload.color ?? current?.color ?? null,
    chassis_number: payload.chassis_number ?? current?.chassis_number ?? null,
    inspection_expiry: payload.inspection_expiry ?? current?.inspection_expiry ?? null,
    insurance_expiry: payload.insurance_expiry ?? current?.insurance_expiry ?? null,
    operation_card_expiry: payload.operation_card_expiry ?? current?.operation_card_expiry ?? null,
    current_delegate: delegate ? { id: delegate.id, full_name: delegate.full_name } : current?.current_delegate ?? null,
  };

  const next = current
    ? cars.map((item) => (item.id === car.id ? car : item))
    : [car, ...cars];
  saveDemoCars(next);
  return car;
}

export function getDemoApplications() {
  return APPS;
}

export function getDemoApplicationRecords() {
  return getDemoDrivers()
    .filter((driver) => driver.app_name)
    .map((driver, index) => ({
      id: `demo-driver-app-${index + 1}`,
      application_id: `app-${driver.app_name}`,
      created_at: nowIso(),
      driver_id: driver.id,
      employee_id: driver.iqama,
      end_date: null,
      is_verified: index % 2 === 0,
      last_import_date: nowIso(),
      orders_count: driver.orders_count ?? 0,
      start_date: driver.created_at.slice(0, 10),
      updated_at: nowIso(),
      working_days: driver.working_hours ?? 0,
      applicationName: APPS.find((app) => app.name === driver.app_name)?.display_name ?? driver.app_name ?? 'غير معروف',
      driverName: driver.full_name,
    })) satisfies DriverOperationRecord[];
}

export function getDemoProfile(): Profile {
  const demoUser = getDemoUser();
  const fullName = typeof demoUser?.user_metadata?.full_name === 'string'
    ? demoUser.user_metadata.full_name
    : 'مستخدم تجريبي';

  return {
    id: 'demo-user',
    created_at: nowIso(),
    department: 'التشغيل',
    full_name: fullName,
    is_active: true,
    role: 'admin',
    updated_at: nowIso(),
  };
}

export function getDemoCompanySettings() {
  return DEMO_COMPANY_SETTINGS;
}

export function getDemoNotifications() {
  const fallback = seedNotifications();
  const notifications = readStorage<NotificationItem[]>(STORAGE_KEYS.notifications, fallback);
  const needsReset = notifications.some((item) => hasMojibake(item.title) || hasMojibake(item.message));

  if (needsReset) {
    writeStorage(STORAGE_KEYS.notifications, fallback);
    return fallback;
  }

  if (!readStorage<NotificationItem[] | null>(STORAGE_KEYS.notifications, null)) {
    writeStorage(STORAGE_KEYS.notifications, notifications);
  }

  return notifications;
}

export function markDemoNotificationRead(notificationId: string) {
  const next = getDemoNotifications().map((item) =>
    item.id === notificationId ? { ...item, is_read: true, updated_at: nowIso() } : item
  );
  writeStorage(STORAGE_KEYS.notifications, next);
}

export function markAllDemoNotificationsRead() {
  const next = getDemoNotifications().map((item) => ({ ...item, is_read: true, updated_at: nowIso() }));
  writeStorage(STORAGE_KEYS.notifications, next);
}

export function getDemoDocuments(driverId?: string) {
  const fallback = seedDocuments();
  const docs = readStorage<DriverDocument[]>(STORAGE_KEYS.documents, fallback);
  if (!readStorage<DriverDocument[] | null>(STORAGE_KEYS.documents, null)) writeStorage(STORAGE_KEYS.documents, docs);
  return driverId ? docs.filter((doc) => doc.driver_id === driverId) : docs;
}

export function upsertDemoDocument(input: DriverDocumentInsert) {
  const docs = getDemoDocuments();
  const currentIndex = docs.findIndex(
    (doc) => (input.id && doc.id === input.id) || (doc.driver_id === input.driver_id && doc.doc_type === input.doc_type)
  );

  const nextDoc: DriverDocument = {
    id: currentIndex >= 0 ? docs[currentIndex].id : input.id ?? `demo-doc-${Date.now()}`,
    driver_id: input.driver_id,
    doc_type: input.doc_type,
    file_url: input.file_url ?? null,
    file_name: input.file_name ?? null,
    file_size: input.file_size ?? null,
    mime_type: input.mime_type ?? null,
    expiry_date: input.expiry_date ?? null,
    status: (input.status as DriverDocument['status']) ?? computeDocumentStatus(input.expiry_date ?? null),
    notes: input.notes ?? null,
    uploaded_by: input.uploaded_by ?? 'demo-user',
    created_at: currentIndex >= 0 ? docs[currentIndex].created_at : nowIso(),
    updated_at: nowIso(),
  };

  if (currentIndex >= 0) docs[currentIndex] = nextDoc;
  else docs.push(nextDoc);
  writeStorage(STORAGE_KEYS.documents, docs);
  return nextDoc;
}

export function deleteDemoDocument(documentId: string) {
  writeStorage(STORAGE_KEYS.documents, getDemoDocuments().filter((doc) => doc.id !== documentId));
}

export async function readFileAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

export function getDemoUser() {
  return readStorage<User | null>(STORAGE_KEYS.user, null);
}

export function setDemoUser(user: User | null) {
  if (!user) {
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEYS.user);
    return;
  }
  writeStorage(STORAGE_KEYS.user, user);
}

export function createDemoUser(email = 'demo@rawaes.local', fullName = 'مستخدم تجريبي'): User {
  return {
    id: 'demo-user',
    app_metadata: {},
    aud: 'authenticated',
    created_at: nowIso(),
    email,
    phone: '',
    role: 'authenticated',
    updated_at: nowIso(),
    user_metadata: { full_name: fullName },
    identities: [],
  } as User;
}

export function createDemoSession(user: User): Session {
  return {
    access_token: 'demo-access-token',
    refresh_token: 'demo-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    expires_in: 60 * 60 * 24,
    token_type: 'bearer',
    user,
  };
}

export function getDemoRole(): UserRole {
  return 'admin';
}

export function getDemoAuditLogs(recordId?: string) {
  const logs = readStorage<AuditLog[]>(STORAGE_KEYS.audit, []);
  const filtered = recordId ? logs.filter((log) => log.record_id === recordId) : logs;
  return [...filtered].sort((left, right) => (right.created_at ?? '').localeCompare(left.created_at ?? ''));
}

export function appendDemoAuditLog(entry: Partial<AuditLog> & Pick<AuditLog, 'action'>) {
  const log: AuditLog = {
    id: entry.id ?? `demo-audit-${Date.now()}`,
    action: entry.action,
    created_at: entry.created_at ?? nowIso(),
    ip_address: entry.ip_address ?? null,
    new_values: entry.new_values ?? null,
    old_values: entry.old_values ?? null,
    record_id: entry.record_id ?? null,
    table_name: entry.table_name ?? null,
    user_agent: entry.user_agent ?? 'demo-mode',
    user_id: entry.user_id ?? getDemoProfile().id,
  };

  const next = [log, ...getDemoAuditLogs()].slice(0, 100);
  writeStorage(STORAGE_KEYS.audit, next);
  return log;
}

