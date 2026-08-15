import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Invoice, getClinicSettings, ClinicSettings } from "@/lib/invoices";
import { calculateInvoiceSHA256, generateAEATQRUrl, formatHashDisplay, INITIAL_SIF_HASH } from "@/lib/verifactu";
import { formatDate } from "@/lib/clinic-data";
import { Button } from "@/components/ui/button";
import { Printer, X, ShieldCheck, FileCheck, Info } from "lucide-react";

interface InvoicePDFDocumentProps {
  invoice: Invoice;
  onClose: () => void;
}

export function InvoicePDFDocument({ invoice, onClose }: InvoicePDFDocumentProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [clinic, setClinic] = useState<ClinicSettings | null>(null);
  const [computedHash, setComputedHash] = useState<string>(invoice.hash_actual || "");

  useEffect(() => {
    setMounted(true);
    getClinicSettings().then(setClinic);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!invoice.hash_actual) {
      calculateInvoiceSHA256({
        emisorNif: invoice.emisor_nif || clinic?.cif_nif || "B12345678",
        numFactura: invoice.numero || "FAC-2026-0001",
        fechaExpedicion: invoice.fecha_expedicion || new Date().toISOString(),
        tipoFactura: invoice.tipo === "rectificativa" ? "R1" : "F1",
        cuotaTotal: invoice.iva_importe || 0,
        importeTotal: invoice.total || 0,
        hashAnterior: invoice.hash_anterior || INITIAL_SIF_HASH,
      }).then(setComputedHash);
    } else {
      setComputedHash(invoice.hash_actual);
    }
  }, [invoice, clinic]);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted) return null;

  const currentHash = computedHash || invoice.hash_actual || INITIAL_SIF_HASH;
  const currentPrevHash = invoice.hash_anterior || INITIAL_SIF_HASH;

  const qrDataUrl = invoice.qr_data || generateAEATQRUrl({
    emisorNif: invoice.emisor_nif || clinic?.cif_nif || "B12345678",
    numFactura: invoice.numero || "FAC-2026-0001",
    fechaExpedicion: invoice.fecha_expedicion || new Date().toISOString(),
    importeTotal: invoice.total || 0,
    hashActual: currentHash,
  });

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrDataUrl)}`;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block print:relative print:z-auto">
      {/* Botones de control (ocultos al imprimir) */}
      <div className="absolute top-4 right-4 flex gap-2 print:hidden z-10">
        <Button onClick={handlePrint} variant="default" className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white">
          <Printer className="size-4 mr-2" /> Imprimir / Guardar en PDF
        </Button>
        <Button onClick={onClose} variant="secondary" size="icon" className="shadow-lg">
          <X className="size-4" />
        </Button>
      </div>

      {/* Contenedor Hoja A4 */}
      <div
        ref={componentRef}
        className="print-only-container relative bg-white text-slate-900 shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-10 overflow-hidden flex flex-col justify-between print:shadow-none print:w-full print:h-auto print:min-h-0 print:p-8 scale-[0.85] origin-top mt-6 print:mt-0 print:scale-100"
        style={{ aspectRatio: "1 / 1.414" }}
      >
        {/* Cabecera Principal */}
        <div>
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                {invoice.tipo === "rectificativa" ? "FACTURA RECTIFICATIVA" : "FACTURA"}
              </h1>
              <p className="text-sm font-semibold text-blue-700 tracking-wide mt-1">
                Nº {invoice.numero}
              </p>
              {invoice.tipo === "rectificativa" && invoice.motivo_rectificacion && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  Motivo: {invoice.motivo_rectificacion}
                </p>
              )}
            </div>

            <div className="text-right">
              <h2 className="text-xl font-bold text-slate-900">{clinic?.razon_social || invoice.emisor_nombre}</h2>
              <p className="text-xs text-slate-600 mt-1">NIF/CIF: <span className="font-semibold">{clinic?.cif_nif || invoice.emisor_nif}</span></p>
              {clinic?.registro_sanitario && (
                <p className="text-xs text-slate-600">Reg. Sanitario: <span className="font-semibold">{clinic.registro_sanitario}</span></p>
              )}
              <p className="text-xs text-slate-600">{clinic?.direccion || invoice.emisor_direccion}</p>
              <p className="text-xs text-slate-600">{clinic?.codigo_postal} {clinic?.ciudad} ({clinic?.provincia})</p>
              <p className="text-xs text-slate-600">Tel: {clinic?.telefono || "—"} | {clinic?.email || "—"}</p>
            </div>
          </div>

          {/* Datos Receptor y Fecha */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 text-sm">
            <div>
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Cliente / Paciente</p>
              <p className="font-bold text-slate-800 text-base">{invoice.receptor_nombre}</p>
              <p className="text-slate-600">NIF/DNI: <span className="font-medium text-slate-800">{invoice.receptor_nif || "No especificado"}</span></p>
              <p className="text-slate-600">{invoice.receptor_direccion || "Dirección habitual no registrada"}</p>
            </div>

            <div className="space-y-1 text-right sm:text-left">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Detalles de Expedición</p>
              <p className="text-slate-700"><span className="font-semibold">Fecha de Expedición:</span> {formatDate(invoice.fecha_expedicion)}</p>
              <p className="text-slate-700"><span className="font-semibold">Ejercicio Fiscal:</span> {invoice.ejercicio}</p>
              <p className="text-slate-700"><span className="font-semibold">Serie / Secuencia:</span> {invoice.serie} / {invoice.secuencia}</p>
              <p className="text-slate-700"><span className="font-semibold">Estado:</span> <span className="uppercase font-bold text-blue-700">{invoice.estado}</span></p>
            </div>
          </div>

          {/* Tabla de Conceptos */}
          <table className="w-full text-sm mb-6 border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold text-left">
                <th className="py-2.5 px-3 rounded-l">Concepto / Tratamiento</th>
                <th className="py-2.5 px-3 text-center w-16">Cant.</th>
                <th className="py-2.5 px-3 text-right w-28">Precio U.</th>
                <th className="py-2.5 px-3 text-right w-24">Dto.</th>
                <th className="py-2.5 px-3 text-right w-28 rounded-r">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.invoice_items?.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {item.concepto}
                    {item.descripcion && <p className="text-xs text-slate-500 font-normal">{item.descripcion}</p>}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600">{item.cantidad}</td>
                  <td className="py-3 px-3 text-right text-slate-600">{Number(item.precio_unitario).toFixed(2)} €</td>
                  <td className="py-3 px-3 text-right text-slate-600">{Number(item.descuento) > 0 ? `${Number(item.descuento).toFixed(2)} €` : "—"}</td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-900">{Number(item.subtotal).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Sección de Totales e Impuestos */}
          <div className="flex justify-between items-start gap-6 border-t border-slate-200 pt-4 mb-6">
            <div className="flex-1 text-xs text-slate-600 space-y-2">
              {invoice.exento_iva && (
                <div className="flex items-start gap-1.5 bg-blue-50 text-blue-900 p-2.5 rounded border border-blue-100">
                  <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold">Exención de IVA:</span> {invoice.motivo_exencion || "Operación exenta según Ley de IVA 37/1992"}.
                  </p>
                </div>
              )}
              {clinic?.iban && (
                <p className="text-slate-700"><span className="font-semibold">Forma de Pago / IBAN:</span> {clinic.iban}</p>
              )}
            </div>

            <div className="w-64 bg-slate-900 text-white p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Base Imponible:</span>
                <span className="font-mono">{Number(invoice.subtotal).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>IVA ({invoice.iva_porcentaje}%):</span>
                <span className="font-mono">{Number(invoice.iva_importe).toFixed(2)} €</span>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between text-lg font-bold text-white">
                <span>TOTAL:</span>
                <span className="font-mono">{Number(invoice.total).toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección Pie de Página - Cumplimiento SIF / RD 1007/2023 (Modo No Verifactu) */}
        <div className="border-t-2 border-slate-800 pt-4">
          <div className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            {/* Código QR AEAT SIF */}
            <div className="flex items-center gap-3">
              <img
                src={qrImageUrl}
                alt="Código QR Verifactu SIF AEAT"
                className="size-20 border border-slate-300 rounded bg-white p-1"
              />
              <div className="text-[10px] text-slate-600 space-y-0.5 max-w-[280px]">
                <p className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="size-3.5 text-blue-600 inline" />
                  Sistema Garantizado RD 1007/2023
                </p>
                <p>Registro de Facturación inalterable (Modo No Veri*factu).</p>
                <p className="font-mono text-[9px] text-slate-700 break-all">
                  <span className="font-bold text-slate-900">Huella SHA-256:</span> {formatHashDisplay(currentHash)}
                </p>
                <p className="font-mono text-[8px] text-slate-400">
                  Ant.: {formatHashDisplay(currentPrevHash)}
                </p>
              </div>
            </div>

            {/* Sello de Inalterabilidad */}
            <div className="text-right text-[10px] text-slate-500 space-y-1">
              <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">
                <FileCheck className="size-3" /> Registro Firmado SIF
              </div>
              <p>Expedido con trazabilidad y encadenamiento informático.</p>
              <p className="font-semibold text-slate-700">Documento Fiscal Oficial</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
