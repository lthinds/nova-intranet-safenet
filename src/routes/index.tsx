import { createFileRoute } from "@tanstack/react-router";

import { PortalPrototype } from "@/components/portal-prototype";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Intranet Safenet — Portal Corporativo" },
      { name: "description", content: "Protótipo navegável do hub corporativo Safenet para acesso a aplicações e gestão de colaboradores." },
      { property: "og:title", content: "Intranet Safenet — Portal Corporativo" },
      { property: "og:description", content: "Hub corporativo para acesso seguro às ferramentas internas da Safenet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <PortalPrototype />;
}
