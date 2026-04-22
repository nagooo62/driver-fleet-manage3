-- Create applications table for delivery apps
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  icon_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, warning, critical, success
  is_read BOOLEAN NOT NULL DEFAULT false,
  target_type TEXT, -- driver, car, document
  target_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create company_settings table
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'روائس للخدمات اللوجستية',
  legal_name TEXT,
  commercial_register TEXT,
  tax_number TEXT,
  official_email TEXT,
  phone_numbers TEXT[],
  headquarters_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create driver_applications table for tracking driver work with different apps
CREATE TABLE public.driver_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  application_id UUID NOT NULL,
  employee_id TEXT, -- The ID given by the delivery app
  start_date DATE NOT NULL,
  end_date DATE,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  orders_count INTEGER DEFAULT 0,
  working_days INTEGER DEFAULT 0,
  last_import_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(driver_id, application_id, start_date)
);

-- Create alert_settings table
CREATE TABLE public.alert_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- license_expiry, iqama_expiry, medical_expiry, vehicle_maintenance
  days_before INTEGER NOT NULL DEFAULT 30,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  message_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create import_logs table to track Excel imports
CREATE TABLE public.import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL,
  imported_by TEXT, -- Could be user name or ID
  file_name TEXT,
  records_count INTEGER DEFAULT 0,
  mismatches_count INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add vehicle downtime tracking to cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS downtime_start DATE,
ADD COLUMN IF NOT EXISTS downtime_end DATE,
ADD COLUMN IF NOT EXISTS downtime_reason TEXT,
ADD COLUMN IF NOT EXISTS temporary_vehicle_plate TEXT,
ADD COLUMN IF NOT EXISTS temporary_vehicle_type TEXT,
ADD COLUMN IF NOT EXISTS temporary_start_date DATE,
ADD COLUMN IF NOT EXISTS temporary_end_date DATE;

-- Enable RLS on all new tables
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth is implemented yet)
CREATE POLICY "Allow all operations on applications" ON public.applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on company_settings" ON public.company_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on driver_applications" ON public.driver_applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on alert_settings" ON public.alert_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on import_logs" ON public.import_logs FOR ALL USING (true) WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_applications_updated_at
BEFORE UPDATE ON public.driver_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alert_settings_updated_at
BEFORE UPDATE ON public.alert_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default applications
INSERT INTO public.applications (name, display_name) VALUES
('toyou', 'ToYou'),
('jahez', 'جاهز'),
('keeta', 'كيتا'),
('hungerstation', 'هنقرستيشن'),
('careem', 'كريم'),
('noon', 'نون'),
('talabat', 'طلبات');

-- Insert default company settings
INSERT INTO public.company_settings (company_name, legal_name) VALUES
('روائس للخدمات اللوجستية', 'شركة روائس للخدمات اللوجستية المحدودة');

-- Insert default alert settings
INSERT INTO public.alert_settings (alert_type, days_before, message_template) VALUES
('license_expiry', 30, 'تنبيه: رخصة القيادة للمندوب {driver_name} تنتهي خلال {days} أيام'),
('iqama_expiry', 30, 'تنبيه: إقامة المندوب {driver_name} تنتهي خلال {days} أيام'),
('medical_expiry', 30, 'تنبيه: الفحص الطبي للمندوب {driver_name} ينتهي خلال {days} أيام'),
('vehicle_maintenance', 7, 'تذكير: السيارة رقم {plate} تحتاج صيانة دورية');