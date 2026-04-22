type DateInput = Date | string | number | null | undefined;

const shortDateFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const longDateFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const relativeFormatter = new Intl.RelativeTimeFormat('ar', {
  numeric: 'auto',
});

export const asDate = (value: DateInput): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDateArabic = (value: DateInput): string => {
  const date = asDate(value);
  return date ? shortDateFormatter.format(date).replace(/\u200f/g, '') : '—';
};

export const formatDateArabicLong = (value: DateInput): string => {
  const date = asDate(value);
  return date ? longDateFormatter.format(date).replace(/\u200f/g, '') : '—';
};

export const daysBetween = (startDate: DateInput, endDate: DateInput): number => {
  const start = asDate(startDate);
  const end = asDate(endDate);

  if (!start || !end) return 0;

  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getDaysUntil = (value: DateInput): number | null => {
  const date = asDate(value);
  return date ? daysBetween(new Date(), date) : null;
};

export const isExpiringWithin = (value: DateInput, days = 30): boolean => {
  const daysUntil = getDaysUntil(value);
  return daysUntil !== null && daysUntil <= days;
};

export const formatRelativeTimeArabic = (value: DateInput): string => {
  const date = asDate(value);
  if (!date) return '—';

  const diffDays = daysBetween(new Date(), date);
  if (Math.abs(diffDays) >= 1) {
    return relativeFormatter.format(diffDays, 'day');
  }

  const diffHours = Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60));
  if (Math.abs(diffHours) >= 1) {
    return relativeFormatter.format(diffHours, 'hour');
  }

  const diffMinutes = Math.round((date.getTime() - Date.now()) / (1000 * 60));
  return relativeFormatter.format(diffMinutes, 'minute');
};

export const formatNumberArabic = (value: number): string =>
  new Intl.NumberFormat('ar-SA').format(value);

export const translateDriverStatus = (status?: string | null): string => {
  const labels: Record<string, string> = {
    new: 'جديد',
    accepted: 'مقبول',
    sponsored: 'على الكفالة',
    archived: 'مؤرشف',
    frozen: 'مجمّد',
    stopped: 'متوقف',
  };

  return status ? labels[status] ?? status : '—';
};

export const translateCarStatus = (status?: string | null): string => {
  const labels: Record<string, string> = {
    delegated: 'مفوّضة',
    handed: 'مسلّمة',
    out_of_service: 'خارج الخدمة',
    available: 'متاحة',
  };

  return status ? labels[status] ?? status : '—';
};

export const translateNotificationType = (type?: string | null): string => {
  const labels: Record<string, string> = {
    iqama_expiry: 'انتهاء إقامة',
    license_expiry: 'انتهاء رخصة',
    medical_expiry: 'فحص طبي',
    car_downtime: 'تعطل مركبة',
    import_complete: 'اكتمال استيراد',
    import_mismatch: 'اختلاف استيراد',
    warning: 'تحذير',
    critical: 'حرج',
    success: 'نجاح',
    info: 'معلومة',
    general: 'تحديث عام',
  };

  return type ? labels[type] ?? type : '—';
};

export const getCurrentDateArabic = (): string => formatDateArabic(new Date());
