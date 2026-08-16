import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listClinics } from "@/lib/clinic-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ShieldAlert, CheckCircle2, Ban, TrendingUp, Users, Building2, CreditCard, Activity, MoreVertical, LogIn } from "lucide-react";

export const Route = createFileRoute("/_authenticated/superadmin/")({
  component: SuperAdminDashboard,
});

function SuperAdminDashboard() {
  const { data: clinics = [], isLoading } = useQuery({
    queryKey: ["clinics"],
    queryFn: listClinics,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cabecera / Bienvenida */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Centro de Control SaaS</h1>
          <p className="text-sm text-slate-400 mt-1">Visión general de suscripciones, ingresos y clientes activos.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
            Exportar Reporte Mensual
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
            + Nueva Licencia Manual
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas SaaS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* MRR (Ingresos Recurrentes) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="size-16 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <CreditCard className="size-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">MRR Estimado</h3>
          </div>
          <p className="text-3xl font-black text-white">4.850€<span className="text-base text-slate-500 font-medium">/mes</span></p>
          <p className="text-xs text-emerald-400 font-medium mt-2 flex items-center gap-1">
            <TrendingUp className="size-3" /> +12% este mes
          </p>
        </div>

        {/* Clínicas Activas */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Building2 className="size-16 text-blue-500" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Building2 className="size-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Clínicas Clientes</h3>
          </div>
          <p className="text-3xl font-black text-white">{clinics.length}</p>
          <p className="text-xs text-blue-400 font-medium mt-2 flex items-center gap-1">
            2 en periodo de prueba
          </p>
        </div>

        {/* Total Pacientes de la plataforma */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="size-16 text-indigo-500" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Users className="size-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Usuarios Finales</h3>
          </div>
          <p className="text-3xl font-black text-white">12.4K</p>
          <p className="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1">
            Pacientes gestionados globalmente
          </p>
        </div>

        {/* Estado de Salud */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="size-16 text-cyan-500" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Activity className="size-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Salud del Sistema</h3>
          </div>
          <p className="text-3xl font-black text-emerald-400">99.9%</p>
          <p className="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1">
            Uptime 30 días · Todo operativo
          </p>
        </div>
      </div>

      {/* Tabla Maestro de Clientes (Clínicas) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="size-5 text-indigo-400" /> Directorio de Clientes (Tenants)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900/90">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 font-semibold w-[250px]">Empresa / Clínica</TableHead>
                <TableHead className="text-slate-400 font-semibold">Suscripción</TableHead>
                <TableHead className="text-slate-400 font-semibold">Estado de Pago</TableHead>
                <TableHead className="text-slate-400 font-semibold">Espacio URL</TableHead>
                <TableHead className="text-right text-slate-400 font-semibold">Control de Acceso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground border-slate-800">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin size-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                      Cargando listado de clientes...
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && clinics.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground border-slate-800">
                    No hay clínicas registradas todavía.
                  </TableCell>
                </TableRow>
              )}
              {clinics.map((c, i) => {
                // Mock data para darle aspecto real de SaaS (esto luego iría linkeado a Stripe)
                const mockPlans = ["Pro", "Pro", "Starter", "Enterprise"];
                const plan = mockPlans[i % 4];
                const isPaid = i !== 2; // El tercero estará en impago de prueba
                
                return (
                  <TableRow key={c.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200">{c.name}</p>
                          <p className="text-xs text-slate-500 font-mono">ID: {c.id.split("-")[0]} · {new Date(c.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
                        {plan} Plan
                      </span>
                    </TableCell>
                    <TableCell>
                      {isPaid ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-300">Al día</p>
                            <p className="text-[10px] text-slate-500">Último cobro: hace 5 días</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="size-4 text-red-500" />
                          <div>
                            <p className="text-sm font-medium text-red-400">Impago (Factura Abierta)</p>
                            <p className="text-[10px] text-slate-500">Reintentando cobro automático...</p>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-400 font-mono text-xs">/c/{c.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" className="h-8 text-xs border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300">
                          <LogIn className="size-3.5 mr-1.5" /> Entrar como Clínica
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
                          <MoreVertical className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
