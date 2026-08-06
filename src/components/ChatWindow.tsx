import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { SendHorizontal } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { renameConversation } from "@/lib/chat-store";

const WELCOME =
  "¡Hola! Soy Marta, de recepción de Clínica Dental Dentix 🦷\n¿En qué puedo ayudarte hoy?";

export function ChatWindow({
  threadId,
  initialMessages,
  accessToken,
  isNewConversation,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  accessToken: string;
  isNewConversation: boolean;
}) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { conversationId: threadId },
      }),
    [accessToken, threadId],
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: () => toast.error("No hemos podido enviar tu mensaje, inténtalo otra vez"),
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      textareaRef.current?.focus();
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    if (isNewConversation && messages.length === 0) {
      const title = text.length > 40 ? `${text.slice(0, 40)}…` : text;
      renameConversation(threadId, title)
        .then(() => queryClient.invalidateQueries({ queryKey: ["conversations"] }))
        .catch(() => undefined);
    }
    await sendMessage({ text });
    textareaRef.current?.focus();
  }

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border bg-card px-5 py-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-hero-gradient text-sm font-semibold text-primary-foreground">
          M
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Recepción · Clínica Dental Dentix</p>
          <p className="text-xs text-muted-foreground">
            Lunes a viernes de 09:00 a 20:00 · Madrid
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-chat-canvas px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.length === 0 && <Bubble role="assistant" text={WELCOME} />}
          {messages.map((message) => (
            <Bubble
              key={message.id}
              role={message.role === "user" ? "user" : "assistant"}
              text={message.parts
                .map((part) => (part.type === "text" ? part.text : ""))
                .join("")}
            />
          ))}
          {status === "submitted" && <Typing />}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={onSubmit} className="border-t border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void onSubmit(event);
              }
            }}
            rows={1}
            placeholder="Escribe tu mensaje…"
            className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="icon" className="size-11 rounded-full" disabled={isLoading}>
            <SendHorizontal className="size-4" />
          </Button>
        </div>
      </form>
    </>
  );
}

function Bubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  const isUser = role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-md bg-bubble-patient text-bubble-patient-foreground"
            : "rounded-bl-md bg-bubble-clinic text-bubble-clinic-foreground"
        }`}
      >
        <div className="prose prose-sm max-w-none whitespace-pre-wrap [&_p]:m-0 [&_p+p]:mt-2">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-1 rounded-2xl rounded-bl-md bg-bubble-clinic px-4 py-3 shadow-sm">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
