import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { CLINIC_SYSTEM_PROMPT } from "@/lib/clinic-prompt";

type ChatRequestBody = { messages?: unknown; conversationId?: unknown };

function textOf(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return new Response("No autorizado", { status: 401 });

        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        const conversationId = body.conversationId;
        if (!Array.isArray(messages) || typeof conversationId !== "string") {
          return new Response("Petición inválida", { status: 400 });
        }

        const supabase = createClient(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          },
        );

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) return new Response("No autorizado", { status: 401 });
        const userId = userData.user.id;

        const { data: conversation } = await supabase
          .from("conversations")
          .select("id")
          .eq("id", conversationId)
          .maybeSingle();
        if (!conversation) return new Response("Conversación no encontrada", { status: 404 });

        const uiMessages = messages as UIMessage[];
        const last = uiMessages[uiMessages.length - 1];
        if (last && last.role === "user") {
          const { error } = await supabase.from("messages").insert({
            conversation_id: conversationId,
            user_id: userId,
            role: "user",
            content: textOf(last),
          });
          if (error) console.error("No se pudo guardar el mensaje del paciente", error);
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Falta la configuración de IA", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3.5-flash"),
          system: CLINIC_SYSTEM_PROMPT,
          messages: await convertToModelMessages(uiMessages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
          onFinish: async ({ responseMessage }) => {
            const content = textOf(responseMessage);
            if (!content) return;
            const { error } = await supabase.from("messages").insert({
              conversation_id: conversationId,
              user_id: userId,
              role: "assistant",
              content,
            });
            if (error) console.error("No se pudo guardar la respuesta", error);
            const { error: updateError } = await supabase
              .from("conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", conversationId);
            if (updateError) console.error("No se pudo actualizar la conversación", updateError);
          },
        });
      },
    },
  },
});
