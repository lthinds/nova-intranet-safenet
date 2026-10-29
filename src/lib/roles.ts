export type PortalPermission = "gerenciar_cargos" | "publicar_avisos" | "gerenciar_colaboradores" | "gerenciar_aplicacoes";

export const permissionLabels: Record<PortalPermission, { label: string; description: string }> = {
  gerenciar_cargos: { label: "Gerenciar cargos e permissões", description: "Ver e usar esta área: criar, editar e excluir cargos." },
  publicar_avisos: { label: "Publicar avisos", description: "Criar e editar comunicados, inclusive em tela cheia." },
  gerenciar_colaboradores: { label: "Gerenciar colaboradores", description: "Aprovar cadastros, atribuir cargos e bloquear contas." },
  gerenciar_aplicacoes: { label: "Gerenciar aplicações", description: "Cadastrar e configurar ferramentas do catálogo." },
};

export type Role = { id: string; name: string; apps: string[]; permissions: PortalPermission[] };

export const seedRoles: Role[] = [
  { id: "coordenacao", name: "Coordenação", apps: [], permissions: ["gerenciar_cargos", "publicar_avisos", "gerenciar_colaboradores", "gerenciar_aplicacoes"] },
  { id: "rh", name: "RH", apps: [], permissions: ["publicar_avisos"] },
  { id: "dp", name: "DP", apps: [], permissions: ["publicar_avisos"] },
  { id: "marketing", name: "Marketing", apps: [], permissions: ["publicar_avisos"] },
  { id: "monitoramento", name: "Monitoramento", apps: ["frota"], permissions: [] },
  { id: "frota", name: "Frota", apps: ["frota"], permissions: [] },
  { id: "supervisor", name: "Supervisor", apps: [], permissions: [] },
  { id: "operacional", name: "Operacional", apps: [], permissions: [] },
  { id: "comercial", name: "Comercial", apps: [], permissions: [] },
  { id: "licitacoes", name: "Licitações", apps: [], permissions: [] },
  { id: "tecnico", name: "Técnico", apps: [], permissions: [] },
];

export function hasPermission(userRoles: string[], roles: Role[], perm: PortalPermission) {
  return roles.some((r) => userRoles.includes(r.name) && r.permissions.includes(perm));
}

export function countMembers(roleName: string, people: Array<{ roles: string[] }>) {
  return people.filter((p) => p.roles.includes(roleName)).length;
}

/** Remove the role and unlink it from every person. */
export function deleteRole<P extends { roles: string[] }>(roleId: string, roles: Role[], people: P[]) {
  const target = roles.find((r) => r.id === roleId);
  if (!target) return { roles, people };
  return { roles: roles.filter((r) => r.id !== roleId), people: people.map((p) => ({ ...p, roles: p.roles.filter((n) => n !== target.name) })) };
}

/** True when deleting/editing would leave no role able to manage roles. */
export function wouldLockOut(roles: Role[]) {
  return !roles.some((r) => r.permissions.includes("gerenciar_cargos"));
}

/** Cargo modificador: sozinho não concede nada; somado a uma área, dá poderes de supervisão nela. */
export const SUPERVISOR = "Supervisor";
/** Cargos que não são áreas operacionais supervisionáveis. */
const NON_AREAS = [SUPERVISOR, "Coordenação"];

/** Áreas que o colaborador supervisiona (pode ser mais de uma). Coordenação supervisiona todas. */
export function supervisedAreas(userRoles: string[], allAreas: string[]): string[] {
  if (userRoles.includes("Coordenação")) return allAreas;
  if (!userRoles.includes(SUPERVISOR)) return [];
  return userRoles.filter((r) => !NON_AREAS.includes(r) && allAreas.includes(r));
}

export function canManageArea(userRoles: string[], area: string, allAreas: string[]) {
  return supervisedAreas(userRoles, allAreas).includes(area);
}
