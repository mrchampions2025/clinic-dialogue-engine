import { supabase } from "@/integrations/supabase/client";

export type BudgetEstado = "Borrador" | "Pendiente" | "Aceptado" | "Rechazado";

export type BudgetItem = {
  id?: string;
  budget_id?: string;
  tratamiento: string;
  descripcion: string | null;
  cantidad: number;
  precio: number;
  descuento: number;
};

export type Budget = {
  id: string;
  patient_id: string;
  numero: string | null;
  titulo: string;
  fecha: string;
  valido_hasta: string | null;
  estado: BudgetEstado;
  total: number;
  descuento: number;
  notas: string | null;
  condiciones: string | null;
  firma_nombre: string | null;
  firma_dni: string | null;
  firma_data: string | null;
  firmado_at: string | null;
  rechazado_at: string | null;
  budget_items: BudgetItem[];
};

const db = supabase as any;

export function lineSubtotal(i: Pick<BudgetItem, "cantidad" | "precio">) {
  return (Number(i.cantidad) || 0) * (Number(i.precio) || 0);
}

export function computeTotals(items: BudgetItem[], descuentoGlobal = 0) {
  const subtotal = items.reduce((acc, i) => acc + lineSubtotal(i), 0);
  const descuentoLineas = items.reduce((acc, i) => acc + (Number(i.descuento) || 0), 0);
  const descuento = descuentoLineas + (Number(descuentoGlobal) || 0);
  return { subtotal, descuentoLineas, descuento, total: Math.max(subtotal - descuento, 0) };
}

export function formatMoney(value: number | string | null | undefined) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export function isExpired(b: Budget) {
  return !!b.valido_hasta && b.estado === "Pendiente" && new Date(b.valido_hasta) < new Date(new Date().toDateString());
}

async function attachItems(rows: any[]): Promise<Budget[]> {
  return (rows || []).map((r) => ({ ...r, budget_items: r.budget_items || [] })) as Budget[];
}

export async function listPatientBudgets(patientId: string): Promise<Budget[]> {
  const { data, error } = await db
    .from("budgets")
    .select("*, budget_items(*)")
    .eq("patient_id", patientId)
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return attachItems(data);
}

export async function listAllBudgets(): Promise<Budget[]> {
  const { data, error } = await db
    .from("budgets")
    .select("*, budget_items(*)")
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return attachItems(data);
}

export type BudgetDraft = {
  id?: string;
  patient_id: string;
  titulo: string;
  fecha: string;
  valido_hasta: string | null;
  descuento: number;
  notas: string | null;
  condiciones: string | null;
  estado: BudgetEstado;
  items: BudgetItem[];
};

export async function saveBudget(draft: BudgetDraft): Promise<string> {
  const items = draft.items.filter((i) => i.tratamiento.trim() !== "");
  const { total } = computeTotals(items, draft.descuento);

  const payload = {
    patient_id: draft.patient_id,
    titulo: draft.titulo || "Plan de tratamiento",
    fecha: draft.fecha,
    valido_hasta: draft.valido_hasta,
    descuento: draft.descuento || 0,
    notas: draft.notas,
    condiciones: draft.condiciones,
    estado: draft.estado,
    total,
  };

  let budgetId = draft.id;

  if (budgetId) {
    const { error } = await db.from("budgets").update(payload).eq("id", budgetId);
    if (error) throw new Error(error.message);
    const { error: delErr } = await db.from("budget_items").delete().eq("budget_id", budgetId);
    if (delErr) throw new Error(delErr.message);
  } else {
    const numero = `PRE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data, error } = await db.from("budgets").insert({ ...payload, numero }).select("id").single();
    if (error) throw new Error(error.message);
    budgetId = data.id as string;
  }

  if (items.length > 0) {
    const { error } = await db.from("budget_items").insert(
      items.map((i) => ({
        budget_id: budgetId,
        tratamiento: i.tratamiento,
        descripcion: i.descripcion || null,
        cantidad: Number(i.cantidad) || 1,
        precio: Number(i.precio) || 0,
        descuento: Number(i.descuento) || 0,
      })),
    );
    if (error) throw new Error(error.message);
  }

  return budgetId!;
}

export async function deleteBudget(id: string): Promise<void> {
  await db.from("budget_items").delete().eq("budget_id", id);
  const { error } = await db.from("budgets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setBudgetEstado(id: string, estado: BudgetEstado): Promise<void> {
  const { error } = await db.from("budgets").update({ estado }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function signBudget(args: {
  id: string;
  nombre: string;
  dni: string;
  firma: string;
}): Promise<void> {
  const { error } = await db
    .from("budgets")
    .update({
      estado: "Aceptado",
      firma_nombre: args.nombre,
      firma_dni: args.dni,
      firma_data: args.firma,
      firmado_at: new Date().toISOString(),
      rechazado_at: null,
    })
    .eq("id", args.id);
  if (error) throw new Error(error.message);
}

export async function rejectBudget(id: string): Promise<void> {
  const { error } = await db
    .from("budgets")
    .update({ estado: "Rechazado", rechazado_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
