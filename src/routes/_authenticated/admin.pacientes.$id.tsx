import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listPatients } from "@/lib/clinic-data";
import { AdminShell } from "@/components/admin/AdminShell";
import { Odontograma, ToothState, ToothRecord } from "@/components/admin/Odontograma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate } from "@/lib/clinic-data";

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
      </Tabs>
    </AdminShell>
  );
}
