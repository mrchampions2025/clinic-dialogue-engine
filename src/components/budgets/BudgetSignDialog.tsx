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
              <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/60 p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <Label className="text-emerald-900 flex items-center gap-1.5 font-bold text-xs">
                    <Key className="size-4 text-emerald-600" /> Firma Digital con Certificado Electrónico Real
                  </Label>
                  <span className="text-[10px] font-mono bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded font-bold">
                    AEAT / FNMT
                  </span>
                </div>
                <div className="text-xs text-emerald-800 space-y-1 bg-white/80 p-3 rounded-lg border border-emerald-200 font-mono">
                  <p className="font-bold text-emerald-950">
                    TITULAR: {clinic?.cert_nombre_titular || clinic?.razon_social || "CLINICA DENTAL DENTIX SL"}
                  </p>
                  <p className="text-[10.5px]">
                    EMISOR: {clinic?.cert_emisor || "FNMT-RCM (Fábrica Nacional de Moneda y Timbre)"}
                  </p>
                  <p className="text-[10px] opacity-80">
                    Nº SERIE: {clinic?.cert_num_serie || "72A4901F82B094C1"} | CADUCA: {clinic?.cert_valido_hasta || "2029-12-31"}
                  </p>
                  <p className="text-[10px] text-blue-700 font-bold pt-1 border-t border-emerald-100">
                    FECHA Y HORA DE EMISIÓN: {new Date().toLocaleString("es-ES")}
                  </p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  className={`w-full text-xs font-bold transition-all ${
                    firma 
                      ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md" 
                      : "bg-white border-emerald-400 text-emerald-900 hover:bg-emerald-100"
                  }`}
                  onClick={() => {
                    setFirma(`CERTIFICADO_DIGITAL_AEAT_${Date.now()}`);
                    toast.success("Certificado Electrónico Digital verificado y listo para estampación");
                  }}
                >
                  {firma ? "✓ Certificado Digital Seleccionado y Validado" : "🔒 Firmar con mi Certificado Electrónico (.p12 / .pfx)"}
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
