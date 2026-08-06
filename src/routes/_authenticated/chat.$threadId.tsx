import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { loadMessages } from "@/lib/chat-store";
import { ChatWindow } from "@/components/ChatWindow";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThread,
});

function ChatThread() {
  const { threadId } = Route.useParams();

  const session = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });

  const history = useQuery({
    queryKey: ["messages", threadId],
    queryFn: () => loadMessages(threadId),
  });

  if (!session.data?.access_token || history.isLoading || !history.data) {
    return (
      <div className="flex flex-1 items-center justify-center bg-chat-canvas text-sm text-muted-foreground">
        Cargando conversación…
      </div>
    );
  }

  return (
    <ChatWindow
      key={threadId}
      threadId={threadId}
      initialMessages={history.data}
      accessToken={session.data.access_token}
      isNewConversation={history.data.length === 0}
    />
  );
}
