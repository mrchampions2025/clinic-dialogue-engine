import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { tratamientos } from "@/lib/admin-mock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/tratamientos")({
  head: () => ({
    meta: [
      { title: "Tratamientos · Dentix Admin" },
      { name: "description", content: "Catálogo de tratamientos dentales de Dentix con precios y duración estimada." },
      { property: "og:title", content: "Tratamientos · Dentix Admin" },
      { property: "og:description", content: "Gestiona el catálogo de tratamientos de la clínica." },
    ],
  }),
  component: TratamientosPage,
});

function TratamientosPage() {
  return (
    <AdminShell
      title="Tratamientos"
      subtitle="Catálogo y tarifas"
      actions={
        <Button size="sm">
          <Plus className="size-4" /> Añadir tratamiento
        </Button>
      }
    >
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tratamiento</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio base</TableHead>
                <TableHead>Duración estimada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tratamientos.map((t) => (
                <TableRow key={t.nombre}>
                  <TableCell className="font-medium">{t.nombre}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                      {t.categoria}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{t.precio}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {t.duracion}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Pencil className="size-4" /> Editar
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
