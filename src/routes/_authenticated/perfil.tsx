import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listUserAppointments, formatDate, formatTime } from "@/lib/clinic-data";
import { CalendarCheck, User, Plus, FileText, Euro } from "lucide-react";
import { EstadoBadge } from "@/components/admin/EstadoBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [{ title: "Mi Portal | Clínica Dental" }],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const { user } = useRouteContext({ from: "/_authenticated" }) as any;
  const qc = useQueryClient();
  const [openForm, setOpenForm] = useState(false);

  // Form states
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState(user.user_metadata?.full_name || "");

  const { data: citas = [], isLoading: loadingCitas } = useQuery({
    queryKey: ["mis-citas"],
    queryFn: () => listUserAppointments(user.id),
  });

  const { data: historial = [], isLoading: loadingHistorial } = useQuery({
    queryKey: ["mis-tratamientos", user.id],
    queryFn: async () => {
      // Intentamos buscar historial si la tabla existe
      const { data, error } = await supabase
        .from("medical_records" as any)
        .select("*")
        .eq("patient_id", user.id)
        .order("fecha", { ascending: false });
      if (error && error.code !== "42P01") throw error;
      return data || [];
    },
  });

  const { data: presupuestos = [], isLoading: loadingPresupuestos } = useQuery({
    queryKey: ["mis-presupuestos", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets" as any)
        .select("*")
        .eq("patient_id", user.id)
        .order("fecha", { ascending: false });
      if (error && error.code !== "42P01") throw error;
      return data || [];
    },
  });

  const agendarMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("appointments").insert({
        paciente: nombre || user.email,
        telefono: telefono || "",
        fecha,
        hora,
        tratamiento,
        canal: "Web (Portal)",
        estado: "Pendiente",
        patient_id: user.id,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Solicitud de cita enviada correctamente");
      setOpenForm(false);
      qc.invalidateQueries({ queryKey: ["mis-citas"] });
      // Limpiar formulario
      setFecha(""); setHora(""); setTratamiento(""); setTelefono("");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAgendar = (e: React.FormEvent) => {
    e.preventDefault();
    agendarMutation.mutate();
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-7" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Mi Portal del Paciente</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Dialog open={openForm} onOpenChange={setOpenForm}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all">
                <Plus className="mr-2 size-5" /> Agendar Nueva Cita
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Solicitar Cita</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAgendar} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>Nombre Completo</Label>
                  <Input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Juan Pérez" />
                </div>
                <div className="grid gap-2">
                  <Label>Teléfono de Contacto</Label>
                  <Input required type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej. +34 600 000 000" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Fecha</Label>
                    <Input required type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Hora Preferida</Label>
                    <Input required type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Motivo de la consulta</Label>
                  <Textarea required value={tratamiento} onChange={(e) => setTratamiento(e.target.value)} placeholder="Limpieza, dolor de muelas, revisión..." />
                </div>
                <Button type="submit" className="w-full mt-4" disabled={agendarMutation.isPending}>
                  {agendarMutation.isPending ? "Enviando..." : "Confirmar Solicitud"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <Tabs defaultValue="citas" className="w-full">
          <TabsList className="mb-6 w-full justify-start h-12 rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="citas" className="rounded-lg px-6 data-[state=active]:shadow-sm">
              <CalendarCheck className="mr-2 size-4" /> Mis Citas
            </TabsTrigger>
            <TabsTrigger value="tratamientos" className="rounded-lg px-6 data-[state=active]:shadow-sm">
              <FileText className="mr-2 size-4" /> Mi Historial
            </TabsTrigger>
            <TabsTrigger value="presupuestos" className="rounded-lg px-6 data-[state=active]:shadow-sm">
              <Euro className="mr-2 size-4" /> Mis Tratamientos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="citas" className="mt-0">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              {loadingCitas ? (
                <p className="py-8 text-center text-muted-foreground animate-pulse">Cargando tus citas...</p>
              ) : citas.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <CalendarCheck className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No tienes citas programadas</h3>
                  <p className="text-muted-foreground mt-1">Utiliza el botón de arriba para agendar tu primera visita.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {citas.map((c) => (
                    <div key={c.id} className="flex flex-col gap-4 rounded-xl border border-border bg-slate-50/50 p-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-slate-50">
                      <div>
                        <p className="font-semibold text-lg text-primary">{c.tratamiento || "Revisión general"}</p>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          <CalendarCheck className="size-4" />
                          {formatDate(c.fecha)} a las {formatTime(c.hora)}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <EstadoBadge estado={c.estado} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="tratamientos" className="mt-0">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              {loadingHistorial ? (
                <p className="py-8 text-center text-muted-foreground animate-pulse">Cargando tu historial...</p>
              ) : historial.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <FileText className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">Historial vacío</h3>
                  <p className="text-muted-foreground mt-1">Tu doctor aún no ha añadido notas a tu historial clínico.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historial.map((h: any) => (
                    <div key={h.id} className="p-5 border border-border rounded-xl bg-slate-50/50">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-semibold text-primary px-3 py-1 bg-primary/10 rounded-full text-sm">{h.tipo}</span>
                        <span className="text-sm font-medium text-muted-foreground">{formatDate(h.fecha)}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">{h.notas}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="presupuestos" className="mt-0">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              {loadingPresupuestos ? (
                <p className="py-8 text-center text-muted-foreground animate-pulse">Cargando tus tratamientos y presupuestos...</p>
              ) : presupuestos.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <Euro className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No hay presupuestos registrados</h3>
                  <p className="text-muted-foreground mt-1">Aquí verás los presupuestos y planes de tratamiento de la clínica.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {presupuestos.map((b: any) => (
                    <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-border rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div>
                        <span className="font-bold text-xl text-primary">{b.total} €</span>
                        <p className="text-sm mt-2 text-slate-700">{b.notas}</p>
                        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                          <CalendarCheck className="size-3" />
                          Emitido el {formatDate(b.fecha)}
                        </p>
                      </div>
                      <div className="mt-4 sm:mt-0 shrink-0">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${b.estado === 'Aceptado' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                          {b.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
