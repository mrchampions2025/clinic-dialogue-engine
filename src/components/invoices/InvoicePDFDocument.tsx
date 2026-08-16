import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Invoice, getClinicSettings, ClinicSettings } from "@/lib/invoices";
import { calculateInvoiceSHA256, generateAEATQRUrl, formatHashDisplay, getVerifactuLegend, getVerifactuBadgeText, INITIAL_SIF_HASH } from "@/lib/verifactu";
import { formatDate } from "@/lib/clinic-data";
import { Button } from "@/components/ui/button";
import { Printer, X, ShieldCheck, FileCheck, Info, CheckCircle2, Download } from "lucide-react";
import { downloadElementAsPdf } from "@/lib/pdf-utils";

interface InvoicePDFDocumentProps {
  invoice: Invoice;
  onClose: () => void;
}

export function InvoicePDFDocument({ invoice, onClose }: InvoicePDFDocumentProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [clinic, setClinic] = useState<ClinicSettings | null>(null);
  const [computedHash, setComputedHash] = useState<string>(invoice.hash_actual || "");

  const handleDownload = () => {
    downloadElementAsPdf("pdf-print-sheet", `Factura_${invoice.numero_factura || "dental"}.pdf`);
  };

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

  const [zoom, setZoom] = useState<number>(75);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 15, 150));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 15, 40));
  const handleResetZoom = () => setZoom(75);

  if (!mounted) return null;

  const currentHash = computedHash || invoice.hash_actual || INITIAL_SIF_HASH;
  const currentPrevHash = invoice.hash_anterior || INITIAL_SIF_HASH;
  const modoFacturacion = clinic?.modo_facturacion || "no_verifactu";
  const isVerifactu = modoFacturacion === "verifactu";

  const qrDataUrl = generateAEATQRUrl({
    emisorNif: invoice.emisor_nif || clinic?.cif_nif || "B12345678",
    numFactura: invoice.numero || "FAC-2026-0001",
    fechaExpedicion: invoice.fecha_expedicion || new Date().toISOString(),
    importeTotal: invoice.total || 0,
    hashActual: currentHash,
    modo: modoFacturacion,
  });

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrDataUrl)}`;

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
          <div className="size-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileCheck className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Factura #{invoice.numero || "FAC-2026-001"}
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-mono">
                Veri*Factu RD 1007
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              {invoice.receptor_nombre || "Cliente"} · {formatDate(invoice.fecha_expedicion || new Date().toISOString())}
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
            <span className="text-sm font-bold">-</span>
          </Button>
          <span className="text-xs font-mono font-bold text-emerald-300 w-12 text-center">
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
            <span className="text-sm font-bold">+</span>
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
            Encajar (75%)
          </Button>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={handlePrint} 
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg text-xs h-9 px-4"
          >
            <Printer className="size-4 mr-1.5" /> Imprimir Factura PDF
          </Button>
          <Button 
            onClick={handleDownload} 
            type="button"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg text-xs h-9 px-4 border-0"
          >
            <Download className="size-4 mr-1.5 text-white" /> Descargar PDF
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
          ref={componentRef}
          className="bg-white text-slate-900 shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-10 overflow-hidden flex flex-col justify-between transition-all duration-200 rounded-sm"
          style={{ 
            transform: `scale(${zoom / 100})`, 
            transformOrigin: 'top center',
            marginBottom: `${(zoom - 100) * 3}px`
          }}
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

              {/* Distintivo Modo SIF */}
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border" style={{
                backgroundColor: isVerifactu ? "#ecfdf5" : "#f0f9ff",
                borderColor: isVerifactu ? "#a7f3d0" : "#bae6fd",
                color: isVerifactu ? "#047857" : "#0369a1",
              }}>
                <CheckCircle2 className="size-3" />
                {isVerifactu ? "VERI*FACTU AEAT" : "SIF RD 1007/2023"}
              </div>
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

        {/* Sección Pie de Página - Cumplimiento SIF / RD 1007/2023 */}
        <div className="border-t-2 border-slate-800 pt-4">
          <div className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            {/* Código QR AEAT SIF */}
            <div className="flex items-center gap-3">
              <img
                src={qrImageUrl}
                alt="Código QR Verifactu SIF AEAT"
                className="size-20 border border-slate-300 rounded bg-white p-1"
              />
              <div className="text-[10px] text-slate-600 space-y-0.5 max-w-[290px]">
                <p className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="size-3.5 text-blue-600 inline" />
                  {isVerifactu ? "VERI*FACTU - Agencia Tributaria" : "Sistema Garantizado RD 1007/2023"}
                </p>
                <p className="text-[9.5px] leading-tight text-slate-600">
                  {getVerifactuLegend(modoFacturacion)}
                </p>
                <p className="font-mono text-[9px] text-slate-700 break-all pt-0.5">
                  <span className="font-bold text-slate-900">Huella SHA-256:</span> {formatHashDisplay(currentHash)}
                </p>
                <p className="font-mono text-[8px] text-slate-400">
                  Ant.: {formatHashDisplay(currentPrevHash)}
                </p>
              </div>
            </div>

            {/* Sello de Inalterabilidad */}
            <div className="text-right text-[10px] text-slate-500 space-y-1">
              <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                <FileCheck className="size-3" /> {getVerifactuBadgeText(modoFacturacion)}
              </div>
              <p>Expedido con trazabilidad y encadenamiento informático.</p>
              <p className="font-semibold text-slate-700">Documento Fiscal Oficial 2027</p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
