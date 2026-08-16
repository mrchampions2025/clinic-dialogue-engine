import { createFileRoute, Outlet, redirect, useRouteContext } from "@tanstack/react-router";
import { ShieldAlert, LogOut, Mail, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    const role = (context as any)?.role;
    // Si el usuario registrado es únicamente un paciente, redirigir a su área de perfil
    if (role === "patient") {
      throw redirect({ to: "/perfil" });
    }
    if (role === "superadmin") {
      throw redirect({ to: "/superadmin" });
    }
  },
  component: AdminLayoutGuard,
});

function AdminLayoutGuard() {
  const context = useRouteContext({ from: "/_authenticated/admin" }) as any;
  const isSuspended = context?.clinic_active === false;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("Sesión cerrada");
    window.location.href = "/auth";
  };

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="size-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 shadow-lg shadow-red-500/10">
            <ShieldAlert className="size-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 ring-1 ring-inset ring-red-500/20">
              Licencia Suspendida
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">Acceso Interrumpido</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              El acceso a <strong className="text-slate-200">{context?.clinic_name || "su clínica"}</strong> ha sido suspendido temporalmente por el Administrador SaaS.
            </p>
          </div>

          <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 text-xs text-slate-400 space-y-2 text-left">
            <p className="flex items-center gap-2 font-medium text-slate-300">
              <Building2 className="size-3.5 text-indigo-400" />
              Estado del Tenant: <span className="text-red-400 font-bold">Bloqueado / En Revisión</span>
            </p>
            <p>
              Si considera que se trata de un error o requiere reactivar su plan de suscripción, por favor comuníquese con Soporte Técnico.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={() => window.location.href = "mailto:soporte@dentalflow.com"}
              className="bg-indigo-600 hover:bg-indigo-500 text-white w-full shadow-lg shadow-indigo-500/20"
            >
              <Mail className="size-4 mr-2" /> Contactar con Soporte SaaS
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 w-full"
            >
              <LogOut className="size-4 mr-2" /> Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
