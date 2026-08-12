
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS titulo text NOT NULL DEFAULT 'Plan de tratamiento',
  ADD COLUMN IF NOT EXISTS valido_hasta date,
  ADD COLUMN IF NOT EXISTS condiciones text,
  ADD COLUMN IF NOT EXISTS descuento numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS firma_nombre text,
  ADD COLUMN IF NOT EXISTS firma_dni text,
  ADD COLUMN IF NOT EXISTS firma_data text,
  ADD COLUMN IF NOT EXISTS firmado_at timestamptz,
  ADD COLUMN IF NOT EXISTS rechazado_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE SEQUENCE IF NOT EXISTS public.budget_number_seq;

ALTER TABLE public.budget_items
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS descuento numeric NOT NULL DEFAULT 0;

UPDATE public.budgets SET numero = 'PRE-' || to_char(created_at, 'YYYY') || '-' || lpad(nextval('public.budget_number_seq')::text, 4, '0') WHERE numero IS NULL;

DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Enable all for admins on budgets" ON public.budgets;
DROP POLICY IF EXISTS "Enable all for admins on budget_items" ON public.budget_items;

CREATE POLICY "Staff manage budgets" ON public.budgets
FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Patients view own budgets" ON public.budgets
FOR SELECT TO authenticated USING (patient_id = auth.uid());

CREATE POLICY "Patients sign own budgets" ON public.budgets
FOR UPDATE TO authenticated USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Staff manage budget items" ON public.budget_items
FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Patients view own budget items" ON public.budget_items
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.budgets b WHERE b.id = budget_items.budget_id AND b.patient_id = auth.uid())
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_items TO authenticated;
GRANT ALL ON public.budgets TO service_role;
GRANT ALL ON public.budget_items TO service_role;

-- Presupuestos reales de ejemplo
INSERT INTO public.budgets (id, patient_id, numero, titulo, fecha, valido_hasta, estado, total, descuento, notas, condiciones)
VALUES
 ('a1000000-0000-4000-8000-000000000001', '402740e1-71d3-491a-a4af-921b1364808e', 'PRE-2026-1001', 'Plan de ortodoncia invisible + higiene', CURRENT_DATE, CURRENT_DATE + 30, 'Pendiente', 3510, 150, 'Incluye revisiones cada 6 semanas durante todo el tratamiento.', 'Presupuesto válido 30 días. Financiación hasta 24 meses sin intereses. El importe no incluye tratamientos adicionales no descritos.'),
 ('a1000000-0000-4000-8000-000000000002', 'd771b7bf-11d3-4609-add3-ddbd8064735a', 'PRE-2026-1002', 'Rehabilitación con implante unitario', CURRENT_DATE, CURRENT_DATE + 30, 'Pendiente', 1690, 0, 'Incluye TAC 3D y cirugía guiada.', 'Presupuesto válido 30 días. Incluye garantía del implante de 10 años.'),
 ('a1000000-0000-4000-8000-000000000003', '49da41dd-30ce-477f-a02f-4d9b07d48347', 'PRE-2026-1003', 'Estética dental: blanqueamiento y carillas', CURRENT_DATE, CURRENT_DATE + 30, 'Pendiente', 2340, 100, 'Diseño de sonrisa digital incluido.', 'Presupuesto válido 30 días. Se requiere higiene previa.'),
 ('a1000000-0000-4000-8000-000000000004', '17cfd225-8f5b-4f8e-b34f-4d4900665a5a', 'PRE-2026-1004', 'Tratamiento conservador y endodoncia', CURRENT_DATE, CURRENT_DATE + 30, 'Pendiente', 720, 0, 'Dos sesiones estimadas.', 'Presupuesto válido 30 días.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.budget_items (budget_id, tratamiento, descripcion, cantidad, precio, descuento)
VALUES
 ('a1000000-0000-4000-8000-000000000001', 'Estudio y diseño Invisalign', 'Escaneado intraoral 3D y plan ClinCheck', 1, 210, 0),
 ('a1000000-0000-4000-8000-000000000001', 'Ortodoncia invisible completa', 'Juego completo de alineadores superior e inferior', 1, 3200, 150),
 ('a1000000-0000-4000-8000-000000000001', 'Higiene bucodental', 'Limpieza con ultrasonidos y pulido', 1, 250, 0),
 ('a1000000-0000-4000-8000-000000000002', 'Implante de titanio', 'Implante Straumann con cirugía guiada', 1, 950, 0),
 ('a1000000-0000-4000-8000-000000000002', 'Corona de zirconio', 'Corona sobre implante, color personalizado', 1, 590, 0),
 ('a1000000-0000-4000-8000-000000000002', 'TAC 3D', 'Radiografía volumétrica de planificación', 1, 150, 0),
 ('a1000000-0000-4000-8000-000000000003', 'Blanqueamiento LED', 'Dos sesiones en clínica + férulas domiciliarias', 1, 390, 50),
 ('a1000000-0000-4000-8000-000000000003', 'Carilla de porcelana', 'Carillas en sector anterior superior', 4, 500, 50),
 ('a1000000-0000-4000-8000-000000000004', 'Endodoncia molar', 'Tratamiento de conductos en pieza 36', 1, 320, 0),
 ('a1000000-0000-4000-8000-000000000004', 'Empaste composite', 'Obturaciones en piezas 24 y 25', 2, 200, 0);
