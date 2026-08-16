import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Budget, computeTotals, formatMoney, rejectBudget, signBudget } from "@/lib/budgets";
import { getClinicSettings } from "@/lib/invoices";
import { useQuery } from "@tanstack/react-query";
import { SignaturePad } from "./SignaturePad";
import { Key } from "lucide-react";

export function BudgetSignDialog({
  budget,
  open,
  onOpenChange,
  defaultName,
  invalidateKey,
}: {
  budget: Budget;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultName?: string;
  invalidateKey: unknown[];
}) {
  const qc = useQueryClient();
  const [nombre, setNombre] = useState(defaultName ?? "");
  const [dni, setDni] = useState("");
  const [firma, setFirma] = useState<string | null>(null);
  const [acepta, setAcepta] = useState(false);

  const { data: clinic } = useQuery({
    queryKey: ["clinicSettings"],
    queryFn: getClinicSettings,
  });

  const totals = computeTotals(budget.budget_items || [], budget.descuento);

  const sign = useMutation({
    mutationFn: () => signBudget({ id: budget.id, nombre: nombre.trim(), dni: dni.trim(), firma: firma! }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey });
      toast.success("Presupuesto aceptado y firmado");
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: () => rejectBudget(budget.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey });
      toast.success("Has rechazado el presupuesto");
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isCertificado = clinic?.tipo_firma_oficial === "certificado";
  const canSign = nombre.trim().length > 2 && dni.trim().length > 4 && (isCertificado || !!firma) && acepta;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aceptar y firmar presupuesto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm font-medium">{budget.titulo}</p>
            <p className="text-xs text-muted-foreground">Nº {budget.numero || "—"}</p>
            <p className="mt-2 text-2xl font-semibold text-primary">{formatMoney(totals.total)}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="firma-nombre">Nombre y apellidos</Label>
            <Input id="firma-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre completo" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="firma-dni">DNI / NIE</Label>
            <Input id="firma-dni" value={dni} onChange={(e) => setDni(e.target.value)} placeholder="12345678A" />
          </div>

          <div className="grid gap-2">
            {isCertificado ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                <Label className="text-emerald-800 flex items-center gap-1.5 font-bold">
                  <Key className="size-4" /> Firma Digital con Certificado
                </Label>
                <p className="text-xs text-emerald-700">
                  El documento será firmado digitalmente usando el certificado electrónico configurado por la clínica ({clinic.cert_nombre_titular || "Certificado AEAT/FNMT"}).
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                  onClick={() => setFirma("CERTIFICADO_DIGITAL_APLICADO")}
                >
                  {firma ? "Certificado Aplicado Correctamente ✓" : "Aplicar Certificado Electrónico ahora"}
                </Button>
              </div>
            ) : (
              <>
                <Label>Firma manuscrita</Label>
                <SignaturePad onChange={setFirma} />
              </>
            )}
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
            <Checkbox checked={acepta} onCheckedChange={(v) => setAcepta(v === true)} className="mt-0.5" />
            <span className="text-muted-foreground">
              He leído y acepto el plan de tratamiento, su importe y las condiciones del presupuesto, y autorizo su
              inicio en Clínica Dental Dentix.
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={reject.isPending} onClick={() => reject.mutate()}>
            Rechazar
          </Button>
          <Button disabled={!canSign || sign.isPending} onClick={() => sign.mutate()}>
            {sign.isPending ? "Firmando..." : "Aceptar y firmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
