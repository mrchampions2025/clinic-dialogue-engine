import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/superadmin")({
  beforeLoad: ({ context }) => {
    // Only superadmin can access this
    if (context.role !== "superadmin") {
      throw redirect({ to: "/panel" });
    }
  },
  component: SuperadminLayout,
});

function SuperadminLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">DF</div>
            <span className="font-bold text-white">SuperAdmin · DentalFlow SaaS</span>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
