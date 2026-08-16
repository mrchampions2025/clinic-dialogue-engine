import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
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
  listPatients,
  upsertPatient,
  deletePatient,
  formatDate,
  type Patient,
} from "@/lib/clinic-data";

export const Route = createFileRoute("/_authenticated/admin/pacientes/")({
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

const empty: Partial<Patient> = {
  nombre: "",
  telefono: "",
  email: "",
  etiqueta: "",
  ultima_visita: "",
  proxima_cita: "",
};

function PacientesPage() {
  const qc = useQueryClient();
  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: listPatients,
  });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Patient>>(empty);

  const save = useMutation({
    mutationFn: upsertPatient,
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      setOpen(false);
      if (!variables.id && variables.email) {
        toast.success(`Paciente guardado. Se han enviado credenciales temporales a ${variables.email} (Simulado)`, { duration: 5000 });
      } else {
        toast.success("Paciente guardado");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = pacientes.filter((p) =>
    `${p.nombre} ${p.telefono ?? ""} ${p.email ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AdminShell
      title="Pacientes"
      subtitle="CRM de la clínica"
      actions={
        <Button
          size="sm"
          onClick={() => {
            setForm(empty);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Añadir paciente
        </Button>
      }
    >
      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente…"
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>DNI/NIF</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Última visita</TableHead>
                <TableHead>Próxima cita</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Cargando pacientes…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No hay pacientes que mostrar.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p) => (
                <TableRow key={p.id}>
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
                        <Link to="/admin/pacientes/$id" params={{ id: p.id }} className="truncate text-sm font-medium hover:underline text-primary">
                          {p.nombre}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">{p.etiqueta}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{p.telefono}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{p.dni || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{p.email}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(p.ultima_visita)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(p.proxima_cita)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Ver ficha" asChild>
                        <Link to="/admin/pacientes/$id" params={{ id: p.id }}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar paciente"
                        onClick={() => {
                          setForm(p);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar paciente"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove.mutate(p.id)}
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
            <DialogTitle>{form.id ? "Editar paciente" : "Nuevo paciente"}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(form);
            }}
          >
            <div className="sm:col-span-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                required
                value={form.nombre ?? ""}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tel">Teléfono</Label>
              <Input
                id="tel"
                value={form.telefono ?? ""}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dni">DNI / NIF</Label>
              <Input
                id="dni"
                placeholder="12345678A"
                value={form.dni ?? ""}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={form.direccion ?? ""}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                value={form.ciudad ?? ""}
                onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="cp">Código postal</Label>
              <Input
                id="cp"
                value={form.codigo_postal ?? ""}
                onChange={(e) => setForm({ ...form, codigo_postal: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="etiqueta">Etiqueta</Label>
              <Input
                id="etiqueta"
                placeholder="Nuevo, Ortodoncia…"
                value={form.etiqueta ?? ""}
                onChange={(e) => setForm({ ...form, etiqueta: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ultima">Última visita</Label>
              <Input
                id="ultima"
                type="date"
                value={form.ultima_visita ?? ""}
                onChange={(e) => setForm({ ...form, ultima_visita: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="proxima">Próxima cita</Label>
              <Input
                id="proxima"
                type="date"
                value={form.proxima_cita ?? ""}
                onChange={(e) => setForm({ ...form, proxima_cita: e.target.value })}
              />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Guardando…" : "Guardar paciente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
