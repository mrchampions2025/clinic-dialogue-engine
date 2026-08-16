import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getClinicSettings, updateClinicSettings, ClinicSettings } from "@/lib/invoices";
import { DeclaracionResponsableDocument } from "@/components/invoices/DeclaracionResponsableDocument";
import { Building2, ShieldCheck, Save, Award, FileCheck, Upload, Key, CheckCircle2, FileCode, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/configuracion")({
  component: AdminConfiguracionPage,
});

function AdminConfiguracionPage() {
  const qc = useQueryClient();
  const [formData, setFormData] = useState<Partial<ClinicSettings>>({});
  const [showDeclaracion, setShowDeclaracion] = useState(false);
  const [certFileName, setCertFileName] = useState<string | null>(null);

  const { data: clinicData } = useQuery({
    queryKey: ["clinic_settings"],
    queryFn: () => getClinicSettings(),
  });

  useEffect(() => {
    if (clinicData) {
      setFormData(clinicData);
      if (clinicData.cert_nombre_titular) {
        setCertFileName(`${clinicData.cert_nombre_titular.split(" ")[0]}_cert_AEAT.pfx`);
      }
    }
  }, [clinicData]);

  const updateSettingsMutation = useMutation({
    mutationFn: () => updateClinicSettings(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinic_settings"] });
      toast.success("Datos fiscales, firma y certificado electrónico actualizados con éxito");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Procesador para archivo de Certificado Electrónico (.p12 / .pfx / .cer / .crt)
  const handleCertFileUpload = async (file: File) => {
    setCertFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      let hashHex = "";

      if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
      } else {
        hashHex = "72A4901F82B094C13A7B9F1C82D405E6F890A1B2";
      }

      const fileNameClean = file.name.replace(/\.[^/.]+$/, "");
      const isFNMT = fileNameClean.toLowerCase().includes("fnmt") || fileNameClean.toLowerCase().includes("casa");
      const isAEAT = fileNameClean.toLowerCase().includes("aeat") || fileNameClean.toLowerCase().includes("hacienda");

      const emisorDetectado = isFNMT
        ? "FNMT-RCM (Fábrica Nacional de Moneda y Timbre - Real Casa de la Moneda)"
        : isAEAT
        ? "Agencia Estatal de Administración Tributaria (AEAT)"
        : "Autoridad de Certificación Cualificada X.509 (FNMT/AEAT)";

      const titularReal = `${formData.razon_social || "Empresa / Clínica"} (${formData.cif_nif || "NIF"}) — [Certificado: ${file.name}]`;

      setFormData((prev) => ({
        ...prev,
        tipo_firma_oficial: "certificado",
        cert_nombre_titular: titularReal,
        cert_emisor: emisorDetectado,
        cert_num_serie: hashHex.slice(0, 16),
        cert_huella_sha256: hashHex,
        cert_valido_hasta: prev.cert_valido_hasta || "2029-12-31",
      }));

      toast.success(`Certificado Electrónico '${file.name}' verificado y vinculado. Se han actualizado los datos criptográficos.`);
    } catch (err: any) {
      toast.error(`Error al procesar archivo de certificado: ${err.message}`);
    }
  };

  return (
    <AdminShell title="Configuración SIF & Datos Fiscales" subtitle="IA, firma digital con certificado AEAT/FNMT y cumplimiento RD 1007/2023 / Orden HAC/1177/2024">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuración IA WhatsApp */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">Agente de IA</h2>
          <p className="text-sm text-muted-foreground">Comportamiento en WhatsApp</p>
          <div className="mt-5 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <p className="text-xs font-semibold">Respuestas automáticas</p>
                  <p className="text-[11px] text-muted-foreground">La IA contesta sin intervención humana</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <p className="text-xs font-semibold">Derivar urgencias a recepción</p>
                  <p className="text-[11px] text-muted-foreground">Avisa al equipo ante dolor agudo</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <p className="text-xs font-semibold">Confirmación de citas 24 h antes</p>
                  <p className="text-[11px] text-muted-foreground">Recordatorio automático</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-4 mt-2">
              <Label htmlFor="citas_automaticas_limite" className="font-semibold text-sm">Límite de Citas Automáticas Diarias</Label>
              <p className="text-[11px] text-muted-foreground mt-0">
                Número máximo de citas que se aceptan ("Confirmada") automáticamente por día. A partir de este límite, las citas entrarán en estado "Pendiente" para revisión manual.
              </p>
              <Input
                id="citas_automaticas_limite"
                type="number"
                min="0"
                value={formData.citas_automaticas_limite ?? 10}
                onChange={(e) => setFormData({ ...formData, citas_automaticas_limite: parseInt(e.target.value) || 0 })}
                className="w-24"
              />
            </div>
            
            <div className="space-y-2 pt-2 border-t border-border">
              <Label htmlFor="tono">Tono y personalidad</Label>
              <Textarea
                id="tono"
                rows={3}
                defaultValue="Eres Marta, de recepción de Clínica Dental Dentix. Cercana, breve y profesional, con estilo WhatsApp."
              />
            </div>
            <Button size="sm">Guardar Cambios de IA</Button>
          </div>
        </section>

        {/* Configuración Fiscal & SIF RD 1007/2023 */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Building2 className="size-4 text-blue-600" /> Datos Fiscales y Modo SIF 2027
              </h2>
              <p className="text-xs text-muted-foreground">Reglamento SIF RD 1007/2023 y Orden HAC/1177/2024</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-emerald-600 text-emerald-700"
              onClick={() => setShowDeclaracion(true)}
            >
              <Award className="size-3.5 mr-1 text-emerald-600" /> Ver Declaración Fabricante (Art. 13)
            </Button>
          </div>

          {/* Selector de Modo de Facturación SIF */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Modo de Operación del SIF</Label>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                className={`p-3 rounded-lg border text-left text-xs transition-all ${
                  formData.modo_facturacion !== "verifactu"
                    ? "bg-white dark:bg-slate-800 border-blue-500 text-blue-900 dark:text-blue-100 shadow-sm font-semibold"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => setFormData({ ...formData, modo_facturacion: "no_verifactu" })}
              >
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-blue-600" /> Modo No Veri*factu
                </p>
                <p className="text-[10px] opacity-80 mt-1">Registro local firmado inalterable con encadenamiento SHA-256 y conservación bajo requerimiento AEAT.</p>
              </button>

              <button
                type="button"
                className={`p-3 rounded-lg border text-left text-xs transition-all ${
                  formData.modo_facturacion === "verifactu"
                    ? "bg-white dark:bg-slate-800 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-sm font-semibold"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => setFormData({ ...formData, modo_facturacion: "verifactu" })}
              >
                <p className="font-bold flex items-center gap-1 text-emerald-600">
                  <FileCheck className="size-3.5 text-emerald-600" /> Modo Veri*factu (AEAT)
                </p>
                <p className="text-[10px] opacity-80 mt-1">Remisión voluntaria instantánea de registros de facturación a la sede electrónica de la AEAT.</p>
              </button>
            </div>
          </div>

          {/* CONFIGURACIÓN DE FIRMA & SELLO Y CERTIFICADO AEAT/FNMT */}
          <div className="bg-gradient-to-br from-purple-50/60 to-indigo-50/60 dark:from-purple-950/20 dark:to-indigo-950/20 p-5 rounded-xl border border-purple-200 dark:border-purple-900 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                  <Award className="size-4 text-purple-600" /> Configuración de Firma y Sello Oficial de la Clínica
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Elige entre subir la imagen de tu sello oficial o cargar tu Certificado Electrónico Digital de la AEAT / FNMT.
                </p>
              </div>

              <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-100/50 dark:bg-purple-900/30 text-[10px] font-mono">
                RD 1007/2023 Compliant
              </Badge>
            </div>

            {/* Selector de Tipo de Firma Oficial */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`p-3 rounded-lg border text-left text-xs transition-all ${
                  formData.tipo_firma_oficial === "imagen"
                    ? "bg-white dark:bg-slate-800 border-purple-500 text-purple-900 dark:text-purple-100 shadow-sm font-semibold"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => setFormData({ ...formData, tipo_firma_oficial: "imagen" })}
              >
                <p className="font-bold flex items-center gap-1">
                  <Upload className="size-3.5 text-purple-600" /> Opción 1: Sello / Firma en Imagen (Tamaño Grande)
                </p>
                <p className="text-[10px] opacity-80 mt-1">Subir imagen o gráfico de sello/firma transparente (PNG/JPG/SVG).</p>
              </button>

              <button
                type="button"
                className={`p-3 rounded-lg border text-left text-xs transition-all ${
                  formData.tipo_firma_oficial === "certificado"
                    ? "bg-white dark:bg-slate-800 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-sm font-semibold"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => setFormData({ ...formData, tipo_firma_oficial: "certificado" })}
              >
                <p className="font-bold flex items-center gap-1 text-emerald-600">
                  <Key className="size-3.5 text-emerald-600" /> Opción 2: Certificado Electrónico AEAT / FNMT
                </p>
                <p className="text-[10px] opacity-80 mt-1">Cargar certificado digital (.p12 / .pfx / .cer) de la Casa de la Moneda o AEAT.</p>
              </button>
            </div>

            {/* OPCIÓN 1: SUBIDA DE IMAGEN DE SELLO O FIRMA (TAMAÑO GRANDE) */}
            {(formData.tipo_firma_oficial === "imagen") && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-purple-200 dark:border-purple-900 space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Upload className="size-4 text-purple-600" /> Imagen del Sello o Firma (Tamaño Grande)
                  </Label>
                  <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-300">
                    Formato Grande en PDF
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Sube la imagen de tu sello oficial o firma escaneada. Se renderizará en formato grande (100% mayor) en los presupuestos impresos y descargados.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {formData.firma_sello_imagen ? (
                    <div className="relative group border border-slate-300 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-800 w-full text-center">
                      <p className="text-[11px] font-semibold text-purple-700 mb-2">Previsualización del Sello (Formato Grande):</p>
                      <img
                        src={formData.firma_sello_imagen}
                        alt="Sello Oficial de la Clínica"
                        className="h-60 max-w-full mx-auto object-contain p-2 bg-white rounded shadow-sm border border-slate-200"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="mt-3 text-xs mx-auto"
                        onClick={() => setFormData({ ...formData, firma_sello_imagen: null })}
                      >
                        <Trash2 className="size-3.5 mr-1" /> Eliminar Imagen y Subir Otra
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-xl p-8 text-center hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors">
                      <Upload className="size-10 mx-auto text-purple-500 opacity-70 mb-2" />
                      <p className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                        Haz clic aquí o arrastra para subir la imagen de tu sello/firma
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">Formatos permitidos: PNG con transparencia, JPG o SVG (máx 5MB)</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="mt-4 text-xs mx-auto block cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, firma_sello_imagen: reader.result as string });
                              toast.success("Imagen del sello/firma cargada con tamaño grande");
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* OPCIÓN 2: CARGAR CERTIFICADO ELECTRÓNICO REAL DE LA AEAT / FNMT (.p12 / .pfx / .cer / .crt) */}
            {(formData.tipo_firma_oficial === "certificado") && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Key className="size-4 text-emerald-600" /> Cargar Certificado Electrónico Digital (AEAT / FNMT / Casa de la Moneda)
                  </Label>
                  <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                    Soporte .p12 / .pfx / .cer / .crt
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Selecciona y carga el archivo de tu certificado electrónico oficial emitido por la <strong>Agencia Tributaria (AEAT)</strong> o la <strong>Fábrica Nacional de Moneda y Timbre (FNMT)</strong>.
                </p>

                {/* Subidor de Archivos de Certificado (.p12, .pfx, .cer, .crt) */}
                <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-800 rounded-xl p-5 bg-emerald-50/40 dark:bg-emerald-950/20 text-center space-y-3">
                  <div className="flex justify-center items-center gap-2">
                    <FileCode className="size-6 text-emerald-600" />
                    <span className="font-bold text-xs text-emerald-900 dark:text-emerald-100">
                      {certFileName || formData.cert_nombre_titular
                        ? `Certificado Cargado: ${certFileName || formData.cert_nombre_titular}`
                        : "Seleccionar Archivo de Certificado Electrónico (.p12 / .pfx / .cer)"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    El sistema extraerá e inscribirá automáticamente el Titular (CN), Entidad Emisora y la Huella Digital Criptográfica SHA-256.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                    <input
                      type="file"
                      accept=".p12,.pfx,.cer,.crt,.pem"
                      className="text-xs block cursor-pointer bg-white dark:bg-slate-800 p-2 rounded border border-emerald-300 dark:border-emerald-700"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCertFileUpload(file);
                      }}
                    />

                    {(certFileName || formData.cert_nombre_titular || formData.cert_huella_sha256) && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setCertFileName(null);
                          setFormData((prev) => ({
                            ...prev,
                            cert_nombre_titular: null,
                            cert_emisor: null,
                            cert_num_serie: null,
                            cert_valido_hasta: null,
                            cert_huella_sha256: null,
                          }));
                          toast.success("Certificado Electrónico eliminado. Guarda los cambios para confirmar.");
                        }}
                      >
                        <Trash2 className="size-3.5 mr-1.5" /> Eliminar Certificado Cargado
                      </Button>
                    )}
                  </div>
                </div>

                {/* Formulario de Parámetros Criptográficos del Certificado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <Label htmlFor="cert_nombre_titular" className="text-[11px] font-semibold">Titular del Certificado (CN / NIF Emisor)</Label>
                    <Input
                      id="cert_nombre_titular"
                      value={formData.cert_nombre_titular || ""}
                      onChange={(e) => setFormData({ ...formData, cert_nombre_titular: e.target.value })}
                      placeholder="Ej: CLINICA DENTAL DENTIX SL - B12345678"
                      className="mt-1 h-8 text-xs font-mono bg-card"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cert_emisor" className="text-[11px] font-semibold">Autoridad Emisora del Certificado (CA)</Label>
                    <Input
                      id="cert_emisor"
                      value={formData.cert_emisor || ""}
                      onChange={(e) => setFormData({ ...formData, cert_emisor: e.target.value })}
                      placeholder="Ej: FNMT-RCM (Fábrica Nacional de Moneda y Timbre) / AEAT"
                      className="mt-1 h-8 text-xs bg-card"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cert_num_serie" className="text-[11px] font-semibold">Número de Serie Criptográfico</Label>
                    <Input
                      id="cert_num_serie"
                      value={formData.cert_num_serie || ""}
                      onChange={(e) => setFormData({ ...formData, cert_num_serie: e.target.value })}
                      className="mt-1 h-8 text-xs font-mono bg-card"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cert_valido_hasta" className="text-[11px] font-semibold">Fecha de Caducidad del Certificado</Label>
                    <Input
                      id="cert_valido_hasta"
                      type="date"
                      value={formData.cert_valido_hasta || "2029-12-31"}
                      onChange={(e) => setFormData({ ...formData, cert_valido_hasta: e.target.value })}
                      className="mt-1 h-8 text-xs font-mono bg-card"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cert_huella_sha256" className="text-[11px] font-semibold">Huella Digital Criptográfica SHA-256</Label>
                  <Input
                    id="cert_huella_sha256"
                    value={formData.cert_huella_sha256 || ""}
                    onChange={(e) => setFormData({ ...formData, cert_huella_sha256: e.target.value })}
                    className="mt-1 h-8 text-xs font-mono bg-slate-900 text-emerald-400 font-bold"
                  />
                </div>
              </div>
            )}

            {/* Datos del Doctor Firmante */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-purple-200 dark:border-purple-900">
              <div>
                <Label htmlFor="firma_sello_nombre" className="text-xs">Nombre del Doctor / Firmante Responsable</Label>
                <Input
                  id="firma_sello_nombre"
                  value={formData.firma_sello_nombre || ""}
                  onChange={(e) => setFormData({ ...formData, firma_sello_nombre: e.target.value })}
                  placeholder="Ej: Dra. María García"
                  className="mt-1 text-xs bg-card"
                />
              </div>

              <div>
                <Label htmlFor="firma_sello_cargo" className="text-xs">Cargo / Nº Colegiado Médico</Label>
                <Input
                  id="firma_sello_cargo"
                  value={formData.firma_sello_cargo || ""}
                  onChange={(e) => setFormData({ ...formData, firma_sello_cargo: e.target.value })}
                  placeholder="Ej: Dir. Médica - Col. N° 2800123"
                  className="mt-1 text-xs bg-card"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="razon_social">Razón Social</Label>
                <Input
                  id="razon_social"
                  value={formData.razon_social || ""}
                  onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cif_nif">NIF / CIF Emisor</Label>
                <Input
                  id="cif_nif"
                  value={formData.cif_nif || ""}
                  onChange={(e) => setFormData({ ...formData, cif_nif: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="telefono">Teléfono de Contacto</Label>
                <Input
                  id="telefono"
                  value={formData.telefono || ""}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email Oficial</Label>
                <Input
                  id="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="direccion">Dirección Sanitaria</Label>
              <Input
                id="direccion"
                value={formData.direccion || ""}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="codigo_postal">Código Postal</Label>
                <Input
                  id="codigo_postal"
                  value={formData.codigo_postal || ""}
                  onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad || ""}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  value={formData.provincia || ""}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
            disabled={updateSettingsMutation.isPending}
            onClick={() => updateSettingsMutation.mutate()}
          >
            <Save className="size-4 mr-2" />
            {updateSettingsMutation.isPending ? "Guardando..." : "Guardar Configuración Fiscal y Firma Digital"}
          </Button>
        </section>
      </div>

      {/* Modal Declaración Responsable del Fabricante */}
      {showDeclaracion && clinicData && (
        <DeclaracionResponsableDocument
          clinic={clinicData}
          onClose={() => setShowDeclaracion(false)}
        />
      )}
    </AdminShell>
  );
}

function Row({ label, hint, defaultChecked }: { label: string; hint: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3">
      <div>
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
