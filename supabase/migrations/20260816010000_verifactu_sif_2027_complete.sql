-- Migración: Cumplimiento 100% SIF y Veri*factu (RD 1007/2023 - Orden HAC/1177/2024 para 2027)

-- 1. Campos SIF y Modo de Facturación en clinic_settings
ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS modo_facturacion text NOT NULL DEFAULT 'no_verifactu', -- 'no_verifactu' | 'verifactu'
  ADD COLUMN IF NOT EXISTS fabricante_nombre text NOT NULL DEFAULT 'Clinic Dialogue Engine S.L.',
  ADD COLUMN IF NOT EXISTS nif_fabricante text NOT NULL DEFAULT 'B87654321',
  ADD COLUMN IF NOT EXISTS software_nombre text NOT NULL DEFAULT 'Clinic Dialogue Engine SIF',
  ADD COLUMN IF NOT EXISTS software_version text NOT NULL DEFAULT 'v2.4.0-2027';

-- 2. Tabla de Registro Informático de Eventos del Sistema SIF (Audit Log inalterable)
CREATE TABLE IF NOT EXISTS public.sif_event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_evento text NOT NULL, -- 'ALTA_FACTURA' | 'RECTIFICACION_FACTURA' | 'ANULACION_FACTURA' | 'EXPORTACION_LIBRO_AEAT' | 'CAMBIO_MODO_SIF' | 'CONFIGURACION_EMISOR' | 'INICIO_SISTEMA'
  fecha_hora timestamptz NOT NULL DEFAULT now(),
  usuario_id text DEFAULT 'sistema',
  detalles_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  hash_evento text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sif_event_logs_fecha ON public.sif_event_logs(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_sif_event_logs_tipo ON public.sif_event_logs(tipo_evento);

-- RLS Policies para sif_event_logs
ALTER TABLE public.sif_event_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view sif event logs" ON public.sif_event_logs;
CREATE POLICY "Staff view sif event logs" ON public.sif_event_logs
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff insert sif event logs" ON public.sif_event_logs;
CREATE POLICY "Staff insert sif event logs" ON public.sif_event_logs
FOR INSERT TO authenticated WITH CHECK (true);

GRANT SELECT, INSERT ON public.sif_event_logs TO authenticated;
GRANT ALL ON public.sif_event_logs TO service_role;

-- 3. Trigger Postgres para garantizar la Inalterabilidad estricta de facturas emitidas
CREATE OR REPLACE FUNCTION public.prevent_invoice_tampering()
RETURNS trigger AS $$
BEGIN
  IF OLD.estado = 'emitida' THEN
    IF (TG_OP = 'DELETE') THEN
      RAISE EXCEPTION 'RD 1007/2023 SIF: No está permitido eliminar facturas emitidas. Debes emitir una Factura Rectificativa (R1).';
    ELSIF (TG_OP = 'UPDATE') THEN
      IF (OLD.numero IS DISTINCT FROM NEW.numero OR
          OLD.subtotal IS DISTINCT FROM NEW.subtotal OR
          OLD.total IS DISTINCT FROM NEW.total OR
          OLD.hash_actual IS DISTINCT FROM NEW.hash_actual OR
          OLD.hash_anterior IS DISTINCT FROM NEW.hash_anterior) THEN
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
