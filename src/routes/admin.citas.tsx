import { createFileRoute } from "@tanstack/react-router";
import { Pencil, X, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EstadoBadge } from "@/components/admin/EstadoBadge";
import { Button } from "@/components/ui/button";
import { citas } from "@/lib/admin-mock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/citas")({
  head: () => ({
    meta: [
      { title: "Citas · Dentix Admin" },
      { name: "description", content: "Gestiona las citas de la Clínica Dental Dentix por fecha, canal y estado." },
      { property: "og:title", content: "Citas · Dentix Admin" },
      { property: "og:description", content: "Listado de citas con canal de origen y estado." },
    ],
  }),
  component: CitasPage,
});

function CitasPage() {
  return (
    <AdminShell
      title="Citas"
      subtitle="Agenda de la clínica"
      actions={
        <Button size="sm">
          <Plus className="size-4" /> Nueva cita
        </Button>
      }
    >
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Tratamiento</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {citas.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="whitespace-nowrap font-medium">{c.fecha}</TableCell>
                  <TableCell className="whitespace-nowrap">{c.hora}</TableCell>
                  <TableCell className="whitespace-nowrap">{c.paciente}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {c.telefono}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{c.tratamiento}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                      {c.canal}
                    </span>
                  </TableCell>
                  <TableCell>
                    <EstadoBadge estado={c.estado} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Editar cita">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Cancelar cita"
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
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
