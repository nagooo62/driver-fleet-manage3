-- Fix critical security vulnerabilities - handle existing policies

-- 1. Clean up existing driver policies and recreate with proper security
DO $$ 
BEGIN
    -- Drop existing policies safely
    DROP POLICY IF EXISTS "Managers and admins can view all drivers" ON public.drivers;
    DROP POLICY IF EXISTS "Managers and admins can insert drivers" ON public.drivers;
    DROP POLICY IF EXISTS "Managers and admins can update drivers" ON public.drivers;
    DROP POLICY IF EXISTS "Managers and admins can manage drivers" ON public.drivers;
EXCEPTION 
    WHEN undefined_object THEN NULL;
END $$;

-- Create secure driver policies - only managers/admins can access sensitive data
CREATE POLICY "Secure driver view access" ON public.drivers
FOR SELECT USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
);

CREATE POLICY "Secure driver insert access" ON public.drivers
FOR INSERT WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
);

CREATE POLICY "Secure driver update access" ON public.drivers
FOR UPDATE USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
);

-- 2. Add user_id column to notifications for proper user targeting
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Drop and recreate notification policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
EXCEPTION 
    WHEN undefined_object THEN NULL;
END $$;

-- Create secure notification policies
CREATE POLICY "Secure notification view access" ON public.notifications
FOR SELECT USING (
  auth.uid() = user_id OR is_admin(auth.uid())
);

CREATE POLICY "Secure notification update access" ON public.notifications
FOR UPDATE USING (
  auth.uid() = user_id OR is_admin(auth.uid())
);

CREATE POLICY "Admin notification management" ON public.notifications
FOR ALL USING (is_admin(auth.uid()));

-- 3. Add audit logging table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate audit log policy
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
EXCEPTION 
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Admin audit log access" ON public.audit_logs
FOR SELECT USING (is_admin(auth.uid()));