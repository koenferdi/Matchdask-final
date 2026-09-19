import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/aanvraag")({
  beforeLoad: () => {
    throw redirect({ to: "/aanvragen" });
  },
});
