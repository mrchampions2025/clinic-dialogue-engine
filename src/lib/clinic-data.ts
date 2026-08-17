import { supabase } from "@/integrations/supabase/client";
import { getClinicSettings } from "./invoices";

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

export type UserRoleData = {
  role: string | null;
  clinic_id: string | null;
  clinic_active: boolean;
  clinic_name: string | null;
  clinic_slug: string | null;
};

export async function getUserRoleData(userId: string): Promise<UserRoleData> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role, clinic_id, clinics(name, slug, active)")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return { role: null, clinic_id: null, clinic_active: true, clinic_name: null, clinic_slug: null };
  }

  const clinicInfo = (data as any).clinics;
  return {
    role: data.role || null,
    clinic_id: data.clinic_id || null,
    clinic_active: clinicInfo?.active !== false,
    clinic_name: clinicInfo?.name || null,
    clinic_slug: clinicInfo?.slug || null,
  };
}

export async function getClinicInternalBillingStats(clinicId: string) {
  try {
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("total, fecha, estado")
      .eq("clinic_id", clinicId);

    if (error || !invoices) return { totalMonth: 0, totalYear: 0, count: 0 };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalMonth = 0;
    let totalYear = 0;

    invoices.forEach((inv: any) => {
      const invDate = new Date(inv.fecha);
      const val = typeof inv.total === "number" ? inv.total : parseFloat(inv.total) || 0;
      if (invDate.getFullYear() === currentYear) {
        totalYear += val;
        if (invDate.getMonth() === currentMonth) {
          totalMonth += val;
        }
      }
    });

    return { totalMonth, totalYear, count: invoices.length };
  } catch (e) {
    return { totalMonth: 0, totalYear: 0, count: 0 };
  }
}


export async function ensureClinicAndRole(userId: string, email: string): Promise<void> {
  const { role } = await getUserRoleData(userId);
  if (role) return; // Ya tiene rol y clínica asignada

  // 1. Crear nueva clínica para este usuario
  const clinicName = `Clínica ${email.split('@')[0]}`;
  const slug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
  
  const { data: clinic, error: clinicErr } = await supabase.from("clinics").insert({
    name: clinicName,
    slug: slug,
  }).select("id").single();
  
  if (clinicErr) {
    console.error("Error creando clínica:", clinicErr);
    return;
  }

  // 2. Asignarle rol de admin de esa clínica
  await supabase.from("user_roles").insert({
    user_id: userId,
    role: "clinic_admin",
    clinic_id: clinic.id
  });
}

export type Clinic = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  active: boolean;
  created_at: string;
  plan?: string | null;
  notes?: string | null;
  modules?: { whatsappBot?: boolean; verifactu?: boolean; digitalSign?: boolean } | null;
};

export async function listClinics(): Promise<Clinic[]> {
  const { data, error } = await supabase.from("clinics").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Clinic[];
}

export async function updateClinicDetails(id: string, updates: Partial<Clinic>): Promise<void> {
  const { error } = await supabase
    .from("clinics")
    .update(updates as any)
    .eq("id", id);
  if (error) console.warn("Error actualizando detalles de clínica:", error.message);
}


export async function createClinicManual(name: string, slug?: string): Promise<Clinic> {
  const cleanSlug = (slug || name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-") + "-" + Math.floor(Math.random() * 1000);

  const { data, error } = await supabase
    .from("clinics")
    .insert({
      name,
      slug: cleanSlug,
      active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Clinic;
}

export async function toggleClinicStatus(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from("clinics")
    .update({ active })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteClinic(id: string): Promise<void> {
  const { error } = await supabase
    .from("clinics")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function getUserRole(userId: string): Promise<string | null> {
  const { role } = await getUserRoleData(userId);
  return role;
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
export async function determineAppointmentEstado(fecha: string): Promise<Estado> {
  try {
    const settings = await getClinicSettings();
    const limit = settings.citas_automaticas_limite ?? 10;
    const { count, error } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("fecha", fecha)
      .eq("estado", "Confirmada");

    if (!error && (count ?? 0) < limit) {
      return "Confirmada";
    }
  } catch (e) {
    console.error("Error validando límite de citas automáticas:", e);
  }
  return "Pendiente";
}

export async function upsertAppointment(a: Partial<Appointment>): Promise<void> {
  let estadoCita = a.estado;

  if (!a.id && (!estadoCita || estadoCita === "Pendiente")) {
    estadoCita = await determineAppointmentEstado(a.fecha!);
  }

  const payload = {
    paciente: a.paciente ?? "",
    telefono: a.telefono || null,
    tratamiento: a.tratamiento || null,
    fecha: a.fecha!,
    hora: a.hora!,
    canal: a.canal || "WhatsApp IA",
    estado: estadoCita,
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

/* SaaS Invoices */
export type SaasInvoice = {
  id: string;
  clinic_id: string;
  numero: string;
  fecha: string;
  concepto: string;
  importe: number;
  estado: "Pagado" | "Impago" | "Pendiente";
  created_at?: string;
};

export async function getSaasInvoices(clinicId: string): Promise<SaasInvoice[]> {
  const { data, error } = await supabase
    .from("saas_invoices")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("fecha", { ascending: false });

  if (error) {
    if (error.code === "42P01") return []; // Table doesn't exist yet (not migrated)
    throw new Error(error.message);
  }
  return data as SaasInvoice[];
}

export async function createSaasInvoice(invoice: Partial<SaasInvoice>): Promise<SaasInvoice> {
  const payload = {
    clinic_id: invoice.clinic_id,
    numero: invoice.numero,
    fecha: invoice.fecha,
    concepto: invoice.concepto,
    importe: invoice.importe,
    estado: invoice.estado || "Pagado",
  };

  const { data, error } = await supabase
    .from("saas_invoices")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SaasInvoice;
}
