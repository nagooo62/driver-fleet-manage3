-- Phase 1: Create user management tables and roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'employee', 'accountant');

-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'employee',
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user permissions table
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  resource TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission, resource)
);

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(user_id UUID, perm TEXT, res TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_permissions.user_id = has_permission.user_id 
    AND permission = perm 
    AND resource = res
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT get_user_role(user_id) = 'admin';
$$;

-- Phase 2: CRITICAL - Replace dangerous RLS policies with secure ones

-- Drop all existing dangerous policies
DROP POLICY IF EXISTS "Allow all operations on drivers" ON public.drivers;
DROP POLICY IF EXISTS "Allow all operations on cars" ON public.cars;
DROP POLICY IF EXISTS "Allow all operations on company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Allow all operations on delegation_history" ON public.delegation_history;
DROP POLICY IF EXISTS "Allow all operations on driver_applications" ON public.driver_applications;
DROP POLICY IF EXISTS "Allow all operations on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow all operations on import_logs" ON public.import_logs;
DROP POLICY IF EXISTS "Allow all operations on applications" ON public.applications;
DROP POLICY IF EXISTS "Allow all operations on alert_settings" ON public.alert_settings;

-- Secure RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (is_admin(auth.uid()));

-- Secure RLS policies for user_permissions
CREATE POLICY "Admins can manage all permissions" ON public.user_permissions
  FOR ALL USING (is_admin(auth.uid()));

-- Secure RLS policies for drivers (sensitive PII)
CREATE POLICY "Authenticated users can view drivers" ON public.drivers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and admins can insert drivers" ON public.drivers
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    get_user_role(auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Managers and admins can update drivers" ON public.drivers
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    get_user_role(auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Only admins can delete drivers" ON public.drivers
  FOR DELETE USING (is_admin(auth.uid()));

-- Secure RLS policies for cars
CREATE POLICY "Authenticated users can view cars" ON public.cars
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and admins can manage cars" ON public.cars
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    get_user_role(auth.uid()) IN ('admin', 'manager')
  );

-- Secure RLS policies for company_settings (highly sensitive)
CREATE POLICY "Only admins can access company settings" ON public.company_settings
  FOR ALL USING (is_admin(auth.uid()));

-- Secure RLS policies for delegation_history
CREATE POLICY "Authenticated users can view delegation history" ON public.delegation_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and admins can manage delegation history" ON public.delegation_history
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    get_user_role(auth.uid()) IN ('admin', 'manager')
  );

-- Secure RLS policies for driver_applications
CREATE POLICY "Authenticated users can view driver applications" ON public.driver_applications
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Managers and admins can manage driver applications" ON public.driver_applications
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    get_user_role(auth.uid()) IN ('admin', 'manager')
  );

-- Secure RLS policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL USING (is_admin(auth.uid()));

-- Secure RLS policies for import_logs
CREATE POLICY "Authenticated users can view import logs" ON public.import_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage import logs" ON public.import_logs
  FOR ALL USING (is_admin(auth.uid()));

-- Secure RLS policies for applications
CREATE POLICY "Authenticated users can view applications" ON public.applications
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage applications" ON public.applications
  FOR ALL USING (is_admin(auth.uid()));

-- Secure RLS policies for alert_settings
CREATE POLICY "Authenticated users can view alert settings" ON public.alert_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage alert settings" ON public.alert_settings
  FOR ALL USING (is_admin(auth.uid()));

-- Create trigger to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'employee'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();