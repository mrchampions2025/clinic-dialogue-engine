import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/whatsapp-reminders")({
  server: {
    handlers: {
      // Endpoint para ser ejecutado por un Cron Job (ej. Vercel Cron)
      // Lo ideal es asegurarlo con una API Key, pero para pruebas lo dejamos abierto o con un token simple
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const cronToken = url.searchParams.get("token");
          
          // Opcional: Proteger el endpoint
          const EXPECTED_TOKEN = process.env["CRON_SECRET"] || "dentix_cron_token";
          if (cronToken !== EXPECTED_TOKEN) {
            return new Response("Unauthorized", { status: 401 });
          }

          const waToken = process.env["WHATSAPP_ACCESS_TOKEN"];
          const waPhoneId = process.env["WHATSAPP_PHONE_ID"];
          
          if (!waToken || !waPhoneId) {
            console.error("Faltan variables de WhatsApp (WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_ID)");
            return new Response("Server Config Error", { status: 500 });
          }

          const supabase = createClient(
            process.env["SUPABASE_URL"]!,
            process.env["SUPABASE_SERVICE_ROLE_KEY"]!
          );

          // Calcular la fecha de mañana (YYYY-MM-DD)
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split("T")[0];

          // Buscar citas confirmadas o pendientes para mañana
          const { data: appointments, error } = await supabase
            .from("appointments")
            .select("*")
            .eq("fecha", tomorrowStr)
            .in("estado", ["Pendiente", "Confirmada"])
            .not("telefono", "is", null);

          if (error) {
            throw new Error(error.message);
          }

          if (!appointments || appointments.length === 0) {
            return new Response(JSON.stringify({ message: "No hay citas para recordar mañana." }), { 
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          }

          let envios = 0;
          let errores = 0;

          // Enviar recordatorio a cada paciente
          for (const cita of appointments) {
            if (cita.telefono && cita.telefono.length > 5) { // Validar mínimamente el teléfono
              // Limpiar teléfono (quitar espacios, +, etc. si Meta lo requiere o no)
              const phone = cita.telefono.replace(/\D/g, "");
              
              const msg = `¡Hola ${cita.paciente}! 🦷\n\nTe escribimos de la Clínica Dental Dentix para recordarte que mañana, *${tomorrowStr} a las ${cita.hora.slice(0, 5)}*, tienes una cita programada para: ${cita.tratamiento || "Revisión"}.\n\nPor favor, responde "Confirmar" si asistirás o "Cancelar" si no puedes venir.\n\n¡Te esperamos!`;
              
              const success = await sendWhatsAppMessage(phone, msg, waPhoneId, waToken);
              if (success) {
                envios++;
              } else {
                errores++;
              }
            }
          }

          return new Response(JSON.stringify({ 
            message: "Proceso completado", 
            procesados: appointments.length,
            enviados: envios,
            errores: errores,
            fecha: tomorrowStr
          }), { 
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
          
        } catch (error: any) {
          console.error("Error en cron de recordatorios:", error);
          return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      },
    },
  },
});

async function sendWhatsAppMessage(to: string, message: string, phoneId: string, token: string) {
  try {
    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Error enviando recordatorio a ${to}:`, errorData);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`Excepción en fetch de WhatsApp para ${to}:`, e);
    return false;
  }
}
