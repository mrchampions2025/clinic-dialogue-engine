import { supabase } from "@/integrations/supabase/client";
import { calculateInvoiceSHA256, generateAEATQRUrl, INITIAL_SIF_HASH } from "./verifactu";
import { logSIFEvent } from "./sif-event-logger";

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
  modo_facturacion?: "no_verifactu" | "verifactu";
  fabricante_nombre?: string;
  nif_fabricante?: string;
  software_nombre?: string;
  software_version?: string;
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
    modo_facturacion: "no_verifactu",
    fabricante_nombre: "Clinic Dialogue Engine S.L.",
    nif_fabricante: "B87654321",
    software_nombre: "Clinic Dialogue Engine SIF",
    software_version: "v2.4.0-2027",
  };
}

export async function updateClinicSettings(settings: Partial<ClinicSettings>): Promise<void> {
  const current = await getClinicSettings();
  const oldMode = current.modo_facturacion;

  if (current.id) {
    const { error } = await db.from("clinic_settings").update({ ...settings, updated_at: new Date().toISOString() }).eq("id", current.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await db.from("clinic_settings").insert(settings);
    if (error) throw new Error(error.message);
  }

  if (settings.modo_facturacion && settings.modo_facturacion !== oldMode) {
    await logSIFEvent("CAMBIO_MODO_SIF", {
      modo_anterior: oldMode,
      nuevo_modo: settings.modo_facturacion,
      motivo: "Actualización de configuración de SIF Veri*factu",
    });
  } else {
    await logSIFEvent("CONFIGURACION_EMISOR", {
      cambios: settings,
    });
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
    modo: clinic.modo_facturacion || "no_verifactu",
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

  // Registrar Evento SIF
  await logSIFEvent("ALTA_FACTURA", {
    invoice_id: newInvoice.id,
    numero,
    total,
    hash_actual: hashActual,
    modo: clinic.modo_facturacion || "no_verifactu",
  });

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
    modo: clinic.modo_facturacion || "no_verifactu",
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

  // Registrar Evento SIF de Rectificación y Anulación
  await logSIFEvent("RECTIFICACION_FACTURA", {
    rectificativa_id: rectInvoice.id,
    original_id: originalInvoiceId,
    original_numero: original.numero,
    numero_rectificativa: numero,
    motivo,
    hash_actual: hashActual,
  });

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

/**
 * Exporta las facturas en formato CSV oficial Libro Registro de Facturas Emitidas AEAT
 */
export function exportInvoicesToCSV(invoices: Invoice[]): void {
  const headers = [
    "Numero_Factura",
    "Tipo_Factura",
    "Fecha_Expedicion",
    "Ejercicio",
    "NIF_Emisor",
    "Razon_Social_Emisor",
    "NIF_Cliente",
    "Nombre_Cliente",
    "Base_Imponible_EUR",
    "Porcentaje_IVA",
    "Cuota_IVA_EUR",
    "Total_Factura_EUR",
    "Exenta_IVA",
    "Motivo_Exencion",
    "Huella_SHA256_SIF",
    "Huella_Anterior_SHA256",
    "Estado",
  ];

  const rows = invoices.map((inv) => {
    const dateFormatted = inv.fecha_expedicion ? new Date(inv.fecha_expedicion).toLocaleDateString("es-ES") : "—";
    return [
      `"${inv.numero || ""}"`,
      `"${inv.tipo === "rectificativa" ? "RECTIFICATIVA (R1)" : "ORDINARIA (F1)"}"`,
      `"${dateFormatted}"`,
      `"${inv.ejercicio || new Date().getFullYear()}"`,
      `"${inv.emisor_nif || ""}"`,
      `"${inv.emisor_nombre || ""}"`,
      `"${inv.receptor_nif || ""}"`,
      `"${inv.receptor_nombre || ""}"`,
      `"${(Number(inv.subtotal) || 0).toFixed(2)}"`,
      `"${(Number(inv.iva_porcentaje) || 0).toFixed(2)}"`,
      `"${(Number(inv.iva_importe) || 0).toFixed(2)}"`,
      `"${(Number(inv.total) || 0).toFixed(2)}"`,
      `"${inv.exento_iva ? "SI" : "NO"}"`,
      `"${inv.motivo_exencion || ""}"`,
      `"${inv.hash_actual || ""}"`,
      `"${inv.hash_anterior || ""}"`,
      `"${inv.estado || "emitida"}"`,
    ].join(";");
  });

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Libro_Registro_Facturas_AEAT_${new Date().getFullYear()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  logSIFEvent("EXPORTACION_LIBRO_AEAT", {
    formato: "CSV",
    total_registros: invoices.length,
  });
}

/**
 * Exporta las facturas en formato JSON estructurado oficial SIF AEAT (RD 1007/2023)
 */
export function exportInvoicesToJSON_AEAT(invoices: Invoice[], clinic?: ClinicSettings): void {
  const sifExportObject = {
    cabecera: {
      remite: {
        nif: clinic?.cif_nif || "B12345678",
        nombre: clinic?.razon_social || "Clínica Dental Dentix",
      },
      software: {
        nombre: clinic?.software_nombre || "Clinic Dialogue Engine SIF",
        version: clinic?.software_version || "v2.4.0-2027",
        fabricanteNif: clinic?.nif_fabricante || "B87654321",
      },
      modoOperacion: clinic?.modo_facturacion || "no_verifactu",
      fechaGeneracion: new Date().toISOString(),
      reglamento: "RD 1007/2023 - Orden HAC/1177/2024",
    },
    registrosFacturacion: invoices.map((inv) => ({
      IDFactura: {
        IDEmisorFactura: inv.emisor_nif,
        NumSerieFactura: inv.numero,
        FechaExpedicionFactura: inv.fecha_expedicion ? new Date(inv.fecha_expedicion).toLocaleDateString("es-ES") : "",
      },
      TipoFactura: inv.tipo === "rectificativa" ? "R1" : "F1",
      DatosReceptor: {
        NombreRazon: inv.receptor_nombre,
        NIF: inv.receptor_nif || "",
      },
      DesgloseFactura: {
        BaseImponible: Number(inv.subtotal) || 0,
        TipoImpositivo: Number(inv.iva_porcentaje) || 0,
        CuotaRepercutida: Number(inv.iva_importe) || 0,
        ImporteTotal: Number(inv.total) || 0,
        Exencion: inv.exento_iva ? { causa: inv.motivo_exencion } : null,
      },
      TrazabilidadSIF: {
        HuellaAnterior: inv.hash_anterior,
        HuellaActual: inv.hash_actual,
        CodigoQRData: inv.qr_data,
      },
      Estado: inv.estado,
    })),
  };

  const jsonContent = JSON.stringify(sifExportObject, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Libro_Registro_SIF_AEAT_${new Date().getFullYear()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  logSIFEvent("EXPORTACION_LIBRO_AEAT", {
    formato: "JSON_SIF",
    total_registros: invoices.length,
  });
}
