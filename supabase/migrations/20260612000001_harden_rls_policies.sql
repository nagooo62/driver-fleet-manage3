-- ═══════════════════════════════════════════════════════════════
-- تقوية أمنية: إزالة سياسات RLS المفتوحة (USING true) من الهجرات
-- المبكرة واستبدالها بسياسات مبنية على المصادقة والأدوار.
-- تعتمد على الدوال الموجودة: get_user_role(uuid) و is_admin(uuid)
-- ═══════════════════════════════════════════════════════════════

-- ─── إسقاط السياسات المفتوحة ───
DROP POLICY IF EXISTS "Allow all operations on drivers"             ON public.drivers;
DROP POLICY IF EXISTS "Allow all operations on cars"                ON public.cars;
DROP POLICY IF EXISTS "Allow all operations on delegation_history"  ON public.delegation_history;
DROP POLICY IF EXISTS "Allow all operations on applications"        ON public.applications;
DROP POLICY IF EXISTS "Allow all operations on notifications"       ON public.notifications;
DROP POLICY IF EXISTS "Allow all operations on company_settings"    ON public.company_settings;
DROP POLICY IF EXISTS "Allow all operations on driver_applications" ON public.driver_applications;
DROP POLICY IF EXISTS "Allow all operations on alert_settings"      ON public.alert_settings;
DROP POLICY IF EXISTS "Allow all operations on import_logs"         ON public.import_logs;

-- ─── المناديب: قراءة للمصادقين، كتابة للمدير ومدير التشغيل، حذف للمدير ───
CREATE POLICY "drivers_select_authenticated" ON public.drivers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "drivers_insert_managers" ON public.drivers
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));
CREATE POLICY "drivers_update_managers" ON public.drivers
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));
CREATE POLICY "drivers_delete_admin" ON public.drivers
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- ─── السيارات: نفس نمط المناديب ───
CREATE POLICY "cars_select_authenticated" ON public.cars
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cars_insert_managers" ON public.cars
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));
CREATE POLICY "cars_update_managers" ON public.cars
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));
CREATE POLICY "cars_delete_admin" ON public.cars
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- ─── سجل التفويض: قراءة للمصادقين، إدخال للمديرين، لا تعديل أو حذف (سجل تاريخي) ───
CREATE POLICY "delegation_select_authenticated" ON public.delegation_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "delegation_insert_managers" ON public.delegation_history
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- ─── التطبيقات: قراءة للمصادقين، إدارة للمدير فقط ───
CREATE POLICY "applications_select_authenticated" ON public.applications
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "applications_admin_write" ON public.applications
  FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ─── سجل تشغيل المناديب على التطبيقات ───
CREATE POLICY "driver_apps_select_authenticated" ON public.driver_applications
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "driver_apps_write_managers" ON public.driver_applications
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));
CREATE POLICY "driver_apps_update_managers" ON public.driver_applications
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));
CREATE POLICY "driver_apps_delete_admin" ON public.driver_applications
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- ─── الإشعارات: قراءة وتحديث (مقروء) للمصادقين، إنشاء من النظام، حذف للمدير ───
CREATE POLICY "notifications_select_authenticated" ON public.notifications
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "notifications_insert_authenticated" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update_authenticated" ON public.notifications
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "notifications_delete_admin" ON public.notifications
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- ─── إعدادات الشركة والتنبيهات: قراءة للمصادقين، تعديل للمدير ───
CREATE POLICY "company_settings_select" ON public.company_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "company_settings_admin_write" ON public.company_settings
  FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "alert_settings_select" ON public.alert_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "alert_settings_admin_write" ON public.alert_settings
  FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ─── سجل الاستيراد: قراءة وإدخال للمديرين، حذف للمدير العام ───
CREATE POLICY "import_logs_select_managers" ON public.import_logs
  FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin', 'manager', 'accountant'));
CREATE POLICY "import_logs_insert_managers" ON public.import_logs
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));
CREATE POLICY "import_logs_delete_admin" ON public.import_logs
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));
