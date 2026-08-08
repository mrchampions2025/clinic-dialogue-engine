import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { EstadoBadge } from "@/components/admin/EstadoBadge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listAppointments,
  upsertAppointment,
  deleteAppointment,
  formatDate,
  formatTime,
  type Appointment,
  type Estado,
} from "@/lib/clinic-data";

export const Route = createFileRoute("/_authenticated/admin/citas")({
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

const empty: Partial<Appointment> = {
  paciente: "",
  telefono: "",
  tratamiento: "",
  fecha: new Date().toISOString().slice(0, 10),
  hora: "09:00",
  canal: "WhatsApp IA",
  estado: "Pendiente",
};

function CitasPage() {
  const qc = useQueryClient();
  const { data: citas = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: listAppointments,
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Appointment>>(empty);

  const save = useMutation({
    mutationFn: upsertAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      setOpen(false);
      toast.success("Cita guardada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Cita eliminada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminShell
      title="Citas"
      subtitle="Agenda de la clínica"
      actions={
        <Button
          size="sm"
          onClick={() => {
            setForm(empty);
            setOpen(true);
          }}
        >
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
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    Cargando citas…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && citas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    Todavía no hay citas registradas.
                  </TableCell>
                </TableRow>
              )}
              {citas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="whitespace-nowrap font-medium">{formatDate(c.fecha)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatTime(c.hora)}</TableCell>
                  <TableCell className="whitespace-nowrap">{c.paciente}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{c.telefono}</TableCell>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar cita"
                        onClick={() => {
                          setForm({ ...c, hora: formatTime(c.hora) });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar cita"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove.mutate(c.id)}
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
            <DialogTitle>{form.id ? "Editar cita" : "Nueva cita"}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(form);
            }}
          >
            <div className="sm:col-span-2">
              <Label htmlFor="paciente">Paciente</Label>
              <Input
                id="paciente"
                required
                value={form.paciente ?? ""}
                onChange={(e) => setForm({ ...form, paciente: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={form.telefono ?? ""}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tratamiento">Tratamiento</Label>
              <Input
                id="tratamiento"
                value={form.tratamiento ?? ""}
                onChange={(e) => setForm({ ...form, tratamiento: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                required
                value={form.fecha ?? ""}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="hora">Hora</Label>
              <Input
                id="hora"
                type="time"
                required
                value={form.hora ?? ""}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}
              />
            </div>
            <div>
              <Label>Canal</Label>
              <Select
                value={form.canal ?? "WhatsApp IA"}
                onValueChange={(v) => setForm({ ...form, canal: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["WhatsApp IA", "Teléfono", "Web", "Presencial"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select
                value={form.estado ?? "Pendiente"}
                onValueChange={(v) => setForm({ ...form, estado: v as Estado })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Pendiente", "Confirmada", "Cancelada"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Guardando…" : "Guardar cita"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
