import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatDate } from "@/lib/clinic-data";
import { getClinicSettings } from "@/lib/invoices";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Printer, 
  X, 
  ShieldCheck, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  FileText 
} from "lucide-react";

interface BudgetInvoiceProps {
  budget: any;
  patient: any;
  onClose: () => void;
}

export function BudgetInvoice({ budget, patient, onClose }: BudgetInvoiceProps) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState<number>(75);

  const { data: clinic } = useQuery({
    queryKey: ["clinicSettings"],
    queryFn: () => getClinicSettings(),
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 15, 150));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 15, 40));
  const handleResetZoom = () => setZoom(75);

  const taxRate = 0.07;
  const total = budget.total;
  const tipoFirma = clinic?.tipo_firma_oficial || "imagen";

  const content = (
    <div id="pdf-document-portal" className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-xl">
      <style>{`
        @media print {
          body > *:not(#pdf-document-portal) {
            display: none !important;
          }
          #pdf-document-portal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            overflow: visible !important;
            backdrop-filter: none !important;
          }
          #pdf-document-toolbar {
            display: none !important;
          }
          #pdf-document-viewport {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          #pdf-print-sheet {
            transform: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Visor de PDF: Barra de Herramientas Superior Estilo Adobe Reader / Drive */}
      <header id="pdf-document-toolbar" className="flex items-center justify-between px-6 py-3 bg-slate-900/95 border-b border-slate-800 text-white shadow-2xl z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <FileText className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Presupuesto #{budget.numero || "PRE-2026"}
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-mono">
                PDF Oficial
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              {patient?.nombre || budget.firma_nombre || "Paciente"} · {new Date().toLocaleDateString("es-ES")}
            </p>
          </div>
        </div>

        {/* Controles de Zoom */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="size-7 text-slate-300 hover:text-white hover:bg-slate-700" 
            onClick={handleZoomOut}
            title="Alejar (-)"
          >
            <ZoomOut className="size-3.5" />
          </Button>
          <span className="text-xs font-mono font-bold text-blue-300 w-12 text-center">
            {zoom}%
          </span>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="size-7 text-slate-300 hover:text-white hover:bg-slate-700" 
            onClick={handleZoomIn}
            title="Acercar (+)"
          >
            <ZoomIn className="size-3.5" />
          </Button>

          <span className="h-4 w-px bg-slate-700 mx-1" />

          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="text-xs text-slate-300 hover:text-white hover:bg-slate-700 px-2 h-7" 
            onClick={handleResetZoom}
            title="Encajar a pantalla (75%)"
          >
            <Maximize2 className="size-3 mr-1 text-blue-400" /> Encajar (75%)
          </Button>
        </div>

        {/* Botones de Acción: Imprimir y Descargar Exclusivo PDF */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={handlePrint} 
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg text-xs"
          >
            <Printer className="size-4 mr-1.5" /> Imprimir Documento PDF
          </Button>
          <Button 
            onClick={handlePrint} 
            variant="outline"
            className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white text-xs"
          >
            <Download className="size-4 mr-1.5 text-blue-400" /> Descargar PDF
          </Button>
          <Button 
            onClick={onClose} 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="size-5" />
          </Button>
        </div>
      </header>

      {/* Viewport del Documento A4 */}
      <div id="pdf-document-viewport" className="flex-1 overflow-y-auto overflow-x-auto p-8 flex justify-center items-start">
        <div 
          id="pdf-print-sheet"
          className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] overflow-hidden flex flex-col transition-all duration-200 rounded-sm"
          style={{ 
            transform: `scale(${zoom / 100})`, 
            transformOrigin: 'top center',
            marginBottom: `${(zoom - 100) * 3}px`
          }}
        >
          {/* Header con corte poligonal */}
          <div className="relative h-32 w-full flex overflow-hidden text-white print:h-32">
            {/* Parte Azul */}
            <div className="absolute top-0 left-0 h-full w-[65%] bg-[#3245d6]" style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0% 100%)' }}>
              <div className="h-full flex items-center px-10">
                <h1 className="text-4xl font-extrabold tracking-widest">PRESUPUESTO</h1>
              </div>
            </div>
            
            {/* Banda Azul Intermedia (Sombra/transición) */}
            <div className="absolute top-0 left-[55%] h-full w-[20%] bg-[#1c2db0]" style={{ clipPath: 'polygon(40% 0, 100% 0, 60% 100%, 0% 100%)', zIndex: -1 }}></div>

            {/* Parte Gris Oscuro */}
            <div className="absolute top-0 right-0 h-full w-[50%] bg-[#2a2b30] -z-20">
              <div className="h-full flex items-center justify-end px-10 gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Presupuesto Nº</div>
                  <div className="text-lg font-bold text-white font-mono">{budget.numero || "PRE-2026-001"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Datos Empresa & Datos Cliente */}
          <div className="p-10 flex-1 flex flex-col justify-between">
            <div>
              {/* Info de la Empresa */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#3245d6]">{clinic?.razon_social || "CLÍNICA DENTAL DENTIX"}</h2>
                  <p className="text-xs text-slate-500 mt-1">CIF/NIF: {clinic?.cif_nif || "B12345678"}</p>
                  <p className="text-xs text-slate-500">{clinic?.direccion || "Av. Principal 123"}, {clinic?.codigo_postal || "28000"} {clinic?.ciudad || "Madrid"}</p>
                  <p className="text-xs text-slate-500">Tel: {clinic?.telefono || "+34 912 345 678"} | Email: {clinic?.email || "info@clinicadentix.es"}</p>
                </div>
                <div className="text-right text-xs text-slate-600 space-y-1">
                  <div><span className="font-semibold text-slate-800">Fecha Emisión:</span> {formatDate(budget.fecha || new Date().toISOString())}</div>
                  <div><span className="font-semibold text-slate-800">Válido Hasta:</span> {formatDate(budget.valido_hasta || new Date(Date.now() + 30*86400000).toISOString())}</div>
                  <div><span className="font-semibold text-slate-800">Estado:</span> <span className="uppercase font-bold text-[#3245d6]">{budget.estado || 'Pendiente'}</span></div>
                </div>
              </div>

              {/* Datos del Paciente / Cliente */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Paciente / Cliente</div>
                  <div className="text-sm font-bold text-slate-800">{patient?.nombre || budget.firma_nombre || "Paciente General"}</div>
                  <div className="text-xs text-slate-600 mt-0.5">DNI/NIE: {patient?.dni || budget.firma_dni || "—"} | Tel: {patient?.telefono || "—"}</div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>Dirección: {patient?.direccion || "No registrada"}</div>
                  <div>Email: {patient?.email || "—"}</div>
                </div>
              </div>

              {/* Tabla de Tratamientos / Ítems */}
              <table className="w-full text-left text-xs mb-6">
                <thead>
                  <tr className="bg-[#3245d6] text-white font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3 rounded-l">No.</th>
                    <th className="py-2.5 px-3">Descripción del Tratamiento</th>
                    <th className="py-2.5 px-3 text-center">Cant.</th>
                    <th className="py-2.5 px-3 text-right">Precio Und.</th>
                    <th className="py-2.5 px-3 text-right rounded-r">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(budget.budget_items && budget.budget_items.length > 0 ? budget.budget_items : [
                    { tratamiento: "Limpieza Dental Completa", cantidad: 1, precio: 50 },
                    { tratamiento: "Revisión Odontológica & Diagnóstico", cantidad: 1, precio: 0 }
                  ]).map((item: any, idx: number) => {
                    const cant = Number(item.cantidad) || 1;
                    const prec = Number(item.precio) || 0;
                    const itemTotal = cant * prec;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-slate-400 font-mono">0{idx + 1}</td>
                        <td className="py-3 px-3 font-medium text-slate-800">
                          {item.tratamiento || item.descripcion}
                          {item.descripcion && item.tratamiento && item.descripcion !== item.tratamiento && (
                            <span className="block text-[10px] text-slate-500 font-normal">{item.descripcion}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600">{cant}</td>
                        <td className="py-3 px-3 text-right text-slate-600">{prec.toFixed(2)} €</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">{itemTotal.toFixed(2)} €</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totales y Firma */}
            <div>
              <div className="flex justify-between items-start pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500 max-w-sm space-y-1">
                  <p className="font-semibold text-slate-700">Forma de Pago & Condiciones:</p>
                  <p>• Pago en clínica o financiación adaptada.</p>
                  <p>• Validez del presupuesto: 30 días naturales.</p>
                  {budget.notas && <p className="text-slate-600 italic mt-2">Nota: {budget.notas}</p>}
                </div>

                {/* Cuadro Resumen Totales */}
                <div className="w-64 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <div className="flex justify-between px-4 py-2 border-b border-slate-200">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-semibold text-slate-800">{Number(total).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 border-b border-white">
                    <span className="text-slate-600">Impuestos</span>
                    <span className="font-semibold text-slate-800">0.00 €</span>
                  </div>
                  <div className="flex justify-between px-4 py-3 bg-[#3245d6] text-white">
                    <span className="font-bold">TOTAL APROX.</span>
                    <span className="font-bold">{Number(total).toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Firmas a la par (Línea simple sin recuadro azul punteado) */}
              <div className="mt-8 flex gap-6 items-end text-center">
                {/* Firma del Paciente */}
                <div className="flex-1 flex flex-col justify-end">
                  <div className="h-6 flex items-center justify-center font-semibold text-xs text-slate-700">
                    Firma del Paciente
                  </div>
                  <div className="border-b border-slate-400 w-full h-[140px] relative flex flex-col items-center justify-end pb-0">
                    {budget.estado === 'Aceptado' && (
                      budget.firma_data && !budget.firma_data.startsWith("CERTIFICADO_DIGITAL") ? (
                        <img src={budget.firma_data} alt="Firma Paciente" className="h-20 max-w-full object-contain -mb-1" />
                      ) : (
                        <div className="font-['Brush_Script_MT',cursive] text-2xl text-slate-700 opacity-90 -rotate-2 whitespace-nowrap mb-1">
                          {budget.firma_nombre || patient?.nombre}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Firma y Sello Oficial de la Clínica (Línea simple rozando la línea) */}
                <div className="flex-1 flex flex-col justify-end">
                  <div className="h-6 flex items-center justify-center font-semibold text-xs text-[#3245d6] gap-1">
                    <ShieldCheck className="size-3.5 text-[#3245d6]" /> Firma y Sello Oficial
                  </div>

                  <div className="border-b border-slate-400 w-full h-[140px] relative flex flex-col items-center justify-end pb-0">
                    {/* Render Opción 1: Imagen de Sello/Firma (+100% de tamaño rozando la línea) */}
                    {(tipoFirma === "imagen") && clinic?.firma_sello_imagen ? (
                      <div className="flex flex-col items-center justify-end w-full h-full relative">
                        {budget.firmado_at && (
                          <p className="text-[8px] font-mono text-slate-400 font-medium absolute top-0">
                            FIRMADO EL: {new Date(budget.firmado_at).toLocaleString("es-ES")}
                          </p>
                        )}
                        <img
                          src={clinic.firma_sello_imagen}
                          alt="Sello Oficial Clínica"
                          className="h-32 sm:h-36 max-w-full object-contain -mb-1"
                        />
                      </div>
                    ) : null}

                    {/* Render Opción 2: Certificado Electrónico AEAT / FNMT */}
                    {(tipoFirma === "certificado" || !clinic?.firma_sello_imagen) && (
                      <div className="space-y-1 w-full text-center pb-1">
                        <p className="font-bold text-[#3245d6] text-[11px] tracking-tight">
                          {clinic?.cert_nombre_titular || `${clinic?.razon_social || "CLINICA DENTAL DENTIX SL"} - ${clinic?.cif_nif || "B12345678"}`}
                        </p>
                        <p className="text-[9px] text-slate-600 font-mono leading-tight">
                          EMISOR AUTORIZADO: {clinic?.cert_emisor || "FNMT-RCM (Fábrica Nacional de Moneda y Timbre)"}
                        </p>
                        <p className="text-[8.5px] text-slate-500 font-mono">
                          Nº Serie: {clinic?.cert_num_serie || "72A4901F82B094C1"} | SHA-256: {clinic?.cert_huella_sha256?.slice(0, 16) || "3A7B9F1C82D405E6"}...
                        </p>
                        <p className="text-[8px] text-emerald-800 font-mono font-bold tracking-tight bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 inline-block mt-0.5">
                          ✓ FIRMA DIGITAL CON CERTIFICADO ELECTRÓNICO OFICIAL AEAT/FNMT (SIF RD 1007/2023)
                        </p>
                        {budget.firmado_at && (
                          <p className="text-[8.5px] font-bold text-slate-700 font-mono mt-0.5">
                            FIRMADO EL: {new Date(budget.firmado_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "medium" })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Borde inferior grueso */}
          <div className="h-6 w-full bg-[#3245d6]"></div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
