import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { listAllBudgets, listPatientBudgets, deleteBudget, setBudgetEstado, Budget, BudgetEstado, formatMoney } from "@/lib/budgets";
import { listPatients, Patient } from "@/lib/clinic-data";
import { createInvoiceFromBudget } from "@/lib/invoices";
import { BudgetDocument } from "@/components/budgets/BudgetDocument";
import { BudgetEditorDialog } from "@/components/budgets/BudgetEditorDialog";
import { BudgetSignDialog } from "@/components/budgets/BudgetSignDialog";
import { BudgetInvoice } from "@/components/admin/BudgetInvoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Euro,
  Search,
  Plus,
  FileText,
  Receipt,
  PenTool,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Filter,
  Trash2,
  Edit,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/presupuestos")({
  component: AdminPresupuestosPage,
});

function AdminPresupuestosPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedPatientId, setSelectedPatientId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [openBudgetEditor, setOpenBudgetEditor] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [signingBudget, setSigningBudget] = useState<Budget | null>(null);
  const [selectedBudgetForPrint, setSelectedBudgetForPrint] = useState<Budget | null>(null);
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const [targetPatientForNew, setTargetPatientForNew] = useState<string>("");

  // Cargar lista de pacientes
  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => listPatients(),
  });

  // Cargar presupuestos (todos o por paciente)
  const { data: rawBudgets = [], isLoading, refetch } = useQuery({
    queryKey: ["admin_budgets", selectedPatientId],
    queryFn: () => (selectedPatientId === "all" ? listAllBudgets() : listPatientBudgets(selectedPatientId)),
  });

  // Mapa rápido paciente id -> objeto Paciente
  const patientsMap = new Map<string, Patient>(patients.map((p) => [p.id, p]));

  // Adjuntar objeto de paciente a cada presupuesto si no lo tiene
  const budgetsWithPatient = rawBudgets.map((b) => ({
    ...b,
    patient: (b as any).patient || patientsMap.get(b.patient_id),
  }));

  // Mutaciones
  const emitInvoiceMutation = useMutation({
    mutationFn: (budgetId: string) => createInvoiceFromBudget(budgetId),
    onSuccess: (invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ["admin_budgets"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Factura SIF generada e inalterada con sello SHA-256. Redirigiendo a facturación...");
      navigate({ to: "/admin/facturacion" });
    },
    onError: (err: any) => {
      toast.error(`Error al emitir factura SIF: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_budgets"] });
      toast.success("Presupuesto eliminado con éxito");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: BudgetEstado }) => setBudgetEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_budgets"] });
      toast.success("Estado del presupuesto actualizado");
    },
  });

  // Filtrado
  const filteredBudgets = budgetsWithPatient.filter((b) => {
    const query = searchTerm.toLowerCase();
    const patientName = (b.patient?.nombre || "").toLowerCase();
    const patientDni = (b.patient?.dni || "").toLowerCase();
    const num = (b.numero || "").toLowerCase();
    const title = (b.titulo || "").toLowerCase();

    const matchesSearch =
      patientName.includes(query) ||
      patientDni.includes(query) ||
      num.includes(query) ||
      title.includes(query);

    const matchesStatus =
      statusFilter === "todos" || b.estado.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // KPIs globales
  const totalCount = rawBudgets.length;
  const acceptedBudgets = rawBudgets.filter((b) => b.estado === "Aceptado");
  const acceptedTotalSum = acceptedBudgets.reduce((acc, b) => acc + Number(b.total), 0);
  const pendingCount = rawBudgets.filter((b) => b.estado === "Pendiente" || b.estado === "Borrador").length;
  const acceptanceRate = totalCount > 0 ? Math.round((acceptedBudgets.length / totalCount) * 100) : 0;

  const handleOpenCreateBudget = () => {
    if (selectedPatientId !== "all") {
      setTargetPatientForNew(selectedPatientId);
      setEditingBudget(null);
      setOpenBudgetEditor(true);
    } else if (patients.length > 0) {
      setPatientPickerOpen(true);
    } else {
      toast.error("No hay pacientes registrados en el sistema. Registra un paciente primero.");
    }
  };

  return (
    <AdminShell
      title="Gestión de Presupuestos"
      subtitle="Presupuestos y planes de tratamiento de los pacientes de la clínica"
      actions={
        <Button
          onClick={handleOpenCreateBudget}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <Plus className="mr-2 size-4" /> Nuevo Presupuesto
        </Button>
      }
    >
      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Euro className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Aceptado</p>
            <p className="text-2xl font-bold">{formatMoney(acceptedTotalSum)}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Aceptados</p>
            <p className="text-2xl font-bold">{acceptedBudgets.length} <span className="text-xs font-normal text-muted-foreground">de {totalCount}</span></p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Pendientes / Borrador</p>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <TrendingUp className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Tasa de Aceptación</p>
            <p className="text-2xl font-bold">{acceptanceRate}%</p>
          </div>
        </div>
      </div>

      {/* Controles de Selección de Paciente, Búsqueda y Filtros */}
      <div className="bg-card p-4 rounded-xl border border-border space-y-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Selector de Paciente */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Users className="size-3.5 text-primary" /> Filtrar por Paciente:
            </label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los pacientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">👥 Todos los pacientes ({patients.length})</SelectItem>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} {p.dni ? `(${p.dni})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Búsqueda por texto */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Search className="size-3.5 text-primary" /> Buscar Presupuesto:
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por Nº, título, paciente o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filtro de Estado */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Filter className="size-3.5 text-primary" /> Estado:
            </label>
            <div className="flex bg-muted p-1 rounded-lg">
              {["todos", "borrador", "pendiente", "aceptado", "rechazado"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`flex-1 text-center py-1 text-xs font-medium rounded-md capitalize transition-all ${
                    statusFilter === st ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Listado de Presupuestos usando BudgetDocument */}
      {isLoading ? (
        <p className="text-center py-12 text-muted-foreground">Cargando presupuestos de la clínica...</p>
      ) : filteredBudgets.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground space-y-4">
          <Euro className="size-12 mx-auto opacity-40 text-primary" />
          <div>
            <p className="font-semibold text-base text-foreground">No se encontraron presupuestos</p>
            <p className="text-xs max-w-md mx-auto mt-1">
              {searchTerm || statusFilter !== "todos" || selectedPatientId !== "all"
                ? "Prueba a cambiar el filtro de paciente, el estado o la búsqueda."
                : "Haz clic en 'Nuevo Presupuesto' para emitir la primera propuesta de tratamiento."}
            </p>
          </div>
          <Button onClick={handleOpenCreateBudget}>
            <Plus className="mr-1 size-4" /> Crear Presupuesto
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBudgets.map((b) => (
            <div key={b.id} className="space-y-3 bg-card p-5 rounded-2xl border border-border shadow-sm">
              {/* Cabecera del Paciente asignado al presupuesto */}
              <div className="flex justify-between items-center border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    {b.patient?.nombre ? b.patient.nombre[0].toUpperCase() : "P"}
                  </span>
                  <div>
                    <button
                      type="button"
                      className="font-bold text-sm text-foreground hover:text-primary transition-colors text-left flex items-center gap-1"
                      onClick={() => navigate({ to: `/admin/pacientes/${b.patient_id}` as any })}
                    >
                      {b.patient?.nombre || "Paciente no especificado"}
                      <ArrowRight className="size-3 text-muted-foreground" />
                    </button>
                    {b.patient?.dni && <p className="text-xs text-muted-foreground font-mono">DNI: {b.patient.dni}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Nº {b.numero || "PRE-0000"}
                  </Badge>
                </div>
              </div>

              {/* Componente Reutilizado de Presupuesto */}
              <BudgetDocument budget={b} />

              {/* Botones de Acción sobre el Presupuesto */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => {
                      setEditingBudget(b);
                      setTargetPatientForNew(b.patient_id);
                      setOpenBudgetEditor(true);
                    }}
                  >
                    <Edit className="size-3.5 mr-1" /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm("¿Seguro que deseas eliminar este presupuesto?")) {
                        deleteMutation.mutate(b.id);
                      }
                    }}
                  >
                    <Trash2 className="size-3.5 mr-1" /> Eliminar
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedBudgetForPrint(b)}
                  >
                    <FileText className="size-4 mr-1.5" /> Ver Vista Previa / PDF
                  </Button>

                  {b.estado !== "Aceptado" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSigningBudget(b)}
                    >
                      <PenTool className="size-4 mr-1.5 text-primary" /> Firmar Digitalmente
                    </Button>
                  )}

                  {b.estado === "Aceptado" && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                      onClick={() => emitInvoiceMutation.mutate(b.id)}
                      disabled={emitInvoiceMutation.isPending}
                    >
                      <Receipt className="mr-1.5 size-4" />
                      {emitInvoiceMutation.isPending ? "Generando SIF..." : "Emitir Factura SIF"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor de Presupuestos Modal */}
      {openBudgetEditor && (
        <BudgetEditorDialog
          open={openBudgetEditor}
          onOpenChange={setOpenBudgetEditor}
          patientId={targetPatientForNew}
          initial={editingBudget || undefined}
          onSaved={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin_budgets"] });
          }}
        />
      )}

      {/* Modal Firma Digital */}
      {signingBudget && (
        <BudgetSignDialog
          open={!!signingBudget}
          onOpenChange={(open) => !open && setSigningBudget(null)}
          budgetId={signingBudget.id}
          budgetNumero={signingBudget.numero || undefined}
          total={signingBudget.total}
          onSigned={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin_budgets"] });
          }}
        />
      )}

      {/* Modal Imprimir / PDF Presupuesto */}
      {selectedBudgetForPrint && (
        <BudgetInvoice
          budget={selectedBudgetForPrint}
          patient={selectedBudgetForPrint.patient}
          onClose={() => setSelectedBudgetForPrint(null)}
        />
      )}

      {/* Modal Selección de Paciente cuando se está en filtro 'Todos los pacientes' */}
      <Dialog open={patientPickerOpen} onOpenChange={setPatientPickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-5 text-primary" /> Seleccionar Paciente para el Presupuesto
            </DialogTitle>
            <DialogDescription>
              Elige el paciente de la clínica al que deseas asignar el nuevo presupuesto de tratamiento:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Select
              value={targetPatientForNew}
              onValueChange={setTargetPatientForNew}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un paciente..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} {p.dni ? `— DNI: ${p.dni}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPatientPickerOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!targetPatientForNew}
              onClick={() => {
                setPatientPickerOpen(false);
                setEditingBudget(null);
                setOpenBudgetEditor(true);
              }}
            >
              Continuar al Editor de Presupuesto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
