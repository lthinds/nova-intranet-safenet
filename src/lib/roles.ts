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
  { id: "monitoramento", name: "Monitoramento", apps: [], permissions: [] },
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
