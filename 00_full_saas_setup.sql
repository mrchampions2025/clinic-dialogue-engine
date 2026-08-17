-- ==============================================================================
-- 00_FULL_SAAS_SETUP.SQL
-- Script Maestro Consolidado para Arquitectura Multi-tenant SaaS
-- ==============================================================================
-- IMPORTANTE: Este script es idempotente (se puede ejecutar múltiples veces sin error).
-- Combina la creación de clínicas, columnas SaaS, aislamiento estricto y facturación.

-- ------------------------------------------------------------------------------
-- 1. ESTRUCTURA BASE SaaS (Clínicas y Roles)
-- ------------------------------------------------------------------------------

-- Tabla de Clínicas (Tenants)
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Columnas extendidas SaaS
    plan TEXT DEFAULT 'Pro Plan',
    notes TEXT,
    modules JSONB DEFAULT '{"whatsappBot": true, "verifactu": true, "digitalSign": true}'::jsonb
);

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- Políticas de Clinics
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.clinics;
CREATE POLICY "Public profiles are viewable by everyone." ON public.clinics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.clinics;
CREATE POLICY "Enable insert for authenticated users" ON public.clinics FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.clinics;
CREATE POLICY "Enable update for authenticated users" ON public.clinics FOR UPDATE USING (auth.role() = 'authenticated');


-- Tabla de Roles de Usuario (Vinculación Usuario -> Clínica)
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas de User Roles
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_roles;
CREATE POLICY "Enable insert for authenticated users" ON public.user_roles FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- ------------------------------------------------------------------------------
-- 2. FACTURACIÓN SaaS (Plataforma -> Clínica)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.saas_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    numero TEXT NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    concepto TEXT NOT NULL,
    importe NUMERIC(10,2) NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Pagado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin full access to saas_invoices" ON public.saas_invoices;
CREATE POLICY "Superadmin full access to saas_invoices" 
ON public.saas_invoices FOR ALL USING (auth.role() = 'authenticated');


-- ------------------------------------------------------------------------------
-- 3. MOTOR DE AISLAMIENTO Y BLOQUEO POR SUSPENSIÓN (CORE)
-- ------------------------------------------------------------------------------

-- FUNCIÓN CRÍTICA: Obtiene el clinic_id PERO bloquea (devuelve NULL) si está suspendida
CREATE OR REPLACE FUNCTION public.get_clinic_id() RETURNS UUID AS $$
DECLARE
  v_clinic_id UUID;
  v_is_active BOOLEAN;
BEGIN
  -- Obtener la clínica a la que pertenece el usuario
  SELECT ur.clinic_id, c.active 
  INTO v_clinic_id, v_is_active
  FROM public.user_roles ur
  JOIN public.clinics c ON ur.clinic_id = c.id
  WHERE ur.user_id = auth.uid() 
  LIMIT 1;

  -- Si la clínica NO está activa, devolvemos NULL para que todas las políticas fallen
  IF v_is_active = false THEN
    RETURN NULL;
  END IF;

  RETURN v_clinic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ------------------------------------------------------------------------------
-- 4. PREPARACIÓN DE TABLAS DE DATOS DEL TENANT
-- ------------------------------------------------------------------------------

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);

-- Configuración de Clínica (Tenant ID + Columnas de Firma/Sello)
ALTER TABLE public.clinic_settings 
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id),
  ADD COLUMN IF NOT EXISTS firma_sello_nombre text DEFAULT 'Dra. María García',
  ADD COLUMN IF NOT EXISTS firma_sello_cargo text DEFAULT 'Dirección Médica - Clínica Dentix',
  ADD COLUMN IF NOT EXISTS firma_sello_data text,
  ADD COLUMN IF NOT EXISTS modo_firma_presupuesto text DEFAULT 'sello_defecto';


-- ------------------------------------------------------------------------------
-- 5. LIMPIEZA DE POLÍTICAS INSEGURAS/VIEJAS
-- ------------------------------------------------------------------------------

DO $$ 
DECLARE r RECORD;
BEGIN 
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('patients', 'appointments', 'treatments', 'budgets', 'invoices', 'clinic_settings')
        AND policyname NOT LIKE 'Tenant isolation%'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;


-- ------------------------------------------------------------------------------
-- 6. POLÍTICAS RLS ESTRICTAS DE AISLAMIENTO (TENANT ISOLATION)
-- ------------------------------------------------------------------------------

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

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


-- ------------------------------------------------------------------------------
-- 7. TRIGGERS DE AUTO-INYECCIÓN (Para asegurar que todo insert lleve el clinic_id)
-- ------------------------------------------------------------------------------

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

-- ==============================================================================
-- FIN DEL SCRIPT
-- ==============================================================================
