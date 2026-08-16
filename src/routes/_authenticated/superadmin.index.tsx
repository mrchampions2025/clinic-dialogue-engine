import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listClinics } from "@/lib/clinic-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ShieldAlert, CheckCircle2, Ban } from "lucide-react";

export const Route = createFileRoute("/_authenticated/superadmin/")({
  component: SuperAdminDashboard,
});

function SuperAdminDashboard() {
  const { data: clinics = [], isLoading } = useQuery({
    queryKey: ["clinics"],
    queryFn: listClinics,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Clínicas (Tenants)</h1>
          <p className="text-sm text-slate-400">Administra todas las clínicas suscritas a DentalFlow SaaS</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900">
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-300">ID / Creación</TableHead>
                <TableHead className="text-slate-300">Nombre Clínica</TableHead>
                <TableHead className="text-slate-300">Slug (URL)</TableHead>
                <TableHead className="text-slate-300">Estado</TableHead>
                <TableHead className="text-right text-slate-300">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground border-slate-800">
                    Cargando clínicas...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && clinics.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground border-slate-800">
                    No hay clínicas registradas todavía.
                  </TableCell>
                </TableRow>
              )}
              {clinics.map((c) => (
                <TableRow key={c.id} className="border-slate-800">
                  <TableCell className="whitespace-nowrap">
                    <div className="text-xs font-mono text-slate-500">{c.id.split("-")[0]}</div>
                    <div className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-200">
                    {c.name}
                  </TableCell>
                  <TableCell className="text-blue-400 font-mono text-xs">
                    /{c.slug}
                  </TableCell>
                  <TableCell>
                    {c.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="size-3" /> Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-400 border border-red-500/20">
                        <Ban className="size-3" /> Suspendida
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="h-7 text-xs border-slate-700 hover:bg-slate-800">
                      Gestionar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
