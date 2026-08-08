import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listTreatments,
  upsertTreatment,
  deleteTreatment,
  type Treatment,
} from "@/lib/clinic-data";

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

const empty: Partial<Treatment> = { nombre: "", categoria: "", precio: "", duracion: "" };

function TratamientosPage() {
  const qc = useQueryClient();
  const { data: tratamientos = [], isLoading } = useQuery({
    queryKey: ["treatments"],
    queryFn: listTreatments,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Treatment>>(empty);

  const save = useMutation({
    mutationFn: upsertTreatment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatments"] });
      setOpen(false);
      toast.success("Tratamiento guardado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: deleteTreatment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatments"] });
      toast.success("Tratamiento eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminShell
      title="Tratamientos"
      subtitle="Catálogo y tarifas"
      actions={
        <Button
          size="sm"
          onClick={() => {
            setForm(empty);
            setOpen(true);
          }}
        >
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
                <TableHead>Precio</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Cargando catálogo…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && tratamientos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Aún no hay tratamientos en el catálogo.
                  </TableCell>
                </TableRow>
              )}
              {tratamientos.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nombre}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                      {t.categoria}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{t.precio}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{t.duracion}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar tratamiento"
                        onClick={() => {
                          setForm(t);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar tratamiento"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove.mutate(t.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar tratamiento" : "Nuevo tratamiento"}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(form);
            }}
          >
            <div className="sm:col-span-2">
              <Label htmlFor="t-nombre">Nombre</Label>
              <Input
                id="t-nombre"
                required
                value={form.nombre ?? ""}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="t-cat">Categoría</Label>
              <Input
                id="t-cat"
                value={form.categoria ?? ""}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="t-precio">Precio</Label>
              <Input
                id="t-precio"
                placeholder="60 €"
                value={form.precio ?? ""}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="t-dur">Duración</Label>
              <Input
                id="t-dur"
                placeholder="30 min"
                value={form.duracion ?? ""}
                onChange={(e) => setForm({ ...form, duracion: e.target.value })}
              />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Guardando…" : "Guardar tratamiento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
