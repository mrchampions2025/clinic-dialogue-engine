import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Odontograma, ToothState, ToothRecord } from "@/components/admin/Odontograma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Activity, Euro, Plus, Pencil, Send, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate } from "@/lib/clinic-data";
import { useState } from "react";
import { BudgetDocument } from "@/components/budgets/BudgetDocument";
import { BudgetEditorDialog } from "@/components/budgets/BudgetEditorDialog";
import { BudgetInvoice } from "@/components/admin/BudgetInvoice";
import {
  Budget,
  BudgetEstado,
  deleteBudget,
  formatMoney,
  listPatientBudgets,
  setBudgetEstado,
} from "@/lib/budgets";
import { createInvoiceFromBudget, listInvoices, Invoice } from "@/lib/invoices";
import { InvoicePDFDocument } from "@/components/invoices/InvoicePDFDocument";


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
      return (data as unknown as ToothRecord[]) || [];
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

  // Presupuestos
  const { data: budgets = [] } = useQuery({
    queryKey: ["patient_budgets", id],
    queryFn: () => listPatientBudgets(id),
  });

  // Facturas del paciente
  const { data: patientInvoices = [] } = useQuery({
    queryKey: ["patient_invoices", id],
    queryFn: () => listInvoices(id),
  });

  const [openBudget, setOpenBudget] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [selectedBudgetForPrint, setSelectedBudgetForPrint] = useState<any | null>(null);
  const [selectedInvoiceForPDF, setSelectedInvoiceForPDF] = useState<Invoice | null>(null);

  const emitInvoiceMutation = useMutation({
    mutationFn: (budgetId: string) => createInvoiceFromBudget(budgetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient_invoices", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Factura oficial SIF emitida con éxito");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeBudget = useMutation({
    mutationFn: (budgetId: string) => deleteBudget(budgetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient_budgets", id] });
      toast.success("Presupuesto eliminado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const changeEstado = useMutation({
    mutationFn: ({ budgetId, estado }: { budgetId: string; estado: BudgetEstado }) => setBudgetEstado(budgetId, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient_budgets", id] });
      toast.success("Estado actualizado");
    },
    onError: (e: any) => toast.error(e.message),
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
          <TabsTrigger value="facturas"><Receipt className="size-4 mr-2" /> Facturas SIF ({patientInvoices.length})</TabsTrigger>
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

        <TabsContent value="presupuestos" className="space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-medium">Presupuestos del paciente</h3>
              <p className="text-sm text-muted-foreground">
                {budgets.length} documento(s) · {budgets.filter((b) => b.estado === "Aceptado").length} aceptado(s) ·
                {" "}
                {formatMoney(
                  budgets.filter((b) => b.estado === "Aceptado").reduce((a, b) => a + Number(b.total), 0),
                )}{" "}
                aceptados
              </p>
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setOpenBudget(true);
              }}
            >
              <Plus className="mr-1 size-4" /> Nuevo presupuesto
            </Button>
          </div>

          {budgets.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              Este paciente todavía no tiene presupuestos.
            </p>
          ) : (
            <div className="space-y-6">
              {budgets.map((b) => (
                <div key={b.id} className="space-y-3">
                  <BudgetDocument budget={b} />
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setSelectedBudgetForPrint(b)}
                    >
                      <FileText className="size-4 mr-1.5" /> Ver Vista Previa
                    </Button>
                    {b.estado === "Aceptado" && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                        onClick={() => navigate({ to: "/admin/facturacion", search: { fromBudget: b.id } as any })}
                      >
                        <Receipt className="mr-1.5 size-4" />
                        Emitir Factura SIF
                      </Button>
                    )}
                    {b.estado !== "Aceptado" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(b);
                          setOpenBudget(true);
                        }}
                      >
                        <Pencil className="mr-1.5 size-4" /> Editar
                      </Button>
                    )}
                    {b.estado === "Borrador" && (
                      <Button size="sm" onClick={() => changeEstado.mutate({ budgetId: b.id, estado: "Pendiente" })}>
                        <Send className="mr-1.5 size-4" /> Enviar al paciente
                      </Button>
                    )}
                    {b.estado === "Rechazado" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changeEstado.mutate({ budgetId: b.id, estado: "Pendiente" })}
                      >
                        Reabrir
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm("¿Eliminar este presupuesto?")) removeBudget.mutate(b.id);
                      }}
                    >
                      <Trash2 className="mr-1.5 size-4" /> Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {openBudget && (
            <BudgetEditorDialog
              key={editing?.id ?? "new"}
              patientId={id}
              budget={editing}
              open={openBudget}
              onOpenChange={setOpenBudget}
            />
          )}
        </TabsContent>

        <TabsContent value="facturas" className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="text-lg font-medium mb-1">Facturas Oficiales SIF</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Registros fiscales inalterables con huella digital SHA-256 y código QR oficial RD 1007/2023.
            </p>

            {patientInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10 border border-dashed rounded-xl">
                No hay facturas emitidas para este paciente. Genera una factura aceptando un presupuesto o emitiéndola desde el panel de Facturación.
              </p>
            ) : (
              <div className="space-y-3">
                {patientInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/40 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{inv.numero}</span>
                        <span className="text-xs text-muted-foreground">({formatDate(inv.fecha_expedicion)})</span>
                        <span className="text-xs font-mono uppercase bg-muted px-2 py-0.5 rounded border border-border">
                          {inv.tipo}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        Huella SHA-256: {inv.hash_actual.slice(0, 16)}...
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-bold text-base">{formatMoney(inv.total)}</span>
                      <Button size="sm" variant="outline" onClick={() => setSelectedInvoiceForPDF(inv)}>
                        <FileText className="size-4 mr-1.5" /> Ver PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedBudgetForPrint && (
        <BudgetInvoice 
          budget={selectedBudgetForPrint} 
          patient={patient} 
          onClose={() => setSelectedBudgetForPrint(null)} 
        />
      )}

      {selectedInvoiceForPDF && (
        <InvoicePDFDocument
          invoice={selectedInvoiceForPDF}
          onClose={() => setSelectedInvoiceForPDF(null)}
        />
      )}
    </AdminShell>
  );
}
