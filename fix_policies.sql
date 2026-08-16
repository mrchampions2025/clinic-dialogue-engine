-- Fix for missing INSERT policies for clinics and user_roles
-- These policies allow the auto-provisioning logic (SaaS signup) to work.

-- Grant SELECT to anon and authenticated
GRANT SELECT ON public.clinics TO anon, authenticated;
GRANT SELECT ON public.user_roles TO anon, authenticated;

-- Policies for clinics
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.clinics;
CREATE POLICY "Enable insert for authenticated users" 
ON public.clinics FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policies for user_roles
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_roles;
CREATE POLICY "Enable insert for authenticated users" 
ON public.user_roles FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

