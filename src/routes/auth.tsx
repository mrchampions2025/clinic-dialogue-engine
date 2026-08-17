import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, ensureClinicAndRole } from "@/lib/clinic-data";
import { ensureDefaultClinicSettings } from "@/lib/invoices";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acceso y Registro de Clínica Dental · DentalFlow SaaS" },
      {
        name: "description",
        content: "Acceso seguro para clínicas dentales y gestión de pacientes en la plataforma SaaS DentalFlow.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">(window.location.hash === '#register' ? 'signup' : 'login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [nif, setNif] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRedirect = async (userId: string, userEmail?: string) => {
    try {
      if (userEmail) {
        await ensureClinicAndRole(userId, userEmail);
      }
      // Auto-crear configuración de empresa por defecto en el primer acceso
      await ensureDefaultClinicSettings(userEmail || email);
    } catch (e) {
      console.warn("Error en el aprovisionamiento SaaS auth:", e);
    }

    const role = await getUserRole(userId);
    if (role === "superadmin") {
      navigate({ to: "/superadmin" });
    } else if (role === "patient") {
      navigate({ to: "/perfil" });
    } else {
      navigate({ to: "/admin" });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) handleRedirect(data.session.user.id, data.session.user.email);
    });
  }, [navigate]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await handleRedirect(data.user.id, data.user.email);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            emailRedirectTo: window.location.origin,
            data: {
              clinic_name: clinicName,
              nif: nif,
              phone: phone,
            }
          },
        });
        if (error) throw error;
        if (data.session) await handleRedirect(data.session.user.id, data.session.user.email);
        else {
          toast.success("Cuenta creada correctamente. Te hemos enviado un email de confirmación 😊");
          await handleRedirect(data.user?.id || "demo-user", email);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No hemos podido continuar");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("No hemos podido entrar con Google");
      return;
    }
    if (result.redirected) return;
    
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await handleRedirect(data.session.user.id, data.session.user.email);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl">
        <Link to="/" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium mb-4">
          ← Volver a la Landing Pública
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
            DF
          </div>
          <span className="text-base font-bold tracking-tight text-white">DentalFlow AI</span>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-mono">
            SaaS
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
          {mode === "login" ? "Acceso a tu Clínica Dental 🦷" : "Crea tu Cuenta de Clínica"}
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          {mode === "login" 
            ? "Entra al panel para gestionar citas, facturas SIF y firmas con certificado." 
            : "Comienza tu prueba gratuita de 14 días. Configuración automática de empresa incluida."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-300">Email profesional de la Clínica</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="clinica@ejemplo.com"
              className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          {mode === "signup" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="clinicName" className="text-xs font-semibold text-slate-300">Nombre de la Clínica</Label>
                <Input
                  id="clinicName"
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Ej. Clínica Dental San José"
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nif" className="text-xs font-semibold text-slate-300">NIF / CIF</Label>
                <Input
                  id="nif"
                  type="text"
                  required
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  placeholder="Ej. B12345678"
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-300">Teléfono (Opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. 910 000 000"
                  className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-slate-300">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg font-semibold" disabled={loading}>
            {loading ? "Cargando..." : mode === "login" ? "Iniciar Sesión" : "Crear Cuenta de Clínica"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px flex-1 bg-slate-800" />o<span className="h-px flex-1 bg-slate-800" />
        </div>

        <Button variant="outline" className="w-full border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:text-white" onClick={onGoogle}>
          Acceso rápido con Google
        </Button>

        <p className="mt-6 text-center text-xs text-slate-400">
          {mode === "login" ? "¿Aún no tienes cuenta para tu clínica?" : "¿Ya tienes registrada tu clínica?"}{" "}
          <button
            type="button"
            className="font-semibold text-blue-400 hover:underline ml-1"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Regístrate gratis" : "Inicia sesión"}
          </button>
        </p>

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <ShieldCheck className="size-3 text-emerald-400" /> 100% Cumplimiento Veri*Factu RD 1007/2023
        </div>
      </div>
    </main>
  );
}
