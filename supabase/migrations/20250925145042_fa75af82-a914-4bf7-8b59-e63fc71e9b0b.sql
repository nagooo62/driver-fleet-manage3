-- Fix critical security vulnerabilities

-- 1. Secure driver data with role-based access
DROP POLICY IF EXISTS "Authenticated users can view drivers" ON public.drivers;
DROP POLICY IF EXISTS "Authenticated users can insert drivers" ON public.drivers;
DROP POLICY IF EXISTS "Authenticated users can update drivers" ON public.drivers;

-- Create secure driver policies - only HR/management can access sensitive data
CREATE POLICY "Managers and admins can view all drivers" ON public.drivers
FOR SELECT USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
);

CREATE POLICY "Managers and admins can insert drivers" ON public.drivers
FOR INSERT WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
);

CREATE POLICY "Managers and admins can update drivers" ON public.drivers
FOR UPDATE USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])
);

-- 2. Fix notification privacy - users should only see their own notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;

-- Add user_id column to notifications for proper user targeting
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create secure notification policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (
  auth.uid() = user_id OR is_admin(auth.uid())
);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (
  auth.uid() = user_id OR is_admin(auth.uid())
);

CREATE POLICY "Admins can manage all notifications" ON public.notifications
FOR ALL USING (is_admin(auth.uid()));

-- 3. Secure profiles access - fix potential data leakage
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create more restrictive profile access
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  is_admin(auth.uid()) AND auth.uid() IS NOT NULL
);

-- 4. Fix database function security - update search_path for all functions
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = user_id;
$function$;

CREATE OR REPLACE FUNCTION public.has_permission(user_id uuid, perm text, res text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_permissions.user_id = has_permission.user_id 
    AND permission = perm 
    AND resource = res
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(get_user_role(user_id) = 'admin', false);
$function$;

-- 5. Add audit logging table for security monitoring
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

CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
FOR SELECT USING (is_admin(auth.uid()));

-- 6. Create secure user management function
CREATE OR REPLACE FUNCTION public.create_user_with_profile(
  email TEXT,
  password TEXT,
  full_name TEXT,
  user_role app_role DEFAULT 'employee',
  department TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_user_id UUID;
BEGIN
  -- Only admins can create users
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can create users';
  END IF;

  -- This function should be called from an edge function with service role
  -- For now, we'll create a placeholder that requires edge function implementation
  RAISE EXCEPTION 'User creation must be done through secure edge function';
  
  RETURN new_user_id;
END;
$function$;