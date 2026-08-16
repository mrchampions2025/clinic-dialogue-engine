import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

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
  component: () => <Outlet />,
});
