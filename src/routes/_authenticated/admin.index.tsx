import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Users, Stethoscope, CheckCircle2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EstadoBadge } from "@/components/admin/EstadoBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAppointments, listPatients, listTreatments, formatTime } from "@/lib/clinic-data";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Panel general · Dentix Admin" },
      { name: "description", content: "KPIs, citas del día y actividad del agente de IA de la Clínica Dental Dentix." },
      { property: "og:title", content: "Panel general · Dentix Admin" },
      { property: "og:description", content: "KPIs y citas del día de la Clínica Dental Dentix." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: citas = [] } = useQuery({ queryKey: ["appointments"], queryFn: listAppointments });
  const { data: pacientes = [] } = useQuery({ queryKey: ["patients"], queryFn: listPatients });
  const { data: tratamientos = [] } = useQuery({ queryKey: ["treatments"], queryFn: listTreatments });

  const hoy = new Date().toISOString().slice(0, 10);
  const citasHoy = citas.filter((c) => c.fecha === hoy);
  const confirmadas = citas.filter((c) => c.estado === "Confirmada").length;

  const kpis = [
    { label: "Pacientes registrados", value: String(pacientes.length), icon: Users },
    { label: "Citas totales", value: String(citas.length), icon: CalendarDays },
    { label: "Citas confirmadas", value: String(confirmadas), icon: CheckCircle2 },
    { label: "Tratamientos en catálogo", value: String(tratamientos.length), icon: Stethoscope },
  ];

  return (
    <AdminShell title="Panel general" subtitle="Resumen de la actividad de hoy · Madrid">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <kpi.icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Citas de hoy</h2>
          <p className="text-sm text-muted-foreground">Agenda en tiempo real</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Tratamiento</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {citasHoy.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No hay citas para hoy.
                  </TableCell>
                </TableRow>
              )}
              {citasHoy.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{formatTime(c.hora)}</TableCell>
                  <TableCell>{c.paciente}</TableCell>
                  <TableCell className="text-muted-foreground">{c.tratamiento}</TableCell>
                  <TableCell className="text-right">
                    <EstadoBadge estado={c.estado} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminShell>
  );
}
