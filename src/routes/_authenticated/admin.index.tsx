import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, Users, Stethoscope, CheckCircle2, TrendingUp, AlertCircle, Euro, Link2, Copy, Check } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EstadoBadge } from "@/components/admin/EstadoBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getClinicSettings } from "@/lib/invoices";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAppointments, listPatients, listTreatments, formatTime, listPayments, listBudgets } from "@/lib/clinic-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Panel general · Dentix Admin" },
    ],
  }),
  component: DashboardPage,
});

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

function DashboardPage() {
  const [copied, setCopied] = useState(false);
  const { data: citas = [] } = useQuery({ queryKey: ["appointments"], queryFn: listAppointments });
  const { data: pacientes = [] } = useQuery({ queryKey: ["patients"], queryFn: listPatients });
  const { data: pagos = [] } = useQuery({ queryKey: ["payments"], queryFn: listPayments });
  const { data: presupuestos = [] } = useQuery({ queryKey: ["budgets"], queryFn: listBudgets });
  const { data: clinicSettings } = useQuery({ queryKey: ["clinic_settings"], queryFn: getClinicSettings });

  const hoy = new Date().toISOString().slice(0, 10);
  const citasHoy = citas.filter((c) => c.fecha === hoy);
  
  // Slug de la clínica o fallback
  const clinicSlug = (clinicSettings?.nombre_comercial || clinicSettings?.razon_social || "demo")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");

  const patientRegistrationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/c/${clinicSlug}/registro`
    : `https://clinicdental-nu.vercel.app/c/${clinicSlug}/registro`;

  const copyPatientLink = () => {
    navigator.clipboard.writeText(patientRegistrationUrl);
    setCopied(true);
    toast.success("¡Enlace de registro de pacientes copiado al portapapeles!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Finanzas
  const totalIngresos = pagos.reduce((acc, p) => acc + Number(p.monto), 0);
  const presupuestosPendientes = presupuestos.filter(p => p.estado === 'Pendiente').length;
  const citasSinPagar = citas.filter(c => c.estado === 'Confirmada' && !c.pagado).length;

  const kpis = [
    { label: "Ingresos Totales", value: formatCurrency(totalIngresos), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Citas Hoy", value: String(citasHoy.length), icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Citas Pendientes de Cobro", value: String(citasSinPagar), icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Presupuestos en Espera", value: String(presupuestosPendientes), icon: Euro, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <AdminShell title="Panel general" subtitle="Resumen de la actividad y finanzas">
      {/* Banner de Enlace Público de la Clínica para Pacientes */}
      <div className="mb-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 border border-blue-700 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link2 className="size-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Enlace Exclusivo para Tus Pacientes</span>
          </div>
          <p className="text-sm font-semibold">
            {patientRegistrationUrl}
          </p>
          <p className="text-xs text-blue-200">
            Comparte este enlace para que tus pacientes se registren y soliciten cita directamente en tu clínica.
          </p>
        </div>
        <Button onClick={copyPatientLink} className="bg-blue-500 hover:bg-blue-400 text-white text-xs gap-2 shrink-0">
          {copied ? <Check className="size-4 text-emerald-300" /> : <Copy className="size-4" />}
          {copied ? "¡Copiado!" : "Copiar Enlace Público"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", kpi.bg, kpi.color)}>
                <kpi.icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-base font-semibold">Citas de hoy</h2>
              <p className="text-sm text-muted-foreground">Agenda en tiempo real</p>
            </div>
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
                {citasHoy.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{formatTime(c.hora)}</TableCell>
                    <TableCell>{c.paciente}</TableCell>
                    <TableCell className="text-muted-foreground">{c.tratamiento}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.pagado && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Pagado</span>}
                        <EstadoBadge estado={c.estado} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Panel lateral: Actividad Reciente o Presupuestos */}
        <div className="rounded-2xl border border-border bg-card shadow-sm flex flex-col">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">Resumen de Negocio</h2>
            <p className="text-sm text-muted-foreground">Pacientes y tratamientos</p>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Users className="size-5 text-blue-500" />
                <span className="font-medium">Total Pacientes</span>
              </div>
              <span className="text-xl font-bold">{pacientes.length}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Stethoscope className="size-5 text-purple-500" />
                <span className="font-medium">Tratamientos</span>
              </div>
              <span className="text-xl font-bold">Activos</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500" />
                <span className="font-medium">Presupuestos</span>
              </div>
              <span className="text-xl font-bold">{presupuestos.length}</span>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
