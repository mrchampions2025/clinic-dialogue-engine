import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Clock, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clínica Dental Dentix Madrid | Cita y atención al paciente" },
      {
        name: "description",
        content:
          "Clínica Dental Dentix en Madrid: revisiones gratuitas, limpiezas, ortodoncia, implantes y urgencias. Habla con recepción y pide tu cita en minutos.",
      },
      { property: "og:title", content: "Clínica Dental Dentix Madrid" },
      {
        property: "og:description",
        content:
          "Revisiones gratuitas, ortodoncia, implantes y urgencias dentales en Madrid. Atención al paciente por chat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const services = [
  "Revisión gratuita",
  "Limpieza dental",
  "Ortodoncia invisible",
  "Implantes",
  "Blanqueamiento",
  "Urgencias dentales",
];

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">Clínica Dental Dentix</span>
        <Button asChild variant="ghost">
          <Link to="/auth">Acceso pacientes</Link>
        </Button>
      </header>

      <section className="mx-auto grid max-w-5xl gap-10 px-6 pb-16 pt-6 md:grid-cols-2 md:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <ShieldCheck className="size-3.5" /> Odontología en Madrid
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Cuidamos tu sonrisa sin miedos ni sorpresas
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Habla directamente con nuestra recepción: resolvemos tus dudas sobre tratamientos,
            precios y urgencias, y te buscamos hueco para una valoración.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                <MessageCircle className="size-4" /> Hablar con recepción
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="tel:+34900123456">
                <Phone className="size-4" /> 900 123 456
              </a>
            </Button>
          </div>
          <ul className="mt-8 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Clock className="size-4 text-primary" /> Lunes a viernes de 09:00 a 20:00
              ininterrumpido
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" /> Madrid · www.clinicadentix.com
            </li>
            <li className="flex items-center gap-2">
              <CalendarCheck className="size-4 text-primary" /> Primera revisión sin coste
            </li>
          </ul>
        </div>

        <div className="rounded-3xl bg-hero-gradient p-1 shadow-soft">
          <div className="rounded-[calc(1.5rem-2px)] bg-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Tratamientos
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {services.map((service) => (
                <li
                  key={service}
                  className="rounded-xl bg-secondary px-3 py-2.5 text-sm text-secondary-foreground"
                >
                  {service}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-muted-foreground">
              Los presupuestos de ortodoncia e implantes se cierran tras una valoración gratuita en
              clínica.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Clínica Dental Dentix · Madrid · soporte@clinicadentix.com · +34 900 123 456
      </footer>
    </main>
  );
}
