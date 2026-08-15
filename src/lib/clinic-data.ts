import { supabase } from "@/integrations/supabase/client";

export type Estado = "Pendiente" | "Confirmada" | "Cancelada";

export type Patient = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  etiqueta: string | null;
  dni: string | null;
  direccion: string | null;
  ciudad: string | null;
  codigo_postal: string | null;
  ultima_visita: string | null;
  proxima_cita: string | null;
};

export type Appointment = {
  id: string;
  paciente: string;
  telefono: string | null;
  tratamiento: string | null;
  fecha: string;
  hora: string;
  canal: string;
  estado: Estado;
  precio?: number | null;
  pagado?: boolean;
};

export type Treatment = {
  id: string;
  nombre: string;
  categoria: string | null;
  precio: string | null;
  duracion: string | null;
};

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export async function getUserRole(userId: string): Promise<string | null> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  if (error) return null;
  return data?.role || null;
}

/* Pacientes */
export async function listPatients(): Promise<Patient[]> {
  return unwrap(await supabase.from("patients").select("*").order("nombre"));
}
export async function upsertPatient(p: Partial<Patient>): Promise<void> {
  const payload = {
    nombre: p.nombre ?? "",
    telefono: p.telefono || null,
    email: p.email || null,
    etiqueta: p.etiqueta || null,
    dni: p.dni || null,
    direccion: p.direccion || null,
    ciudad: p.ciudad || null,
    codigo_postal: p.codigo_postal || null,
    ultima_visita: p.ultima_visita || null,
    proxima_cita: p.proxima_cita || null,
  };
  const res = p.id
    ? await supabase.from("patients").update(payload).eq("id", p.id)
    : await supabase.from("patients").insert(payload);
  if (res.error) throw new Error(res.error.message);
}
export async function deletePatient(id: string): Promise<void> {
  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* Citas */
export async function listAppointments(): Promise<Appointment[]> {
  return unwrap(
    await supabase.from("appointments").select("*").order("fecha").order("hora"),
  ) as Appointment[];
}
export async function listUserAppointments(userId: string): Promise<Appointment[]> {
  return unwrap(
    await supabase.from("appointments").select("*").eq("patient_id", userId).order("fecha").order("hora"),
  ) as Appointment[];
}
export async function upsertAppointment(a: Partial<Appointment>): Promise<void> {
  const payload = {
    paciente: a.paciente ?? "",
    telefono: a.telefono || null,
    tratamiento: a.tratamiento || null,
    fecha: a.fecha!,
    hora: a.hora!,
    canal: a.canal || "WhatsApp IA",
    estado: a.estado || "Pendiente",
    precio: a.precio || null,
    pagado: a.pagado || false,
  };
  const res = a.id
    ? await supabase.from("appointments").update(payload).eq("id", a.id)
    : await supabase.from("appointments").insert(payload);
  if (res.error) throw new Error(res.error.message);
}
export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* Tratamientos */
export async function listTreatments(): Promise<Treatment[]> {
  return unwrap(await supabase.from("treatments").select("*").order("categoria"));
}
export async function upsertTreatment(t: Partial<Treatment>): Promise<void> {
  const payload = {
    nombre: t.nombre ?? "",
    categoria: t.categoria || null,
    precio: t.precio || null,
    duracion: t.duracion || null,
  };
  const res = t.id
    ? await supabase.from("treatments").update(payload).eq("id", t.id)
    : await supabase.from("treatments").insert(payload);
  if (res.error) throw new Error(res.error.message);
}
export async function deleteTreatment(id: string): Promise<void> {
  const { error } = await supabase.from("treatments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
export function formatTime(t: string): string {
  return t.slice(0, 5);
}

/* Finances & Budgets */
export async function listPayments(): Promise<any[]> {
  const { data, error } = await supabase.from("payments" as any).select("*");
  if (error && error.code !== "42P01") throw error;
  return data || [];
}

export async function listBudgets(): Promise<any[]> {
  const { data, error } = await supabase.from("budgets" as any).select("*");
  if (error && error.code !== "42P01") throw error;
  return data || [];
}
