import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, LogOut, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createConversation, deleteConversation, listConversations } from "@/lib/chat-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatLayout,
});

function ChatLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };

  const conversations = useQuery({ queryKey: ["conversations"], queryFn: listConversations });

  const create = useMutation({
    mutationFn: () => createConversation(),
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/chat/$threadId", params: { threadId: conversation.id } });
    },
    onError: () => toast.error("No hemos podido abrir una conversación nueva"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (params.threadId === id) navigate({ to: "/chat" });
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden w-72 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-hero-gradient text-primary-foreground">
            <Stethoscope className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Dentix</p>
            <p className="text-xs text-muted-foreground">Atención al paciente</p>
          </div>
        </div>

        <div className="px-4">
          <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>
            <Plus className="size-4" /> Nueva consulta
          </Button>
        </div>

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {conversations.data?.map((conversation) => {
            const active = params.threadId === conversation.id;
            return (
              <div
                key={conversation.id}
                className={`group flex items-center gap-1 rounded-xl px-1 ${
                  active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60"
                }`}
              >
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: conversation.id }}
                  className="flex-1 truncate px-2 py-2.5 text-sm text-sidebar-foreground"
                >
                  {conversation.title}
                </Link>
                <button
                  type="button"
                  aria-label="Eliminar conversación"
                  className="rounded-lg p-2 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                  onClick={() => remove.mutate(conversation.id)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
          {conversations.data?.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Todavía no tienes conversaciones.
            </p>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="size-4" /> Salir
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
