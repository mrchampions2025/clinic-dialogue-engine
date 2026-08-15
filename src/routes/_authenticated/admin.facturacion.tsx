import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceEditorDialog } from "@/components/admin/InvoiceEditorDialog";
import {
  deleteInvoice,
  draftFromBudget,
  formatMoney,
  listInvoices,
  setInvoiceEstado,
  type Invoice,
  type InvoiceDraft,
} from "@/lib/invoices";
import { formatDate } from "@/lib/clinic-data";

export const Route = createFileRoute("/_authenticated/admin/facturacion")({
  validateSearch: (search: Record<string, unknown>) => ({
    budget: typeof search['budget'] === "string" ? (search['budget'] as string) : undefined,
  }),
  component: FacturacionPage,
  head: () => ({
    meta: [
      { title: "Facturación | Clínica Dentix" },
      { name: "description", content: "Emite y gestiona las facturas de la clínica a partir de presupuestos aceptados." },
      { property: "og:title", content: "Facturación | Clínica Dentix" },
      { property: "og:description", content: "Emite y gestiona las facturas de la clínica a partir de presupuestos aceptados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function emptyDraft(): InvoiceDraft {
  return {
    patient_id: "",
    budget_id: null,
    numero: null,
    fecha: new Date().toISOString().slice(0, 10),
    vencimiento: null,
    cliente_nombre: "",
    cliente_dni: null,
    cliente_direccion: null,
    cliente_ciudad: null,
    cliente_cp: null,
    cliente_email: null,
    cliente_telefono: null,
    descuento: 0,
    iva_porcentaje: 0,
    estado: "Emitida",
    metodo_pago: "Efectivo",
    notas: null,
    items: [],
  };
}

function invoiceToDraft(inv: Invoice): InvoiceDraft {
  return {
    id: inv.id,
    patient_id: inv.patient_id,
    budget_id: inv.budget_id,
    numero: inv.numero,
    fecha: inv.fecha,
    vencimiento: inv.vencimiento,
    cliente_nombre: inv.cliente_nombre,
    cliente_dni: inv.cliente_dni,
    cliente_direccion: inv.cliente_direccion,
    cliente_ciudad: inv.cliente_ciudad,
    cliente_cp: inv.cliente_cp,
    cliente_email: inv.cliente_email,
    cliente_telefono: inv.cliente_telefono,
    descuento: Number(inv.descuento) || 0,
    iva_porcentaje: Number(inv.iva_porcentaje) || 0,
    estado: inv.estado,
    metodo_pago: inv.metodo_pago,
    notas: inv.notas,
    items: (inv.invoice_items || []).map((i) => ({
      concepto: i.concepto,
      descripcion: i.descripcion,
      cantidad: Number(i.cantidad) || 1,
      precio: Number(i.precio) || 0,
      descuento: Number(i.descuento) || 0,
    })),
  };
}

function FacturacionPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { budget } = Route.useSearch();

  const [ref, setRef] = useState("");
  const [draft, setDraft] = useState<InvoiceDraft | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: listInvoices,
  });

  const loadFromBudget = useMutation({
    mutationFn: (value: string) => draftFromBudget(value),
    onSuccess: (d) => {
      setDraft(d);
      setRef("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Llegada desde un presupuesto ("Facturar")
  useEffect(() => {
    if (budget) {
      loadFromBudget.mutate(budget);
      navigate({ to: "/admin/facturacion", search: {}, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget]);

  const remove = useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Factura eliminada");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => setInvoiceEstado(id, "Pagada"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Factura marcada como pagada");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const facturado = invoices
    .filter((i) => i.estado !== "Anulada")
    .reduce((a, i) => a + Number(i.total), 0);

  return (
    <AdminShell
      title="Facturación"
      subtitle={`${invoices.length} factura(s) · ${formatMoney(facturado)} facturado`}
      actions={
        <Button onClick={() => setDraft(emptyDraft())}>
          <Plus className="mr-1 size-4" /> Nueva factura
        </Button>
      }
    >
      <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold">Facturar desde presupuesto</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Introduce el número de referencia del presupuesto aceptado (ej. PRE-2026-1234) y la factura se rellenará
          automáticamente con el paciente, sus datos fiscales y los tratamientos.
        </p>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (ref.trim()) loadFromBudget.mutate(ref.trim());
          }}
        >
          <Input
            placeholder="PRE-2026-1234"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="sm:max-w-xs"
          />
          <Button type="submit" variant="secondary" disabled={loadFromBudget.isPending}>
            <Search className="mr-1 size-4" />
            {loadFromBudget.isPending ? "Buscando…" : "Cargar presupuesto"}
          </Button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº factura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>DNI/NIF</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Cargando facturas…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Todavía no hay facturas emitidas.
                </TableCell>
              </TableRow>
            )}
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    {inv.numero || "—"}
                  </span>
                </TableCell>
                <TableCell>{inv.cliente_nombre}</TableCell>
                <TableCell className="text-muted-foreground">{inv.cliente_dni || "—"}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(inv.fecha)}</TableCell>
                <TableCell>
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-xs font-medium " +
                      (inv.estado === "Pagada"
                        ? "bg-primary/10 text-primary"
                        : inv.estado === "Anulada"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-secondary text-secondary-foreground")
                    }
                  >
                    {inv.estado}
                  </span>
                </TableCell>
                <TableCell className="text-right font-semibold">{formatMoney(inv.total)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {inv.estado === "Emitida" && (
                      <Button variant="outline" size="sm" onClick={() => markPaid.mutate(inv.id)}>
                        Marcar pagada
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setDraft(invoiceToDraft(inv))}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm("¿Eliminar esta factura?")) remove.mutate(inv.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {draft && (
        <InvoiceEditorDialog
          key={draft.id ?? draft.budget_id ?? "new"}
          draft={draft}
          open={!!draft}
          onOpenChange={(v) => !v && setDraft(null)}
        />
      )}
    </AdminShell>
  );
}
