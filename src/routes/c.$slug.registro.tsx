import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/c/$slug/registro")({
  ssr: false,
  component: PatientRegistrationPage,
});

function PatientRegistrationPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch clinic info by slug
  const { data: clinic, isLoading } = useQuery({
    queryKey: ["clinic-by-slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinics").select("*").eq("slug", slug).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic) return toast.error("Clínica no encontrada");
    setLoading(true);

    try {
      // 1. Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      
      const userId = data.user?.id;
      if (userId) {
        // 2. Assign patient role and link to clinic
        await supabase.from("user_roles").insert({
          user_id: userId,
          role: "patient",
          clinic_id: clinic.id
        });

        // 3. Create patient profile
        await supabase.from("patients").insert({
          id: userId,
          nombre,
          email,
          clinic_id: clinic.id
        });

        toast.success("¡Registro completado! Ya puedes iniciar sesión.");
        
        // Wait briefly then redirect to profile (if session exists) or auth
        setTimeout(() => {
          if (data.session) navigate({ to: "/perfil" });
          else navigate({ to: "/auth" });
        }, 1500);
      } else {
        toast.success("Revisa tu correo para confirmar el registro.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No hemos podido crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Cargando...</div>;
  if (!clinic) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Clínica no encontrada</div>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl">
        <div className="flex items-center gap-2 mb-2 justify-center">
          <div className="size-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md text-xl">
            {clinic.name.charAt(0)}
          </div>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white text-center">
          {clinic.name}
        </h1>
        <p className="mt-2 text-sm text-slate-400 text-center">
          Crea tu cuenta de paciente para gestionar tus citas y tratamientos
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre" className="text-xs font-semibold text-slate-300">Nombre Completo</Label>
            <Input
              id="nombre"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. María García"
              className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
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
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg font-semibold" disabled={loading}>
            {loading ? "Creando cuenta..." : "Registrarme"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link to="/auth" className="font-semibold text-blue-400 hover:underline ml-1">
            Inicia sesión
          </Link>
        </p>
        
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <ShieldCheck className="size-3 text-emerald-400" /> Plataforma SaaS impulsada por DentalFlow AI
        </div>
      </div>
    </main>
  );
}
