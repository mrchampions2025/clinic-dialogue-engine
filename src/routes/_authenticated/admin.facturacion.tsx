import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { listInvoices, createRectifyingInvoice, Invoice } from "@/lib/invoices";
import { InvoicePDFDocument } from "@/components/invoices/InvoicePDFDocument";
import { formatDate } from "@/lib/clinic-data";
import { formatMoney } from "@/lib/budgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { FileText, Search, ShieldCheck, RefreshCw, Eye, AlertTriangle, Euro, FileCheck, Layers, Database, Copy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/facturacion")({
  component: AdminFacturacionPage,
});

const SQL_MIGRATION_SNIPPET = `-- Migración: Facturación profesional RD 1007/2023
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

INSERT INTO public.clinic_settings (id, razon_social, cif_nif, registro_sanitario, direccion, codigo_postal, ciudad, provincia, telefono, email, iban)
SELECT '00000000-0000-0000-0000-000000000001', 'Clínica Dental Dentix', 'B12345678', 'CS-12345-M', 'Av. Principal 123', '28000', 'Madrid', 'Madrid', '+34 912 345 678', 'info@clinicadentix.es', 'ES91 2100 0418 4502 0005 1324'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_settings);

CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.invoice_rectifying_seq START WITH 1;

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  serie text NOT NULL DEFAULT 'FAC',
  ejercicio integer NOT NULL DEFAULT extract(year from current_date)::integer,
  secuencia integer NOT NULL,
  tipo text NOT NULL DEFAULT 'ordinaria',
  fecha_expedicion timestamptz NOT NULL DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  budget_id uuid REFERENCES public.budgets(id) ON DELETE SET NULL,
  emisor_nif text NOT NULL,
  emisor_nombre text NOT NULL,
  emisor_direccion text NOT NULL,
  receptor_nif text,
  receptor_nombre text NOT NULL,
  receptor_direccion text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0.00,
  exento_iva boolean NOT NULL DEFAULT true,
  motivo_exencion text DEFAULT 'Art. 20.Uno.3º Ley 37/1992 de IVA (Servicios Médicos/Odontológicos)',
  iva_porcentaje numeric(5,2) NOT NULL DEFAULT 0.00,
  iva_importe numeric(12,2) NOT NULL DEFAULT 0.00,
  total numeric(12,2) NOT NULL DEFAULT 0.00,
  hash_anterior text NOT NULL,
  hash_actual text NOT NULL UNIQUE,
  qr_data text NOT NULL,
  rectifica_invoice_id uuid REFERENCES public.invoices(id),
  motivo_rectificacion text,
  estado text NOT NULL DEFAULT 'emitida',
  created_at timestamptz NOT NULL DEFAULT now()
);

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

ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage clinic settings" ON public.clinic_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff manage invoices" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff manage invoice items" ON public.invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.clinic_settings TO authenticated, service_role;
GRANT ALL ON public.invoices TO authenticated, service_role;
GRANT ALL ON public.invoice_items TO authenticated, service_role;
`;

function AdminFacturacionPage() {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [rectifyingTarget, setRectifyingTarget] = useState<Invoice | null>(null);
  const [rectifyingReason, setRectifyingReason] = useState("");
  const [showSqlDialog, setShowSqlDialog] = useState(false);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => listInvoices(),
  });

  const rectifyingMutation = useMutation({
    mutationFn: async () => {
      if (!rectifyingTarget) return;
      if (!rectifyingReason.trim()) throw new Error("Debes indicar el motivo de la rectificación");
      return createRectifyingInvoice(rectifyingTarget.id, rectifyingReason.trim());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Factura rectificativa emitida correctamente");
      setRectifyingTarget(null);
      setRectifyingReason("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filteredInvoices = invoices.filter((inv) => {
    const query = searchTerm.toLowerCase();
    return (
      inv.numero.toLowerCase().includes(query) ||
      inv.receptor_nombre.toLowerCase().includes(query) ||
      (inv.receptor_nif && inv.receptor_nif.toLowerCase().includes(query))
    );
  });

  const currentYear = new Date().getFullYear();
  const yearInvoices = invoices.filter((inv) => inv.ejercicio === currentYear && inv.estado === "emitida");
  const totalFacturado = yearInvoices.reduce((acc, inv) => acc + Number(inv.total), 0);
  const totalOrdinarias = invoices.filter((i) => i.tipo === "ordinaria").length;
  const totalRectificativas = invoices.filter((i) => i.tipo === "rectificativa").length;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SQL_MIGRATION_SNIPPET);
    toast.success("Script SQL copiado al portapapeles. Ejecútalo en el SQL Editor de Supabase.");
  };

  return (
    <AdminShell
      title="Gestión de Facturación SIF"
      subtitle="Sistema inalterable con encadenamiento SHA-256 y cumplimiento RD 1007/2023 (Modo No Veri*factu)"
      actions={
        <Button variant="outline" size="sm" onClick={() => setShowSqlDialog(true)}>
          <Database className="size-4 mr-2 text-blue-600" /> Configurar Tablas SQL
        </Button>
      }
    >
      {/* Tarjetas de Estadísticas */}
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
          <div className="size-12 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Trazabilidad SIF</p>
            <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1 mt-1">
              <Layers className="size-4" /> Hash SHA-256 Activo
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Control */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border border-border mb-6">
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
                      {inv.numero}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{formatDate(inv.fecha_expedicion)}</td>
                    <td className="py-3 px-4 font-medium">
                      {inv.receptor_nombre}
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
                      <span className="bg-muted px-2 py-1 rounded border border-border inline-block" title={inv.hash_actual}>
                        {inv.hash_actual.slice(0, 8)}...{inv.hash_actual.slice(-6)}
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
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => setRectifyingTarget(inv)}
                        >
                          <RefreshCw className="size-3.5 mr-1" /> Rectificar
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

      {/* Modal para ver e imprimir PDF */}
      {selectedInvoice && (
        <InvoicePDFDocument
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Diálogo para emitir Factura Rectificativa */}
      {rectifyingTarget && (
        <Dialog open={!!rectifyingTarget} onOpenChange={() => setRectifyingTarget(null)}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="size-5" />
                Emitir Factura Rectificativa
              </DialogTitle>
              <DialogDescription>
                Se emitirá una factura rectificativa inalterable para anular la factura original{" "}
                <span className="font-mono font-bold text-foreground">{rectifyingTarget.numero}</span> por un importe de{" "}
                <span className="font-bold text-foreground">{formatMoney(rectifyingTarget.total)}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <label className="text-sm font-medium">Motivo legal de la rectificación:</label>
              <Textarea
                placeholder="Ejemplo: Error en el importe abonado, devolución parcial o cancelación del tratamiento..."
                value={rectifyingReason}
                onChange={(e) => setRectifyingReason(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRectifyingTarget(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => rectifyingMutation.mutate()}
                disabled={rectifyingMutation.isPending || !rectifyingReason.trim()}
              >
                {rectifyingMutation.isPending ? "Generando registro..." : "Emitir Rectificativa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo con el Script SQL de Migración */}
      <Dialog open={showSqlDialog} onOpenChange={setShowSqlDialog}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="size-5 text-blue-600" />
              Script SQL de Migración (Supabase)
            </DialogTitle>
            <DialogDescription>
              Ejecuta estas instrucciones en el **SQL Editor** de tu panel de Supabase para crear las tablas de facturación inalterable.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-950 text-slate-100 p-4 rounded-lg text-xs font-mono max-h-72 overflow-y-auto border border-slate-800">
            <pre>{SQL_MIGRATION_SNIPPET}</pre>
          </div>

          <DialogFooter className="flex justify-between items-center w-full">
            <Button variant="outline" onClick={() => setShowSqlDialog(false)}>
              Cerrar
            </Button>
            <Button onClick={copySqlToClipboard} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Copy className="size-4 mr-2" /> Copiar SQL al portapapeles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
