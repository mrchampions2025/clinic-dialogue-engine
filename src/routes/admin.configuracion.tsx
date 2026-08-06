import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/configuracion")({
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
  return (
    <AdminShell title="Configuración" subtitle="IA y sistema">
      <div className="grid gap-4 lg:grid-cols-2">
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

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">Datos de la clínica</h2>
          <p className="text-sm text-muted-foreground">Se usan en las respuestas de la IA</p>
          <div className="mt-5 grid gap-4">
            <Field id="nombre" label="Nombre" defaultValue="Clínica Dental Dentix" />
            <Field id="dir" label="Dirección" defaultValue="C/ Alcalá 128, Madrid" />
            <Field id="tel" label="Teléfono" defaultValue="+34 910 000 000" />
            <Field id="horario" label="Horario" defaultValue="Lunes a viernes, 09:00 – 20:00" />
            <Button variant="outline">Actualizar datos</Button>
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

function Field({ id, label, defaultValue }: { id: string; label: string; defaultValue: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} defaultValue={defaultValue} />
    </div>
  );
}
