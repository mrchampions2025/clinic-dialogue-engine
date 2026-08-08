CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  telefono text,
  email text,
  etiqueta text,
  ultima_visita date,
  proxima_cita date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage patients" ON public.patients FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  categoria text,
  precio text,
  duracion text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatments TO authenticated;
GRANT ALL ON public.treatments TO service_role;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage treatments" ON public.treatments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  paciente text NOT NULL,
  telefono text,
  tratamiento text,
  fecha date NOT NULL,
  hora time NOT NULL,
  canal text NOT NULL DEFAULT 'WhatsApp IA',
  estado text NOT NULL DEFAULT 'Pendiente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage appointments" ON public.appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON public.treatments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.patients (nombre, telefono, email, etiqueta, ultima_visita, proxima_cita) VALUES
 ('Lucía Herrera','+34 611 223 344','lucia.h@mail.com','Recurrente','2026-07-12','2026-08-06'),
 ('Marcos Ruiz','+34 699 004 512','marcos.ruiz@mail.com','Ortodoncia','2026-07-02','2026-08-07'),
 ('Ana Belén Soto','+34 622 118 902','abs@mail.com','Nuevo',NULL,'2026-08-06'),
 ('Javier Molina','+34 677 445 118','j.molina@mail.com','Urgencias','2026-06-28','2026-08-08'),
 ('Paula Nieto','+34 634 889 100','paula.nieto@mail.com','Estética','2026-05-19','2026-08-07'),
 ('Elena Vargas','+34 688 332 907','elena.v@mail.com','Nuevo',NULL,'2026-08-08');

INSERT INTO public.treatments (nombre, categoria, precio, duracion) VALUES
 ('Limpieza dental (higiene)','Prevención','60 €','30 min'),
 ('Primera visita + revisión','Prevención','Gratis','20 min'),
 ('Empaste composite','Conservadora','75 €','45 min'),
 ('Endodoncia unirradicular','Conservadora','180 €','60 min'),
 ('Implante unitario','Implantes','950 €','90 min'),
 ('Ortodoncia invisible','Ortodoncia','3.200 €','45 min'),
 ('Brackets metálicos','Ortodoncia','2.400 €','45 min'),
 ('Blanqueamiento LED','Estética','290 €','60 min');

INSERT INTO public.appointments (paciente, telefono, tratamiento, fecha, hora, canal, estado) VALUES
 ('Lucía Herrera','+34 611 223 344','Limpieza dental','2026-08-06','09:00','WhatsApp IA','Confirmada'),
 ('Ana Belén Soto','+34 622 118 902','Implante unitario','2026-08-06','11:15','WhatsApp IA','Pendiente'),
 ('Diego Cabrera','+34 655 771 220','Endodoncia','2026-08-06','17:30','Teléfono','Cancelada'),
 ('Marcos Ruiz','+34 699 004 512','Ortodoncia (revisión)','2026-08-07','10:00','WhatsApp IA','Confirmada'),
 ('Paula Nieto','+34 634 889 100','Blanqueamiento','2026-08-07','12:30','Web','Pendiente'),
 ('Javier Molina','+34 677 445 118','Urgencia dental','2026-08-08','09:45','WhatsApp IA','Confirmada'),
 ('Elena Vargas','+34 688 332 907','Primera visita','2026-08-08','18:15','WhatsApp IA','Pendiente');