-- 1. Eliminar CUALQUIER política antigua que pudiera estar dando acceso global a todos
DROP POLICY IF EXISTS "Enable read access for all users" ON public.patients;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.patients;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.patients;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.patients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.patients;
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON public.patients;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.appointments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.treatments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.budgets;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.invoices;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.clinic_settings;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.appointments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.treatments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.budgets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.invoices;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.clinic_settings;


-- Por si tienen nombres genéricos puestos por supabase/lovable
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('patients', 'appointments', 'treatments', 'budgets', 'invoices', 'clinic_settings')
        AND policyname NOT LIKE 'Tenant isolation%'
        AND policyname NOT LIKE 'Public profiles are viewable%'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;


-- 2. Asegurar que RLS está activo en todas
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- 3. Aplicar EXCLUSIVAMENTE las políticas de Tenant (Clínica) Isolation
-- Patients
DROP POLICY IF EXISTS "Tenant isolation for patients SELECT" ON public.patients;
DROP POLICY IF EXISTS "Tenant isolation for patients INSERT" ON public.patients;
DROP POLICY IF EXISTS "Tenant isolation for patients UPDATE" ON public.patients;
DROP POLICY IF EXISTS "Tenant isolation for patients DELETE" ON public.patients;
CREATE POLICY "Tenant isolation for patients SELECT" ON public.patients FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for patients INSERT" ON public.patients FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for patients UPDATE" ON public.patients FOR UPDATE USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for patients DELETE" ON public.patients FOR DELETE USING (clinic_id = public.get_clinic_id());

-- Appointments
DROP POLICY IF EXISTS "Tenant isolation for appointments SELECT" ON public.appointments;
DROP POLICY IF EXISTS "Tenant isolation for appointments INSERT" ON public.appointments;
DROP POLICY IF EXISTS "Tenant isolation for appointments UPDATE" ON public.appointments;
DROP POLICY IF EXISTS "Tenant isolation for appointments DELETE" ON public.appointments;
CREATE POLICY "Tenant isolation for appointments SELECT" ON public.appointments FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for appointments INSERT" ON public.appointments FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for appointments UPDATE" ON public.appointments FOR UPDATE USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for appointments DELETE" ON public.appointments FOR DELETE USING (clinic_id = public.get_clinic_id());

-- Treatments
DROP POLICY IF EXISTS "Tenant isolation for treatments SELECT" ON public.treatments;
DROP POLICY IF EXISTS "Tenant isolation for treatments INSERT" ON public.treatments;
DROP POLICY IF EXISTS "Tenant isolation for treatments UPDATE" ON public.treatments;
DROP POLICY IF EXISTS "Tenant isolation for treatments DELETE" ON public.treatments;
CREATE POLICY "Tenant isolation for treatments SELECT" ON public.treatments FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for treatments INSERT" ON public.treatments FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for treatments UPDATE" ON public.treatments FOR UPDATE USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for treatments DELETE" ON public.treatments FOR DELETE USING (clinic_id = public.get_clinic_id());

-- Budgets
DROP POLICY IF EXISTS "Tenant isolation for budgets SELECT" ON public.budgets;
DROP POLICY IF EXISTS "Tenant isolation for budgets INSERT" ON public.budgets;
DROP POLICY IF EXISTS "Tenant isolation for budgets UPDATE" ON public.budgets;
DROP POLICY IF EXISTS "Tenant isolation for budgets DELETE" ON public.budgets;
CREATE POLICY "Tenant isolation for budgets SELECT" ON public.budgets FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for budgets INSERT" ON public.budgets FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for budgets UPDATE" ON public.budgets FOR UPDATE USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for budgets DELETE" ON public.budgets FOR DELETE USING (clinic_id = public.get_clinic_id());

-- Invoices
DROP POLICY IF EXISTS "Tenant isolation for invoices SELECT" ON public.invoices;
DROP POLICY IF EXISTS "Tenant isolation for invoices INSERT" ON public.invoices;
DROP POLICY IF EXISTS "Tenant isolation for invoices UPDATE" ON public.invoices;
DROP POLICY IF EXISTS "Tenant isolation for invoices DELETE" ON public.invoices;
CREATE POLICY "Tenant isolation for invoices SELECT" ON public.invoices FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for invoices INSERT" ON public.invoices FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for invoices UPDATE" ON public.invoices FOR UPDATE USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for invoices DELETE" ON public.invoices FOR DELETE USING (clinic_id = public.get_clinic_id());

-- Clinic Settings
DROP POLICY IF EXISTS "Tenant isolation for settings SELECT" ON public.clinic_settings;
DROP POLICY IF EXISTS "Tenant isolation for settings INSERT" ON public.clinic_settings;
DROP POLICY IF EXISTS "Tenant isolation for settings UPDATE" ON public.clinic_settings;
DROP POLICY IF EXISTS "Tenant isolation for settings DELETE" ON public.clinic_settings;
CREATE POLICY "Tenant isolation for settings SELECT" ON public.clinic_settings FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for settings INSERT" ON public.clinic_settings FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for settings UPDATE" ON public.clinic_settings FOR UPDATE USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for settings DELETE" ON public.clinic_settings FOR DELETE USING (clinic_id = public.get_clinic_id());

-- 4. Forzar que los Triggers estén presentes
CREATE OR REPLACE FUNCTION public.set_clinic_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clinic_id IS NULL THEN
    NEW.clinic_id := public.get_clinic_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_clinic_id_patients ON public.patients;
CREATE TRIGGER set_clinic_id_patients BEFORE INSERT ON public.patients FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();

DROP TRIGGER IF EXISTS set_clinic_id_appointments ON public.appointments;
CREATE TRIGGER set_clinic_id_appointments BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();

DROP TRIGGER IF EXISTS set_clinic_id_treatments ON public.treatments;
CREATE TRIGGER set_clinic_id_treatments BEFORE INSERT ON public.treatments FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();

DROP TRIGGER IF EXISTS set_clinic_id_budgets ON public.budgets;
CREATE TRIGGER set_clinic_id_budgets BEFORE INSERT ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();

DROP TRIGGER IF EXISTS set_clinic_id_invoices ON public.invoices;
CREATE TRIGGER set_clinic_id_invoices BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();

DROP TRIGGER IF EXISTS set_clinic_id_clinic_settings ON public.clinic_settings;
CREATE TRIGGER set_clinic_id_clinic_settings BEFORE INSERT ON public.clinic_settings FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();
