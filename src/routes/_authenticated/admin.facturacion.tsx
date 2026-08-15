import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { listInvoices, createRectifyingInvoice, exportInvoicesToCSV, exportInvoicesToJSON_AEAT, getClinicSettings, updateClinicSettings, Invoice, ClinicSettings } from "@/lib/invoices";
import { listSIFEventLogs, exportSIFEventsToCSV, SIFEventLog } from "@/lib/sif-event-logger";
import { formatHashDisplay } from "@/lib/verifactu";
import { InvoicePDFDocument } from "@/components/invoices/InvoicePDFDocument";
import { DeclaracionResponsableDocument } from "@/components/invoices/DeclaracionResponsableDocument";
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
  component: AdminFacturacionPage,
});

const SQL_MIGRATION_SNIPPET = `-- Migración Completa SIF / Veri*factu 2027 (RD 1007/2023 - Orden HAC/1177/2024)
ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS modo_facturacion text NOT NULL DEFAULT 'no_verifactu',
  ADD COLUMN IF NOT EXISTS fabricante_nombre text NOT NULL DEFAULT 'Clinic Dialogue Engine S.L.',
  ADD COLUMN IF NOT EXISTS nif_fabricante text NOT NULL DEFAULT 'B87654321',
  ADD COLUMN IF NOT EXISTS software_nombre text NOT NULL DEFAULT 'Clinic Dialogue Engine SIF',
  ADD COLUMN IF NOT EXISTS software_version text NOT NULL DEFAULT 'v2.4.0-2027';

CREATE TABLE IF NOT EXISTS public.sif_event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_evento text NOT NULL,
  fecha_hora timestamptz NOT NULL DEFAULT now(),
  usuario_id text DEFAULT 'sistema',
  detalles_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  hash_evento text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [rectifyingTarget, setRectifyingTarget] = useState<Invoice | null>(null);
  const [rectifyReason, setRectifyReason] = useState("");
  const [showSqlDialog, setShowSqlDialog] = useState(false);
  const [showDeclaracion, setShowDeclaracion] = useState(false);
  const [activeTab, setActiveTab] = useState("facturas");

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
                            onClick={() => setSelectedInvoice(inv)}
                          >
                            <Eye className="size-3.5 mr-1" /> PDF
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
