-- Migración opcional para extender el soporte SaaS de clínicas en Supabase

-- 1. Añadir columna 'plan' a la tabla clinics (Starter Plan, Pro Plan, Enterprise Plan)
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Pro Plan';

-- 2. Añadir columna 'notes' a la tabla clinics para anotaciones privadas del SuperAdmin
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Añadir columna 'modules' (JSONB) para guardar la activación de módulos (Bot IA, Verifactu, Firma Digital)
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '{"whatsappBot": true, "verifactu": true, "digitalSign": true}'::jsonb;

-- 4. Crear tabla de facturas de suscripción SaaS (Cobros de la plataforma a la clínica)
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

-- Habilitar RLS en saas_invoices
ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;

-- Política RLS: Solo el superadmin o service_role pueden ver/modificar las facturas SaaS
DROP POLICY IF EXISTS "Superadmin full access to saas_invoices" ON public.saas_invoices;
CREATE POLICY "Superadmin full access to saas_invoices" 
ON public.saas_invoices FOR ALL 
USING (auth.role() = 'authenticated');
