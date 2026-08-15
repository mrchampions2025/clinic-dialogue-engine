import { supabase } from "@/integrations/supabase/client";
import { calculateInvoiceSHA256, generateAEATQRUrl, INITIAL_SIF_HASH } from "./verifactu";

const db = supabase as any;

export interface ClinicSettings {
  id?: string;
  razon_social: string;
  cif_nif: string;
  registro_sanitario: string | null;
  direccion: string;
  codigo_postal: string;
  ciudad: string;
  provincia: string;
  telefono: string | null;
  email: string | null;
  iban: string | null;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  concepto: string;
  descripcion?: string | null;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  numero: string;
  serie: string;
  ejercicio: number;
  secuencia: number;
  tipo: "ordinaria" | "rectificativa";
  fecha_expedicion: string;
  patient_id: string;
  budget_id?: string | null;
  emisor_nif: string;
  emisor_nombre: string;
  emisor_direccion: string;
  receptor_nif?: string | null;
  receptor_nombre: string;
  receptor_direccion?: string | null;
  subtotal: number;
  exento_iva: boolean;
  motivo_exencion?: string | null;
  iva_porcentaje: number;
  iva_importe: number;
  total: number;
  hash_anterior: string;
  hash_actual: string;
  qr_data: string;
  rectifica_invoice_id?: string | null;
  motivo_rectificacion?: string | null;
  estado: "emitida" | "anulada";
  created_at: string;
  invoice_items?: InvoiceItem[];
  patient?: any;
}

export async function getClinicSettings(): Promise<ClinicSettings> {
  try {
    const { data, error } = await db.from("clinic_settings").select("*").limit(1).maybeSingle();
    if (error) {
      console.warn("Tabla 'clinic_settings' no existe aún:", error.message);
    }
    if (data) return data;
  } catch (e) {
    console.warn("Excepción al cargar clinic_settings:", e);
  }
  return {
    razon_social: "Clínica Dental Dentix",
    cif_nif: "B12345678",
    registro_sanitario: "CS-12345-M",
    direccion: "Av. Principal 123",
    codigo_postal: "28000",
    ciudad: "Madrid",
    provincia: "Madrid",
    telefono: "+34 912 345 678",
    email: "info@clinicadentix.es",
    iban: "ES91 2100 0418 4502 0005 1324",
  };
}

export async function updateClinicSettings(settings: Partial<ClinicSettings>): Promise<void> {
  const current = await getClinicSettings();
  if (current.id) {
    const { error } = await db.from("clinic_settings").update({ ...settings, updated_at: new Date().toISOString() }).eq("id", current.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await db.from("clinic_settings").insert(settings);
    if (error) throw new Error(error.message);
  }
}

export async function getLastInvoiceHash(): Promise<string> {
  try {
    const { data, error } = await db.from("invoices").select("hash_actual").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error || !data) return INITIAL_SIF_HASH;
    return data.hash_actual || INITIAL_SIF_HASH;
  } catch (e) {
    return INITIAL_SIF_HASH;
  }
}

export async function getNextInvoiceSequence(tipo: "ordinaria" | "rectificativa" = "ordinaria"): Promise<{ numero: string; secuencia: number; serie: string; ejercicio: number }> {
  const ejercicio = new Date().getFullYear();
  const serie = tipo === "rectificativa" ? "REC" : "FAC";

  try {
    const { data, error } = await db
      .from("invoices")
      .select("secuencia")
      .eq("serie", serie)
      .eq("ejercicio", ejercicio)
      .order("secuencia", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSeq = (data?.secuencia || 0) + 1;
    const numero = `${serie}-${ejercicio}-${String(nextSeq).padStart(4, "0")}`;

    return { numero, secuencia: nextSeq, serie, ejercicio };
  } catch (e) {
    return { numero: `${serie}-${ejercicio}-0001`, secuencia: 1, serie, ejercicio };
  }
}

export async function createInvoiceFromBudget(
  budgetId: string,
  options: { exentoIva?: boolean; ivaPorcentaje?: number } = {}
): Promise<string> {
  const { data: budget, error: bErr } = await db.from("budgets").select("*, budget_items(*)").eq("id", budgetId).single();
  if (bErr || !budget) throw new Error("Presupuesto no encontrado");

  const { data: patient, error: pErr } = await db.from("patients").select("*").eq("id", budget.patient_id).single();
  if (pErr || !patient) throw new Error("Paciente no encontrado");

  const clinic = await getClinicSettings();

  const exentoIva = options.exentoIva ?? true;
  const ivaPorcentaje = exentoIva ? 0 : (options.ivaPorcentaje ?? 21);
  
  const subtotal = Number(budget.total) || 0;
  const ivaImporte = exentoIva ? 0 : Number((subtotal * (ivaPorcentaje / 100)).toFixed(2));
  const total = Number((subtotal + ivaImporte).toFixed(2));

  const { numero, secuencia, serie, ejercicio } = await getNextInvoiceSequence("ordinaria");
  const hashAnterior = await getLastInvoiceHash();
  const fechaExpedicion = new Date().toISOString();

  const hashActual = await calculateInvoiceSHA256({
    emisorNif: clinic.cif_nif,
    numFactura: numero,
    fechaExpedicion,
    tipoFactura: "F1",
    cuotaTotal: ivaImporte,
    importeTotal: total,
    hashAnterior,
  });

  const qrData = generateAEATQRUrl({
    emisorNif: clinic.cif_nif,
    numFactura: numero,
    fechaExpedicion,
    importeTotal: total,
    hashActual,
  });

  const { data: newInvoice, error: invErr } = await db
    .from("invoices")
    .insert({
      numero,
      serie,
      ejercicio,
      secuencia,
      tipo: "ordinaria",
      fecha_expedicion: fechaExpedicion,
      patient_id: patient.id,
      budget_id: budgetId,
      emisor_nif: clinic.cif_nif,
      emisor_nombre: clinic.razon_social,
      emisor_direccion: `${clinic.direccion}, ${clinic.codigo_postal} ${clinic.ciudad}`,
      receptor_nif: patient.dni || patient.nif || null,
      receptor_nombre: patient.nombre,
      receptor_direccion: patient.direccion || null,
      subtotal,
      exento_iva: exentoIva,
      motivo_exencion: exentoIva ? "Art. 20.Uno.3º Ley 37/1992 de IVA (Servicios Médicos/Odontológicos)" : null,
      iva_porcentaje: ivaPorcentaje,
      iva_importe: ivaImporte,
      total,
      hash_anterior: hashAnterior,
      hash_actual: hashActual,
      qr_data: qrData,
      estado: "emitida",
    })
    .select("id")
    .single();

  if (invErr) {
    if (invErr.code === "42P01" || invErr.message?.includes("does not exist")) {
      throw new Error("La tabla 'invoices' no existe en Supabase aún. Ejecuta el archivo SQL de migración en el editor de Supabase.");
    }
    throw new Error(invErr.message);
  }

  const itemsToInsert = (budget.budget_items || []).map((bi: any) => {
    const cant = Number(bi.cantidad) || 1;
    const prec = Number(bi.precio) || 0;
    const desc = Number(bi.descuento) || 0;
    const itemSubtotal = Number((cant * prec - desc).toFixed(2));

    return {
      invoice_id: newInvoice.id,
      concepto: bi.tratamiento,
      descripcion: bi.descripcion || null,
      cantidad: cant,
      precio_unitario: prec,
      descuento: desc,
      subtotal: itemSubtotal,
    };
  });

  if (itemsToInsert.length > 0) {
    const { error: itemsErr } = await db.from("invoice_items").insert(itemsToInsert);
    if (itemsErr) console.error("Error al insertar líneas de factura:", itemsErr);
  }

  return newInvoice.id;
}

export async function createRectifyingInvoice(
  originalInvoiceId: string,
  motivo: string
): Promise<string> {
  const original = await getInvoiceById(originalInvoiceId);
  if (!original) throw new Error("Factura original no encontrada");
  if (original.estado === "anulada") throw new Error("La factura ya ha sido anulada");

  const clinic = await getClinicSettings();
  const { numero, secuencia, serie, ejercicio } = await getNextInvoiceSequence("rectificativa");
  const hashAnterior = await getLastInvoiceHash();
  const fechaExpedicion = new Date().toISOString();

  const subtotal = -Math.abs(Number(original.subtotal));
  const ivaImporte = -Math.abs(Number(original.iva_importe));
  const total = -Math.abs(Number(original.total));

  const hashActual = await calculateInvoiceSHA256({
    emisorNif: clinic.cif_nif,
    numFactura: numero,
    fechaExpedicion,
    tipoFactura: "R1",
    cuotaTotal: ivaImporte,
    importeTotal: total,
    hashAnterior,
  });

  const qrData = generateAEATQRUrl({
    emisorNif: clinic.cif_nif,
    numFactura: numero,
    fechaExpedicion,
    importeTotal: total,
    hashActual,
  });

  const { data: rectInvoice, error: rectErr } = await db
    .from("invoices")
    .insert({
      numero,
      serie,
      ejercicio,
      secuencia,
      tipo: "rectificativa",
      fecha_expedicion: fechaExpedicion,
      patient_id: original.patient_id,
      budget_id: original.budget_id,
      emisor_nif: clinic.cif_nif,
      emisor_nombre: clinic.razon_social,
      emisor_direccion: `${clinic.direccion}, ${clinic.codigo_postal} ${clinic.ciudad}`,
      receptor_nif: original.receptor_nif,
      receptor_nombre: original.receptor_nombre,
      receptor_direccion: original.receptor_direccion,
      subtotal,
      exento_iva: original.exento_iva,
      motivo_exencion: original.motivo_exencion,
      iva_porcentaje: original.iva_porcentaje,
      iva_importe: ivaImporte,
      total,
      hash_anterior: hashAnterior,
      hash_actual: hashActual,
      qr_data: qrData,
      rectifica_invoice_id: originalInvoiceId,
      motivo_rectificacion: motivo,
      estado: "emitida",
    })
    .select("id")
    .single();

  if (rectErr) throw new Error(rectErr.message);

  await db.from("invoices").update({ estado: "anulada" }).eq("id", originalInvoiceId);

  if (original.invoice_items && original.invoice_items.length > 0) {
    const rectItems = original.invoice_items.map((item) => ({
      invoice_id: rectInvoice.id,
      concepto: `[RECTIFICACIÓN] ${item.concepto}`,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precio_unitario: -Math.abs(Number(item.precio_unitario)),
      descuento: -Math.abs(Number(item.descuento)),
      subtotal: -Math.abs(Number(item.subtotal)),
    }));
    await db.from("invoice_items").insert(rectItems);
  }

  return rectInvoice.id;
}

export async function listInvoices(patientId?: string): Promise<Invoice[]> {
  try {
    let query = db
      .from("invoices")
      .select("*, invoice_items(*), patient:patients(*)")
      .order("created_at", { ascending: false });

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.warn("Tabla 'invoices' no existe aún en Supabase.");
        return [];
      }
      console.error("Error al listar facturas:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Error en listInvoices:", err);
    return [];
  }
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  try {
    const { data, error } = await db
      .from("invoices")
      .select("*, invoice_items(*), patient:patients(*)")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error al obtener factura:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Error en getInvoiceById:", err);
    return null;
  }
}
