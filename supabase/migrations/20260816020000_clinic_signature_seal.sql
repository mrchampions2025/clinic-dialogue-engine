-- Migración: Firma y Sello Oficial por Defecto en Configuración y Presupuestos
ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS firma_sello_nombre text DEFAULT 'Dra. María García',
  ADD COLUMN IF NOT EXISTS firma_sello_cargo text DEFAULT 'Dirección Médica - Clínica Dentix',
  ADD COLUMN IF NOT EXISTS firma_sello_data text,
  ADD COLUMN IF NOT EXISTS modo_firma_presupuesto text DEFAULT 'sello_defecto'; -- 'sello_defecto' | 'firma_paciente' | 'ambos'
