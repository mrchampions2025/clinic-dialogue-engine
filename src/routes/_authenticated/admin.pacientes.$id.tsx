import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listPatients } from "@/lib/clinic-data";
import { AdminShell } from "@/components/admin/AdminShell";
import { Odontograma, ToothState, ToothRecord } from "@/components/admin/Odontograma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Activity, Euro, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate } from "@/lib/clinic-data";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/pacientes/$id")({
  component: PatientDetailPage,
});

function PatientDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  // Obtener paciente
  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  // Obtener Odontograma
  const { data: odontogramData = [], isLoading: loadingOdontogram } = useQuery({
    queryKey: ["odontogram", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("odontogram_states" as any).select("*").eq("patient_id", id);
      if (error && error.code !== '42P01') { // Ignorar error si la tabla no existe aún
        console.error(error);
        return [];
      }
      return (data as ToothRecord[]) || [];
    },
  });

  // Obtener Historial Médico
  const { data: medicalRecords = [], isLoading: loadingMedical } = useQuery({
    queryKey: ["medical_records", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("medical_records" as any).select("*").eq("patient_id", id).order("fecha", { ascending: false });
      if (error && error.code !== '42P01') {
        console.error(error);
        return [];
      }
      return data || [];
    },
  });

  // Obtener Presupuestos
  const { data: budgets = [], isLoading: loadingBudgets } = useQuery({
    queryKey: ["patient_budgets", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets" as any)
        .select("*, budget_items(*)")
        .eq("patient_id", id)
        .order("fecha", { ascending: false });
      if (error && error.code !== '42P01') {
        console.error(error);
        return [];
      }
      return data || [];
    },
  });

  // Mutación para crear Presupuesto
  const [openBudget, setOpenBudget] = useState(false);
  const [budgetNotes, setBudgetNotes] = useState("");
  const [budgetItems, setBudgetItems] = useState([{ tratamiento: "", cantidad: 1, precio: 0 }]);

  const budgetTotalComputed = budgetItems.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);

  const createBudget = useMutation({
    mutationFn: async () => {
      // 1. Insert budget
      const { data: budgetData, error: budgetError } = await supabase.from("budgets" as any).insert({
        patient_id: id,
        total: budgetTotalComputed,
        notas: budgetNotes,
        estado: "Pendiente"
      }).select().single();
      if (budgetError) throw new Error(budgetError.message);

      // 2. Insert items
      const itemsToInsert = budgetItems.filter(i => i.tratamiento.trim() !== "").map(i => ({
        budget_id: budgetData.id,
        tratamiento: i.tratamiento,
        cantidad: i.cantidad,
        precio: i.precio
      }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from("budget_items" as any).insert(itemsToInsert);
        if (itemsError) throw new Error(itemsError.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient_budgets", id] });
      toast.success("Presupuesto creado");
      setOpenBudget(false);
      setBudgetItems([{ tratamiento: "", cantidad: 1, precio: 0 }]);
      setBudgetNotes("");
    },
    onError: (e: any) => toast.error(e.message)
  });

  const updateBudgetStatus = useMutation({
    mutationFn: async ({ budgetId, status }: { budgetId: string, status: string }) => {
      const { error } = await supabase.from("budgets" as any).update({ estado: status }).eq("id", budgetId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient_budgets", id] });
      toast.success("Estado actualizado");
    }
  });

  // Mutación para actualizar Odontograma
  const updateTooth = useMutation({
    mutationFn: async ({ tooth_number, state, notes }: { tooth_number: number, state: ToothState, notes: string }) => {
      // Upsert
      const { error } = await supabase.from("odontogram_states" as any).upsert({
        patient_id: id,
        tooth_number,
        state,
        notes,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'patient_id, tooth_number' });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["odontogram", id] });
      toast.success("Odontograma actualizado");
    },
    onError: (e: any) => {
      if (e.message.includes("does not exist")) {
        toast.error("Debes crear las tablas SQL primero (ver documentación).");
      } else {
        toast.error(e.message);
      }
    }
  });

  if (loadingPatient) return <AdminShell title="Cargando..." subtitle=""><p>Cargando información...</p></AdminShell>;
  if (!patient) return <AdminShell title="Error" subtitle=""><p>Paciente no encontrado</p></AdminShell>;

  // Transformar lista a mapa para el componente
  const recordsMap: Record<number, ToothRecord> = {};
  odontogramData.forEach((r: any) => {
    recordsMap[r.tooth_number] = { tooth_number: r.tooth_number, state: r.state, notes: r.notes };
  });

  return (
    <AdminShell
      title={patient.nombre}
      subtitle={`Email: ${patient.email || "No registrado"} | Tel: ${patient.telefono || "No registrado"}`}
      actions={
        <Button variant="outline" asChild>
          <Link to="/admin/pacientes">
            <ArrowLeft className="size-4 mr-2" /> Volver
          </Link>
        </Button>
      }
    >
      <Tabs defaultValue="odontograma" className="w-full mt-4">
        <TabsList className="mb-4">
          <TabsTrigger value="odontograma"><Activity className="size-4 mr-2" /> Odontograma</TabsTrigger>
          <TabsTrigger value="historial"><FileText className="size-4 mr-2" /> Historial Clínico</TabsTrigger>
          <TabsTrigger value="presupuestos"><Euro className="size-4 mr-2" /> Presupuestos</TabsTrigger>
        </TabsList>

        <TabsContent value="odontograma" className="space-y-4">
          <Odontograma 
            records={recordsMap} 
            onUpdateTooth={(tooth, state, notes) => updateTooth.mutate({ tooth_number: tooth, state, notes })}
          />
        </TabsContent>

        <TabsContent value="historial">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-4">Anotaciones Médicas</h3>
            {medicalRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-xl">
                No hay registros clínicos. Ejecuta el script SQL para habilitar esta función e insertar datos.
              </p>
            ) : (
              <div className="space-y-4">
                {medicalRecords.map((record: any) => (
                  <div key={record.id} className="p-4 border border-border rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-primary">{record.tipo}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(record.fecha)}</span>
                    </div>
                    <p className="text-sm">{record.notas}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="presupuestos">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Presupuestos del Paciente</h3>
              <Dialog open={openBudget} onOpenChange={setOpenBudget}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="size-4 mr-1" /> Nuevo Presupuesto</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader><DialogTitle>Crear Nuevo Presupuesto</DialogTitle></DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div>
                      <Label className="mb-2 block">Líneas de Tratamiento</Label>
                      <div className="rounded-xl border border-border bg-slate-50/50 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tratamiento</TableHead>
                              <TableHead className="w-24">Cant.</TableHead>
                              <TableHead className="w-32">Precio Und.</TableHead>
                              <TableHead className="w-32">Subtotal</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {budgetItems.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Input 
                                    value={item.tratamiento} 
                                    onChange={(e) => {
                                      const newItems = [...budgetItems];
                                      newItems[index].tratamiento = e.target.value;
                                      setBudgetItems(newItems);
                                    }} 
                                    placeholder="Ej: Corona Zirconio" 
                                    className="bg-background"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input 
                                    type="number" 
                                    min="1"
                                    value={item.cantidad} 
                                    onChange={(e) => {
                                      const newItems = [...budgetItems];
                                      newItems[index].cantidad = Number(e.target.value);
                                      setBudgetItems(newItems);
                                    }} 
                                    className="bg-background"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input 
                                    type="number" 
                                    value={item.precio} 
                                    onChange={(e) => {
                                      const newItems = [...budgetItems];
                                      newItems[index].precio = Number(e.target.value);
                                      setBudgetItems(newItems);
                                    }} 
                                    className="bg-background"
                                  />
                                </TableCell>
                                <TableCell className="font-medium text-slate-700">
                                  {(item.cantidad * item.precio).toFixed(2)} €
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive"
                                    onClick={() => {
                                      if (budgetItems.length > 1) {
                                        setBudgetItems(budgetItems.filter((_, i) => i !== index));
                                      }
                                    }}
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => setBudgetItems([...budgetItems, { tratamiento: "", cantidad: 1, precio: 0 }])}
                      >
                        <Plus className="size-4 mr-1" /> Añadir Línea
                      </Button>
                    </div>

                    <div className="grid gap-2">
                      <Label>Notas Adicionales</Label>
                      <Textarea value={budgetNotes} onChange={e => setBudgetNotes(e.target.value)} placeholder="Condiciones, descuentos especiales..." />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Total Presupuesto</p>
                        <p className="text-3xl font-bold text-primary">{budgetTotalComputed.toFixed(2)} €</p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => createBudget.mutate()} disabled={createBudget.isPending || budgetItems.length === 0}>
                      Generar Presupuesto
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-xl bg-slate-50/50">
                No hay presupuestos registrados para este paciente.
              </p>
            ) : (
              <div className="space-y-6">
                {budgets.map((b: any) => (
                  <div key={b.id} className="border border-border rounded-xl bg-card overflow-hidden shadow-sm transition-all hover:shadow-md">
                    {/* Cabecera del Presupuesto */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-border bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-xl text-primary">{b.total} €</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold 
                            ${b.estado === 'Aceptado' ? 'bg-green-100 text-green-700' : 
                              b.estado === 'Rechazado' ? 'bg-red-100 text-red-700' : 
                              'bg-purple-100 text-purple-700'}`}>
                            {b.estado}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">Emitido: {formatDate(b.fecha)}</p>
                      </div>
                      
                      {b.estado === 'Pendiente' && (
                        <div className="flex items-center gap-2 mt-4 sm:mt-0">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => updateBudgetStatus.mutate({ budgetId: b.id, status: 'Aceptado' })}
                          >
                            <CheckCircle2 className="size-4 mr-1.5" /> Aceptar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => updateBudgetStatus.mutate({ budgetId: b.id, status: 'Rechazado' })}
                          >
                            <XCircle className="size-4 mr-1.5" /> Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Cuerpo del Presupuesto (Line Items) */}
                    <div className="p-5">
                      {b.budget_items && b.budget_items.length > 0 ? (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-slate-700 mb-2">Tratamientos Incluidos</p>
                          <ul className="space-y-2">
                            {b.budget_items.map((item: any) => (
                              <li key={item.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 last:border-0">
                                <div>
                                  <span className="font-medium">{item.tratamiento}</span>
                                  <span className="text-muted-foreground ml-2">x{item.cantidad}</span>
                                </div>
                                <span className="font-medium text-slate-600">{(item.cantidad * item.precio).toFixed(2)} €</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic mb-4">No hay líneas de detalle.</p>
                      )}
                      
                      {b.notas && (
                        <div className="mt-4 p-3 bg-yellow-50/50 rounded-lg border border-yellow-100">
                          <p className="text-xs font-semibold text-yellow-800 mb-1">Notas</p>
                          <p className="text-sm text-slate-700">{b.notas}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
