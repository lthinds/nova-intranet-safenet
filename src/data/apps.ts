// Catálogo de aplicações do portal. Para incluir uma ferramenta, adicione um item aqui:
// grupos e filtros são derivados automaticamente desta lista.
export interface AppItemData {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string; // nome do ícone (ver mapa de ícones no portal)
  group?: string;
  integration: "sso" | "link";
  status: "disponivel" | "em_breve";
  recent?: boolean;
}

export const appsData: AppItemData[] = [
  { id: "ponto", name: "Ponto — Pontotel", description: "Registro e acompanhamento do ponto.", url: "https://www.pontotel.com.br", icon: "clock", group: "Acesso rápido", integration: "link", status: "disponivel", recent: true },
  { id: "webmail", name: "Webmail", description: "E-mail corporativo e agenda.", url: "https://webmail.exemplo.com.br", icon: "mail", group: "Acesso rápido", integration: "link", status: "disponivel", recent: true },
  { id: "frota", name: "Relatório de Frota", description: "Preenchimento e relatórios de frota.", url: "/frota", icon: "car", group: "Operacional", integration: "sso", status: "disponivel", recent: true },
  { id: "rel-monitoramento", name: "Relatório de Monitoramento", description: "Relatórios semanais do monitoramento.", url: "/relatorio-monitoramento", icon: "file", group: "Operacional", integration: "sso", status: "disponivel" },
  { id: "monitoramento", name: "Monitoramento", description: "Plantão, alarmes e CFTV em tempo real.", url: "/monitoramento", icon: "monitor", group: "Operacional", integration: "sso", status: "disponivel", recent: true },
  { id: "segware", name: "Segware Cloud", description: "Software de monitoramento parceiro.", url: "https://cloud.segware.com.br", icon: "radio", group: "Operacional", integration: "link", status: "disponivel" },
  { id: "auvo-os", name: "Auvo — Ordens de Serviço", description: "Ordens de serviço do operacional.", url: "https://app.auvo.com.br", icon: "ticket", group: "Operacional", integration: "link", status: "disponivel" },
  { id: "auvo-desk", name: "Auvo Desk — Chamados", description: "Abertura e acompanhamento de chamados.", url: "https://desk.auvo.com.br", icon: "help", group: "Operacional", integration: "link", status: "disponivel" },
  { id: "dash-comercial", name: "Dashboard Comercial", description: "Pipeline, contratos e prospecção.", url: "/comercial", icon: "chart", group: "Comercial", integration: "sso", status: "disponivel" },
  { id: "planilha-comercial", name: "Planilha Comercial", description: "Base viva de contratos e histórico.", url: "https://docs.google.com", icon: "grid", group: "Comercial", integration: "link", status: "disponivel" },
  { id: "pregoes", name: "Gestor de Pregões", description: "Fluxo completo dos processos licitatórios.", url: "/licitacoes/pregoes", icon: "briefcase", group: "Licitações", integration: "sso", status: "disponivel" },
  { id: "painel-licitacoes", name: "Painel de Licitações", description: "Indicadores e recortes comerciais.", url: "/licitacoes/painel", icon: "chart", group: "Licitações", integration: "sso", status: "disponivel" },
  { id: "dahua", name: "Dahua Academy", description: "Agenda de treinamentos técnicos.", url: "https://www.dahuasecurity.com", icon: "book", group: "Treinamentos", integration: "link", status: "disponivel" },
  { id: "hikvision", name: "Hikvision eLearning", description: "Portal de treinamento Hikvision.", url: "https://www.hikvision.com", icon: "book", group: "Treinamentos", integration: "link", status: "disponivel" },
  { id: "intelbras", name: "Intelbras — Treinamentos", description: "Portal de treinamentos Intelbras.", url: "https://www.intelbras.com", icon: "book", group: "Treinamentos", integration: "link", status: "disponivel" },
  { id: "manuais", name: "Manuais técnicos", description: "Biblioteca de procedimentos técnicos.", url: "/manuais", icon: "file", group: "Técnico", integration: "sso", status: "em_breve" },
  { id: "recrutamento", name: "Gestor de Recrutamento", description: "Vagas, currículos e candidatos.", url: "/rh/recrutamento", icon: "users", group: "RH", integration: "sso", status: "disponivel" },
];

export const OTHER_GROUP = "Outros";

/** Grupos derivados da lista, na ordem em que aparecem. Apps sem grupo caem em "Outros". */
export function deriveGroups(list: AppItemData[]): string[] {
  return [...new Set(list.map((a) => a.group || OTHER_GROUP))];
}
