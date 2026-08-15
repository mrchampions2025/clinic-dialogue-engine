import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ClinicSettings } from "@/lib/invoices";
import { Button } from "@/components/ui/button";
import { Printer, X, ShieldCheck, FileCheck, Award, Building2 } from "lucide-react";

interface DeclaracionResponsableDocumentProps {
  clinic: ClinicSettings;
  onClose: () => void;
}

export function DeclaracionResponsableDocument({ clinic, onClose }: DeclaracionResponsableDocumentProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted) return null;

  const fabricanteNombre = (clinic as any).fabricante_nombre || "Clinic Dialogue Engine S.L.";
  const nifFabricante = (clinic as any).nif_fabricante || "B87654321";
  const softwareNombre = (clinic as any).software_nombre || "Clinic Dialogue Engine SIF";
  const softwareVersion = (clinic as any).software_version || "v2.4.0-2027";
  const fechaExpedicionCertificado = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block print:relative print:z-auto">
      {/* Botones de control */}
      <div className="absolute top-4 right-4 flex gap-2 print:hidden z-10">
        <Button onClick={handlePrint} variant="default" className="shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
          <Printer className="size-4 mr-2" /> Imprimir / Guardar Certificado en PDF
        </Button>
        <Button onClick={onClose} variant="secondary" size="icon" className="shadow-lg">
          <X className="size-4" />
        </Button>
      </div>

      {/* Documento A4 Certificado */}
      <div
        ref={componentRef}
        className="print-only-container relative bg-white text-slate-900 shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-10 overflow-hidden flex flex-col justify-between print:shadow-none print:w-full print:h-auto print:min-h-0 print:p-8 scale-[0.85] origin-top mt-6 print:mt-0 print:scale-100 border-t-8 border-emerald-600"
        style={{ aspectRatio: "1 / 1.414" }}
      >
        <div>
          {/* Cabecera del Certificado */}
          <div className="flex justify-between items-center border-b border-slate-200 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Award className="size-7" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">DECLARACIÓN RESPONSABLE DEL FABRICANTE</h1>
                <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                  Reglamento de Sistemas Informáticos de Facturación (SIF - RD 1007/2023)
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              <p className="font-bold text-slate-800">Art. 13 RD 1007/2023</p>
              <p>Orden HAC/1177/2024</p>
            </div>
          </div>

          {/* Bloque Identificativo */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 text-xs leading-relaxed space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold uppercase text-slate-400 text-[10px]">Fabricante del Software</p>
                <p className="font-bold text-slate-800 text-sm">{fabricanteNombre}</p>
                <p className="text-slate-600">NIF: <span className="font-semibold">{nifFabricante}</span></p>
                <p className="text-slate-600">Domicilio Fiscal: Paseo de la Castellana 200, Madrid</p>
              </div>
              <div>
                <p className="font-bold uppercase text-slate-400 text-[10px]">Sistema Informático Certificado</p>
                <p className="font-bold text-slate-800 text-sm">{softwareNombre}</p>
                <p className="text-slate-600">Versión Certificada: <span className="font-semibold">{softwareVersion}</span></p>
                <p className="text-slate-600">Usuario Emisor Licenciado: <span className="font-semibold">{clinic.razon_social} ({clinic.cif_nif})</span></p>
              </div>
            </div>
          </div>

          {/* Texto Oficial de Declaración */}
          <div className="space-y-4 text-xs text-slate-700 text-justify leading-relaxed mb-6">
            <p className="font-semibold text-slate-900 text-sm">
              DECLARA BAJO SU EXCLUSIVA RESPONSABILIDAD:
            </p>
            <p>
              Que el sistema informático de facturación denominado <span className="font-bold text-slate-900">{softwareNombre}</span> en su versión <span className="font-bold text-slate-900">{softwareVersion}</span> cumple estrictamente con todos y cada uno de los requisitos exigidos por el <span className="font-semibold text-slate-900">Artículo 8 del Real Decreto 1007/2023, de 5 de diciembre</span>, por el que se aprueba el Reglamento que establece los requisitos que deben adoptar los sistemas informáticos o electrónicos que soporten los procesos de facturación de empresarios y profesionales, así como con la especificación técnica aprobada en la <span className="font-semibold text-slate-900">Orden HAC/1177/2024, de 17 de octubre</span>.
            </p>

            <div className="space-y-2.5 pt-2">
              <p className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                GARANTÍAS TÉCNICAS Y FUNCIONALES CERTIFICADAS:
              </p>
              
              <div className="grid grid-cols-1 gap-2 pl-2">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold text-slate-800">Inalterabilidad e Integridad de Registros:</span> El sistema prohíbe técnicamente la modificación o eliminación de registros de facturación expedidos. Cualquier rectificación genera un registro inalterable de anulación o rectificación R1.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold text-slate-800">Trazabilidad y Encadenamiento SHA-256:</span> Cada registro de facturación de alta genera una huella digital SHA-256 encadenada a la huella del registro anterior, impidiendo cualquier alteración sin detección.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold text-slate-800">Código QR y Formato Legible:</span> Todas las facturas incluyen un código QR normalizado de cotejo y la leyenda exigida por la Agencia Estatal de Administración Tributaria (AEAT).
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold text-slate-800">Registro Informático de Eventos (Audit Log):</span> El sistema conserva un registro cronológico automatizado (`sif_event_logs`) de todas las operaciones, inicios de sesión y exportaciones realizadas.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold text-slate-800">Soporte Dual (Veri*factu y No Veri*factu):</span> El software permite la remisión automática instantánea a la sede electrónica de la AEAT o la conservación firmada para su inspección inmediata.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque de Validación Fiscal */}
          <div className="border border-emerald-200 bg-emerald-50/50 p-4 rounded-xl text-xs flex justify-between items-center mb-6">
            <div className="space-y-1">
              <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                <FileCheck className="size-4 text-emerald-700" />
                Certificación Válida para Inspección Tributaria (AEAT)
              </p>
              <p className="text-slate-600 text-[11px]">
                Expedida conforme al Art. 13.2 del RD 1007/2023. Consérvese junto a la documentación fiscal del establecimiento.
              </p>
            </div>
            <div className="text-right font-mono text-[10px] text-slate-500">
              <p className="font-bold text-slate-700">Ref: SIF-2027-{clinic.cif_nif}</p>
              <p>Fecha: {fechaExpedicionCertificado}</p>
            </div>
          </div>
        </div>

        {/* Firma y Sello del Fabricante */}
        <div className="border-t border-slate-300 pt-6">
          <div className="flex justify-between items-end text-xs">
            <div>
              <p className="text-slate-500 text-[10px]">Expedido en Madrid, a {fechaExpedicionCertificado}</p>
              <p className="font-bold text-slate-800 mt-1">{fabricanteNombre}</p>
              <p className="text-slate-500">NIF: {nifFabricante}</p>
            </div>

            <div className="text-center w-64">
              <p className="font-bold text-slate-800 mb-8">Firma del Representante Legal y Sello SIF</p>
              <div className="border-b border-slate-400 pb-1 font-mono text-[10px] text-slate-600">
                [Firmado Digitalmente SIF-2027 SHA256]
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Sello Digital del Fabricante</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
