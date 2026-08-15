-- Migración: Facturación profesional con soporte RD 1007/2023 (Modo No Verifactu)

-- 1. Tabla de configuración fiscal de la clínica
CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razon_social text NOT NULL DEFAULT 'Clínica Dental Dentix',
  cif_nif text NOT NULL DEFAULT 'B12345678',
  registro_sanitario text DEFAULT 'CS-12345-M',
  direccion text DEFAULT 'Av. Principal 123',
  codigo_postal text DEFAULT '28000',
  ciudad text DEFAULT 'Madrid',
  provincia text DEFAULT 'Madrid',
  telefono text DEFAULT '+34 912 345 678',
  email text DEFAULT 'info@clinicadentix.es',
  iban text DEFAULT 'ES91 2100 0418 4502 0005 1324',
  updated_at timestamptz DEFAULT now()
);

-- Fila por defecto si no existe
INSERT INTO public.clinic_settings (id, razon_social, cif_nif, registro_sanitario, direccion, codigo_postal, ciudad, provincia, telefono, email, iban)
SELECT '00000000-0000-0000-0000-000000000001', 'Clínica Dental Dentix', 'B12345678', 'CS-12345-M', 'Av. Principal 123', '28000', 'Madrid', 'Madrid', '+34 912 345 678', 'info@clinicadentix.es', 'ES91 2100 0418 4502 0005 1324'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_settings);

-- 2. Secuencia para numeración de facturas correlativa e ininterrumpida
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.invoice_rectifying_seq START WITH 1;

-- 3. Tabla principal de Facturas (Inalterables)
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  serie text NOT NULL DEFAULT 'FAC',
  ejercicio integer NOT NULL DEFAULT extract(year from current_date)::integer,
  secuencia integer NOT NULL,
  tipo text NOT NULL DEFAULT 'ordinaria', -- 'ordinaria' | 'rectificativa'
  fecha_expedicion timestamptz NOT NULL DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  budget_id uuid REFERENCES public.budgets(id) ON DELETE SET NULL,
  
  -- Snapshot fiscal emisor
  emisor_nif text NOT NULL,
  emisor_nombre text NOT NULL,
  emisor_direccion text NOT NULL,
  
  -- Snapshot fiscal receptor
  receptor_nif text,
  receptor_nombre text NOT NULL,
  receptor_direccion text,
  
  -- Importes y tipos
  subtotal numeric(12,2) NOT NULL DEFAULT 0.00,
  exento_iva boolean NOT NULL DEFAULT true,
  motivo_exencion text DEFAULT 'Art. 20.Uno.3º Ley 37/1992 de IVA (Servicios Médicos/Odontológicos)',
  iva_porcentaje numeric(5,2) NOT NULL DEFAULT 0.00,
  iva_importe numeric(12,2) NOT NULL DEFAULT 0.00,
  total numeric(12,2) NOT NULL DEFAULT 0.00,
  
  -- Veri*factu SIF (RD 1007/2023 Modo No Verifactu)
  hash_anterior text NOT NULL,
  hash_actual text NOT NULL UNIQUE,
  qr_data text NOT NULL,
  
  -- Campos para facturas rectificativas
  rectifica_invoice_id uuid REFERENCES public.invoices(id),
  motivo_rectificacion text,
  
  estado text NOT NULL DEFAULT 'emitida', -- 'emitida' | 'anulada'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Tabla de ítems/líneas de factura
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  concepto text NOT NULL,
  descripcion text,
  cantidad numeric(10,2) NOT NULL DEFAULT 1,
  precio_unitario numeric(12,2) NOT NULL DEFAULT 0.00,
  descuento numeric(12,2) NOT NULL DEFAULT 0.00,
  subtotal numeric(12,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON public.invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_fecha ON public.invoices(fecha_expedicion DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_hash ON public.invoices(hash_actual);

-- RLS Policies
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage clinic settings" ON public.clinic_settings;
CREATE POLICY "Staff manage clinic settings" ON public.clinic_settings
FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Patients view clinic settings" ON public.clinic_settings;
CREATE POLICY "Patients view clinic settings" ON public.clinic_settings
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff manage invoices" ON public.invoices;
CREATE POLICY "Staff manage invoices" ON public.invoices
FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Patients view own invoices" ON public.invoices;
CREATE POLICY "Patients view own invoices" ON public.invoices
FOR SELECT TO authenticated USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "Staff manage invoice items" ON public.invoice_items;
CREATE POLICY "Staff manage invoice items" ON public.invoice_items
FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Patients view own invoice items" ON public.invoice_items;
CREATE POLICY "Patients view own invoice items" ON public.invoice_items
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_items.invoice_id AND i.patient_id = auth.uid())
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.clinic_settings TO service_role;
GRANT ALL ON public.invoices TO service_role;
GRANT ALL ON public.invoice_items TO service_role;
