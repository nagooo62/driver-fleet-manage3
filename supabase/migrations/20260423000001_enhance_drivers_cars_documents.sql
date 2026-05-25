-- ============================================================
-- Migration: تحسين جداول المناديب والسيارات وإضافة الوثائق
-- Date: 2026-04-23
-- ============================================================

-- ============================================================
-- 1. تحسين جدول المناديب - إضافة الحقول المفقودة
-- ============================================================

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS photo_url       TEXT,
  ADD COLUMN IF NOT EXISTS nationality     TEXT,
  ADD COLUMN IF NOT EXISTS phone           TEXT,
  ADD COLUMN IF NOT EXISTS city            TEXT,
  ADD COLUMN IF NOT EXISTS profession      TEXT,
  ADD COLUMN IF NOT EXISTS ajeer_expiry    DATE,
  ADD COLUMN IF NOT EXISTS performance_score NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS working_hours   NUMERIC(8,2)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS orders_count    INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS app_name        TEXT;

COMMENT ON COLUMN public.drivers.photo_url        IS 'رابط صورة المندوب في Supabase Storage';
COMMENT ON COLUMN public.drivers.nationality      IS 'جنسية المندوب';
COMMENT ON COLUMN public.drivers.phone            IS 'رقم الجوال';
COMMENT ON COLUMN public.drivers.city             IS 'المدينة';
COMMENT ON COLUMN public.drivers.profession       IS 'المهنة';
COMMENT ON COLUMN public.drivers.ajeer_expiry     IS 'تاريخ انتهاء تصريح أجير';
COMMENT ON COLUMN public.drivers.performance_score IS 'مؤشر الأداء (0-100)';
COMMENT ON COLUMN public.drivers.working_hours    IS 'إجمالي ساعات العمل';
COMMENT ON COLUMN public.drivers.orders_count     IS 'إجمالي الطلبات';
COMMENT ON COLUMN public.drivers.app_name         IS 'اسم التطبيق المرتبط: toyou/jahez/keeta/hungerstation/chefz';

-- ============================================================
-- 2. تحسين جدول السيارات - إضافة الحقول المفقودة
-- ============================================================

ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS photo_url             TEXT,
  ADD COLUMN IF NOT EXISTS model                 TEXT,
  ADD COLUMN IF NOT EXISTS year                  INTEGER,
  ADD COLUMN IF NOT EXISTS color                 TEXT,
  ADD COLUMN IF NOT EXISTS chassis_number        TEXT,
  ADD COLUMN IF NOT EXISTS inspection_expiry     DATE,
  ADD COLUMN IF NOT EXISTS insurance_expiry      DATE,
  ADD COLUMN IF NOT EXISTS operation_card_expiry DATE,
  ADD COLUMN IF NOT EXISTS brand                 TEXT;

COMMENT ON COLUMN public.cars.photo_url             IS 'رابط صورة السيارة';
COMMENT ON COLUMN public.cars.model                 IS 'موديل السيارة (هايلوكس / H1 / ...)';
COMMENT ON COLUMN public.cars.year                  IS 'سنة الصنع';
COMMENT ON COLUMN public.cars.color                 IS 'لون السيارة';
COMMENT ON COLUMN public.cars.chassis_number        IS 'رقم الهيكل VIN';
COMMENT ON COLUMN public.cars.inspection_expiry     IS 'تاريخ انتهاء الفحص الدوري';
COMMENT ON COLUMN public.cars.insurance_expiry      IS 'تاريخ انتهاء التأمين';
COMMENT ON COLUMN public.cars.operation_card_expiry IS 'تاريخ انتهاء كرت التشغيل';
COMMENT ON COLUMN public.cars.brand                 IS 'الماركة: Toyota / Nissan / Hyundai';

-- ============================================================
-- 3. إنشاء جدول وثائق المناديب
-- ============================================================

CREATE TABLE IF NOT EXISTS public.driver_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id       UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  doc_type        TEXT NOT NULL,
  -- أنواع المستندات المقبولة:
  -- iqama_doc | license_doc | driver_card | ajeer_permit
  -- operation_card | registration | insurance_doc | medical_doc | other
  file_url        TEXT,
  file_name       TEXT,
  file_size       INTEGER,
  mime_type       TEXT,
  expiry_date     DATE,
  status          TEXT NOT NULL DEFAULT 'valid',
  -- valid | expiring_soon | expired | missing
  notes           TEXT,
  uploaded_by     UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id
  ON public.driver_documents(driver_id);

CREATE INDEX IF NOT EXISTS idx_driver_documents_doc_type
  ON public.driver_documents(doc_type);

CREATE INDEX IF NOT EXISTS idx_driver_documents_status
  ON public.driver_documents(status);

COMMENT ON TABLE public.driver_documents IS 'وثائق المناديب: إقامة، رخصة، بطاقة سائق، أجير، كرت تشغيل، استمارة، تأمين';

-- trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_driver_documents_updated_at ON public.driver_documents;
CREATE TRIGGER trg_driver_documents_updated_at
  BEFORE UPDATE ON public.driver_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. تفعيل Row Level Security لجدول الوثائق
-- ============================================================

ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers_admins_view_docs" ON public.driver_documents
  FOR SELECT USING (
    get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
  );

CREATE POLICY "managers_admins_insert_docs" ON public.driver_documents
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
  );

CREATE POLICY "managers_admins_update_docs" ON public.driver_documents
  FOR UPDATE USING (
    get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
  );

CREATE POLICY "managers_admins_delete_docs" ON public.driver_documents
  FOR DELETE USING (
    get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
  );

-- ============================================================
-- 5. إنشاء Supabase Storage Buckets
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'driver-photos',
    'driver-photos',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg','image/png','image/webp']
  ),
  (
    'car-photos',
    'car-photos',
    true,
    5242880,
    ARRAY['image/jpeg','image/png','image/webp']
  ),
  (
    'driver-documents',
    'driver-documents',
    false,
    10485760, -- 10MB
    ARRAY['image/jpeg','image/png','image/webp','application/pdf']
  )
ON CONFLICT (id) DO NOTHING;

-- Storage policies - driver-photos (public read)
CREATE POLICY "public_read_driver_photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'driver-photos');

CREATE POLICY "auth_upload_driver_photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'driver-photos' AND auth.role() = 'authenticated'
  );

CREATE POLICY "auth_update_driver_photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'driver-photos' AND auth.role() = 'authenticated'
  );

-- Storage policies - car-photos (public read)
CREATE POLICY "public_read_car_photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'car-photos');

CREATE POLICY "auth_upload_car_photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'car-photos' AND auth.role() = 'authenticated'
  );

-- Storage policies - driver-documents (private, managers only)
CREATE POLICY "managers_read_driver_docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'driver-documents' AND auth.role() = 'authenticated'
  );

CREATE POLICY "managers_upload_driver_docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'driver-documents' AND auth.role() = 'authenticated'
  );

CREATE POLICY "managers_delete_driver_docs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'driver-documents' AND auth.role() = 'authenticated'
  );

-- ============================================================
-- 6. دالة لحساب حالة الوثيقة تلقائياً
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_document_status(expiry_date DATE)
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  IF expiry_date IS NULL THEN
    RETURN 'missing';
  ELSIF expiry_date < CURRENT_DATE THEN
    RETURN 'expired';
  ELSIF expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
    RETURN 'expiring_soon';
  ELSE
    RETURN 'valid';
  END IF;
END;
$$;

-- ============================================================
-- 7. View مجمّعة لحالة وثائق المناديب
-- ============================================================

CREATE OR REPLACE VIEW public.driver_documents_summary AS
SELECT
  d.id                                                        AS driver_id,
  d.full_name,
  d.status                                                    AS driver_status,
  d.app_name,
  public.get_document_status(d.iqama_expiry::DATE)            AS iqama_status,
  public.get_document_status(d.license_expiry::DATE)          AS license_status,
  public.get_document_status(d.medical_expiry::DATE)          AS medical_status,
  public.get_document_status(d.ajeer_expiry)                  AS ajeer_status,
  (
    SELECT COUNT(*) FROM public.driver_documents dd
    WHERE dd.driver_id = d.id
  )                                                           AS uploaded_docs_count,
  (
    SELECT COUNT(*) FROM public.driver_documents dd
    WHERE dd.driver_id = d.id AND dd.status = 'expired'
  )                                                           AS expired_docs_count
FROM public.drivers d;
