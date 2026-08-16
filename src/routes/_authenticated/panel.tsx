import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureDefaultClinicSettings } from "@/lib/invoices";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { 
  CalendarDays, 
  Users, 
  FileText, 
  Receipt, 
  Settings, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Stethoscope,
  Building2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/panel")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel SaaS · Gestión de Clínica Dental" },
      { name: "description", content: "Centro de control y gestión SaaS para clínicas dentales." },
    ],
  }),
  beforeLoad: async ({ context }: any) => {
    // Auto-crear configuración de empresa por defecto en el primer acceso
    if (context?.user?.email) {
      await ensureDefaultClinicSettings(context.user.email);
    }
  },
  component: SaaSPanelPage,
});

function SaaSPanelPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clinicInfo, setClinicInfo] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const settings = await ensureDefaultClinicSettings(user.email);
        setClinicInfo(settings);
      }
      setLoading(false);
    }
    init();
  }, []);

  return (
    <AdminShell 
      title="Panel de Control SaaS" 
      subtitle="Bienvenido a tu plataforma de gestión dental inteligente"
      actions={
        <Button onClick={() => navigate({ to: "/admin" })} className="bg-primary hover:bg-primary/90">
          Ver Panel General <ArrowRight className="ml-2 size-4" />
        </Button>
      }
    >
      <div className="space-y-6 mt-2">
        {/* Banner de bienvenida y estado de empresa */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-md">
          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="size-3.5" /> Cuenta SaaS Activa
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {clinicInfo?.razon_social || "Tu Clínica Dental"}
            </h1>
            <p className="text-sm opacity-90 leading-relaxed">
              Configuración de empresa inicial auto-creada. Gestiona citas automáticas por IA, facturación SIF Veri*factu y firmas digitales con certificado oficial.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => navigate({ to: "/admin/configuracion" })}
                className="bg-white text-blue-900 hover:bg-blue-50 font-semibold"
              >
                <Settings className="mr-2 size-4" /> Ajustar Configuración Fiscal
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate({ to: "/admin/citas" })}
                className="border-white/40 text-white hover:bg-white/10"
              >
                <CalendarDays className="mr-2 size-4" /> Ver Agenda de Citas
              </Button>
            </div>
          </div>
          <Building2 className="absolute -right-8 -bottom-8 size-64 text-white/10 pointer-events-none" />
        </div>

        {/* Tarjetas de Accesos Directos SaaS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div 
            onClick={() => navigate({ to: "/admin/citas" })}
            className="group cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="size-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarDays className="size-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                IA Activa
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">Gestión de Citas e IA</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Recepción automática por WhatsApp con límite configurable de auto-aceptación.
            </p>
          </div>

          <div 
            onClick={() => navigate({ to: "/admin/presupuestos" })}
            className="group cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="size-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="size-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Certificado AEAT
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">Presupuestos y Firma Digital</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Emisión de planes de tratamiento y firma criptográfica .p12/.pfx de la Casa de la Moneda.
            </p>
          </div>

          <div 
            onClick={() => navigate({ to: "/admin/facturacion" })}
            className="group cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="size-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Receipt className="size-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                Veri*Factu RD 1007
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">Facturación SIF Veri*Factu</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Generación de facturas con código QR, huella SHA-256 y cumplimiento normativo 2027.
            </p>
          </div>

          <div 
            onClick={() => navigate({ to: "/admin/pacientes" })}
            className="group cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-amber-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="size-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="size-6" />
              </div>
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">Directorio de Pacientes</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Fichas clínicas completas, historial de intervenciones y fichas de tratamiento.
            </p>
          </div>

          <div 
            onClick={() => navigate({ to: "/admin/tratamientos" })}
            className="group cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="size-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Stethoscope className="size-6" />
              </div>
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">Catálogo de Tratamientos</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Configura tus categorías de odontología general, implantología y ortodoncia.
            </p>
          </div>

          <div 
            onClick={() => navigate({ to: "/admin/configuracion" })}
            className="group cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-slate-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="size-12 rounded-xl bg-slate-500/10 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Settings className="size-6" />
              </div>
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">Datos de la Clínica</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Razón social, sello gráfico, certificado digital y límites de cita diaria.
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
