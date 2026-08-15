import { supabase } from "@/integrations/supabase/client";

export type InvoiceEstado = "Emitida" | "Pagada" | "Anulada";

export type InvoiceItem = {
  id?: string;
  invoice_id?: string;
  concepto: string;
  descripcion: string | null;
  cantidad: number;
  precio: number;
  descuento: number;
};

export type Invoice = {
  id: string;
  patient_id: string;
  budget_id: string | null;
  numero: string | null;
  fecha: string;
  vencimiento: string | null;
  cliente_nombre: string;
  cliente_dni: string | null;
  cliente_direccion: string | null;
  cliente_ciudad: string | null;
  cliente_cp: string | null;
  cliente_email: string | null;
  cliente_telefono: string | null;
  subtotal: number;
  descuento: number;
  iva_porcentaje: number;
  iva_importe: number;
  total: number;
  estado: InvoiceEstado;
  metodo_pago: string;
  notas: string | null;
  invoice_items: InvoiceItem[];
};

export type InvoiceDraft = {
  id?: string | undefined;
  patient_id: string;
  budget_id: string | null;
  numero: string | null;
  fecha: string;
  vencimiento: string | null;
  cliente_nombre: string;
  cliente_dni: string | null;
  cliente_direccion: string | null;
  cliente_ciudad: string | null;
  cliente_cp: string | null;
  cliente_email: string | null;
  cliente_telefono: string | null;
  descuento: number;
  iva_porcentaje: number;
  estado: InvoiceEstado;
  metodo_pago: string;
  notas: string | null;
  items: InvoiceItem[];
};

const db = supabase as any;

export function formatMoney(value: number | string | null | undefined) {
  const n = Number(value) || 0;
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export function lineSubtotal(i: Pick<InvoiceItem, "cantidad" | "precio">) {
  return (Number(i.cantidad) || 0) * (Number(i.precio) || 0);
}

export function computeInvoiceTotals(items: InvoiceItem[], descuentoGlobal = 0, ivaPorcentaje = 0) {
  const bruto = items.reduce((acc, i) => acc + lineSubtotal(i), 0);
  const descuentoLineas = items.reduce((acc, i) => acc + (Number(i.descuento) || 0), 0);
  const descuento = descuentoLineas + (Number(descuentoGlobal) || 0);
  const subtotal = Math.max(bruto - descuento, 0);
  const ivaImporte = subtotal * ((Number(ivaPorcentaje) || 0) / 100);
  return { bruto, descuentoLineas, descuento, subtotal, ivaImporte, total: subtotal + ivaImporte };
}

export async function listInvoices(): Promise<Invoice[]> {
  const { data, error } = await db
    .from("invoices")
    .select("*, invoice_items(*)")
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((r: any) => ({ ...r, invoice_items: r.invoice_items || [] }));
}

export async function listPatientInvoices(patientId: string): Promise<Invoice[]> {
  const { data, error } = await db
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("patient_id", patientId)
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((r: any) => ({ ...r, invoice_items: r.invoice_items || [] }));
}

/** Busca un presupuesto por su número de referencia (o id) y devuelve un borrador de factura ya relleno. */
export async function draftFromBudget(ref: string): Promise<InvoiceDraft> {
  const clean = ref.trim();
  const isUuid = /^[0-9a-f-]{36}$/i.test(clean);
  const query = db.from("budgets").select("*, budget_items(*), patients(*)");
  const { data, error } = isUuid
    ? await query.eq("id", clean).maybeSingle()
    : await query.ilike("numero", clean).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`No se encontró ningún presupuesto con la referencia "${clean}".`);
  if (data.estado !== "Aceptado") {
    throw new Error("Solo se pueden facturar presupuestos aceptados por el paciente.");
  }
  return budgetToDraft(data);
}

export function budgetToDraft(budget: any): InvoiceDraft {
  const p = budget.patients || {};
  const today = new Date().toISOString().slice(0, 10);
  return {
    patient_id: budget.patient_id,
    budget_id: budget.id,
    numero: null,
    fecha: today,
    vencimiento: null,
    cliente_nombre: p.nombre || budget.firma_nombre || "",
    cliente_dni: p.dni || budget.firma_dni || null,
    cliente_direccion: p.direccion || null,
    cliente_ciudad: p.ciudad || null,
    cliente_cp: p.codigo_postal || null,
    cliente_email: p.email || null,
    cliente_telefono: p.telefono || null,
    descuento: Number(budget.descuento) || 0,
    iva_porcentaje: 0,
    estado: "Emitida",
    metodo_pago: "Efectivo",
    notas: budget.numero ? `Factura generada desde el presupuesto ${budget.numero}.` : null,
    items: (budget.budget_items || []).map((i: any) => ({
      concepto: i.tratamiento,
      descripcion: i.descripcion || null,
      cantidad: Number(i.cantidad) || 1,
      precio: Number(i.precio) || 0,
      descuento: Number(i.descuento) || 0,
    })),
  };
}

export async function saveInvoice(draft: InvoiceDraft): Promise<string> {
  const items = draft.items.filter((i) => i.concepto.trim() !== "");
  const { subtotal, descuento, ivaImporte, total } = computeInvoiceTotals(
    items,
    draft.descuento,
    draft.iva_porcentaje,
  );

  const payload = {
    patient_id: draft.patient_id,
    budget_id: draft.budget_id,
    fecha: draft.fecha,
    vencimiento: draft.vencimiento,
    cliente_nombre: draft.cliente_nombre,
    cliente_dni: draft.cliente_dni,
    cliente_direccion: draft.cliente_direccion,
    cliente_ciudad: draft.cliente_ciudad,
    cliente_cp: draft.cliente_cp,
    cliente_email: draft.cliente_email,
    cliente_telefono: draft.cliente_telefono,
    subtotal,
    descuento,
    iva_porcentaje: draft.iva_porcentaje || 0,
    iva_importe: ivaImporte,
    total,
    estado: draft.estado,
    metodo_pago: draft.metodo_pago,
    notas: draft.notas,
  };

  let invoiceId = draft.id;

  if (invoiceId) {
    const { error } = await db.from("invoices").update(payload).eq("id", invoiceId);
    if (error) throw new Error(error.message);
    const { error: delErr } = await db.from("invoice_items").delete().eq("invoice_id", invoiceId);
    if (delErr) throw new Error(delErr.message);
  } else {
    const numero = draft.numero || `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data, error } = await db.from("invoices").insert({ ...payload, numero }).select("id").single();
    if (error) throw new Error(error.message);
    invoiceId = data.id as string;
  }

  if (items.length > 0) {
    const { error } = await db.from("invoice_items").insert(
      items.map((i) => ({
        invoice_id: invoiceId,
        concepto: i.concepto,
        descripcion: i.descripcion || null,
        cantidad: Number(i.cantidad) || 1,
        precio: Number(i.precio) || 0,
        descuento: Number(i.descuento) || 0,
      })),
    );
    if (error) throw new Error(error.message);
  }

  return invoiceId!;
}

export async function deleteInvoice(id: string): Promise<void> {
  await db.from("invoice_items").delete().eq("invoice_id", id);
  const { error } = await db.from("invoices").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setInvoiceEstado(id: string, estado: InvoiceEstado): Promise<void> {
  const { error } = await db.from("invoices").update({ estado }).eq("id", id);
  if (error) throw new Error(error.message);
}
