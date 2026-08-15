-- Migración: Sello en Imagen y Certificado Electrónico Digital X.509
ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS tipo_firma_oficial text DEFAULT 'imagen', -- 'imagen' | 'certificado' | 'ambos'
  ADD COLUMN IF NOT EXISTS firma_sello_imagen text, -- Base64 data URL o URL de imagen de firma/sello
  ADD COLUMN IF NOT EXISTS cert_nombre_titular text DEFAULT 'CLINICA DENTAL DENTIX SL - B12345678',
  ADD COLUMN IF NOT EXISTS cert_emisor text DEFAULT 'FNMT-RCM (Fábrica Nacional de Moneda y Timbre)',
  ADD COLUMN IF NOT EXISTS cert_num_serie text DEFAULT '72A4901F82B094C1',
  ADD COLUMN IF NOT EXISTS cert_valido_hasta text DEFAULT '2029-12-31',
  ADD COLUMN IF NOT EXISTS cert_huella_sha256 text DEFAULT '3A7B9F1C82D405E6F890A1B2C3D4E5F67890ABCD';
