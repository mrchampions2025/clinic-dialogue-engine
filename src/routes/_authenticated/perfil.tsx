import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listUserAppointments, formatDate, formatTime } from "@/lib/clinic-data";
import { CalendarCheck, User } from "lucide-react";
import { EstadoBadge } from "@/components/admin/EstadoBadge";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [{ title: "Mi Perfil | Clínica Dental Dentix" }],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const { user } = useRouteContext({ from: "/_authenticated" }) as any;
  const { data: citas = [], isLoading } = useQuery({
    queryKey: ["mis-citas"],
    queryFn: () => listUserAppointments(user.id),
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Mi Perfil</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </header>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
            <CalendarCheck className="size-5 text-primary" />
            <h2 className="text-lg font-medium">Mis Citas</h2>
          </div>

          {isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Cargando tus citas...</p>
          ) : citas.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No tienes citas registradas actualmente.</p>
          ) : (
            <div className="space-y-4">
              {citas.map((c) => (
                <div key={c.id} className="flex flex-col gap-2 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{c.tratamiento || "Revisión general"}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(c.fecha)} a las {formatTime(c.hora)}
                    </p>
                  </div>
                  <div>
                    <EstadoBadge estado={c.estado} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
