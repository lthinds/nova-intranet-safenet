// Catálogo de aplicações do portal. Para incluir uma ferramenta, adicione um item aqui:
// grupos e filtros são derivados automaticamente desta lista.
export interface AppItemData {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string; // nome do ícone (ver mapa de ícones no portal)
  group?: string;
  /** Grupo do Keycloak (GS_App_<nome>). Sem grupo = visível a todos. */
  keycloakGroup?: string;
  integration: "sso" | "link";
  status: "disponivel" | "em_breve";
  recent?: boolean;
  /** Funções que usam o card, em ordem. Vazio = acesso geral. A cor do ícone segue a primeira. */
  roles?: string[];
}

/** Endereço da intranet atual, onde ficam as ferramentas próprias. */
export const INTRANET = "http://intranet.safenet.lan:8081";

/** URL "#" = endereço ainda não informado (o botão Abrir fica desativado). */
export const appsData: AppItemData[] = [
  { id: "ponto", name: "Ponto — Pontotel", description: "Registro e acompanhamento do ponto.", url: "https://gestao.pontotel.com.br/#/cognito/login", icon: "clock", group: "Acesso rápido", integration: "link", status: "disponivel", recent: true },
  { id: "webmail", name: "Webmail", description: "E-mail corporativo e agenda.", url: "https://webmail-seguro.com.br/v2/", icon: "mail", group: "Acesso rápido", integration: "link", status: "disponivel", recent: true },
  { id: "frota", roles: ["Monitoramento", "Frota"], name: "Relatório de Frota", description: "Preenchimento e relatórios de frota.", url: INTRANET + "/frota/", icon: "car", group: "Operacional", keycloakGroup: "GS_App_frota", integration: "sso", status: "disponivel", recent: true },
  { id: "rel-monitoramento", roles: ["Monitoramento"], name: "Relatório de Monitoramento", description: "Relatórios semanais do monitoramento.", url: INTRANET + "/monitoramento/", icon: "file", group: "Operacional", keycloakGroup: "GS_App_rel-monitoramento", integration: "sso", status: "disponivel" },
  { id: "monitoramento", roles: ["Monitoramento"], name: "Monitoramento", description: "Plantão, alarmes e CFTV em tempo real.", url: "https://monitoramento.safenet.lan:8543/", icon: "monitor", group: "Operacional", keycloakGroup: "GS_App_monitoramento", integration: "sso", status: "disponivel", recent: true },
  { id: "segware", roles: ["Monitoramento"], name: "Segware Cloud", description: "Software de monitoramento parceiro.", url: "https://cloud.segware.com.br/", icon: "radio", group: "Operacional", integration: "link", status: "disponivel" },
  { id: "auvo-os", roles: ["Técnico"], name: "Auvo — Ordens de Serviço", description: "Ordens de serviço do operacional.", url: "https://app.auvo.com.br/", icon: "ticket", group: "Operacional", integration: "link", status: "disponivel" },
  { id: "auvo-desk", roles: ["Monitoramento"], name: "Auvo Desk — Chamados", description: "Abertura e acompanhamento de chamados.", url: "https://desk.auvo.com.br/Login", icon: "help", group: "Operacional", integration: "link", status: "disponivel" },
  { id: "dash-comercial", roles: ["Comercial"], name: "Dashboard Comercial", description: "Pipeline, contratos e prospecção.", url: INTRANET + "/dashboard_safenet.html", icon: "chart", group: "Comercial", keycloakGroup: "GS_App_dash-comercial", integration: "sso", status: "disponivel" },
  { id: "planilha-comercial", roles: ["Comercial"], name: "Planilha Comercial", description: "Base viva de contratos e histórico.", url: "#", icon: "grid", group: "Comercial", integration: "link", status: "disponivel" },
  { id: "pregoes", roles: ["Licitações", "Comercial"], name: "Gestor de Pregões", description: "Fluxo completo dos processos licitatórios.", url: INTRANET + "/licitacoes/index.html", icon: "briefcase", group: "Licitações", keycloakGroup: "GS_App_pregoes", integration: "sso", status: "disponivel" },
  { id: "painel-licitacoes", roles: ["Licitações", "Comercial"], name: "Painel de Licitações", description: "Indicadores e recortes comerciais.", url: INTRANET + "/dashboard_safenet.html", icon: "chart", group: "Licitações", keycloakGroup: "GS_App_painel-licitacoes", integration: "sso", status: "disponivel" },
  { id: "dahua", name: "Dahua Academy", description: "Agenda de treinamentos técnicos.", url: "https://www.dahuaacademy.com.br/agenda-de-treinamentos-dahua-technology", icon: "book", group: "Treinamentos", integration: "link", status: "disponivel" },
  { id: "hikvision", name: "Hikvision eLearning", description: "Portal de treinamento Hikvision.", url: "https://elearning.hikvision.com/br/", icon: "book", group: "Treinamentos", integration: "link", status: "disponivel" },
  { id: "intelbras", name: "Intelbras — Treinamentos", description: "Portal de treinamentos Intelbras.", url: "https://cursos.intelbras.com.br/portal/layout/927/intelbras/home.asp?V29ya3NwYWNlSUQ9MTI1MCZrdF9kaWRheGlzPXRvcA", icon: "book", group: "Treinamentos", integration: "link", status: "disponivel" },
  { id: "manuais", name: "Manuais técnicos", description: "Biblioteca de procedimentos técnicos.", url: "/manuais", icon: "file", group: "Técnico", integration: "sso", status: "disponivel" },
  { id: "recrutamento", roles: ["RH", "DP"], name: "Gestor de Recrutamento", description: "Vagas, currículos e candidatos.", url: INTRANET + "/rh/", icon: "users", group: "RH", keycloakGroup: "GS_App_recrutamento", integration: "sso", status: "disponivel" },
];

export const OTHER_GROUP = "Outros";

/** Grupos derivados da lista, na ordem em que aparecem. Apps sem grupo caem em "Outros". */
export function deriveGroups(list: AppItemData[]): string[] {
  return [...new Set(list.map((a) => a.group || OTHER_GROUP))];
}

export type AppTone = "geral" | "monitoramento" | "comercial" | "tecnico" | "rh";
const ROLE_TONE: Record<string, AppTone> = {
  Monitoramento: "monitoramento", Frota: "monitoramento", Operacional: "monitoramento",
  Comercial: "comercial", "Licitações": "comercial", Marketing: "comercial",
  "Técnico": "tecnico", RH: "rh", DP: "rh",
};
/** Cor do ícone: sem funções = geral; com funções, a da primeira marcada. */
export function appTone(roles: string[] | undefined): AppTone {
  const first = roles?.[0];
  return (first && ROLE_TONE[first]) || "geral";
}
