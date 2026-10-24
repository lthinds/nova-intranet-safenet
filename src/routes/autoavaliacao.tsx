import { createFileRoute } from "@tanstack/react-router";
import { PublicFormPage } from "@/components/public-form-page";

export const Route = createFileRoute("/autoavaliacao")({
  head: () => ({
    meta: [
      { title: "Autoavaliação — Safenet" },
      { name: "description", content: "Formulário de autoavaliação de desempenho do RH." },
      { property: "og:title", content: "Autoavaliação — Safenet" },
      { property: "og:description", content: "Formulário de autoavaliação de desempenho do RH." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PublicFormPage title="Autoavaliação" description="Formulário de autoavaliação de desempenho do RH." fields={[{ label: "Nome completo" }, { label: "E-mail corporativo", type: "email" }, { label: "Principais entregas do período", textarea: true }, { label: "Pontos a desenvolver", textarea: true }]} submitLabel="Enviar autoavaliação" />,
});
