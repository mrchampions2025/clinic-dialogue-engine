import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Eye, Link2, Copy, Check, UserPlus, MessageSquare, ShieldCheck } from "lucide-react";
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
import { getClinicSettings } from "@/lib/invoices";

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
  const [openLinkModal, setOpenLinkModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<Partial<Patient>>(empty);

  const { data: clinicSettings } = useQuery({ 
    queryKey: ["clinic_settings"], 
    queryFn: getClinicSettings 
  });

  const clinicSlug = (clinicSettings?.nombre_comercial || clinicSettings?.razon_social || "demo")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");

  const registrationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/c/${clinicSlug}/registro`
    : `https://clinicdental-nu.vercel.app/c/${clinicSlug}/registro`;

  const handleCopy = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    toast.success("Enlace de registro copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateCredentials = (email: string) => {
    // Option B: Simulate generating credentials
    const tempPassword = Math.random().toString(36).slice(-8);
    toast.success(`Credenciales generadas para ${email}. Contraseña temporal: ${tempPassword}. (Simulado para la demo)`);
  };

  const save = useMutation({
    mutationFn: upsertPatient,
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      setOpen(false);
      if (!variables.id && variables.email) {
        toast.success(`Paciente guardado. Se han enviado credenciales temporales a ${variables.email}`, { duration: 5000 });
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
      subtitle="CRM y Gestión de Pacientes de la Clínica"
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
            onClick={() => setOpenLinkModal(true)}
          >
            <Link2 className="size-4 mr-1.5" /> Enlace Registro Paciente
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md"
            onClick={() => {
              setForm(empty);
              setOpen(true);
            }}
          >
            <UserPlus className="size-4 mr-1.5" /> Nuevo Paciente
          </Button>
        </div>
      }
    >
      {/* Banner Informativo de Métodos de Registro de Pacientes */}
      <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-emerald-500/10 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-emerald-500 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Registro de Pacientes:</strong> Puedes crear la ficha de un paciente manualmente con el botón <em>"+ Nuevo Paciente"</em> o compartir tu <em>"Enlace Registro Paciente"</em> para que ellos creen su propia cuenta y accedan a sus citas y presupuestos.
          </p>
        </div>
      </div>

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente por Nombre, DNI, Teléfono o Email…"
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
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (p.email) handleGenerateCredentials(p.email);
                          else toast.error("El paciente no tiene email");
                        }}
                        title="Opción B: Generar y enviar credenciales (Simulado)"
                      >
                        <ShieldCheck className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-slate-400 hover:text-white hover:bg-slate-800"
                        onClick={(e) => {
                          e.stopPropagation();
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
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold" disabled={save.isPending}>
                {save.isPending ? "Creando..." : form.id ? "Guardar cambios" : "Crear Paciente y Enviar Credenciales"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Opción A: Enlace Único de Registro para Pacientes */}
      <Dialog open={openLinkModal} onOpenChange={setOpenLinkModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Link2 className="size-5 text-blue-500" /> Enlace de Auto-Registro de Paciente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Envía este enlace por WhatsApp o email a tus pacientes. Al hacer clic, accederán al formulario de registro con la marca de tu clínica y se vincularán automáticamente a tu cuenta.
            </p>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-blue-500/20">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="size-4 text-blue-400" />
                Opciones de Acceso para Pacientes
              </h4>
              <div className="space-y-4 mt-3">
                <div>
                  <p className="text-xs text-slate-300 font-medium mb-1.5">Opción A: Enlace de Auto-registro</p>
                  <p className="text-[11px] text-slate-400 mb-2">Envía este enlace para que el paciente cree su propia contraseña.</p>
                  <div className="flex items-center gap-2">
                    <Input 
                      readOnly 
                      value={registrationUrl}
                      className="bg-slate-950/50 border-slate-700 text-xs text-slate-400 h-8"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopy}
                      className="h-8 shrink-0 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border-0"
                    >
                      {copied ? <Check className="size-3.5 mr-1.5" /> : <Copy className="size-3.5 mr-1.5" />}
                      Copiar Enlace
                    </Button>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-800">
                  <p className="text-xs text-slate-300 font-medium mb-1.5">Opción B: Creación de Cuenta (Manual)</p>
                  <p className="text-[11px] text-slate-400 mb-2">Guarda el paciente primero, luego usa el botón del escudo en la tabla para generarle credenciales temporales.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <MessageSquare className="size-4" /> Envío rápido por WhatsApp
              </div>
              <p className="text-[11px] text-muted-foreground">
                Puedes copiar este mensaje y enviárselo directamente a tu paciente:
              </p>
              <div className="bg-background/80 p-2.5 rounded-lg border border-border text-xs font-mono text-foreground leading-relaxed select-all">
                Hola! Para darte de alta en la clínica y gestionar tus citas, accede al siguiente enlace: {registrationUrl}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenLinkModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
