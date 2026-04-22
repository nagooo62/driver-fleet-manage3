-- Fix security issue: Restrict driver personal data access to managers and admins only
-- Drop the overly permissive policy that allows all authenticated users to view drivers
DROP POLICY IF EXISTS "Authenticated users can view drivers" ON public.drivers;

-- Create a new restrictive policy that only allows managers and admins to view driver data
CREATE POLICY "Only managers and admins can view drivers" 
ON public.drivers 
FOR SELECT 
USING ((auth.uid() IS NOT NULL) AND (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'manager'::app_role])));