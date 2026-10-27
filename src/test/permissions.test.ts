import { describe, expect, it } from "vitest";
import { viewsAllowed } from "@/components/portal-prototype";
import { hasPermission, seedRoles } from "@/lib/roles";

const perms = (roles: string[]) => ({
  canManageRoles: hasPermission(roles, seedRoles, "gerenciar_cargos"),
  canManagePeople: hasPermission(roles, seedRoles, "gerenciar_colaboradores"),
  canManageApps: hasPermission(roles, seedRoles, "gerenciar_aplicacoes"),
});

describe("abas por permissão", () => {
  it("coordenação vê todas as áreas administrativas", () => {
    expect(viewsAllowed(perms(["Coordenação"]))).toEqual(expect.arrayContaining(["colaboradores", "acessos", "gestao", "cargos"]));
  });
  it("operacional não vê áreas administrativas", () => {
    const v = viewsAllowed(perms(["Operacional", "Monitoramento"]));
    expect(v).not.toContain("colaboradores");
    expect(v).not.toContain("gestao");
    expect(v).not.toContain("cargos");
  });
  it("RH publica avisos mas não gerencia colaboradores", () => {
    expect(hasPermission(["RH"], seedRoles, "publicar_avisos")).toBe(true);
    expect(viewsAllowed(perms(["RH"]))).not.toContain("colaboradores");
  });
});

describe("aniversários e tempo de casa", () => {
  it("aparece só para RH e DP", () => {
    expect(viewsAllowed({ ...perms(["RH"]), canSeeHr: true })).toContain("aniversarios");
    expect(viewsAllowed(perms(["Coordenação"]))).not.toContain("aniversarios");
  });
});
