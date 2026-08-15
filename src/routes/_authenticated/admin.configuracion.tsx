import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getClinicSettings, updateClinicSettings, ClinicSettings } from "@/lib/invoices";
import { toast } from "sonner";
import { Building2, ShieldCheck, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración · Dentix Admin" },
      { name: "description", content: "Ajusta el comportamiento del agente de IA y los datos de la Clínica Dental Dentix." },
      { property: "og:title", content: "Configuración · Dentix Admin" },
      { property: "og:description", content: "Configuración de la IA y del sistema de la clínica." },
    ],
  }),
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  const qc = useQueryClient();
  
  const { data: clinicData } = useQuery({
    queryKey: ["clinic_settings"],
    queryFn: () => getClinicSettings(),
  });

  const [formData, setFormData] = useState<Partial<ClinicSettings>>({
    razon_social: "Clínica Dental Dentix",
    cif_nif: "B12345678",
    registro_sanitario: "CS-12345-M",
    direccion: "Av. Principal 123",
    codigo_postal: "28000",
    ciudad: "Madrid",
    provincia: "Madrid",
    telefono: "+34 912 345 678",
    email: "info@clinicadentix.es",
    iban: "ES91 2100 0418 4502 0005 1324",
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
      toast.success("Datos fiscales de la clínica actualizados");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AdminShell title="Configuración" subtitle="IA, sistema y datos fiscales de facturación SIF">
      <div className="grid gap-6 lg:grid-cols-2">
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
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Building2 className="size-4 text-blue-600" /> Datos Fiscales de la Clínica (SIF)
              </h2>
              <p className="text-xs text-muted-foreground">Utilizados en la emisión de facturas oficiales y códigos QR RD 1007/2023</p>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="size-3" /> Veri*factu SIF
            </span>
          </div>

          <div className="mt-5 grid gap-4 text-sm">
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
              {updateSettingsMutation.isPending ? "Guardando..." : "Actualizar Datos Fiscales"}
            </Button>
          </div>
        </section>
      </div>
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
