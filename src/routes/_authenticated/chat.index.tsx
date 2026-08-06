import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createConversation, listConversations } from "@/lib/chat-store";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const conversations = await listConversations();
      const target = conversations[0] ?? (await createConversation());
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/chat/$threadId", params: { threadId: target.id }, replace: true });
    })();
  }, [navigate, queryClient]);

  return (
    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      Abriendo tu conversación…
    </div>
  );
}
