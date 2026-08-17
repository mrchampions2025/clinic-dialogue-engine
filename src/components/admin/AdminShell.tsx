import { useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getClinicSettings } from "@/lib/invoices";
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
  LogOut,
  Package,
  Shield,
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
  { to: "/admin/inventario", label: "Inventario", icon: Package },
  { to: "/admin/seguros", label: "Seguros y Mutuas", icon: Shield },
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
    <Link to="/panel" className="flex items-center gap-3 border-b border-border px-5 py-4 hover:bg-muted/50 transition-colors">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
        DF
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-bold">DentalFlow AI</p>
        <p className="truncate text-[11px] text-muted-foreground">Panel SaaS Clínica</p>
      </div>
    </Link>
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
  const navigate = useNavigate();

  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic_settings"],
    queryFn: () => getClinicSettings(),
  });

  const clinicName = clinicSettings?.nombre_comercial || clinicSettings?.razon_social || "Mi Clínica Dental";
  const initials = clinicName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CL";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <Brand />
        <NavList />
        <div className="mt-auto border-t border-border p-4">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-100 dark:bg-blue-950 text-xs font-bold text-blue-700 dark:text-blue-300">
                {initials}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold">{clinicName}</p>
                <p className="truncate text-[11px] text-muted-foreground">Administrador</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="shrink-0 text-muted-foreground hover:text-red-500" title="Cerrar sesión">
              <LogOut className="size-4" />
            </Button>
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
