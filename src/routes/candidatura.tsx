import { createFileRoute } from "@tanstack/react-router";
import { PublicFormPage } from "@/components/public-form-page";

export const Route = createFileRoute("/candidatura")({
  head: () => ({
    meta: [
      { title: "Candidatura — Safenet" },
      { name: "description", content: "Envie seus dados para as vagas abertas na Safenet." },
      { property: "og:title", content: "Candidatura — Safenet" },
      { property: "og:description", content: "Envie seus dados para as vagas abertas na Safenet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PublicFormPage title="Candidatura" description="Envie seus dados para as vagas abertas na Safenet." fields={[{ label: "Nome completo" }, { label: "E-mail", type: "email" }, { label: "Telefone", type: "tel" }, { label: "Vaga de interesse" }, { label: "Conte um pouco sobre você", textarea: true }]} submitLabel="Enviar candidatura" />,
});
