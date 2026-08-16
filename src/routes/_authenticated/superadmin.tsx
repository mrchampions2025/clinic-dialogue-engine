import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/superadmin")({
  beforeLoad: ({ context }) => {
    const role = (context as any)?.role;
    // Redirigir a /admin en lugar del viejo /panel para evitar el error 404
    if (role !== "superadmin") {
      throw redirect({ to: "/admin" });
    }
  },
  component: SuperadminLayout,
});

function SuperadminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-md text-sm border border-blue-400/30">
              DF
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight">SuperAdmin · DentalFlow SaaS</span>
              <p className="text-[11px] text-slate-400">Panel Maestro de Control Global de Empresas Clínicas</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white hover:bg-slate-800">
            <LogOut className="size-4 mr-2" /> Cerrar sesión
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
