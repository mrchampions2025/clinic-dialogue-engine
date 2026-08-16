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
import { Building2, ShieldCheck, Save, Award, FileCheck, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/configuracion")({
  component: AdminConfiguracionPage,
});

function AdminConfiguracionPage() {
  const qc = useQueryClient();
  const [formData, setFormData] = useState<Partial<ClinicSettings>>({});
  const [showDeclaracion, setShowDeclaracion] = useState(false);

  const { data: clinicData } = useQuery({
    queryKey: ["clinic_settings"],
    queryFn: () => getClinicSettings(),
  });

  useEffect(() => {
    if (clinicData) {
      setFormData(clinicData);
    }
  }, [clinicData]);

  const updateSettingsMutation = useMutation({
    mutationFn: () => updateClinicSettings(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinic_settings"] });
      toast.success("Datos fiscales y configuración SIF actualizados con éxito");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AdminShell title="Configuración SIF & Datos Fiscales" subtitle="IA, sistema y cumplimiento RD 1007/2023 / Orden HAC/1177/2024">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuración IA WhatsApp */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">Agente de IA</h2>
          <p className="text-sm text-muted-foreground">Comportamiento en WhatsApp</p>
          <div className="mt-5 space-y-5">
            <Row label="Respuestas automáticas" hint="La IA contesta sin intervención humana" defaultChecked />
            <Row label="Derivar urgencias a recepción" hint="Avisa al equipo ante dolor agudo" defaultChecked />
            <Row label="Confirmación de citas 24 h antes" hint="Recordatorio automático" defaultChecked />
            <Row label="Responder fuera de horario" hint="Lunes a viernes 09:00–20:00" />
            <div className="space-y-2">
              <Label htmlFor="tono">Tono y personalidad</Label>
              <Textarea
                id="tono"
                rows={4}
                defaultValue="Eres Marta, de recepción de Clínica Dental Dentix. Cercana, breve y profesional, con estilo WhatsApp."
              />
            </div>
            <Button>Guardar cambios</Button>
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

          {/* Configuración de Firma y Sello Oficial por Defecto para Presupuestos y Documentos */}
          <div className="bg-gradient-to-br from-purple-50/60 to-indigo-50/60 dark:from-purple-950/20 dark:to-indigo-950/20 p-5 rounded-xl border border-purple-200 dark:border-purple-900 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                  <Award className="size-4 text-purple-600" /> Configuración de Firma y Sello Oficial de la Clínica
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Elige y configura las opciones oficiales de firma que se aplicarán en los presupuestos e informes médicos.
                </p>
              </div>

              <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-100/50 dark:bg-purple-900/30 text-[10px] font-mono">
                RD 1007/2023 Compliant
              </Badge>
            </div>

            {/* Selector de Tipo de Firma Oficial */}
            <div className="grid grid-cols-3 gap-3">
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
                  <Upload className="size-3.5 text-purple-600" /> Opción 1: Imagen de Sello / Firma
                </p>
                <p className="text-[10px] opacity-80 mt-1">Subir imagen o logotipo de firma/sello transparente (PNG/JPG/SVG).</p>
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
                  <ShieldCheck className="size-3.5 text-emerald-600" /> Opción 2: Certificado Electrónico
                </p>
                <p className="text-[10px] opacity-80 mt-1">Firma digital con Certificado de Representante / FNMT X.509.</p>
              </button>

              <button
                type="button"
                className={`p-3 rounded-lg border text-left text-xs transition-all ${
                  formData.tipo_firma_oficial === "ambos"
                    ? "bg-white dark:bg-slate-800 border-indigo-500 text-indigo-900 dark:text-indigo-100 shadow-sm font-semibold"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => setFormData({ ...formData, tipo_firma_oficial: "ambos" })}
              >
                <p className="font-bold flex items-center gap-1 text-indigo-600">
                  <FileCheck className="size-3.5 text-indigo-600" /> Opción 3: Imagen + Certificado
                </p>
                <p className="text-[10px] opacity-80 mt-1">Combina el gráfico del sello con la validación de Certificado Digital.</p>
              </button>
            </div>

            {/* OPCIÓN 1: SUBIDA DE IMAGEN DE FIRMA / SELLO */}
            {(formData.tipo_firma_oficial === "imagen" || formData.tipo_firma_oficial === "ambos") && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-purple-200 dark:border-purple-900 space-y-3">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Upload className="size-3.5 text-purple-600" /> Imagen del Sello u Firma Oficial (PNG / JPG / SVG)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Sube el archivo gráfico de tu sello o firma escaneada. Se guardará de forma segura en tu sistema.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {formData.firma_sello_imagen ? (
                    <div className="relative group border border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-slate-50 dark:bg-slate-800">
                      <img
                        src={formData.firma_sello_imagen}
                        alt="Sello Oficial de la Clínica"
                        className="h-20 max-w-xs object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="mt-2 w-full text-xs"
                        onClick={() => setFormData({ ...formData, firma_sello_imagen: null })}
                      >
                        Eliminar Imagen
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-xl p-6 text-center hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors">
                      <Upload className="size-8 mx-auto text-purple-500 opacity-70 mb-2" />
                      <p className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                        Arrastra o haz clic para subir la imagen de la firma/sello
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">Recomendado: PNG con fondo transparente (máx. 2MB)</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="mt-3 text-xs mx-auto block cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, firma_sello_imagen: reader.result as string });
                              toast.success("Imagen de firma/sello cargada y lista para guardar");
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

            {/* OPCIÓN 2: CERTIFICADO ELECTRÓNICO DIGITAL X.509 */}
            {(formData.tipo_firma_oficial === "certificado" || formData.tipo_firma_oficial === "ambos") && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-emerald-600" /> Certificado Electrónico Digital X.509 (FNMT / Representante)
                  </Label>
                  <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                    Certificado Activo
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Configuración del certificado digital de representante de persona jurídica o sello cualificado conforme a eIDAS / RD 1007/2023.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <Label htmlFor="cert_nombre_titular" className="text-[11px]">Titular del Certificado (CN)</Label>
                    <Input
                      id="cert_nombre_titular"
                      value={formData.cert_nombre_titular || ""}
                      onChange={(e) => setFormData({ ...formData, cert_nombre_titular: e.target.value })}
                      placeholder="Ej: CLINICA DENTAL DENTIX SL - B12345678"
                      className="mt-1 h-8 text-xs font-mono bg-card"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cert_emisor" className="text-[11px]">Autoridad Emisora (CA)</Label>
                    <Input
                      id="cert_emisor"
                      value={formData.cert_emisor || ""}
                      onChange={(e) => setFormData({ ...formData, cert_emisor: e.target.value })}
                      placeholder="Ej: FNMT-RCM / Camerfirma"
                      className="mt-1 h-8 text-xs bg-card"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cert_num_serie" className="text-[11px]">Número de Serie Criptográfico</Label>
                    <Input
                      id="cert_num_serie"
                      value={formData.cert_num_serie || ""}
                      onChange={(e) => setFormData({ ...formData, cert_num_serie: e.target.value })}
                      className="mt-1 h-8 text-xs font-mono bg-card"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cert_valido_hasta" className="text-[11px]">Fecha de Caducidad</Label>
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
                  <Label htmlFor="cert_huella_sha256" className="text-[11px]">Huella Criptográfica SHA-256 del Certificado</Label>
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
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-purple-200 dark:border-purple-900">
              <div>
                <Label htmlFor="firma_sello_nombre" className="text-xs">Nombre del Doctor / Firmante</Label>
                <Input
                  id="firma_sello_nombre"
                  value={formData.firma_sello_nombre || ""}
                  onChange={(e) => setFormData({ ...formData, firma_sello_nombre: e.target.value })}
                  placeholder="Ej: Dra. María García"
                  className="mt-1 text-xs bg-card"
                />
              </div>

              <div>
                <Label htmlFor="firma_sello_cargo" className="text-xs">Cargo / Colegiado</Label>
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
                <Label htmlFor="registro_sanitario">Registro Sanitario / N° Colegiado</Label>
                <Input
                  id="registro_sanitario"
                  value={formData.registro_sanitario || ""}
                  onChange={(e) => setFormData({ ...formData, registro_sanitario: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono de Contacto</Label>
                <Input
                  id="telefono"
                  value={formData.telefono || ""}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="direccion">Dirección Fiscal</Label>
              <Input
                id="direccion"
                value={formData.direccion || ""}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="codigo_postal">C.P.</Label>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email">Email Fiscal</Label>
                <Input
                  id="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="iban">IBAN Bancario</Label>
                <Input
                  id="iban"
                  value={formData.iban || ""}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                />
              </div>
            </div>

            <Button
              className="mt-2"
              onClick={() => updateSettingsMutation.mutate()}
              disabled={updateSettingsMutation.isPending}
            >
              <Save className="size-4 mr-2" />
              {updateSettingsMutation.isPending ? "Guardando..." : "Actualizar Datos Fiscales y SIF"}
            </Button>
          </div>
        </section>
      </div>

      {/* Visor de Declaración Responsable del Fabricante */}
      {showDeclaracion && (clinicData || formData) && (
        <DeclaracionResponsableDocument
          clinic={(clinicData || formData) as ClinicSettings}
          onClose={() => setShowDeclaracion(false)}
        />
      )}
    </AdminShell>
  );
}

function Row({
  label,
  hint,
  defaultChecked,
}: {
  label: string;
  hint: string;
  defaultChecked?: boolean | undefined;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch defaultChecked={defaultChecked ?? false} />
    </div>
  );
}
