import { cn } from "@/lib/utils";
import type { Estado, ChatEstado } from "@/lib/admin-mock";

export function EstadoBadge({ estado }: { estado: Estado }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        estado === "Confirmada" && "bg-accent text-accent-foreground",
        estado === "Pendiente" && "bg-secondary text-secondary-foreground",
        estado === "Cancelada" && "bg-destructive/10 text-destructive",
      )}
    >
      {estado}
    </span>
  );
}

export function ChatEstadoBadge({ estado }: { estado: ChatEstado }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
        estado === "Atendido por IA" && "bg-accent text-accent-foreground",
        estado === "Requiere humano" && "bg-destructive/10 text-destructive",
        estado === "Resuelto" && "bg-secondary text-secondary-foreground",
      )}
    >
      {estado}
    </span>
  );
}
