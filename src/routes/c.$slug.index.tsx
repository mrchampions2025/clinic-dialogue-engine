import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/c/$slug/")({
  beforeLoad: ({ params }: { params: { slug: string } }) => {
    throw redirect({
      to: "/c/$slug/registro",
      params: { slug: params.slug },
    });
  },
  component: () => null,
});
