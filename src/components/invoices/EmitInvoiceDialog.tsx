import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Budget, formatMoney } from "@/lib/budgets";
import { createInvoiceFromBudget, CreateInvoiceOptions } from "@/lib/invoices";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Receipt, ShieldCheck, Plus, Trash2, Calculator, Info } from "lucide-react";

interface EmitInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
  onEmitted?: (invoiceId: string) => void;
}

export function EmitInvoiceDialog({ open, onOpenChange, budget, onEmitted }: EmitInvoiceDialogProps) {
  const queryClient = useQueryClient();

  const [receptorNif, setReceptorNif] = useState("");
  const [receptorNombre, setReceptorNombre] = useState("");
  const [receptorDireccion, setReceptorDireccion] = useState("");
  const [exentoIva, setExentoIva] = useState(true);
  const [ivaPorcentaje, setIvaPorcentaje] = useState(0);
  const [motivoExencion, setMotivoExencion] = useState("Art. 20.Uno.3º Ley 37/1992 de IVA (Servicios Médicos/Odontológicos)");
  
  const [items, setItems] = useState<Array<{
    concepto: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    descuento: number;
    subtotal: number;
  }>>([]);

  useEffect(() => {
    if (budget) {
      const patient = (budget as any).patient;
      setReceptorNombre(patient?.nombre || "");
      setReceptorNif(patient?.dni || patient?.nif || "");
      setReceptorDireccion(patient?.direccion || "");
      setExentoIva(true);
      setIvaPorcentaje(0);
      setMotivoExencion("Art. 20.Uno.3º Ley 37/1992 de IVA (Servicios Médicos/Odontológicos)");

      const budgetItems = (budget.budget_items || []).map((bi) => {
        const cant = Number(bi.cantidad) || 1;
        const prec = Number(bi.precio) || 0;
        const desc = Number(bi.descuento) || 0;
        const sub = Number((cant * prec - desc).toFixed(2));
        return {
          concepto: bi.tratamiento,
          descripcion: bi.descripcion || "",
          cantidad: cant,
          precio_unitario: prec,
          descuento: desc,
          subtotal: sub,
        };
      });

      setItems(budgetItems);
    }
  }, [budget]);

  // Recalculación de subtotal
  const updateItem = (index: number, field: string, value: any) => {
    const next = [...items];
    const item = { ...next[index], [field]: value };
    const cant = Number(item.cantidad) || 0;
    const prec = Number(item.precio_unitario) || 0;
    const desc = Number(item.descuento) || 0;
    item.subtotal = Number((cant * prec - desc).toFixed(2));
    next[index] = item;
    setItems(next);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems([
      ...items,
      { concepto: "Nuevo tratamiento", descripcion: "", cantidad: 1, precio_unitario: 0, descuento: 0, subtotal: 0 },
    ]);
  };

  const subtotal = items.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);
  const ivaImporte = exentoIva ? 0 : Number((subtotal * (ivaPorcentaje / 100)).toFixed(2));
  const total = Number((subtotal + ivaImporte).toFixed(2));

  const emitMutation = useMutation({
    mutationFn: async () => {
      if (!budget) throw new Error("Sin presupuesto seleccionado");
      const options: CreateInvoiceOptions = {
        exentoIva,
        ivaPorcentaje: exentoIva ? 0 : ivaPorcentaje,
        motivoExencion: exentoIva ? motivoExencion : undefined,
        receptorNif,
        receptorNombre,
        receptorDireccion,
        items,
      };
      return createInvoiceFromBudget(budget.id, options);
    },
    onSuccess: (invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["admin_budgets"] });
      toast.success("Factura SIF emitida e inalterada con huella SHA-256.");
      onOpenChange(false);
      if (onEmitted) onEmitted(invoiceId);
    },
    onError: (err: any) => {
      toast.error(`Error al emitir factura: ${err.message}`);
    },
  });

  if (!budget) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Receipt className="size-5 text-blue-600" /> Revisar y Personalizar Factura SIF
          </DialogTitle>
          <DialogDescription>
            Borrador generado a partir del Presupuesto <strong className="text-foreground">{budget.numero}</strong>. Revisa los datos fiscales antes de emitir el registro inalterable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Bloque Receptor / Cliente */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Datos Fiscales del Cliente / Paciente</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="receptor_nombre" className="text-xs">Nombre / Razón Social</Label>
                <Input
                  id="receptor_nombre"
                  value={receptorNombre}
                  onChange={(e) => setReceptorNombre(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="receptor_nif" className="text-xs">NIF / DNI</Label>
                <Input
                  id="receptor_nif"
                  value={receptorNif}
                  onChange={(e) => setReceptorNif(e.target.value)}
                  className="mt-1 text-sm font-mono"
                />
              </div>
              <div>
                <Label htmlFor="receptor_direccion" className="text-xs">Dirección Habitual</Label>
                <Input
                  id="receptor_direccion"
                  value={receptorDireccion}
                  onChange={(e) => setReceptorDireccion(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Tabla de Conceptos Editables */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Conceptos y Líneas de Factura</h4>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="text-xs">
                <Plus className="size-3.5 mr-1" /> Añadir Concepto
              </Button>
            </div>

            <div className="border border-border rounded-xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Concepto</th>
                    <th className="py-2.5 px-3 text-center w-20">Cant.</th>
                    <th className="py-2.5 px-3 text-right w-28">Precio U. (€)</th>
                    <th className="py-2.5 px-3 text-right w-24">Dto. (€)</th>
                    <th className="py-2.5 px-3 text-right w-28">Subtotal</th>
                    <th className="py-2.5 px-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/20">
                      <td className="p-2">
                        <Input
                          value={item.concepto}
                          onChange={(e) => updateItem(idx, "concepto", e.target.value)}
                          className="h-8 text-xs font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => updateItem(idx, "cantidad", Number(e.target.value))}
                          className="h-8 text-xs text-center"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.precio_unitario}
                          onChange={(e) => updateItem(idx, "precio_unitario", Number(e.target.value))}
                          className="h-8 text-xs text-right"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.descuento}
                          onChange={(e) => updateItem(idx, "descuento", Number(e.target.value))}
                          className="h-8 text-xs text-right"
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {formatMoney(item.subtotal)}
                      </td>
                      <td className="p-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(idx)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Configuración Fiscal de IVA */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-900 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={exentoIva} onCheckedChange={(val) => {
                  setExentoIva(val);
                  if (!val && ivaPorcentaje === 0) setIvaPorcentaje(21);
                }} />
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Factura Exenta de IVA</p>
                  <p className="text-slate-500 text-[11px]">Por defecto según Art. 20.Uno.3º Ley 37/1992 para servicios odontológicos y médicos.</p>
                </div>
              </div>

              {!exentoIva && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="iva_pct" className="text-xs">Porcentaje IVA:</Label>
                  <select
                    id="iva_pct"
                    value={ivaPorcentaje}
                    onChange={(e) => setIvaPorcentaje(Number(e.target.value))}
                    className="bg-card border border-border rounded px-2 py-1 font-semibold text-xs"
                  >
                    <option value={21}>21 % (General)</option>
                    <option value={10}>10 % (Reducido)</option>
                    <option value={4}>4 % (Superreducido)</option>
                  </select>
                </div>
              )}
            </div>

            {exentoIva && (
              <div>
                <Label htmlFor="motivo_exencion" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Motivo o Causa de Exención Fiscal:
                </Label>
                <Input
                  id="motivo_exencion"
                  value={motivoExencion}
                  onChange={(e) => setMotivoExencion(e.target.value)}
                  className="mt-1 h-8 text-xs bg-white dark:bg-slate-900"
                />
              </div>
            )}
          </div>

          {/* Totales y Garantía SIF */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 text-white p-4 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="size-5 text-emerald-400 shrink-0" />
              <span>Se generará el sello inalterable SHA-256 y código QR oficial SIF.</span>
            </div>

            <div className="text-right space-y-0.5 font-mono">
              <p className="text-xs text-slate-400">Base Imponible: {formatMoney(subtotal)}</p>
              {!exentoIva && <p className="text-xs text-slate-400">Cuota IVA ({ivaPorcentaje}%): {formatMoney(ivaImporte)}</p>}
              <p className="text-xl font-bold text-emerald-400">TOTAL FACTURA: {formatMoney(total)}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md"
            disabled={items.length === 0 || emitMutation.isPending}
            onClick={() => emitMutation.mutate()}
          >
            <ShieldCheck className="size-4 mr-2" />
            {emitMutation.isPending ? "Emitiendo Registro SIF..." : "Confirmar y Emitir Factura SIF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
