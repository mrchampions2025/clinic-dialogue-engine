import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  computeInvoiceTotals,
  formatMoney,
  saveInvoice,
  type InvoiceDraft,
  type InvoiceEstado,
} from "@/lib/invoices";

const ESTADOS: InvoiceEstado[] = ["Emitida", "Pagada", "Anulada"];
const METODOS = ["Efectivo", "Tarjeta", "Transferencia", "Financiación"];

export function InvoiceEditorDialog({
  draft,
  open,
  onOpenChange,
}: {
  draft: InvoiceDraft;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<InvoiceDraft>(draft);

  const totals = computeInvoiceTotals(form.items, form.descuento, form.iva_porcentaje);

  const save = useMutation({
    mutationFn: () => saveInvoice(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["patient_invoices"] });
      toast.success("Factura guardada");
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setItem = (idx: number, patch: Partial<InvoiceDraft["items"][number]>) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar factura" : "Nueva factura"}</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.patient_id) {
              toast.error("Selecciona un paciente o un presupuesto de origen.");
              return;
            }
            save.mutate();
          }}
        >
          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </div>
            <div>
              <Label>Vencimiento</Label>
              <Input
                type="date"
                value={form.vencimiento ?? ""}
                onChange={(e) => setForm({ ...form, vencimiento: e.target.value || null })}
              />
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border p-4">
            <h4 className="text-sm font-semibold">Datos de facturación</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nombre / Razón social</Label>
                <Input
                  required
                  value={form.cliente_nombre}
                  onChange={(e) => setForm({ ...form, cliente_nombre: e.target.value })}
                />
              </div>
              <div>
                <Label>DNI / NIF</Label>
                <Input
                  value={form.cliente_dni ?? ""}
                  onChange={(e) => setForm({ ...form, cliente_dni: e.target.value || null })}
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={form.cliente_telefono ?? ""}
                  onChange={(e) => setForm({ ...form, cliente_telefono: e.target.value || null })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Dirección</Label>
                <Input
                  value={form.cliente_direccion ?? ""}
                  onChange={(e) => setForm({ ...form, cliente_direccion: e.target.value || null })}
                />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input
                  value={form.cliente_ciudad ?? ""}
                  onChange={(e) => setForm({ ...form, cliente_ciudad: e.target.value || null })}
                />
              </div>
              <div>
                <Label>Código postal</Label>
                <Input
                  value={form.cliente_cp ?? ""}
                  onChange={(e) => setForm({ ...form, cliente_cp: e.target.value || null })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.cliente_email ?? ""}
                  onChange={(e) => setForm({ ...form, cliente_email: e.target.value || null })}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Conceptos</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    items: [
                      ...f.items,
                      { concepto: "", descripcion: null, cantidad: 1, precio: 0, descuento: 0 },
                    ],
                  }))
                }
              >
                <Plus className="mr-1 size-4" /> Añadir línea
              </Button>
            </div>

            {form.items.map((item, idx) => (
              <div key={idx} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <Label className="text-xs">Concepto</Label>
                  <Input value={item.concepto} onChange={(e) => setItem(idx, { concepto: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.cantidad}
                    onChange={(e) => setItem(idx, { cantidad: Number(e.target.value) })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Precio</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.precio}
                    onChange={(e) => setItem(idx, { precio: Number(e.target.value) })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Dto. (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.descuento}
                    onChange={(e) => setItem(idx, { descuento: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-end sm:col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="sm:col-span-12">
                  <Input
                    placeholder="Descripción (opcional)"
                    value={item.descripcion ?? ""}
                    onChange={(e) => setItem(idx, { descripcion: e.target.value || null })}
                  />
                </div>
              </div>
            ))}
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Descuento global (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.descuento}
                onChange={(e) => setForm({ ...form, descuento: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>IVA (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.iva_porcentaje}
                onChange={(e) => setForm({ ...form, iva_porcentaje: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Método de pago</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.metodo_pago}
                onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}
              >
                {METODOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Estado</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value as InvoiceEstado })}
              >
                {ESTADOS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>Notas</Label>
              <Textarea
                rows={2}
                value={form.notas ?? ""}
                onChange={(e) => setForm({ ...form, notas: e.target.value || null })}
              />
            </div>
          </section>

          <div className="rounded-xl bg-secondary/50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base bruta</span>
              <span>{formatMoney(totals.bruto)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descuentos</span>
              <span>-{formatMoney(totals.descuento)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base imponible</span>
              <span>{formatMoney(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA ({form.iva_porcentaje || 0}%)</span>
              <span>{formatMoney(totals.ivaImporte)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatMoney(totals.total)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Guardando…" : "Guardar factura"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
