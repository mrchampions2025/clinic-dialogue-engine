import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { BudgetInvoice } from "@/components/admin/BudgetInvoice";
import { Odontograma, ToothState, ToothRecord } from "@/components/admin/Odontograma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Activity, Euro, Plus, Pencil, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate } from "@/lib/clinic-data";
import { useState } from "react";
import { BudgetDocument } from "@/components/budgets/BudgetDocument";
import { BudgetEditorDialog } from "@/components/budgets/BudgetEditorDialog";
import {
  Budget,
  BudgetEstado,
  deleteBudget,
  formatMoney,
  listPatientBudgets,
  setBudgetEstado,
} from "@/lib/budgets";


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

  const [openBudget, setOpenBudget] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [selectedBudgetForPrint, setSelectedBudgetForPrint] = useState<any | null>(null);

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
                      <FileText className="size-4 mr-1.5" /> Ver PDF
                    </Button>
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
      </Tabs>

      {selectedBudgetForPrint && (
        <BudgetInvoice 
          budget={selectedBudgetForPrint} 
          patient={patient} 
          onClose={() => setSelectedBudgetForPrint(null)} 
        />
      )}
    </AdminShell>
  );
}
