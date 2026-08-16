import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
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
        return { user: sessData.session.user, role: role || "clinic_admin" };
      }

      // If no session, redirect to auth
      throw redirect({ to: "/auth" });
    } catch (e) {
      if (e && typeof e === 'object' && 'isRedirect' in e) throw e;
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
