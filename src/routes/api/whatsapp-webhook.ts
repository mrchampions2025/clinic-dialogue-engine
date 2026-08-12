import { createFileRoute } from "@tanstack/react-router";
import { generateText, tool } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { CLINIC_SYSTEM_PROMPT } from "@/lib/clinic-prompt";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Token de verificación configurado en el panel de Meta (puedes poner lo que quieras, ej: "mi_token_secreto_123")
const VERIFY_TOKEN = process.env["WHATSAPP_VERIFY_TOKEN"] || "dentix_secreto";

export const Route = createFileRoute("/api/whatsapp-webhook")({
  server: {
    handlers: {
      // Endpoint GET para la verificación inicial de Meta
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode && token) {
          if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("WEBHOOK VERIFICADO CORRECTAMENTE");
            return new Response(challenge, { status: 200 });
          }
          return new Response("Forbidden", { status: 403 });
        }
        return new Response("Bad Request", { status: 400 });
      },

      // Endpoint POST para recibir mensajes de WhatsApp
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          
          // Verifica si es un evento de WhatsApp
          if (body.object === "whatsapp_business_account") {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            
            if (value?.messages && value.messages.length > 0) {
              const message = value.messages[0];
              const contact = value.contacts?.[0];
              
              if (message.type === "text") {
                const phone = message.from;
                const text = message.text.body;
                const userName = contact?.profile?.name || "Paciente";
                
                console.log(`Mensaje recibido de ${phone}: ${text}`);
                
                // Procesar con IA y responder
                await processMessageWithAI(phone, text, userName);
              }
            }
            return new Response("EVENT_RECEIVED", { status: 200 });
          }
          
          return new Response("Not Found", { status: 404 });
        } catch (error) {
          console.error("Error en el webhook:", error);
          return new Response("Internal Error", { status: 500 });
        }
      },
    },
  },
});

async function processMessageWithAI(phone: string, text: string, userName: string) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  const waToken = process.env["WHATSAPP_ACCESS_TOKEN"];
  const waPhoneId = process.env["WHATSAPP_PHONE_ID"]; // ID del teléfono de origen
  
  if (!apiKey || !waToken || !waPhoneId) {
    console.error("Faltan variables de entorno (LOVABLE_API_KEY, WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_ID)");
    return;
  }

  const supabase = createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]! // Usamos el service role porque es una API en background
  );

  const gateway = createLovableAiGatewayProvider(apiKey);
  
  // Aquí podríamos buscar el historial de la conversación en Supabase usando el número de teléfono
  // Por simplicidad, pasamos el mensaje directamente
  const { text: aiResponse } = await generateText({
    model: gateway("google/gemini-1.5-flash"),
    system: CLINIC_SYSTEM_PROMPT + `\n\nEl paciente se llama ${userName} y su número es ${phone}.`,
    prompt: text,
    tools: {
      bookAppointment: tool({
        description: "Reserva una cita médica en la base de datos de la clínica.",
        inputSchema: z.object({
          paciente: z.string().describe("El nombre completo del paciente."),
          telefono: z.string().describe("El teléfono de contacto del paciente."),
          fecha: z.string().describe("La fecha de la cita en formato YYYY-MM-DD."),
          hora: z.string().describe("La hora de la cita en formato HH:MM."),
          tratamiento: z.string().describe("El tratamiento o motivo de la visita."),
        }),
        execute: async (args: any) => {
          // Buscamos si existe el paciente por número para asociarlo
          let patientId = null;
          const { data: existingPatient } = await supabase
            .from("patients")
            .select("id")
            .eq("telefono", phone)
            .maybeSingle();
            
          if (existingPatient) {
            patientId = existingPatient.id;
          }

          const { error } = await supabase.from("appointments").insert({
            paciente: args.paciente,
            telefono: args.telefono || phone,
            fecha: args.fecha,
            hora: args.hora,
            tratamiento: args.tratamiento,
            canal: "WhatsApp IA",
            estado: "Confirmada",
            patient_id: patientId,
          });

          if (error) {
            return { success: false, error: error.message };
          }
          return { success: true, message: "Cita reservada correctamente." };
        },
      }),
    },
  });

  // Enviar respuesta a WhatsApp
  await sendWhatsAppMessage(phone, aiResponse, waPhoneId, waToken);
}

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
      console.error("Error enviando WhatsApp:", errorData);
    } else {
      console.log(`Respuesta enviada con éxito a ${to}`);
    }
  } catch (e) {
    console.error("Error en fetch de WhatsApp:", e);
  }
}
