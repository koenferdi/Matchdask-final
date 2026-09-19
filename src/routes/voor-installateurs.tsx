import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/voor-installateurs")({
  beforeLoad: () => {
    throw redirect({ to: "/installateurs" });
  },
});
