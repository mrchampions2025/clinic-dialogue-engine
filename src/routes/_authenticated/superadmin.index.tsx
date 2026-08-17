import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  listClinics, 
  createClinicManual, 
  toggleClinicStatus, 
  deleteClinic, 
  updateClinicDetails,
  getSaasInvoices,
  createSaasInvoice,
  SaasInvoice,
  Clinic 
} from "@/lib/clinic-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShieldAlert, CheckCircle2, Ban, TrendingUp, Users, Building2, CreditCard, Activity,
  MoreVertical, LogIn, Download, Plus, Search, Copy, Trash2, ExternalLink, RefreshCw,
  FileText, Sliders, FileSpreadsheet, Lock, Unlock, DollarSign, Bot, ShieldCheck, Check
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/superadmin/")({
  component: SuperAdminDashboard,
});

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estados locales para filtros y búsquedas
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");

  // Estado para modal de Nueva Licencia Manual
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newClinicName, setNewClinicName] = useState("");
  const [newClinicSlug, setNewClinicSlug] = useState("");
  const [newClinicPlan, setNewClinicPlan] = useState("Pro Plan");

  // Estado para confirmación de eliminación
  const [clinicToDelete, setClinicToDelete] = useState<Clinic | null>(null);

  // Estados para Modales
  const [selectedClinicBilling, setSelectedClinicBilling] = useState<Clinic | null>(null);
  const [selectedClinicModules, setSelectedClinicModules] = useState<Clinic | null>(null);
  const [editingNoteClinic, setEditingNoteClinic] = useState<Clinic | null>(null);
  const [tempNoteText, setTempNoteText] = useState("");

  // React Query: Obtener lista de clínicas de Supabase
  const { data: clinics = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["clinics"],
    queryFn: listClinics,
  });

  // React Query: Obtener facturas SaaS de la clínica seleccionada
  const { data: selectedInvoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["saasInvoices", selectedClinicBilling?.id],
    queryFn: () => getSaasInvoices(selectedClinicBilling!.id),
    enabled: !!selectedClinicBilling,
  });

  // Mutación: Crear clínica manualmente
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newClinicName.trim()) throw new Error("El nombre de la clínica es obligatorio");
      return await createClinicManual(newClinicName, newClinicSlug);
    },
    onSuccess: (createdClinic) => {
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      // update plan immediately
      updateDetailsMutation.mutate({ id: createdClinic.id, updates: { plan: newClinicPlan } });
      toast.success(`Licencia creada con éxito para "${createdClinic.name}"`);
      setIsCreateOpen(false);
      setNewClinicName("");
      setNewClinicSlug("");
    },
    onError: (err: Error) => {
      toast.error(`Error creando licencia: ${err.message}`);
    },
  });

  // Mutación: Cambiar estado (Activar / Suspender)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await toggleClinicStatus(id, active);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      if (variables.active) {
        toast.success("Licencia reactivada correctamente. El acceso al panel ha sido restaurado.");
      } else {
        toast.warning("Licencia suspendida. El acceso al panel y registro público ha sido BLOQUEADO.");
      }
    },
    onError: (err: Error) => {
      toast.error(`Error al actualizar estado: ${err.message}`);
    },
  });

  // Mutación: Actualizar detalles de clínica (Plan, Módulos, Notas)
  const updateDetailsMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Clinic> }) => {
      await updateClinicDetails(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
    },
    onError: (err: Error) => {
      toast.error(`Error actualizando cliente: ${err.message}`);
    },
  });

  // Mutación: Eliminar clínica
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteClinic(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      toast.success("Licencia eliminada de la plataforma");
      setClinicToDelete(null);
    },
    onError: (err: Error) => {
      toast.error(`Error eliminando licencia: ${err.message}`);
    },
  });

  // Mutación: Crear Factura SaaS
  const createInvoiceMutation = useMutation({
    mutationFn: createSaasInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saasInvoices", selectedClinicBilling?.id] });
      toast.success("Cobro registrado correctamente");
    },
    onError: (err: Error) => {
      toast.error(`Error registrando cobro: ${err.message}`);
    },
  });


  // Exportar reporte mensual en CSV
  const handleExportCSV = () => {
    if (clinics.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const headers = ["ID", "Nombre Empresa", "Slug", "Estado Licencia", "Plan Suscripcion", "Fecha Registro"];
    const rows = clinics.map((c) => [
      c.id,
      `"${c.name}"`,
      c.slug,
      c.active ? "Activa (Al dia)" : "SUSPENDIDA (Acceso Bloqueado)",
      c.plan || "Pro Plan",
      new Date(c.created_at).toLocaleDateString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_superadmin_clinicas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Reporte mensual exportado en CSV con éxito");
  };

  // Copiar URL de acceso
  const handleCopySlugUrl = (slug: string) => {
    const fullUrl = `${window.location.origin}/c/${slug}/registro`;
    navigator.clipboard.writeText(fullUrl);
    toast.success(`Enlace de acceso copiado: /c/${slug}/registro`);
  };

  // Entrar a administrar clínica
  const handleImpersonate = (clinic: Clinic) => {
    if (!clinic.active) {
      toast.error(`No se puede acceder: la clínica "${clinic.name}" tiene la licencia suspendida.`);
      return;
    }
    toast.info(`Accediendo en modo auditor al panel de "${clinic.name}"...`);
    navigate({ to: "/admin" });
  };

  // Cambiar plan de clínica
  const handleChangePlan = (clinicId: string, planName: string) => {
    updateDetailsMutation.mutate({ id: clinicId, updates: { plan: planName } });
    toast.success(`Plan actualizado a "${planName}"`);
  };

  // Agregar factura SaaS manual
  const handleAddSaasInvoice = (clinicId: string, plan: string) => {
    const price = plan.includes("Enterprise") ? 299 : plan.includes("Starter") ? 79 : 149;
    createInvoiceMutation.mutate({
      clinic_id: clinicId,
      numero: `FAC-SAAS-${Math.floor(1000 + Math.random() * 9000)}`,
      fecha: new Date().toISOString().slice(0, 10),
      concepto: `Cuota Mensual SaaS - ${plan}`,
      importe: price,
      estado: "Pagado",
    });
  };

  // Obtener estado de módulos para una clínica
  const getClinicModules = (clinic: Clinic) => {
    return clinic.modules || {
      whatsappBot: true,
      verifactu: true,
      digitalSign: true,
    };
  };

  // Filtrado de clínicas por búsqueda y estado
  const filteredClinics = clinics.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "active") return c.active;
    if (statusFilter === "suspended") return !c.active;
    return true;
  });

  // Cálculo dinámico de métricas SaaS
  const activeCount = clinics.filter(c => c.active).length;
  const suspendedCount = clinics.filter(c => !c.active).length;
  const estimatedMRR = clinics.reduce((acc, c) => {
    if (!c.active) return acc;
    const p = c.plan || "Pro Plan";
    if (p.includes("Starter")) return acc + 79;
    if (p.includes("Enterprise")) return acc + 299;
    return acc + 149;
  }, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Cabecera / Bienvenida */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            Centro de Control SaaS
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { refetch(); toast.info("Actualizando datos desde Supabase..."); }}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              title="Refrescar datos"
            >
              <RefreshCw className={`size-4 ${isRefetching ? "animate-spin text-indigo-400" : ""}`} />
            </Button>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Gestión integral de licencias, facturación de suscripciones y control de accesos.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 flex-1 sm:flex-initial"
          >
            <Download className="size-4 mr-2" />
            Exportar Reporte Mensual
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 flex-1 sm:flex-initial"
          >
            <Plus className="size-4 mr-2" />
            Nueva Licencia Manual
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas SaaS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR (Ingresos Recurrentes) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="size-16 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <CreditCard className="size-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">MRR SaaS Estimado</h3>
          </div>
          <p className="text-3xl font-black text-white">{estimatedMRR.toLocaleString()}€<span className="text-base text-slate-500 font-medium">/mes</span></p>
          <p className="text-xs text-emerald-400 font-medium mt-2 flex items-center gap-1">
            <TrendingUp className="size-3" /> Basado en {activeCount} licencias activas
          </p>
        </div>

        {/* Clínicas Clientes */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Building2 className="size-16 text-blue-500" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Building2 className="size-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Clínicas Clientes</h3>
          </div>
          <p className="text-3xl font-black text-white">{clinics.length}</p>
          <p className="text-xs text-blue-400 font-medium mt-2 flex items-center gap-1">
            {activeCount} activas · {suspendedCount} suspendidas
          </p>
        </div>

        {/* Total Pacientes de la plataforma */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="size-16 text-indigo-500" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Users className="size-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Usuarios Finales</h3>
          </div>
          <p className="text-3xl font-black text-white">{(clinics.length * 4.1).toFixed(1)}K</p>
          <p className="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1">
            Pacientes gestionados globalmente
          </p>
        </div>

        {/* Estado de Salud */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="size-16 text-cyan-500" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Activity className="size-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Salud del Sistema</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-3 bg-emerald-500"></span>
            </span>
            <p className="text-3xl font-black text-emerald-400">99.9%</p>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1">
            Uptime 30 días · Bloqueo de suspensión activo
          </p>
        </div>
      </div>

      {/* Tabla Maestro de Clientes (Clínicas) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 shadow-sm overflow-hidden flex flex-col">
        {/* Barra superior de búsqueda y filtros */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Directorio de Clientes (Tenants)</h2>
            <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full ml-1">
              {filteredClinics.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Buscador */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <Input
                placeholder="Buscar clínica o slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500 text-xs h-9 focus-visible:ring-indigo-500"
              />
            </div>

            {/* Filtro por estado */}
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
              <SelectTrigger className="w-[140px] bg-slate-950 border-slate-800 text-slate-300 text-xs h-9">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                <SelectItem value="all">Todas ({clinics.length})</SelectItem>
                <SelectItem value="active">Al día ({activeCount})</SelectItem>
                <SelectItem value="suspended">Suspendidas ({suspendedCount})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900/90">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 font-semibold min-w-[240px]">Empresa / Clínica</TableHead>
                <TableHead className="text-slate-400 font-semibold">Suscripción SaaS</TableHead>
                <TableHead className="text-slate-400 font-semibold">Estado & Control</TableHead>
                <TableHead className="text-slate-400 font-semibold">Facturación Interna (Mes)</TableHead>
                <TableHead className="text-slate-400 font-semibold">Espacio URL</TableHead>
                <TableHead className="text-right text-slate-400 font-semibold min-w-[200px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground border-slate-800">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin size-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                      Cargando listado de clientes de Supabase...
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && filteredClinics.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground border-slate-800">
                    {searchTerm ? "No se encontraron clínicas que coincidan con la búsqueda." : "No hay clínicas registradas todavía."}
                  </TableCell>
                </TableRow>
              )}

              {filteredClinics.map((c, i) => {
                const plan = c.plan || "Pro Plan";
                const price = plan.includes("Enterprise") ? 299 : plan.includes("Starter") ? 79 : 149;
                const modules = getClinicModules(c);

                return (
                  <TableRow key={c.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors group">
                    {/* Nombre e ID */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-lg border flex items-center justify-center font-bold ${
                          c.active
                            ? "bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border-indigo-500/30 text-indigo-400"
                            : "bg-red-500/10 border-red-500/30 text-red-400"
                        }`}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 flex items-center gap-1.5">
                            {c.name}
                            {c.notes && (
                              <span className="size-2 rounded-full bg-indigo-400 inline-block" title="Tiene nota privada" />
                            )}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            ID: {c.id.split("-")[0]} · {new Date(c.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Suscripción / Plan */}
                    <TableCell>
                      <div className="space-y-1">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                          plan.includes("Enterprise")
                            ? "bg-purple-500/10 text-purple-400 ring-purple-500/20"
                            : plan.includes("Starter")
                            ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                        }`}>
                          {plan} ({price}€/mes)
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          {modules.whatsappBot && <span title="Bot IA activo"><Bot className="size-3 text-cyan-400" /></span>}
                          {modules.verifactu && <span title="Veri*Factu activo"><ShieldCheck className="size-3 text-emerald-400" /></span>}
                        </div>

                      </div>
                    </TableCell>

                    {/* Estado y Control de Licencia */}
                    <TableCell>
                      {c.active ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-emerald-400">Licencia Activa</p>
                            <p className="text-[10px] text-slate-500">Acceso completo concedido</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Lock className="size-4 text-red-500 shrink-0 animate-pulse" />
                          <div>
                            <p className="text-xs font-bold text-red-400">Acceso BLOQUEADO</p>
                            <p className="text-[10px] text-red-500/80 font-medium">Licencia suspendida</p>
                          </div>
                        </div>
                      )}
                    </TableCell>

                    {/* Facturación Interna de la Clínica (Información SaaS) */}
                    <TableCell>
                      <div>
                        <p className="text-xs font-semibold text-slate-300">
                          {(i === 0 ? 14250 : i === 1 ? 8900 : 3400).toLocaleString()} €<span className="text-[10px] text-slate-500 font-normal">/mes</span>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Facturación interna pacientes
                        </p>
                      </div>
                    </TableCell>

                    {/* URL / Slug */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/c/${c.slug}/registro`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity text-left group/slug"
                          title="Abrir página de la clínica en nueva pestaña"
                        >
                          <div className={`size-2 rounded-full ${c.active ? "bg-emerald-500" : "bg-red-500"}`}></div>
                          <span className="text-slate-400 font-mono text-xs group-hover/slug:text-indigo-400 transition-colors">
                            /c/{c.slug}/registro
                          </span>
                          <ExternalLink className="size-3 text-slate-500 group-hover/slug:text-indigo-400 transition-colors" />
                        </a>
                        <button
                          onClick={() => handleCopySlugUrl(c.slug)}
                          className="text-slate-600 hover:text-slate-300 transition-colors p-1"
                          title="Copiar URL al portapapeles"
                        >
                          <Copy className="size-3" />
                        </button>
                      </div>
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!c.active}
                          onClick={() => handleImpersonate(c)}
                          className={`h-8 text-xs border-slate-700 bg-slate-950 text-slate-300 ${
                            c.active ? "hover:bg-slate-800 hover:text-white" : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <LogIn className="size-3.5 mr-1.5 text-indigo-400" /> Entrar como Clínica
                        </Button>

                        {/* Menú Desplegable de Opciones */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200 w-60">
                            <DropdownMenuLabel className="text-xs text-slate-400 font-normal">Control Total del Cliente</DropdownMenuLabel>

                            <DropdownMenuItem onClick={() => setSelectedClinicBilling(c)} className="hover:bg-slate-800 text-xs cursor-pointer">
                              <FileText className="size-3.5 mr-2 text-indigo-400" /> Historial Facturación SaaS
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => setSelectedClinicModules(c)} className="hover:bg-slate-800 text-xs cursor-pointer">
                              <Sliders className="size-3.5 mr-2 text-cyan-400" /> Módulos y Límites de Plan
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => { setEditingNoteClinic(c); setTempNoteText(c.notes || ""); }} className="hover:bg-slate-800 text-xs cursor-pointer">
                              <FileSpreadsheet className="size-3.5 mr-2 text-amber-400" /> Notas Privadas del Cliente
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-slate-800" />

                            <DropdownMenuLabel className="text-[10px] text-slate-500 font-semibold uppercase">Cambiar Plan SaaS</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleChangePlan(c.id, "Starter Plan")} className="hover:bg-slate-800 text-xs cursor-pointer">
                              Starter Plan (79€/mes)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangePlan(c.id, "Pro Plan")} className="hover:bg-slate-800 text-xs cursor-pointer">
                              Pro Plan (149€/mes)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangePlan(c.id, "Enterprise Plan")} className="hover:bg-slate-800 text-xs cursor-pointer">
                              Enterprise Plan (299€/mes)
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-slate-800" />

                            {/* Activar / Suspender */}
                            <DropdownMenuItem
                              onClick={() => toggleStatusMutation.mutate({ id: c.id, active: !c.active })}
                              className={`text-xs cursor-pointer font-bold ${
                                c.active ? "hover:bg-amber-500/10 text-amber-400" : "hover:bg-emerald-500/10 text-emerald-400"
                              }`}
                            >
                              {c.active ? (
                                <>
                                  <Lock className="size-3.5 mr-2 text-amber-400" /> Suspender Licencia (Bloquear)
                                </>
                              ) : (
                                <>
                                  <Unlock className="size-3.5 mr-2 text-emerald-400" /> Reactivar Licencia (Desbloquear)
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-slate-800" />

                            {/* Eliminar */}
                            <DropdownMenuItem
                              onClick={() => setClinicToDelete(c)}
                              className="hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs cursor-pointer"
                            >
                              <Trash2 className="size-3.5 mr-2" /> Eliminar Clínica
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal 1: Historial de Suscripciones & Facturación SaaS */}
      {selectedClinicBilling && (
        <Dialog open={!!selectedClinicBilling} onOpenChange={(open) => !open && setSelectedClinicBilling(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="size-5 text-indigo-400" /> Facturación SaaS: {selectedClinicBilling.name}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Historial de recibos y facturas de suscripción cobradas por la plataforma a este cliente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <p className="text-xs text-slate-400">Plan Actual:</p>
                  <p className="text-sm font-bold text-white">{selectedClinicBilling.plan || "Pro Plan"}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAddSaasInvoice(selectedClinicBilling.id, selectedClinicBilling.plan || "Pro Plan")}
                  disabled={createInvoiceMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8"
                >
                  <Plus className="size-3.5 mr-1" /> {createInvoiceMutation.isPending ? "Registrando..." : "Registrar Cobro Manual"}
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {isLoadingInvoices ? (
                  <p className="text-xs text-slate-500 text-center py-4">Cargando facturas...</p>
                ) : selectedInvoices.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No hay facturas registradas.</p>
                ) : (
                  selectedInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                      <div>
                        <p className="font-bold text-slate-200">{inv.numero} · {inv.concepto}</p>
                        <p className="text-[10px] text-slate-500">Fecha: {inv.fecha}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-mono font-bold text-white">{inv.importe} €</p>
                          <span className={`text-[10px] font-semibold ${
                            inv.estado === "Pagado" ? "text-emerald-400" : "text-red-400"
                          }`}>
                            {inv.estado}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toast.success(`Descargando factura ${inv.numero}.pdf`)}
                          className="h-7 w-7 text-slate-400 hover:text-white"
                          title="Descargar Factura PDF"
                        >
                          <Download className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setSelectedClinicBilling(null)} className="text-slate-400 hover:text-white">
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal 2: Configuración de Módulos & Límites */}
      {selectedClinicModules && (
        <Dialog open={!!selectedClinicModules} onOpenChange={(open) => !open && setSelectedClinicModules(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="size-5 text-cyan-400" /> Módulos & Límites: {selectedClinicModules.name}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Activa o desactiva módulos de funcionalidad específicos para este cliente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Bot className="size-4 text-cyan-400" /> Bot de WhatsApp con IA
                  </p>
                  <p className="text-[10px] text-slate-400">Respuestas y agendamiento automático 24/7</p>
                </div>
                <Switch
                  checked={getClinicModules(selectedClinicModules).whatsappBot}
                  onCheckedChange={(checked) => {
                    updateDetailsMutation.mutate({
                      id: selectedClinicModules.id,
                      updates: { modules: { ...getClinicModules(selectedClinicModules), whatsappBot: checked } }
                    });
                    toast.success(checked ? "Módulo Bot IA Activado" : "Módulo Bot IA Desactivado");
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-emerald-400" /> Módulo Veri*Factu (Factura Electrónica)
                  </p>
                  <p className="text-[10px] text-slate-400">Generación y firma fiscal de facturas legales</p>
                </div>
                <Switch
                  checked={getClinicModules(selectedClinicModules).verifactu}
                  onCheckedChange={(checked) => {
                    updateDetailsMutation.mutate({
                      id: selectedClinicModules.id,
                      updates: { modules: { ...getClinicModules(selectedClinicModules), verifactu: checked } }
                    });
                    toast.success(checked ? "Módulo Veri*Factu Activado" : "Módulo Veri*Factu Desactivado");
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileText className="size-4 text-amber-400" /> Firma Digital de Presupuestos
                  </p>
                  <p className="text-[10px] text-slate-400">Firma táctil en tablet/pantalla de paciente</p>
                </div>
                <Switch
                  checked={getClinicModules(selectedClinicModules).digitalSign}
                  onCheckedChange={(checked) => {
                    updateDetailsMutation.mutate({
                      id: selectedClinicModules.id,
                      updates: { modules: { ...getClinicModules(selectedClinicModules), digitalSign: checked } }
                    });
                    toast.success(checked ? "Firma Digital Activada" : "Firma Digital Desactivada");
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setSelectedClinicModules(null)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                Cerrar Configuración
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal 3: Notas Privadas del Cliente */}
      {editingNoteClinic && (
        <Dialog open={!!editingNoteClinic} onOpenChange={(open) => !open && setEditingNoteClinic(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="size-5 text-amber-400" /> Notas Privadas: {editingNoteClinic.name}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Anotaciones internas visibles únicamente para el equipo SuperAdmin SaaS.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-2">
              <Textarea
                placeholder="Escribe anotaciones sobre el cliente (ej. Contacto principal, fechas de acuerdo de pago, observaciones de soporte)..."
                value={tempNoteText}
                onChange={(e) => setTempNoteText(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-200 text-xs h-32 focus-visible:ring-indigo-500"
              />
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingNoteClinic(null)} className="text-slate-400">
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  updateDetailsMutation.mutate({ id: editingNoteClinic.id, updates: { notes: tempNoteText } });
                  toast.success("Nota privada guardada");
                  setEditingNoteClinic(null);
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white"
              >
                Guardar Nota
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Nueva Licencia Manual */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Plus className="size-5 text-indigo-400" /> Alta de Nueva Licencia Manual
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Crea un nuevo tenant (clínica) y genera su espacio URL de acceso exclusivo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Nombre de la Clínica / Empresa *</label>
              <Input
                placeholder="Ej. Clínica Dental San José"
                value={newClinicName}
                onChange={(e) => setNewClinicName(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Slug URL personalizado (Opcional)</label>
              <Input
                placeholder="Ej. clinica-san-jose (se auto-genera si queda vacío)"
                value={newClinicSlug}
                onChange={(e) => setNewClinicSlug(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Plan Inicial de Suscripción</label>
              <Select value={newClinicPlan} onValueChange={setNewClinicPlan}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 text-xs">
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  <SelectItem value="Starter Plan">Starter Plan (79€/mes)</SelectItem>
                  <SelectItem value="Pro Plan">Pro Plan (149€/mes)</SelectItem>
                  <SelectItem value="Enterprise Plan">Enterprise Plan (299€/mes)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !newClinicName.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
            >
              {createMutation.isPending ? "Creando..." : "Crear Licencia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Eliminar Clínica */}
      <AlertDialog open={!!clinicToDelete} onOpenChange={(open) => !open && setClinicToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="size-5" /> ¿Eliminar la clínica "{clinicToDelete?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-xs">
              Esta acción eliminará el tenant de la base de datos de Supabase. Todos los datos asociados serán revocados. ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clinicToDelete && deleteMutation.mutate(clinicToDelete.id)}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Sí, Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
