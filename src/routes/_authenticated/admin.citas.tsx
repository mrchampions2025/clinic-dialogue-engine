import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { AdminShell } from "@/components/admin/AdminShell";
import { EstadoBadge } from "@/components/admin/EstadoBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  listPatients,
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

const locales = {
  es: es,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const empty: Partial<Appointment> = {
  paciente: "",
  telefono: "",
  tratamiento: "",
  fecha: new Date().toISOString().slice(0, 10),
  hora: "09:00",
  canal: "WhatsApp IA",
  estado: "Pendiente",
  precio: 0,
  pagado: false,
};

function CitasPage() {
  const qc = useQueryClient();
  const { data: citas = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: listAppointments,
  });
  const { data: pacientes = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: listPatients,
  });

  const [patientQuery, setPatientQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredPatients = pacientes.filter((p) => {
    if (!patientQuery.trim()) return false;
    const q = patientQuery.toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(q) ||
      p.dni?.toLowerCase().includes(q) ||
      p.telefono?.toLowerCase().includes(q)
    );
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
      <Tabs defaultValue="list" className="w-full">
        <div className="flex items-center mb-4">
          <TabsList>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="calendar">Calendario</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="list">
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
                <TableHead>Cobro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    Cargando citas…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && citas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
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
                  <TableCell>
                    {c.precio != null && c.precio > 0 ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">{c.precio} €</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full w-max ${c.pagado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {c.pagado ? "Pagado" : "Pendiente"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
      </TabsContent>

      <TabsContent value="calendar">
        <div className="space-y-3">
          {/* Leyenda Visual de Colores de Citas */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-xl p-3 px-4 shadow-sm text-xs">
            <span className="font-bold text-muted-foreground flex items-center gap-1.5">
              Leyenda de Clasificación:
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="size-3 rounded-full bg-emerald-600 shadow-sm inline-block" /> Confirmadas (Verde)
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                <span className="size-3 rounded-full bg-amber-500 shadow-sm inline-block" /> Pendientes (Naranja)
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-red-700 dark:text-red-400">
                <span className="size-3 rounded-full bg-red-600 shadow-sm inline-block" /> Canceladas (Rojo)
              </span>
            </div>
          </div>

          <div className="h-[650px] bg-card border border-border rounded-xl p-4 shadow-sm">
            <Calendar
              localizer={localizer}
              defaultView="month"
              views={["month", "week", "day", "agenda"]}
              events={citas.map((c) => {
                const timeClean = (c.hora || "09:00").slice(0, 5);
                const dateClean = (c.fecha || new Date().toISOString().slice(0, 10)).slice(0, 10);
                const start = new Date(`${dateClean}T${timeClean}:00`);
                const validStart = isNaN(start.getTime()) ? new Date() : start;
                const validEnd = new Date(validStart.getTime() + 60 * 60 * 1000);

                return {
                  id: c.id,
                  title: `${c.paciente} - ${c.tratamiento || "Cita"}`,
                  start: validStart,
                  end: validEnd,
                  resource: c,
                };
              })}
              startAccessor="start"
              endAccessor="end"
              culture="es"
              messages={{
                next: "Sig",
                previous: "Ant",
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día",
                agenda: "Agenda",
                date: "Fecha",
                time: "Hora",
                event: "Evento",
                noEventsInRange: "No hay citas en este periodo.",
              }}
              eventPropGetter={(event: any) => {
                let backgroundColor = "#f59e0b"; // amber-500
                let borderLeftColor = "#b45309"; // amber-700
                let extraClasses = "";
                
                if (event.resource.estado === "Confirmada") {
                  backgroundColor = "#059669"; // emerald-600
                  borderLeftColor = "#064e3b"; // emerald-900
                } else if (event.resource.estado === "Cancelada") {
                  backgroundColor = "#dc2626"; // red-600
                  borderLeftColor = "#450a0a"; // red-950
                  extraClasses = "line-through opacity-90";
                }
                
                return { 
                  style: {
                    backgroundColor,
                    borderLeft: `4px solid ${borderLeftColor}`,
                    borderTop: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    color: 'white',
                  },
                  className: `font-bold shadow-sm !rounded-lg p-1 transition-all text-xs cursor-pointer ${extraClasses}` 
                };
              }}
              components={{
                event: ({ event }: any) => (
                  <div className="p-1 text-xs h-full leading-tight flex flex-col justify-between">
                    <div className="font-bold truncate">{event.resource.paciente}</div>
                    <div className="opacity-90 truncate text-[10px] flex items-center justify-between mt-0.5">
                      <span>{event.resource.tratamiento || "Cita general"}</span>
                      <span className="font-mono text-[9px] bg-black/25 px-1 rounded font-bold">{event.resource.hora?.slice(0, 5)}</span>
                    </div>
                  </div>
                ),
              }}
              onSelectEvent={(event) => {
                setForm({ ...event.resource, hora: formatTime(event.resource.hora) });
                setOpen(true);
              }}
            />
          </div>
        </div>
      </TabsContent>
      </Tabs>

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
            <div className="sm:col-span-2 relative">
              <Label htmlFor="paciente">Paciente (Buscador por Nombre, Apellidos o DNI)</Label>
              <Input
                id="paciente"
                required
                placeholder="Empieza a escribir nombre, apellidos o DNI..."
                value={form.paciente ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, paciente: val });
                  setPatientQuery(val);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && filteredPatients.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover p-1 shadow-lg max-h-48 overflow-y-auto">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent rounded-lg flex justify-between items-center transition-colors"
                      onClick={() => {
                        setForm({
                          ...form,
                          paciente: p.nombre,
                          telefono: p.telefono || form.telefono || "",
                        });
                        setPatientQuery(p.nombre);
                        setShowDropdown(false);
                        toast.info(`Datos cargados automáticamente para ${p.nombre}`);
                      }}
                    >
                      <div>
                        <span className="font-bold text-foreground block">{p.nombre}</span>
                        <span className="text-[10px] text-muted-foreground">
                          DNI: {p.dni || "Sin DNI"} · Tel: {p.telefono || "Sin Teléfono"}
                        </span>
                      </div>
                      <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded">
                        Auto-rellenar ✓
                      </span>
                    </button>
                  ))}
                </div>
              )}
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
            <div>
              <Label htmlFor="precio">Precio (€)</Label>
              <Input
                id="precio"
                type="number"
                value={form.precio ?? ""}
                onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="pagado"
                checked={form.pagado ?? false}
                onCheckedChange={(checked) => setForm({ ...form, pagado: checked })}
              />
              <Label htmlFor="pagado" className="cursor-pointer">Marcar como pagado</Label>
            </div>
            <DialogFooter className="sm:col-span-2 mt-4">
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
