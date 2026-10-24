// Integração com o login único (Keycloak atrás de proxy OIDC).
// O portal não tem tela de login: o proxy autentica antes e expõe os endpoints abaixo.


export const USERINFO_URL = "/oauth2/userinfo";
export const SIGN_OUT_URL = "/oauth2/sign_out";
export const APP_GROUP_PREFIX = "GS_App_";

/** Rotas abertas, sem login (o proxy deve liberá-las). */
export const PUBLIC_ROUTES = ["/candidatura", "/autoavaliacao"];

export interface UserInfo {
  name: string;
  email: string;
  preferred_username?: string;
  groups: string[];
}

/** Um app sem grupo é visível para todos; com grupo, só para quem o possui. */
export function canSeeApp(app: { keycloakGroup?: string | undefined }, groups: string[]): boolean {
  if (!app.keycloakGroup) return true;
  const normalized = groups.map((g) => g.replace(/^\//, ""));
  return normalized.includes(app.keycloakGroup);
}

/** Em produção lê /oauth2/userinfo; no protótipo, sem proxy, usa um perfil de demonstração. */
export async function fetchUserInfo(fallback: UserInfo): Promise<{ user: UserInfo; demo: boolean }> {
  try {
    const res = await fetch(USERINFO_URL, { credentials: "include" });
    if (!res.ok || !res.headers.get("content-type")?.includes("json")) throw new Error("sem proxy");
    const data = await res.json();
    return { user: { name: data.name ?? data.preferred_username ?? data.email, email: data.email, preferred_username: data.preferred_username, groups: data.groups ?? [] }, demo: false };
  } catch {
    return { user: fallback, demo: true };
  }
}

/** Perfis de demonstração para a apresentação (simulam respostas do /oauth2/userinfo). */
export const demoProfiles: Array<UserInfo & { label: string; roles: string[] }> = [
  { label: "Coordenadora", name: "Marina Alves", email: "marina.alves@empresa.com.br", roles: ["Coordenação", "Monitoramento"], groups: ["GS_App_frota", "GS_App_rel-monitoramento", "GS_App_monitoramento", "GS_App_dash-comercial", "GS_App_pregoes", "GS_App_painel-licitacoes", "GS_App_manuais", "GS_App_recrutamento"] },
  { label: "Operador de monitoramento", name: "Rafael Costa", email: "rafael.costa@empresa.com.br", roles: ["Operacional", "Monitoramento"], groups: ["GS_App_monitoramento", "GS_App_rel-monitoramento", "GS_App_frota"] },
  { label: "Comercial", name: "Beatriz Lima", email: "beatriz.lima@empresa.com.br", roles: ["Comercial", "Licitações"], groups: ["GS_App_dash-comercial", "GS_App_pregoes", "GS_App_painel-licitacoes"] },
];
