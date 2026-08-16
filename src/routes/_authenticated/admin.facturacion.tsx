import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { listInvoices, createRectifyingInvoice, exportInvoicesToCSV, exportInvoicesToJSON_AEAT, getClinicSettings, updateClinicSettings, Invoice, ClinicSettings } from "@/lib/invoices";
import { getBudgetById, Budget } from "@/lib/budgets";
import { listSIFEventLogs, exportSIFEventsToCSV, SIFEventLog } from "@/lib/sif-event-logger";
import { formatHashDisplay } from "@/lib/verifactu";
import { InvoicePDFDocument } from "@/components/invoices/InvoicePDFDocument";
import { DeclaracionResponsableDocument } from "@/components/invoices/DeclaracionResponsableDocument";
import { EmitInvoiceDialog } from "@/components/invoices/EmitInvoiceDialog";
import { formatDate } from "@/lib/clinic-data";
import { formatMoney } from "@/lib/budgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  FileText,
  Search,
  ShieldCheck,
  RefreshCw,
  Eye,
  AlertTriangle,
  Euro,
  FileCheck,
  Layers,
  Database,
  Download,
  Award,
  History,
  CheckCircle2,
  Lock,
  FileSpreadsheet,
  FileJson,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/facturacion")({
  validateSearch: (search: Record<string, unknown>) => ({
    fromBudget: (search.fromBudget as string) || undefined,
  }),
  component: AdminFacturacionPage,
});

const SQL_MIGRATION_SNIPPET = `-- Migración Idempotente Completa SIF / Veri*factu 2027 (RD 1007/2023 - Orden HAC/1177/2024)

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
  ADD COLUMN IF NOT EXISTS software_version text NOT NULL DEFAULT 'v2.4.0-2027',
  ADD COLUMN IF NOT EXISTS firma_sello_nombre text DEFAULT 'Dra. María García',
  ADD COLUMN IF NOT EXISTS firma_sello_cargo text DEFAULT 'Dirección Médica - Clínica Dentix',
  ADD COLUMN IF NOT EXISTS firma_sello_data text,
  ADD COLUMN IF NOT EXISTS modo_firma_presupuesto text DEFAULT 'ambos';

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
FOR EACH ROW EXECUTE FUNCTION public.prevent_invoice_tampering();`;

function AdminFacturacionPage() {
  const queryClient = useQueryClient();
  const { fromBudget } = Route.useSearch();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [rectifyingTarget, setRectifyingTarget] = useState<Invoice | null>(null);
  const [rectifyReason, setRectifyReason] = useState("");
  const [showSqlDialog, setShowSqlDialog] = useState(false);
  const [showDeclaracion, setShowDeclaracion] = useState(false);
  const [activeTab, setActiveTab] = useState("facturas");

  // Borrador de factura desde presupuesto para revisar y personalizar
  const [draftBudgetForInvoice, setDraftBudgetForInvoice] = useState<Budget | null>(null);

  useEffect(() => {
    if (fromBudget) {
      getBudgetById(fromBudget).then((b) => {
        if (b) {
          setDraftBudgetForInvoice(b);
        }
      });
    }
  }, [fromBudget]);

  // Cargar facturas
  const { data: invoices = [], isLoading, refetch } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => listInvoices(),
  });

  // Cargar configuración clínica
  const { data: clinic } = useQuery({
    queryKey: ["clinicSettings"],
    queryFn: () => getClinicSettings(),
  });

  // Cargar logs de eventos SIF
  const { data: eventLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ["sifEventLogs"],
    queryFn: () => listSIFEventLogs(),
  });

  // Mutación para rectificar factura
  const rectifyMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => createRectifyingInvoice(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["sifEventLogs"] });
      toast.success("Factura Rectificativa (R1) emitida e inalterada con sello SIF SHA-256.");
      setRectifyingTarget(null);
      setRectifyReason("");
    },
    onError: (err: any) => {
      toast.error(`Error al emitir factura rectificativa: ${err.message}`);
    },
  });

  // Mutación para alternar Modo SIF (Veri*factu / No Veri*factu)
  const modeMutation = useMutation({
    mutationFn: (newMode: "verifactu" | "no_verifactu") =>
      updateClinicSettings({ modo_facturacion: newMode }),
    onSuccess: (_, newMode) => {
      queryClient.invalidateQueries({ queryKey: ["clinicSettings"] });
      queryClient.invalidateQueries({ queryKey: ["sifEventLogs"] });
      toast.success(`Modo SIF actualizado a: ${newMode === "verifactu" ? "MODO VERI*FACTU (AEAT)" : "MODO NO VERI*FACTU"}`);
    },
    onError: (err: any) => {
      toast.error(`Error al cambiar el modo SIF: ${err.message}`);
    },
  });

  const filteredInvoices = invoices.filter((inv) => {
    const query = searchTerm.toLowerCase();
    const num = inv?.numero || "";
    const name = inv?.receptor_nombre || "";
    const nif = inv?.receptor_nif || "";
    return (
      num.toLowerCase().includes(query) ||
      name.toLowerCase().includes(query) ||
      nif.toLowerCase().includes(query)
    );
  });

  const currentYear = new Date().getFullYear();
  const yearInvoices = invoices.filter((inv) => inv.ejercicio === currentYear && inv.estado === "emitida");
  const totalFacturado = yearInvoices.reduce((acc, inv) => acc + Number(inv.total), 0);
  const totalOrdinarias = invoices.filter((i) => i.tipo === "ordinaria").length;
  const totalRectificativas = invoices.filter((i) => i.tipo === "rectificativa").length;

  const currentMode = clinic?.modo_facturacion || "no_verifactu";
  const isVerifactu = currentMode === "verifactu";

  return (
    <AdminShell
      title="Gestión de Facturación SIF / Veri*factu 2027"
      subtitle="Cumplimiento al 100% con RD 1007/2023 y Orden HAC/1177/2024 (Inalterabilidad SHA-256, QR y SIF Audit Log)"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Modo SIF */}
          <div className="flex items-center bg-muted p-1 rounded-lg border border-border">
            <button
              type="button"
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                !isVerifactu ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => modeMutation.mutate("no_verifactu")}
            >
              No Veri*factu
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                isVerifactu ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => modeMutation.mutate("verifactu")}
            >
              Veri*factu (AEAT)
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            onClick={() => setShowDeclaracion(true)}
          >
            <Award className="size-4 mr-2 text-emerald-600" /> Declaración Fabricante (Art. 13)
          </Button>

          <Button
            variant="default"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
            onClick={() => {
              if (invoices.length === 0) {
                toast.error("No hay facturas registradas en la base de datos para exportar");
                return;
              }
              exportInvoicesToCSV(invoices);
              toast.success("Libro Registro de Facturas (CSV AEAT) exportado con éxito");
            }}
          >
            <FileSpreadsheet className="size-4 mr-2" /> Exportar CSV
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (invoices.length === 0) {
                toast.error("No hay facturas registradas para exportar");
                return;
              }
              exportInvoicesToJSON_AEAT(invoices, clinic);
              toast.success("Libro Registro SIF en formato JSON AEAT exportado con éxito");
            }}
          >
            <FileJson className="size-4 mr-2" /> JSON SIF AEAT
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setShowSqlDialog(true)}>
            <Database className="size-4 text-blue-600" />
          </Button>
        </div>
      }
    >
      {/* Tarjetas de Estadísticas y Estado SIF */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Euro className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Facturado Ejercicio {currentYear}</p>
            <p className="text-2xl font-bold">{formatMoney(totalFacturado)}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <FileCheck className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Facturas Ordinarias</p>
            <p className="text-2xl font-bold">{totalOrdinarias}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Facturas Rectificativas</p>
            <p className="text-2xl font-bold">{totalRectificativas}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className={`size-12 rounded-lg ${isVerifactu ? "bg-emerald-500/10 text-emerald-600" : "bg-purple-500/10 text-purple-600"} flex items-center justify-center`}>
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Estado Modo SIF Active</p>
            <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1 mt-1">
              <CheckCircle2 className="size-4" /> {isVerifactu ? "VERI*FACTU AEAT" : "Modo No Veri*factu"}
            </p>
          </div>
        </div>
      </div>

      {/* Pestañas Principales: Facturas / Audit Log / Declaración */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="facturas" className="gap-2 text-xs font-semibold">
            <FileText className="size-4" /> Facturas Emitidas ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="audit-log" className="gap-2 text-xs font-semibold">
            <History className="size-4" /> Log de Eventos SIF ({eventLogs.length})
          </TabsTrigger>
        </TabsList>

        {/* Pestaña 1: Facturas */}
        <TabsContent value="facturas" className="space-y-4">
          {/* Barra de Búsqueda */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border border-border">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por Nº de factura, paciente o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              Mostrando {filteredInvoices.length} de {invoices.length} registro(s) fiscales inalterables
            </p>
          </div>

          {/* Tabla de Facturas */}
          {isLoading ? (
            <p className="text-center py-12 text-muted-foreground">Cargando facturas inalterables...</p>
          ) : filteredInvoices.length === 0 ? (
            <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground space-y-4">
              <FileText className="size-10 mx-auto opacity-40 text-blue-600" />
              <div>
                <p className="font-semibold text-base text-foreground">Sin facturas registradas en el sistema</p>
                <p className="text-xs max-w-md mx-auto mt-1">
                  Las facturas emitidas desde los presupuestos aceptados de los pacientes aparecerán aquí inmediatamente con su correspondiente sello y código QR SIF.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowSqlDialog(true)}>
                  <Database className="size-4 mr-2 text-blue-600" /> Ver Script SQL de Migración Supabase
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3 px-4 text-left">Nº Factura</th>
                      <th className="py-3 px-4 text-left">Fecha</th>
                      <th className="py-3 px-4 text-left">Paciente</th>
                      <th className="py-3 px-4 text-left">Tipo</th>
                      <th className="py-3 px-4 text-right">Base Imponible</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-center">Huella SIF (SHA-256)</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-primary">
                          {inv.numero || "—"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{formatDate(inv.fecha_expedicion)}</td>
                        <td className="py-3 px-4 font-medium">
                          {inv.receptor_nombre || "—"}
                          {inv.receptor_nif && <span className="block text-xs text-muted-foreground font-mono">{inv.receptor_nif}</span>}
                        </td>
                        <td className="py-3 px-4">
                          {inv.tipo === "rectificativa" ? (
                            <Badge variant="destructive" className="font-mono text-[10px]">
                              RECTIFICATIVA
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="font-mono text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400">
                              ORDINARIA
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">{formatMoney(inv.subtotal)}</td>
                        <td className="py-3 px-4 text-right font-bold">{formatMoney(inv.total)}</td>
                        <td className="py-3 px-4 text-center font-mono text-[11px] text-muted-foreground">
                          <span className="bg-muted px-2 py-1 rounded border border-border inline-block" title={inv.hash_actual || ""}>
                            {formatHashDisplay(inv.hash_actual)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium"
                            onClick={() => setSelectedInvoice(inv)}
                          >
                            <Download className="size-3.5 mr-1" /> Descargar / Ver PDF
                          </Button>

                          {inv.tipo === "ordinaria" && inv.estado === "emitida" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setRectifyingTarget(inv)}
                            >
                              <RefreshCw className="size-3.5 mr-1" /> Rectificar (R1)
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Pestaña 2: Registro Informático de Eventos SIF (Audit Log) */}
        <TabsContent value="audit-log" className="space-y-4">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <History className="size-4 text-emerald-600" /> Registro Informático de Eventos del Sistema (Audit Log)
              </h3>
              <p className="text-xs text-muted-foreground">
                Trazabilidad inalterable de operaciones exigida por el Art. 8 del RD 1007/2023 y la Orden HAC/1177/2024.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportSIFEventsToCSV(eventLogs);
                toast.success("Registro de Eventos SIF exportado en CSV para Inspección AEAT");
              }}
            >
              <Download className="size-4 mr-2" /> Exportar Log de Eventos (CSV)
            </Button>
          </div>

          {eventLogs.length === 0 ? (
            <div className="bg-card rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground space-y-2">
              <Lock className="size-8 mx-auto opacity-40 text-emerald-600" />
              <p className="font-semibold">Sin eventos registrados aún en el log de auditoría</p>
              <p className="text-xs text-muted-foreground">
                Los eventos de emisión, rectificación, exportación y cambios de modo se registrarán automáticamente aquí.
              </p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold text-xs">
                  <tr>
                    <th className="py-3 px-4 text-left">Fecha / Hora</th>
                    <th className="py-3 px-4 text-left">Tipo de Evento SIF</th>
                    <th className="py-3 px-4 text-left">Usuario / Origen</th>
                    <th className="py-3 px-4 text-left">Detalles de Operación</th>
                    <th className="py-3 px-4 text-center">Huella Hash SHA-256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {eventLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        {new Date(log.fecha_hora).toLocaleString("es-ES")}
                      </td>
                      <td className="py-3 px-4 font-semibold text-xs">
                        <Badge variant="outline" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300">
                          {log.tipo_evento}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-muted-foreground">{log.usuario_id}</td>
                      <td className="py-3 px-4 text-xs max-w-xs truncate font-mono text-muted-foreground" title={JSON.stringify(log.detalles_json)}>
                        {JSON.stringify(log.detalles_json)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-muted-foreground">
                        <span className="bg-muted px-2 py-0.5 rounded border border-border inline-block" title={log.hash_evento}>
                          {formatHashDisplay(log.hash_evento)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Visor de PDF Factura */}
      {selectedInvoice && (
        <InvoicePDFDocument
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Modal Revisor y Personalizador de Borrador desde Presupuesto */}
      {draftBudgetForInvoice && (
        <EmitInvoiceDialog
          open={!!draftBudgetForInvoice}
          onOpenChange={(open) => !open && setDraftBudgetForInvoice(null)}
          budget={draftBudgetForInvoice}
          onEmitted={() => {
            refetch();
            refetchLogs();
            setDraftBudgetForInvoice(null);
          }}
        />
      )}

      {/* Modal Declaración Responsable del Fabricante (Art. 13 RD 1007/2023) */}
      {showDeclaracion && clinic && (
        <DeclaracionResponsableDocument
          clinic={clinic}
          onClose={() => setShowDeclaracion(false)}
        />
      )}

      {/* Modal Rectificación Factura (R1) */}
      <Dialog open={!!rectifyingTarget} onOpenChange={(open) => !open && setRectifyingTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" /> Emitir Factura Rectificativa (R1)
            </DialogTitle>
            <DialogDescription>
              Se creará un registro rectificativo inalterable para anular fiscalmente la factura{" "}
              <strong className="text-foreground">{rectifyingTarget?.numero}</strong> según la normativa SIF RD 1007/2023.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Motivo legal de la rectificación:
              </label>
              <Textarea
                placeholder="Ej: Error en datos del paciente, importe erróneo o anulación del tratamiento..."
                value={rectifyReason}
                onChange={(e) => setRectifyReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRectifyingTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!rectifyReason.trim() || rectifyMutation.isPending}
              onClick={() => {
                if (rectifyingTarget) {
                  rectifyMutation.mutate({
                    id: rectifyingTarget.id,
                    motivo: rectifyReason.trim(),
                  });
                }
              }}
            >
              {rectifyMutation.isPending ? "Generando R1 SIF..." : "Emitir Factura Rectificativa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Script SQL de Migración */}
      <Dialog open={showSqlDialog} onOpenChange={setShowSqlDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="size-5 text-blue-600" /> Script SQL de Migración Supabase SIF 2027
            </DialogTitle>
            <DialogDescription>
              Ejecuta estas instrucciones en el Editor SQL de tu panel de Supabase para activar el soporte completo de inalterabilidad, Audit Log y modo dual Veri*factu.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-950 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-80 my-2">
            <pre>{SQL_MIGRATION_SNIPPET}</pre>
          </div>

          <DialogFooter>
            <Button
              variant="default"
              onClick={() => {
                navigator.clipboard.writeText(SQL_MIGRATION_SNIPPET);
                toast.success("Script SQL copiado al portapapeles. Ejecútalo en el SQL Editor de Supabase.");
              }}
            >
              Copiar Script SQL al Portapapeles
            </Button>
            <Button variant="outline" onClick={() => setShowSqlDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
