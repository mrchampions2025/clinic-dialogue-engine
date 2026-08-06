import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, MessageSquare } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pacientes } from "@/lib/admin-mock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/pacientes")({
  head: () => ({
    meta: [
      { title: "Pacientes · Dentix Admin" },
      { name: "description", content: "CRM de pacientes de la Clínica Dental Dentix: contacto, visitas y próximas citas." },
      { property: "og:title", content: "Pacientes · Dentix Admin" },
      { property: "og:description", content: "Ficha y seguimiento de pacientes de la clínica." },
    ],
  }),
  component: PacientesPage,
});

function PacientesPage() {
  return (
    <AdminShell
      title="Pacientes"
      subtitle="CRM de la clínica"
      actions={
        <Button size="sm">
          <Plus className="size-4" /> Añadir paciente
        </Button>
      }
    >
      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar paciente…" className="pl-9" />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Última visita</TableHead>
                <TableHead>Próxima cita</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientes.map((p) => (
                <TableRow key={p.email}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {p.nombre
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{p.nombre}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.etiqueta}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {p.telefono}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{p.email}</TableCell>
                  <TableCell className="whitespace-nowrap">{p.ultimaVisita}</TableCell>
                  <TableCell className="whitespace-nowrap">{p.proxima}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="size-4" /> Ver chat
                    </Button>
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
