-- Fix for missing INSERT policies for clinics and user_roles
-- These policies allow the auto-provisioning logic (SaaS signup) to work.

-- Grant SELECT to anon and authenticated
GRANT SELECT ON public.clinics TO anon, authenticated;
GRANT SELECT ON public.user_roles TO anon, authenticated;

-- Policies for clinics
CREATE POLICY "Enable insert for authenticated users" 
ON public.clinics FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policies for user_roles
CREATE POLICY "Enable insert for authenticated users" 
ON public.user_roles FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy for patients (anon needs to insert during patient registration)
-- Wait, if patient registers, they are authenticated during the signup process (the trigger or the client side code runs after signup).
-- Actually, the client code runs `supabase.auth.signUp`, which returns a session. So they are authenticated.
