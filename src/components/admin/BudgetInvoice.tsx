import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatDate } from "@/lib/clinic-data";
import { getClinicSettings } from "@/lib/invoices";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Printer, X, ShieldCheck, Award } from "lucide-react";

interface BudgetInvoiceProps {
  budget: any;
  patient: any;
  onClose: () => void;
}

export function BudgetInvoice({ budget, patient, onClose }: BudgetInvoiceProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

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

  const taxRate = 0.07;
  const total = budget.total;
  const tipoFirma = clinic?.tipo_firma_oficial || "imagen";

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block print:relative print:z-auto">
      {/* Controles (ocultos al imprimir) */}
      <div className="absolute top-4 right-4 flex gap-2 print:hidden z-10">
        <Button onClick={handlePrint} variant="default" className="shadow-lg">
          <Printer className="size-4 mr-2" /> Imprimir / PDF
        </Button>
        <Button onClick={onClose} variant="secondary" size="icon" className="shadow-lg">
          <X className="size-4" />
        </Button>
      </div>

      {/* Contenedor del documento (A4 aprox) */}
      <div 
        ref={componentRef}
        className="print-only-container relative bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] overflow-hidden flex flex-col print:shadow-none print:w-full print:h-auto print:min-h-0 scale-[0.85] origin-top mt-10 print:mt-0 print:scale-100 print:origin-top-left"
        style={{ aspectRatio: '1 / 1.414' }}
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
                <h2 className="text-xl font-bold uppercase tracking-wide leading-tight">Clínica Dental<br/>Dentix</h2>
              </div>
              {/* Icono de Diente Simple */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                <path d="M12 2c-4.418 0-8 3.582-8 8 0 1.95.7 3.737 1.854 5.111l-.854 5.889h4.5l.5-3h4l.5 3h4.5l-.854-5.889c1.154-1.374 1.854-3.161 1.854-5.111 0-4.418-3.582-8-8-8zm0 16.5l-.5-3h-3l-.5 3h-2.1l.6-4.146c-1.353-1.429-2.1-3.32-2.1-5.354 0-3.86 3.14-7 7-7s7 3.14 7 7c0 2.034-.747 3.925-2.1 5.354l.6 4.146h-2.1z"/>
                <path d="M12 4c-3.309 0-6 2.691-6 6 0 1.62.64 3.111 1.707 4.207l1.293 1.293.5-3.5h5l.5 3.5 1.293-1.293c1.067-1.096 1.707-2.587 1.707-4.207 0-3.309-2.691-6-6-6z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Info Paciente y Fecha */}
        <div className="px-10 mt-10">
          <div className="flex justify-between items-end border-b-2 border-slate-100 pb-2 mb-4">
            <h3 className="text-[#3245d6] text-xl font-bold uppercase tracking-wider">Facturar a</h3>
            <div className="text-sm">
              <span className="font-bold mr-2">Fecha</span> 
              <span className="text-slate-600">{formatDate(budget.fecha)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="font-bold">Paciente</span>
              <span className="text-slate-600">{patient.nombre}</span>
              <span className="font-bold">Dirección</span>
              <span className="text-slate-600">Dirección no registrada<br/>Ciudad, CP 00000</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="font-bold">Teléfono</span>
              <span className="text-slate-600">{patient.telefono || "—"}</span>
              <span className="font-bold">Email</span>
              <span className="text-slate-600">{patient.email || "—"}</span>
            </div>
          </div>
        </div>

        {/* Tabla de Tratamientos */}
        <div className="px-10 mt-10 flex-grow">
          <table className="w-full text-sm">
            <thead className="bg-[#3245d6] text-white">
              <tr>
                <th className="py-3 px-4 text-left font-semibold w-16">No.</th>
                <th className="py-3 px-4 text-left font-semibold">Descripción del Tratamiento</th>
                <th className="py-3 px-4 text-center font-semibold w-24">Cant.</th>
                <th className="py-3 px-4 text-right font-semibold w-32">Precio Und.</th>
                <th className="py-3 px-4 text-right font-semibold w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {budget.budget_items?.map((item: any, idx: number) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="py-3 px-4 border-b border-slate-100 text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                  <td className="py-3 px-4 border-b border-slate-100 font-medium text-slate-700">{item.tratamiento}</td>
                  <td className="py-3 px-4 border-b border-slate-100 text-center text-slate-600">{item.cantidad}</td>
                  <td className="py-3 px-4 border-b border-slate-100 text-right text-slate-600">{Number(item.precio).toFixed(2)} €</td>
                  <td className="py-3 px-4 border-b border-slate-100 text-right text-slate-700 font-semibold">{(item.cantidad * item.precio).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Bloque espaciador azul claro como en la imagen */}
          <div className="w-full h-8 bg-[#f5f6ff] mt-8"></div>
        </div>

        {/* Sección de Totales e Info Inferior */}
        <div className="px-10 mt-auto mb-10">
          <div className="flex justify-between items-end gap-10">
            {/* Info Izquierda */}
            <div className="text-sm flex-1">
              <div className="grid grid-cols-[140px_1fr] gap-3 mb-10">
                <span className="font-bold">Seguro Dental</span>
                <span className="text-slate-600">No aplica</span>
                <span className="font-bold">Proveedor</span>
                <span className="text-slate-600">—</span>
                <span className="font-bold">Plan de Pago</span>
                <span className="text-slate-600">Contado / Financiación a consultar</span>
              </div>
              
              <div className="text-slate-600 mb-4">
                <p className="italic mb-2">¡Gracias por confiar en <span className="font-bold text-slate-800 not-italic">CLÍNICA DENTIX!</span></p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="size-6 rounded-full bg-[#3245d6]/10 flex items-center justify-center text-[#3245d6]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <span>Av. Principal 123, Madrid, 28000</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="size-6 rounded-full bg-[#3245d6]/10 flex items-center justify-center text-[#3245d6]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <span>info@clinicadentix.es</span>
                </div>
              </div>
            </div>

            {/* Totales Derecha y Firma */}
            <div className="w-72">
              <div className="bg-[#f5f6ff] text-sm">
                <div className="flex justify-between px-4 py-2 border-b border-white">
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

              <div className="mt-8 flex gap-3 text-center">
                {/* Firma del Paciente */}
                <div className="flex-1">
                  <div className="font-semibold text-xs mb-2 text-slate-700">Firma del Paciente</div>
                  <div className="border-b border-slate-400 w-full h-14 relative flex items-center justify-center">
                    {budget.estado === 'Aceptado' && (
                      budget.firma_data ? (
                        <img src={budget.firma_data} alt="Firma Paciente" className="h-12 object-contain" />
                      ) : (
                        <div className="font-['Brush_Script_MT',cursive] text-xl text-slate-700 opacity-90 -rotate-2 whitespace-nowrap">
                          {budget.firma_nombre || patient?.nombre}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Firma y Sello Oficial de la Clínica (Imagen y/o Certificado Electrónico) */}
                <div className="flex-1">
                  <div className="font-semibold text-xs mb-2 text-[#3245d6] flex items-center justify-center gap-1">
                    <ShieldCheck className="size-3.5 text-[#3245d6]" /> Firma y Sello Oficial
                  </div>

                  <div className="border border-dashed border-[#3245d6]/40 rounded bg-blue-50/40 p-2 text-[10px] text-slate-700 relative min-h-[56px] flex flex-col items-center justify-center">
                    {/* Render Opción 1: Imagen de Firma o Sello */}
                    {(tipoFirma === "imagen" || tipoFirma === "ambos") && clinic?.firma_sello_imagen ? (
                      <img
                        src={clinic.firma_sello_imagen}
                        alt="Sello Oficial Clínica"
                        className="h-12 max-w-full object-contain mb-1"
                      />
                    ) : null}

                    {/* Render Opción 2: Certificado Electrónico Digital X.509 */}
                    {(tipoFirma === "certificado" || tipoFirma === "ambos" || !clinic?.firma_sello_imagen) && (
                      <div className="space-y-0.5 w-full">
                        <p className="font-bold text-[#3245d6] text-[10px]">
                          {clinic?.cert_nombre_titular || clinic?.razon_social || "CLINICA DENTAL DENTIX SL"}
                        </p>
                        <p className="text-[8px] text-slate-500 font-mono">
                          CA: {clinic?.cert_emisor || "FNMT-RCM"} · Nº Serie: {clinic?.cert_num_serie || "72A4901F"}
                        </p>
                        <p className="text-[7.5px] text-emerald-700 font-mono font-bold tracking-tight bg-emerald-100/60 px-1 py-0.5 rounded border border-emerald-300 inline-block mt-0.5">
                          ✓ Firmado con Certificado Digital X.509 (SIF RD 1007/2023)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Borde inferior grueso */}
        <div className="h-6 w-full bg-[#3245d6]"></div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
