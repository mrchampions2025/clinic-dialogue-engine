import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listTreatments } from "@/lib/clinic-data";
import { Budget, BudgetItem, computeTotals, formatMoney, saveBudget } from "@/lib/budgets";

const emptyItem = (): BudgetItem => ({ tratamiento: "", descripcion: "", cantidad: 1, precio: 0, descuento: 0 });

const DEFAULT_CONDICIONES =
  "Presupuesto válido durante 30 días desde su emisión. Los importes incluyen IVA cuando sea aplicable. La aceptación firmada de este documento autoriza el inicio del plan de tratamiento descrito.";

export function BudgetEditorDialog({
  patientId,
  budget,
  open,
  onOpenChange,
}: {
  patientId: string;
  budget?: Budget | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const [titulo, setTitulo] = useState(budget?.titulo ?? "Plan de tratamiento");
  const [fecha, setFecha] = useState(budget?.fecha ?? today);
  const [validoHasta, setValidoHasta] = useState(budget?.valido_hasta ?? in30);
  const [aseguradora, setAseguradora] = useState(budget?.notas?.match(/\[Seguro: (.*?)\]/)?.[1] ?? "Privado");
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);

  const applyPorcentajeDescuento = (pct: number) => {
    setDescuentoPorcentaje(pct);
    if (pct > 0) {
      const sub = items.reduce((acc, i) => acc + i.cantidad * i.precio, 0);
      const descCalculado = Math.round((sub * (pct / 100)) * 100) / 100;
      setDescuento(descCalculado);
    }
  };

  const { data: treatments = [] } = useQuery({ queryKey: ["treatments"], queryFn: listTreatments });

  const totals = computeTotals(items, descuento);

  const patch = (index: number, changes: Partial<BudgetItem>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...changes } : it)));

  const save = useMutation({
    mutationFn: (estado: "Borrador" | "Pendiente") => {
      const notasConSeguro = aseguradora !== "Privado"
        ? `[Seguro: ${aseguradora}] ${notas}`
        : notas;
      return saveBudget({
        id: budget?.id,
        patient_id: patientId,
        titulo,
        fecha,
        valido_hasta: validoHasta || null,
        descuento,
        notas: notasConSeguro || null,
        condiciones: condiciones || null,
        estado,
        items,
      });
    },
    onSuccess: (_d, estado) => {
      qc.invalidateQueries({ queryKey: ["patient_budgets", patientId] });
      toast.success(estado === "Borrador" ? "Borrador guardado" : "Presupuesto enviado al paciente");
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{budget ? "Editar presupuesto" : "Nuevo presupuesto"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="grid gap-2 sm:col-span-4">
              <Label>Título del plan</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Plan de ortodoncia invisible" />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label className="flex items-center gap-1.5 text-blue-600 font-bold">
                Aseguradora / Cobertura
              </Label>
              <select
                value={aseguradora}
                onChange={(e) => {
                  setAseguradora(e.target.value);
                  if (e.target.value !== "Privado") {
                    applyPorcentajeDescuento(15); // Aplicar 15% por defecto para mutua
                  }
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="Privado">Privado (Sin Aseguradora)</option>
                <option value="Sanitas Dental">Sanitas Dental</option>
                <option value="Adeslas Dental">Adeslas Dental</option>
                <option value="Asisa Dental">Asisa Dental</option>
                <option value="DKV Seguros">DKV Seguros</option>
                <option value="Caser / Santa Lucía">Caser / Santa Lucía / Otra Mutua</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Fecha de emisión</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Válido hasta</Label>
              <Input type="date" value={validoHasta ?? ""} onChange={(e) => setValidoHasta(e.target.value)} />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label>Descuento por Cobertura / Mutua (%)</Label>
              <div className="flex gap-2">
                {[5, 10, 15, 20, 25].map((pct) => (
                  <Button
                    key={pct}
                    type="button"
                    variant={descuentoPorcentaje === pct ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => applyPorcentajeDescuento(pct)}
                  >
                    -{pct}%
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label>Descuento Global (€)</Label>
              <Input type="number" min="0" value={descuento} onChange={(e) => setDescuento(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Líneas de tratamiento</Label>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="rounded-xl border border-border bg-muted/30 p-3">
                  <div className="grid gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-5">
                      <Input
                        list="treatment-options"
                        value={item.tratamiento}
                        onChange={(e) => patch(index, { tratamiento: e.target.value })}
                        placeholder="Tratamiento"
                        className="bg-background"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => patch(index, { cantidad: Number(e.target.value) })}
                        className="bg-background"
                        aria-label="Cantidad"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        type="number"
                        min="0"
                        value={item.precio}
                        onChange={(e) => patch(index, { precio: Number(e.target.value) })}
                        className="bg-background"
                        aria-label="Precio unitario"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        type="number"
                        min="0"
                        value={item.descuento}
                        onChange={(e) => patch(index, { descuento: Number(e.target.value) })}
                        className="bg-background"
                        aria-label="Descuento"
                      />
                    </div>
                    <div className="flex items-center justify-end sm:col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setItems(items.length > 1 ? items.filter((_, i) => i !== index) : [emptyItem()])}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <div className="sm:col-span-12">
                      <Input
                        value={item.descripcion ?? ""}
                        onChange={(e) => patch(index, { descripcion: e.target.value })}
                        placeholder="Descripción / detalle clínico (opcional)"
                        className="bg-background text-sm"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-right text-xs text-muted-foreground">
                    Importe: {formatMoney(item.cantidad * item.precio - (Number(item.descuento) || 0))}
                  </p>
                </div>
              ))}
            </div>
            <datalist id="treatment-options">
              {treatments.map((t) => (
                <option key={t.id} value={t.nombre} />
              ))}
            </datalist>
            <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => setItems([...items, emptyItem()])}>
              <Plus className="mr-1 size-4" /> Añadir línea
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Notas para el paciente</Label>
              <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={4} />
            </div>
            <div className="grid gap-2">
              <Label>Condiciones legales</Label>
              <Textarea value={condiciones} onChange={(e) => setCondiciones(e.target.value)} rows={4} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-6 border-t border-border pt-4">
            <div className="text-right text-sm text-muted-foreground">
              <p>Subtotal: {formatMoney(totals.subtotal)}</p>
              <p>Descuentos: -{formatMoney(totals.descuento)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-3xl font-semibold text-primary">{formatMoney(totals.total)}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={save.isPending} onClick={() => save.mutate("Borrador")}>
            Guardar borrador
          </Button>
          <Button disabled={save.isPending} onClick={() => save.mutate("Pendiente")}>
            {budget ? "Guardar y enviar" : "Enviar al paciente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
