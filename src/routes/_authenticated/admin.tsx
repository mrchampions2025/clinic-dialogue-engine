import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    const { role } = context as any;
    if (role !== "admin") {
      throw redirect({ to: "/chat" });
    }
  },
  component: () => <Outlet />,
});
