import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole } from "@/lib/clinic-data";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acceso pacientes | Clínica Dental Dentix" },
      {
        name: "description",
        content:
          "Entra en tu área de paciente de Clínica Dental Dentix en Madrid para hablar con recepción y pedir cita.",
      },
      { property: "og:title", content: "Acceso pacientes | Clínica Dental Dentix" },
      {
        property: "og:description",
        content: "Accede a tu chat con recepción de Clínica Dental Dentix.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRedirect = async (userId: string) => {
    const role = await getUserRole(userId);
    if (role === "admin") navigate({ to: "/admin" });
    else navigate({ to: "/perfil" });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) handleRedirect(data.session.user.id);
    });
  }, [navigate]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await handleRedirect(data.user.id);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) await handleRedirect(data.session.user.id);
        else toast.success("Te hemos enviado un email para confirmar tu cuenta 😊");
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
    
    // Si no ha habido redirección, verificamos sesión
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await handleRedirect(data.session.user.id);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-soft">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {mode === "login" ? "Hola de nuevo 🦷" : "Crea tu ficha de paciente"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entra para hablar con recepción de Clínica Dental Dentix.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {mode === "login" ? "Entrar" : "Crear cuenta"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={onGoogle}>
          Continuar con Google
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "¿Aún no tienes cuenta?" : "¿Ya eres paciente?"}{" "}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </main>
  );
}
