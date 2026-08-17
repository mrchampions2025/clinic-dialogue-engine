-- ==============================================================================
-- 01_FULL_SAAS_EXTENDED.SQL
-- Módulos Extendidos: Inventario, Seguros y Límites de Usuarios SaaS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. MÓDULO DE INVENTARIO (Control de Stock)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    unit TEXT DEFAULT 'Unidades',
    current_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
    min_stock NUMERIC(10,2) NOT NULL DEFAULT 10,
    unit_cost NUMERIC(10,2) DEFAULT 0,
    supplier TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'salida', 'ajuste')),
    quantity NUMERIC(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Isolation Policies for Inventory
DROP POLICY IF EXISTS "Tenant isolation for inventory_items SELECT" ON public.inventory_items;
DROP POLICY IF EXISTS "Tenant isolation for inventory_items INSERT" ON public.inventory_items;
DROP POLICY IF EXISTS "Tenant isolation for inventory_items UPDATE" ON public.inventory_items;
DROP POLICY IF EXISTS "Tenant isolation for inventory_items DELETE" ON public.inventory_items;

CREATE POLICY "Tenant isolation for inventory_items SELECT" ON public.inventory_items FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for inventory_items INSERT" ON public.inventory_items FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for inventory_items UPDATE" ON public.inventory_items FOR UPDATE USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for inventory_items DELETE" ON public.inventory_items FOR DELETE USING (clinic_id = public.get_clinic_id());

DROP POLICY IF EXISTS "Tenant isolation for inventory_transactions SELECT" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Tenant isolation for inventory_transactions INSERT" ON public.inventory_transactions;

CREATE POLICY "Tenant isolation for inventory_transactions SELECT" ON public.inventory_transactions FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for inventory_transactions INSERT" ON public.inventory_transactions FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());

-- Triggers for auto clinic_id injection
DROP TRIGGER IF EXISTS set_clinic_id_inventory_items ON public.inventory_items;
CREATE TRIGGER set_clinic_id_inventory_items BEFORE INSERT ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();

DROP TRIGGER IF EXISTS set_clinic_id_inventory_transactions ON public.inventory_transactions;
CREATE TRIGGER set_clinic_id_inventory_transactions BEFORE INSERT ON public.inventory_transactions FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();


-- ------------------------------------------------------------------------------
-- 2. MÓDULO DE SEGUROS Y BAREMOS (Mutuas Dental)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.insurances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.insurance_tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    insurance_id UUID REFERENCES public.insurances(id) ON DELETE CASCADE,
    treatment_name TEXT NOT NULL,
    agreed_price NUMERIC(10,2) NOT NULL,
    copay_patient NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Vincular Seguro y N° de Póliza al Paciente
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS insurance_id UUID REFERENCES public.insurances(id) ON DELETE SET NULL;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS policy_number TEXT;

ALTER TABLE public.insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_tariffs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Tenant isolation for insurances SELECT" ON public.insurances;
DROP POLICY IF EXISTS "Tenant isolation for insurances INSERT" ON public.insurances;
DROP POLICY IF EXISTS "Tenant isolation for insurances UPDATE" ON public.insurances;
DROP POLICY IF EXISTS "Tenant isolation for insurances DELETE" ON public.insurances;

CREATE POLICY "Tenant isolation for insurances SELECT" ON public.insurances FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for insurances INSERT" ON public.insurances FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for insurances UPDATE" ON public.insurances FOR UPDATE USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for insurances DELETE" ON public.insurances FOR DELETE USING (clinic_id = public.get_clinic_id());

DROP POLICY IF EXISTS "Tenant isolation for insurance_tariffs SELECT" ON public.insurance_tariffs;
DROP POLICY IF EXISTS "Tenant isolation for insurance_tariffs INSERT" ON public.insurance_tariffs;
DROP POLICY IF EXISTS "Tenant isolation for insurance_tariffs UPDATE" ON public.insurance_tariffs;
DROP POLICY IF EXISTS "Tenant isolation for insurance_tariffs DELETE" ON public.insurance_tariffs;

CREATE POLICY "Tenant isolation for insurance_tariffs SELECT" ON public.insurance_tariffs FOR SELECT USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for insurance_tariffs INSERT" ON public.insurance_tariffs FOR INSERT WITH CHECK (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for insurance_tariffs UPDATE" ON public.insurance_tariffs FOR UPDATE USING (clinic_id = public.get_clinic_id());
CREATE POLICY "Tenant isolation for insurance_tariffs DELETE" ON public.insurance_tariffs FOR DELETE USING (clinic_id = public.get_clinic_id());

-- Triggers
DROP TRIGGER IF EXISTS set_clinic_id_insurances ON public.insurances;
CREATE TRIGGER set_clinic_id_insurances BEFORE INSERT ON public.insurances FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();

DROP TRIGGER IF EXISTS set_clinic_id_insurance_tariffs ON public.insurance_tariffs;
CREATE TRIGGER set_clinic_id_insurance_tariffs BEFORE INSERT ON public.insurance_tariffs FOR EACH ROW EXECUTE FUNCTION public.set_clinic_id();


-- ------------------------------------------------------------------------------
-- 3. MOTOR DE VALIDACIÓN DE LÍMITES POR PLAN SaaS (TRIGGER EN USER_ROLES)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_saas_user_limit() RETURNS TRIGGER AS $$
DECLARE
    v_plan TEXT;
    v_user_count INTEGER;
    v_max_users INTEGER;
BEGIN
    -- Obtener el plan de la clínica
    SELECT plan INTO v_plan
    FROM public.clinics
    WHERE id = NEW.clinic_id;

    -- Si no hay plan asignado, asumimos 'Starter' por defecto
    v_plan := COALESCE(v_plan, 'Starter');

    -- Definir límites por plan
    IF v_plan ILIKE '%Starter%' THEN
        v_max_users := 4;
    ELSIF v_plan ILIKE '%Pro%' THEN
        v_max_users := 6;
    ELSE
        -- Enterprise u otro plan personalizado: sin límite estricto
        RETURN NEW;
    END IF;

    -- Contar usuarios actuales en esta clínica
    SELECT COUNT(*) INTO v_user_count
    FROM public.user_roles
    WHERE clinic_id = NEW.clinic_id;

    -- Si supera el límite, lanzar un error y cancelar la transacción
    IF v_user_count >= v_max_users THEN
        RAISE EXCEPTION 'Límite de usuarios alcanzado para la clínica en el plan % (Máximo: % usuarios). Actualiza tu suscripción para añadir más miembros.', v_plan, v_max_users;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_enforce_saas_user_limit ON public.user_roles;
CREATE TRIGGER trigger_enforce_saas_user_limit
    BEFORE INSERT ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_saas_user_limit();
