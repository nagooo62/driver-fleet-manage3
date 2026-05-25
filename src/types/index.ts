import type {
  Enums,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/integrations/supabase/types';

export type Driver = Tables<'drivers'>;
export type DriverInsert = TablesInsert<'drivers'>;
export type DriverUpdate = TablesUpdate<'drivers'>;
export type DriverStatus = Driver['status'];

export type Car = Tables<'cars'> & {
  current_delegate?: Pick<Driver, 'id' | 'full_name'> | null;
};
export type CarInsert = TablesInsert<'cars'>;
export type CarUpdate = TablesUpdate<'cars'>;
export type CarStatus = Car['status'];

export type Application = Tables<'applications'>;
export type DriverDocument = Tables<'driver_documents'>;
export type DriverDocumentInsert = TablesInsert<'driver_documents'>;

export type DocType =
  | 'iqama_doc'
  | 'license_doc'
  | 'driver_card'
  | 'ajeer_permit'
  | 'operation_card'
  | 'registration'
  | 'insurance_doc'
  | 'medical_doc';

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  iqama_doc:      'صورة الإقامة',
  license_doc:    'صورة الرخصة',
  driver_card:    'بطاقة السائق',
  ajeer_permit:   'تصريح أجير',
  operation_card: 'كرت التشغيل',
  registration:   'الاستمارة',
  insurance_doc:  'التأمين',
  medical_doc:    'الفحص الطبي',
};
export type NotificationRecord = Tables<'notifications'>;
export type AuditLog = Tables<'audit_logs'>;
export type DriverApplication = Tables<'driver_applications'>;
export type Profile = Tables<'profiles'>;
export type CompanySettings = Tables<'company_settings'>;
export type DelegationHistory = Tables<'delegation_history'>;
export type UserPermissionRow = Tables<'user_permissions'>;
export type UserRole = Enums<'app_role'>;

export type Permission =
  | 'dashboard:read'
  | 'drivers:read'
  | 'drivers:write'
  | 'drivers:archive'
  | 'cars:read'
  | 'cars:write'
  | 'applications:read'
  | 'notifications:read'
  | 'notifications:write'
  | 'reports:read'
  | 'reports:export'
  | 'audit:read'
  | 'settings:read'
  | 'settings:write'
  | 'users:manage'
  | 'gps:read'
  | 'ai:read'
  | 'finance:read';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DashboardStats {
  totalDrivers: number;
  activeDrivers: number;
  totalCars: number;
  delegatedCars: number;
  outOfServiceCars: number;
  expiringDocuments: number;
  realtimeAlerts: number;
  performanceScore: number;
  utilizationRate: number;
  totalApplications: number;
}

export interface ExpiringDocumentItem {
  driverId: string;
  driverName: string;
  document: 'iqama' | 'license' | 'medical';
  expiresAt: string;
  daysLeft: number;
}

export interface DriverOperationRecord extends DriverApplication {
  applicationName?: string;
  driverName?: string;
}

export interface DriverAuditRecord extends AuditLog {
  actorName?: string | null;
}

export interface DriverDetailData {
  driver: Driver;
  operations: DriverOperationRecord[];
  assignedCars: Car[];
  audit: DriverAuditRecord[];
}

export interface NotificationItem extends NotificationRecord {
  severity: 'info' | 'warning' | 'critical' | 'success';
  link?: string;
}

export interface AppTrackingSummary {
  application: Application | null;
  totalDrivers: number;
  verifiedDrivers: number;
  totalOrders: number;
  totalWorkingDays: number;
}

export interface GpsTripBlueprint {
  id: string;
  driverId: string;
  carId: string;
  startedAt: string;
  endedAt?: string | null;
  distanceKm: number;
  routeHash?: string | null;
  unauthorizedUsage?: boolean;
}

export interface GpsAnalyticsBlueprint {
  liveTrackingEnabled: boolean;
  lastLocationAt?: string | null;
  idleMinutesThreshold: number;
  geofenceViolations: number;
}

export interface AiInsightBlueprint {
  modelKey: 'performance_prediction' | 'risk_scoring' | 'fuel_analytics' | 'anomaly_detection';
  title: string;
  description: string;
  readiness: 'planned' | 'ready_for_data' | 'requires_schema';
}

export interface FinanceComparisonSource {
  id: string;
  source: 'platform' | 'internal' | 'driver';
  reference: string;
  amount: number;
  orders: number;
  periodLabel: string;
}

export interface FinanceReconciliationRow {
  reference: string;
  platformAmount: number;
  internalAmount: number;
  driverAmount: number;
  delta: number;
  status: 'matched' | 'warning' | 'critical';
}
