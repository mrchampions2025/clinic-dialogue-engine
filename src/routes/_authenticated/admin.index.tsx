import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { kpis, citasHoy } from "@/lib/admin-mock";
import { EstadoBadge } from "@/components/admin/EstadoBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  return (
    <AdminShell title="Panel general" subtitle="Resumen de la actividad de hoy · Madrid">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-3xl font-semibold tracking-tight">{kpi.value}</p>
              <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                <ArrowUpRight className="size-3" />
                {kpi.delta}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Próximas citas de hoy</h2>
          <p className="text-sm text-muted-foreground">Agenda del 6 de agosto</p>
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
              {citasHoy.map((c) => (
                <TableRow key={c.hora}>
                  <TableCell className="font-medium">{c.hora}</TableCell>
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
