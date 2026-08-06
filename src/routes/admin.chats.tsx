import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, SendHorizontal, Search, PauseCircle, PlayCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ChatEstadoBadge } from "@/components/admin/EstadoBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chats } from "@/lib/admin-mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/chats")({
  head: () => ({
    meta: [
      { title: "Bandeja de chats · Dentix Admin" },
      { name: "description", content: "Bandeja de entrada de WhatsApp con el agente de IA de la Clínica Dental Dentix." },
      { property: "og:title", content: "Bandeja de chats · Dentix Admin" },
      { property: "og:description", content: "Supervisa y toma el control de las conversaciones de WhatsApp." },
    ],
  }),
  component: ChatsPage,
});

function ChatsPage() {
  const [activeId, setActiveId] = useState(chats[0].id);
  const [iaActiva, setIaActiva] = useState(true);
  const [draft, setDraft] = useState("");
  const active = chats.find((c) => c.id === activeId)!;

  return (
    <AdminShell title="Chats" subtitle="Bandeja de entrada de WhatsApp" flush>
      <div className="grid h-[calc(100vh-65px)] grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="hidden min-h-0 flex-col border-r border-border bg-card md:flex">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar conversación…" className="pl-9" />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {chats.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border px-3 py-3 text-left transition-colors",
                  c.id === activeId ? "bg-secondary" : "hover:bg-muted",
                )}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-hero-gradient text-xs font-semibold text-primary-foreground">
                  {c.iniciales}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{c.nombre}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{c.hora}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {c.ultimo}
                  </span>
                  <span className="mt-1.5 block">
                    <ChatEstadoBadge estado={c.estado} />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-chat-canvas">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-hero-gradient text-xs font-semibold text-primary-foreground">
                {active.iniciales}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold">{active.nombre}</p>
                <p className="truncate text-xs text-muted-foreground">WhatsApp · Madrid</p>
              </div>
            </div>
            <Button
              variant={iaActiva ? "outline" : "default"}
              size="sm"
              className="shrink-0"
              onClick={() => setIaActiva((v) => !v)}
            >
              {iaActiva ? (
                <>
                  <PauseCircle className="size-4" /> Pausar IA
                </>
              ) : (
                <>
                  <PlayCircle className="size-4" /> Reanudar IA
                </>
              )}
            </Button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto flex max-w-2xl flex-col gap-3">
              {active.mensajes.map((m, i) => (
                <div key={i} className={m.from === "ai" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={cn(
                      "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                      m.from === "ai"
                        ? "rounded-br-md bg-bubble-patient text-bubble-patient-foreground"
                        : "rounded-bl-md bg-bubble-clinic text-bubble-clinic-foreground",
                    )}
                  >
                    {m.from === "ai" && (
                      <span className="mb-1 flex items-center gap-1 text-[11px] font-medium opacity-70">
                        <Bot className="size-3" /> Agente IA
                      </span>
                    )}
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setDraft("");
            }}
            className="border-t border-border bg-card px-4 py-3"
          >
            <div className="mx-auto flex max-w-2xl items-center gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  iaActiva ? "Escribe para tomar el control de la conversación…" : "Escribe tu mensaje…"
                }
                className="h-11 rounded-full"
              />
              <Button type="submit" size="icon" className="size-11 shrink-0 rounded-full">
                <SendHorizontal className="size-4" />
              </Button>
            </div>
            <p className="mx-auto mt-2 max-w-2xl text-[11px] text-muted-foreground">
              {iaActiva
                ? "La IA está respondiendo automáticamente. Al enviar un mensaje, la IA se pausará."
                : "IA pausada · estás atendiendo tú esta conversación."}
            </p>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}
