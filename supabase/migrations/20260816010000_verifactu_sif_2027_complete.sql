-- Migración Idempotente Completa SIF / Veri*factu 2027 (RD 1007/2023 - Orden HAC/1177/2024)

-- 1. Tabla clinic_settings y columnas SIF
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

ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS modo_facturacion text NOT NULL DEFAULT 'no_verifactu',
  ADD COLUMN IF NOT EXISTS fabricante_nombre text NOT NULL DEFAULT 'Clinic Dialogue Engine S.L.',
  ADD COLUMN IF NOT EXISTS nif_fabricante text NOT NULL DEFAULT 'B87654321',
  ADD COLUMN IF NOT EXISTS software_nombre text NOT NULL DEFAULT 'Clinic Dialogue Engine SIF',
  ADD COLUMN IF NOT EXISTS software_version text NOT NULL DEFAULT 'v2.4.0-2027';

INSERT INTO public.clinic_settings (id, razon_social, cif_nif, registro_sanitario, direccion, codigo_postal, ciudad, provincia, telefono, email, iban)
SELECT '00000000-0000-0000-0000-000000000001', 'Clínica Dental Dentix', 'B12345678', 'CS-12345-M', 'Av. Principal 123', '28000', 'Madrid', 'Madrid', '+34 912 345 678', 'info@clinicadentix.es', 'ES91 2100 0418 4502 0005 1324'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_settings);

-- 2. Secuencias
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.invoice_rectifying_seq START WITH 1;

-- 3. Tabla Facturas y Alter Table para columnas faltantes
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS serie text NOT NULL DEFAULT 'FAC',
  ADD COLUMN IF NOT EXISTS ejercicio integer NOT NULL DEFAULT extract(year from current_date)::integer,
  ADD COLUMN IF NOT EXISTS secuencia integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'ordinaria',
  ADD COLUMN IF NOT EXISTS fecha_expedicion timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS patient_id uuid,
  ADD COLUMN IF NOT EXISTS budget_id uuid,
  ADD COLUMN IF NOT EXISTS emisor_nif text NOT NULL DEFAULT 'B12345678',
  ADD COLUMN IF NOT EXISTS emisor_nombre text NOT NULL DEFAULT 'Clínica Dental Dentix',
  ADD COLUMN IF NOT EXISTS emisor_direccion text NOT NULL DEFAULT 'Av. Principal 123',
  ADD COLUMN IF NOT EXISTS receptor_nif text,
  ADD COLUMN IF NOT EXISTS receptor_nombre text NOT NULL DEFAULT 'Paciente',
  ADD COLUMN IF NOT EXISTS receptor_direccion text,
  ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS exento_iva boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS motivo_exencion text DEFAULT 'Art. 20.Uno.3º Ley 37/1992 de IVA (Servicios Médicos/Odontológicos)',
  ADD COLUMN IF NOT EXISTS iva_porcentaje numeric(5,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS iva_importe numeric(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total numeric(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS hash_anterior text NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
  ADD COLUMN IF NOT EXISTS hash_actual text NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
  ADD COLUMN IF NOT EXISTS qr_data text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS rectifica_invoice_id uuid,
  ADD COLUMN IF NOT EXISTS motivo_rectificacion text,
  ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'emitida';

-- 4. Tabla Líneas de Factura
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

-- 5. Tabla Log de Eventos SIF (Audit Log)
CREATE TABLE IF NOT EXISTS public.sif_event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_evento text NOT NULL,
  fecha_hora timestamptz NOT NULL DEFAULT now(),
  usuario_id text DEFAULT 'sistema',
  detalles_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  hash_evento text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices (solo si existen las columnas)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='patient_id') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_patient ON public.invoices(patient_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='fecha_expedicion') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_fecha ON public.invoices(fecha_expedicion DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='hash_actual') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_hash ON public.invoices(hash_actual);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sif_event_logs_fecha ON public.sif_event_logs(fecha_hora DESC);

-- RLS y Políticas (con DROP previo para evitar duplicados "already exists")
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sif_event_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage clinic settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Patients view clinic settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Allow all clinic settings" ON public.clinic_settings;

CREATE POLICY "Allow all clinic settings" ON public.clinic_settings
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Staff manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Patients view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow all invoices" ON public.invoices;

CREATE POLICY "Allow all invoices" ON public.invoices
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Staff manage invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Patients view own invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Allow all invoice items" ON public.invoice_items;

CREATE POLICY "Allow all invoice items" ON public.invoice_items
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Staff view sif event logs" ON public.sif_event_logs;
DROP POLICY IF EXISTS "Staff insert sif event logs" ON public.sif_event_logs;
DROP POLICY IF EXISTS "Allow all sif event logs" ON public.sif_event_logs;

CREATE POLICY "Allow all sif event logs" ON public.sif_event_logs
FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.clinic_settings TO authenticated;
GRANT ALL ON public.invoices TO authenticated;
GRANT ALL ON public.invoice_items TO authenticated;
GRANT ALL ON public.sif_event_logs TO authenticated;
GRANT ALL ON public.clinic_settings TO service_role;
GRANT ALL ON public.invoices TO service_role;
GRANT ALL ON public.invoice_items TO service_role;
GRANT ALL ON public.sif_event_logs TO service_role;

-- 6. Trigger Postgres de Inalterabilidad
CREATE OR REPLACE FUNCTION public.prevent_invoice_tampering()
RETURNS trigger AS $$
BEGIN
  IF OLD.estado = 'emitida' THEN
    IF (TG_OP = 'DELETE') THEN
      RAISE EXCEPTION 'RD 1007/2023 SIF: No está permitido eliminar facturas emitidas.';
    ELSIF (TG_OP = 'UPDATE') THEN
      IF (OLD.numero IS DISTINCT FROM NEW.numero OR
          OLD.subtotal IS DISTINCT FROM NEW.subtotal OR
          OLD.total IS DISTINCT FROM NEW.total OR
          OLD.hash_actual IS DISTINCT FROM NEW.hash_actual) THEN
        RAISE EXCEPTION 'RD 1007/2023 SIF: Los datos fiscales y la huella SHA-256 de una factura emitida son inalterables.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_invoice_tampering ON public.invoices;
CREATE TRIGGER trg_prevent_invoice_tampering
BEFORE UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.prevent_invoice_tampering();
