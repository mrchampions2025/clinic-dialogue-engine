import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  Users,
  FileText,
  Stethoscope,
  Receipt,
  Settings,
  Menu,
  Bell,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Panel general", icon: LayoutDashboard, exact: true },
  { to: "/admin/citas", label: "Citas", icon: CalendarDays },
  { to: "/admin/pacientes", label: "Pacientes", icon: Users },
  { to: "/admin/presupuestos", label: "Presupuestos", icon: FileText },
  { to: "/admin/tratamientos", label: "Tratamientos", icon: Stethoscope },
  { to: "/admin/facturacion", label: "Facturación", icon: Receipt },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-hero-gradient text-sm font-bold text-primary-foreground">
        D
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold">Dentix</p>
        <p className="truncate text-xs text-muted-foreground">Panel de clínica</p>
      </div>
    </div>
  );
}

export function AdminShell({
  title,
  subtitle,
  actions,
  children,
  flush,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <Brand />
        <NavList />
        <div className="mt-auto border-t border-border p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              MR
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">Marta Reyes</p>
              <p className="truncate text-xs text-muted-foreground">Recepción</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Navegación</SheetTitle>
                <Brand />
                <NavList onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold sm:text-xl">{title}</h1>
              {subtitle && (
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <Button variant="ghost" size="icon" aria-label="Notificaciones">
              <Bell className="size-5" />
            </Button>
          </div>
        </header>

        <main className={cn("flex-1", flush ? "min-h-0" : "p-4 sm:p-6")}>{children}</main>
      </div>
    </div>
  );
}
