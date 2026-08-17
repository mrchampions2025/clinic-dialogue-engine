import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, Plus, FileSpreadsheet, Building2, Phone, Mail, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/seguros")({
  component: AdminSegurosPage,
});

export type Insurance = {
  id: string;
  clinic_id: string;
  name: string;
  phone?: string;
  email?: string;
  active: boolean;
  created_at: string;
};

export type InsuranceTariff = {
  id: string;
  insurance_id: string;
  treatment_name: string;
  agreed_price: number;
  copay_patient: number;
};

export function AdminSegurosPage() {
  const queryClient = useQueryClient();
  const [isCreateInsuranceOpen, setIsCreateInsuranceOpen] = useState(false);
  const [selectedInsuranceForTariff, setSelectedInsuranceForTariff] = useState<Insurance | null>(null);

  // New Insurance form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // New Tariff form
  const [treatmentName, setTreatmentName] = useState("Limpieza Dental / Profilaxis");
  const [agreedPrice, setAgreedPrice] = useState("45.00");
  const [copayPatient, setCopayPatient] = useState("10.00");

  // Fetch Insurances
  const { data: insurances = [], isLoading } = useQuery<Insurance[]>({
    queryKey: ["insurances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurances" as any)
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data as any) || [];
    },
  });

  // Fetch Tariffs for selected insurance
  const { data: tariffs = [] } = useQuery<InsuranceTariff[]>({
    queryKey: ["insurance_tariffs", selectedInsuranceForTariff?.id],
    enabled: !!selectedInsuranceForTariff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance_tariffs" as any)
        .select("*")
        .eq("insurance_id", selectedInsuranceForTariff!.id);
      if (error) throw error;
      return (data as any) || [];
    },
  });

  // Create Insurance Mutation
  const createInsuranceMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("insurances" as any).insert([
        { name, phone, email, active: true },
      ]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Aseguradora agregada correctamente");
      queryClient.invalidateQueries({ queryKey: ["insurances"] });
      setIsCreateInsuranceOpen(false);
      setName("");
      setPhone("");
      setEmail("");
    },
    onError: (err: any) => {
      toast.error(`Error al crear aseguradora: ${err.message}`);
    },
  });

  // Create Tariff Mutation
  const createTariffMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInsuranceForTariff) return;
      const { data, error } = await supabase.from("insurance_tariffs" as any).insert([
        {
          insurance_id: selectedInsuranceForTariff.id,
          treatment_name: treatmentName,
          agreed_price: parseFloat(agreedPrice) || 0,
          copay_patient: parseFloat(copayPatient) || 0,
        },
      ]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Baremo de tarifa añadido");
      queryClient.invalidateQueries({ queryKey: ["insurance_tariffs", selectedInsuranceForTariff?.id] });
      setTreatmentName("");
      setAgreedPrice("45.00");
      setCopayPatient("10.00");
    },
    onError: (err: any) => {
      toast.error(`Error al añadir tarifa: ${err.message}`);
    },
  });

  return (
    <AdminShell
      title="Gestión de Seguros y Baremos Médicos"
      subtitle="Configura mutuas aseguradoras, baremos acordados y desglose de copagos por tratamiento."
      actions={
        <Button onClick={() => setIsCreateInsuranceOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-500 text-white">
          <Plus className="size-4" /> Añadir Aseguradora
        </Button>
      }
    >
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list" className="gap-2"><Building2 className="size-4" /> Aseguradoras Registradas</TabsTrigger>
          <TabsTrigger value="reports" className="gap-2"><FileSpreadsheet className="size-4" /> Resumen de Cobros a Mutuas</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-3 text-center py-8 text-muted-foreground">Cargando aseguradoras...</div>
            ) : insurances.length === 0 ? (
              <div className="col-span-3 text-center py-12 bg-card rounded-2xl border border-border">
                <Shield className="size-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold">No hay aseguradoras o mutuas registradas</p>
                <p className="text-xs text-muted-foreground mt-1">Registra Sanitas, Adeslas o DKV para gestionar sus tarifas acordadas.</p>
              </div>
            ) : (
              insurances.map((ins) => (
                <div key={ins.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                        <Shield className="size-5 text-blue-600" />
                        {ins.name}
                      </h4>
                      <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 text-[10px]">
                        Activa
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                      {ins.phone && <p className="flex items-center gap-2"><Phone className="size-3.5" /> {ins.phone}</p>}
                      {ins.email && <p className="flex items-center gap-2"><Mail className="size-3.5" /> {ins.email}</p>}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="mt-6 w-full text-xs gap-1.5"
                    onClick={() => setSelectedInsuranceForTariff(ins)}
                  >
                    Ver / Editar Baremos de Tarifas
                  </Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="p-8 bg-card border border-border rounded-2xl text-center space-y-3">
            <FileSpreadsheet className="size-12 text-blue-600 mx-auto" />
            <h3 className="text-lg font-bold">Informe de Facturación Mensual a Mutuas</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Descarga la liquidación consolidada con el detalle de tratamientos realizados a pacientes asegurados para enviar la factura mensual a las mutuas.
            </p>
            <Button variant="outline" className="gap-2">
              Generar Liquidación del Mes
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Insurance Dialog */}
      <Dialog open={isCreateInsuranceOpen} onOpenChange={setIsCreateInsuranceOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Añadir Nueva Aseguradora / Mutua</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nombre de la Aseguradora</Label>
              <Input
                placeholder="Ej. Sanitas Dental / Adeslas / Asisa"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Teléfono de Atención a Cuadro Médico</Label>
              <Input
                placeholder="Ej. +34 900 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Correo de Facturación</Label>
              <Input
                placeholder="facturacion@aseguradora.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateInsuranceOpen(false)}>Cancelar</Button>
            <Button onClick={() => createInsuranceMutation.mutate()} disabled={createInsuranceMutation.isPending || !name}>
              Guardar Aseguradora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Tariffs Dialog */}
      <Dialog open={selectedInsuranceForTariff !== null} onOpenChange={(open) => !open && setSelectedInsuranceForTariff(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Baremos y Tarifas: {selectedInsuranceForTariff?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Add Tariff Inline Form */}
            <div className="p-3 bg-muted/50 rounded-xl border border-border space-y-3">
              <span className="text-xs font-bold block">Añadir Nueva Tarifa Acordada</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  placeholder="Tratamiento"
                  value={treatmentName}
                  onChange={(e) => setTreatmentName(e.target.value)}
                  className="sm:col-span-3 text-xs"
                />
                <div>
                  <Label className="text-[10px]">Precio Acordado (€)</Label>
                  <Input
                    type="number"
                    value={agreedPrice}
                    onChange={(e) => setAgreedPrice(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Copago Paciente (€)</Label>
                  <Input
                    type="number"
                    value={copayPatient}
                    onChange={(e) => setCopayPatient(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    size="sm"
                    className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    onClick={() => createTariffMutation.mutate()}
                    disabled={!treatmentName}
                  >
                    Guardar Tarifa
                  </Button>
                </div>
              </div>
            </div>

            {/* List of Tariffs */}
            <div className="max-h-60 overflow-y-auto rounded-xl border border-border">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground uppercase border-b border-border">
                  <tr>
                    <th className="p-2.5">Tratamiento</th>
                    <th className="p-2.5">Precio Mutua</th>
                    <th className="p-2.5">Copago Paciente</th>
                    <th className="p-2.5">Cargo Aseguradora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tariffs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">
                        No hay tarifas personalizadas aún. Se aplicará el precio privado general.
                      </td>
                    </tr>
                  ) : (
                    tariffs.map((t) => (
                      <tr key={t.id}>
                        <td className="p-2.5 font-medium">{t.treatment_name}</td>
                        <td className="p-2.5 font-bold">{t.agreed_price.toFixed(2)} €</td>
                        <td className="p-2.5 text-blue-600 font-semibold">{t.copay_patient.toFixed(2)} €</td>
                        <td className="p-2.5 text-emerald-600 font-semibold">{(t.agreed_price - t.copay_patient).toFixed(2)} €</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedInsuranceForTariff(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
