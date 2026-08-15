import { createFileRoute, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole } from "@/lib/clinic-data";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        const role = await getUserRole(data.user.id);
        return { user: data.user, role: role || "staff" };
      }

      const { data: sessData } = await supabase.auth.getSession();
      if (sessData?.session?.user) {
        const role = await getUserRole(sessData.session.user.id);
        return { user: sessData.session.user, role: role || "staff" };
      }

      // Acceso staff/demo en caso de no haber sesión activa de Supabase
      return { user: { id: "demo-staff-user", email: "admin@dentix.es" }, role: "staff" };
    } catch (e) {
      return { user: { id: "demo-staff-user", email: "admin@dentix.es" }, role: "staff" };
    }
  },
  component: () => <Outlet />,
});
