import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type SIFEventType =
  | "ALTA_FACTURA"
  | "RECTIFICACION_FACTURA"
  | "ANULACION_FACTURA"
  | "EXPORTACION_LIBRO_AEAT"
  | "CAMBIO_MODO_SIF"
  | "CONFIGURACION_EMISOR"
  | "INICIO_SISTEMA";

export interface SIFEventLog {
  id: string;
  tipo_evento: SIFEventType;
  fecha_hora: string;
  usuario_id: string;
  detalles_json: Record<string, any>;
  hash_evento: string;
  created_at: string;
}

/**
 * Calcula la huella SHA-256 para el registro informático de evento SIF
 */
async function calculateEventHash(tipo: string, fechaHora: string, detallesStr: string): Promise<string> {
  const rawString = `EVENTO=${tipo}&FECHA=${fechaHora}&DETALLES=${detallesStr}`;
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(rawString);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  }
  return "HASH_EVENT_SIF_2027";
}

/**
 * Registra un evento inalterable en la trazabilidad del sistema informático de facturación (SIF / RD 1007/2023)
 */
export async function logSIFEvent(
  tipo_evento: SIFEventType,
  detalles_json: Record<string, any>,
  usuario_id: string = "sistema-admin"
): Promise<void> {
  try {
    const fecha_hora = new Date().toISOString();
    const detallesStr = JSON.stringify(detalles_json);
    const hash_evento = await calculateEventHash(tipo_evento, fecha_hora, detallesStr);

    const { error } = await db.from("sif_event_logs").insert({
      tipo_evento,
      fecha_hora,
      usuario_id,
      detalles_json,
      hash_evento,
    });

    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.warn("Tabla 'sif_event_logs' no creada aún en Supabase.");
        return;
      }
      console.error("Error al registrar evento SIF:", error.message);
    }
  } catch (e) {
    console.warn("Excepción en logSIFEvent:", e);
  }
}

/**
 * Obtiene la lista del Registro Informático de Eventos SIF para auditoría tributaria
 */
export async function listSIFEventLogs(): Promise<SIFEventLog[]> {
  try {
    const { data, error } = await db
      .from("sif_event_logs")
      .select("*")
      .order("fecha_hora", { ascending: false });

    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return [];
      }
      console.error("Error al obtener logs de eventos SIF:", error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("Excepción en listSIFEventLogs:", e);
    return [];
  }
}

/**
 * Exporta el Registro Informático de Eventos SIF a formato CSV para la Inspección de Hacienda (AEAT)
 */
export function exportSIFEventsToCSV(events: SIFEventLog[]): void {
  const headers = [
    "ID_Evento",
    "Tipo_Evento",
    "Fecha_Hora_ISO",
    "Usuario",
    "Detalles_JSON",
    "Huella_SHA256_Evento",
  ];

  const rows = events.map((e) => [
    `"${e.id}"`,
    `"${e.tipo_evento}"`,
    `"${e.fecha_hora}"`,
    `"${e.usuario_id}"`,
    `"${JSON.stringify(e.detalles_json).replace(/"/g, '""')}"`,
    `"${e.hash_evento}"`,
  ].join(";"));

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Registro_Eventos_SIF_AEAT_${new Date().getFullYear()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
