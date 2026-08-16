import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getUserRoleData } from "@/lib/clinic-data";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        const roleData = await getUserRoleData(data.user.id);
        return {
          user: data.user,
          role: roleData.role || "staff",
          clinic_active: roleData.clinic_active,
          clinic_name: roleData.clinic_name,
          clinic_slug: roleData.clinic_slug,
        };
      }

      const { data: sessData } = await supabase.auth.getSession();
      if (sessData?.session?.user) {
        const roleData = await getUserRoleData(sessData.session.user.id);
        return {
          user: sessData.session.user,
          role: roleData.role || "clinic_admin",
          clinic_active: roleData.clinic_active,
          clinic_name: roleData.clinic_name,
          clinic_slug: roleData.clinic_slug,
        };
      }

      // If no session, redirect to auth
      throw redirect({ to: "/auth" });
    } catch (e) {
      if (e && typeof e === "object" && "isRedirect" in e) throw e;
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});

