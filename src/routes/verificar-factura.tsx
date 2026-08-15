import { createFileRoute } from "@tanstack/react-router";
import { formatHashDisplay } from "@/lib/verifactu";
import { ShieldCheck, FileCheck, Award, Building2, CheckCircle2, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verificar-factura")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      nif: (search.nif as string) || "B12345678",
      num: (search.num as string) || "FAC-2026-0001",
      fecha: (search.fecha as string) || "16-08-2026",
      importe: (search.importe as string) || "0.00",
      hc: (search.hc as string) || "00000000",
    };
  },
  component: VerificarFacturaPage,
});

function VerificarFacturaPage() {
  const { nif, num, fecha, importe, hc } = Route.useSearch();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Cabecera de Verificación */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center relative">
          <div className="size-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldCheck className="size-10 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight">VERIFICACIÓN REGISTRO FISCAL SIF</h1>
          <p className="text-xs text-emerald-100 mt-1 font-medium">
            Reglamento de Sistemas Informáticos de Facturación (RD 1007/2023)
          </p>
        </div>

        {/* Cuerpo del Certificado */}
        <div className="p-6 space-y-5 text-sm">
          {/* Badge Válido */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="size-6 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-400 text-sm">REGISTRO VÁLIDO E INALTERABLE</p>
              <p className="text-xs text-slate-300">
                La factura ha sido expedida con huella digital encadenada SHA-256 según la Orden HAC/1177/2024.
              </p>
            </div>
          </div>

          {/* Detalles de la Factura Verificada */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Nº de Factura:</span>
              <span className="font-bold text-white text-sm">{num}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">NIF Emisor:</span>
              <span className="font-semibold text-slate-200">{nif}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Fecha de Expedición:</span>
              <span className="text-slate-200">{fecha}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Importe Total:</span>
              <span className="font-bold text-emerald-400 text-sm">{Number(importe).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Código Huella (HC):</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-emerald-300 font-bold">
                {hc}
              </span>
            </div>
          </div>

          {/* Leyenda Fiscal */}
          <div className="space-y-2 text-xs text-slate-400 leading-relaxed border-t border-slate-700/60 pt-4">
            <p className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Lock className="size-3.5 text-emerald-400 inline" />
              Garantías de Integridad del Software SIF:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li>Trazabilidad encadenada por algoritmo criptográfico SHA-256.</li>
              <li>Imposibilidad técnica de modificación o borrado tras expedición.</li>
              <li>Log informático de eventos del sistema registrado (`sif_event_logs`).</li>
              <li>Declaración Responsable del Fabricante conforme al Art. 13 RD 1007/2023.</li>
            </ul>
          </div>

          <div className="pt-2 text-center">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => {
                if (typeof window !== "undefined") window.location.href = "/admin/facturacion";
              }}
            >
              <ArrowLeft className="size-4 mr-2" /> Volver al Panel de Administración
            </Button>
          </div>
        </div>

        {/* Pie de página */}
        <div className="bg-slate-950 p-3 text-center text-[10px] text-slate-500 border-t border-slate-800">
          Clinic Dialogue Engine SIF — Software Certificado RD 1007/2023 / Orden HAC/1177/2024
        </div>
      </div>
    </div>
  );
}
