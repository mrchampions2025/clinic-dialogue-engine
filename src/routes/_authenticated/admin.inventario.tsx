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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Package, AlertTriangle, Plus, Search, ArrowUpRight, ArrowDownRight, Layers, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/inventario")({
  component: AdminInventarioPage,
});

export type InventoryItem = {
  id: string;
  clinic_id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  unit_cost: number;
  supplier?: string;
  created_at: string;
};

export function AdminInventarioPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);

  // Form states for creation
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Consumibles");
  const [newUnit, setNewUnit] = useState("Cajas");
  const [newStock, setNewStock] = useState("50");
  const [newMinStock, setNewMinStock] = useState("10");
  const [newUnitCost, setNewUnitCost] = useState("15.50");
  const [newSupplier, setNewSupplier] = useState("");

  // Adjustment states
  const [adjustType, setAdjustType] = useState<"entrada" | "salida">("entrada");
  const [adjustQty, setAdjustQty] = useState("10");
  const [adjustNotes, setAdjustNotes] = useState("");

  // Fetch Inventory Items
  const { data: items = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["inventory_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items" as any)
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data as any) || [];
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("inventory_items" as any).insert([
        {
          name: newName,
          category: newCategory,
          unit: newUnit,
          current_stock: parseFloat(newStock) || 0,
          min_stock: parseFloat(newMinStock) || 0,
          unit_cost: parseFloat(newUnitCost) || 0,
          supplier: newSupplier,
        },
      ]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Producto registrado correctamente en el inventario");
      queryClient.invalidateQueries({ queryKey: ["inventory_items"] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(`Error al registrar producto: ${err.message}`);
    },
  });

  // Adjust Mutation
  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItemForAdjust) return;
      const qty = parseFloat(adjustQty) || 0;
      const newStockVal = adjustType === "entrada" 
        ? selectedItemForAdjust.current_stock + qty
        : Math.max(0, selectedItemForAdjust.current_stock - qty);

      // Update Stock
      const { error: updateErr } = await supabase
        .from("inventory_items" as any)
        .update({ current_stock: newStockVal })
        .eq("id", selectedItemForAdjust.id);

      if (updateErr) throw updateErr;

      // Log Transaction
      await supabase.from("inventory_transactions" as any).insert([
        {
          item_id: selectedItemForAdjust.id,
          type: adjustType,
          quantity: qty,
          notes: adjustNotes,
        },
      ]);
    },
    onSuccess: () => {
      toast.success("Stock actualizado con éxito");
      queryClient.invalidateQueries({ queryKey: ["inventory_items"] });
      setSelectedItemForAdjust(null);
      setAdjustQty("10");
      setAdjustNotes("");
    },
    onError: (err: any) => {
      toast.error(`Error al ajustar el stock: ${err.message}`);
    },
  });

  const resetForm = () => {
    setNewName("");
    setNewCategory("Consumibles");
    setNewUnit("Cajas");
    setNewStock("50");
    setNewMinStock("10");
    setNewUnitCost("15.50");
    setNewSupplier("");
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = items.filter((i) => i.current_stock <= i.min_stock).length;
  const totalValue = items.reduce((acc, i) => acc + (i.current_stock * (i.unit_cost || 0)), 0);

  return (
    <AdminShell
      title="Control de Inventario y Stock"
      subtitle="Supervisa materiales, insumos médicos y alertas de reposición automática."
      actions={
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-500 text-white">
          <Plus className="size-4" /> Nuevo Producto
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <Package className="size-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Productos</p>
              <p className="text-2xl font-bold">{items.length}</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle className="size-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Stock Bajo (Requerido Reponer)</p>
              <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
              <DollarSign className="size-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Valor Estimado del Inventario</p>
              <p className="text-2xl font-bold text-emerald-600">{totalValue.toFixed(2)} €</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-card p-4 rounded-2xl border border-border">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por material o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Categorías</SelectItem>
                <SelectItem value="Consumibles">Consumibles</SelectItem>
                <SelectItem value="Anestésicos">Anestésicos</SelectItem>
                <SelectItem value="Ortodoncia">Ortodoncia</SelectItem>
                <SelectItem value="Implantes">Implantes</SelectItem>
                <SelectItem value="Protección/EPIS">Protección/EPIS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Stock Actual</th>
                  <th className="px-6 py-4">Stock Mínimo</th>
                  <th className="px-6 py-4">Coste Unitario</th>
                  <th className="px-6 py-4">Proveedor</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      Cargando inventario...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No se encontraron productos en el inventario.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLowStock = item.current_stock <= item.min_stock;
                    return (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-2">
                          {item.name}
                          {isLowStock && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                              Stock Bajo
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{item.category}</td>
                        <td className="px-6 py-4 font-bold">
                          <span className={isLowStock ? "text-red-600" : "text-foreground"}>
                            {item.current_stock}
                          </span>{" "}
                          <span className="text-xs text-muted-foreground font-normal">{item.unit}</span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{item.min_stock} {item.unit}</td>
                        <td className="px-6 py-4 font-medium">{item.unit_cost ? `${item.unit_cost.toFixed(2)} €` : "-"}</td>
                        <td className="px-6 py-4 text-muted-foreground">{item.supplier || "-"}</td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedItemForAdjust(item)}
                            className="gap-1.5 text-xs"
                          >
                            Ajustar Stock
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Product Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Material / Producto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nombre del Producto</Label>
              <Input
                placeholder="Ej. Guantes Nitrilo Talla M"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoría</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consumibles">Consumibles</SelectItem>
                    <SelectItem value="Anestésicos">Anestésicos</SelectItem>
                    <SelectItem value="Ortodoncia">Ortodoncia</SelectItem>
                    <SelectItem value="Implantes">Implantes</SelectItem>
                    <SelectItem value="Protección/EPIS">Protección/EPIS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Unidad de Medida</Label>
                <Input
                  placeholder="Cajas, Frascos, Blíster"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Stock Inicial</Label>
                <Input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Stock Mínimo</Label>
                <Input
                  type="number"
                  value={newMinStock}
                  onChange={(e) => setNewMinStock(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Coste (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newUnitCost}
                  onChange={(e) => setNewUnitCost(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Proveedor Habitual</Label>
              <Input
                placeholder="Ej. Henry Schein / DVD Dental"
                value={newSupplier}
                onChange={(e) => setNewSupplier(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !newName}>
              Guardar Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={selectedItemForAdjust !== null} onOpenChange={(open) => !open && setSelectedItemForAdjust(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Ajustar Stock: {selectedItemForAdjust?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tipo de Movimiento</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={adjustType === "entrada" ? "default" : "outline"}
                  className="gap-2 text-xs"
                  onClick={() => setAdjustType("entrada")}
                >
                  <ArrowUpRight className="size-4 text-emerald-500" /> Entrada (Compra)
                </Button>
                <Button
                  type="button"
                  variant={adjustType === "salida" ? "default" : "outline"}
                  className="gap-2 text-xs"
                  onClick={() => setAdjustType("salida")}
                >
                  <ArrowDownRight className="size-4 text-red-500" /> Salida (Uso/Consumo)
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Cantidad ({selectedItemForAdjust?.unit})</Label>
              <Input
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Notas u Observaciones</Label>
              <Input
                placeholder="Ej. Pedido mensual de reposición"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedItemForAdjust(null)}>Cancelar</Button>
            <Button onClick={() => adjustMutation.mutate()} disabled={adjustMutation.isPending}>
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
