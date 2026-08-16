-- Migración a Arquitectura Multi-tenant SaaS

-- 1. Crear tabla de clínicas (Tenants)
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en clinics
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer (para el login/slug) pero solo el superadmin puede modificar (se implementará rol luego)
CREATE POLICY "Public profiles are viewable by everyone."
ON public.clinics FOR SELECT USING (true);


-- 2. Modificar user_roles para añadir clinic_id
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);

-- 3. Crear función auxiliar para obtener el clinic_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_clinic_id() RETURNS UUID AS $$
  SELECT clinic_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;


-- 4. Modificar el resto de tablas para añadir clinic_id
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);
ALTER TABLE public.clinic_settings ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);


-- 5. Actualizar las Políticas RLS para Aislar Datos (Multi-tenancy)

-- Patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for patients SELECT" ON public.patients FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for patients INSERT" ON public.patients FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for patients UPDATE" ON public.patients FOR UPDATE USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for patients DELETE" ON public.patients FOR DELETE USING (clinic_id = public.get_clinic_id());

-- Appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for appointments SELECT" ON public.appointments FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for appointments INSERT" ON public.appointments FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for appointments UPDATE" ON public.appointments FOR UPDATE USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for appointments DELETE" ON public.appointments FOR DELETE USING (clinic_id = public.get_clinic_id());

-- Treatments
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for treatments SELECT" ON public.treatments FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for treatments INSERT" ON public.treatments FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for treatments UPDATE" ON public.treatments FOR UPDATE USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for treatments DELETE" ON public.treatments FOR DELETE USING (clinic_id = public.get_clinic_id());

-- Budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for budgets SELECT" ON public.budgets FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for budgets INSERT" ON public.budgets FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for budgets UPDATE" ON public.budgets FOR UPDATE USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for budgets DELETE" ON public.budgets FOR DELETE USING (clinic_id = public.get_clinic_id());

-- Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for invoices SELECT" ON public.invoices FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for invoices INSERT" ON public.invoices FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for invoices UPDATE" ON public.invoices FOR UPDATE USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for invoices DELETE" ON public.invoices FOR DELETE USING (clinic_id = public.get_clinic_id());

-- Clinic Settings
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for settings SELECT" ON public.clinic_settings FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for settings INSERT" ON public.clinic_settings FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for settings UPDATE" ON public.clinic_settings FOR UPDATE USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for settings DELETE" ON public.clinic_settings FOR DELETE USING (clinic_id = public.get_clinic_id());

-- 6. Triggers para Auto-Inyectar clinic_id en los INSERTs
CREATE OR REPLACE FUNCTION public.set_clinic_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clinic_id IS NULL THEN
    NEW.clinic_id := public.get_clinic_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_clinic_id_patients BEFORE INSERT ON public.patients FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();
CREATE TRIGGER set_clinic_id_appointments BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();
CREATE TRIGGER set_clinic_id_treatments BEFORE INSERT ON public.treatments FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();
CREATE TRIGGER set_clinic_id_budgets BEFORE INSERT ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();
CREATE TRIGGER set_clinic_id_invoices BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();
CREATE TRIGGER set_clinic_id_clinic_settings BEFORE INSERT ON public.clinic_settings FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();
