import { describe, expect, it } from "vitest";
import { countMembers, deleteRole, hasPermission, seedRoles, wouldLockOut } from "@/lib/roles";

const people = [{ roles: ["RH", "DP"] }, { roles: ["RH"] }, { roles: ["Técnico"] }];

describe("cargos", () => {
  it("Frota e Supervisor existem nos cargos iniciais", () => {
    expect(seedRoles.map((r) => r.name)).toEqual(expect.arrayContaining(["Frota", "Supervisor"]));
  });
  it("só Coordenação gerencia cargos inicialmente", () => {
    expect(seedRoles.filter((r) => r.permissions.includes("gerenciar_cargos")).map((r) => r.name)).toEqual(["Coordenação"]);
    expect(hasPermission(["RH"], seedRoles, "gerenciar_cargos")).toBe(false);
  });
  it("liberar a permissão a outro cargo dá acesso a ele", () => {
    const roles = seedRoles.map((r) => (r.name === "RH" ? { ...r, permissions: [...r.permissions, "gerenciar_cargos" as const] } : r));
    expect(hasPermission(["RH"], roles, "gerenciar_cargos")).toBe(true);
  });
  it("conta colaboradores do cargo", () => {
    expect(countMembers("RH", people)).toBe(2);
  });
  it("excluir desvincula o cargo dos colaboradores", () => {
    const res = deleteRole("rh", seedRoles, people);
    expect(res.roles.some((r) => r.name === "RH")).toBe(false);
    expect(res.people[0]!.roles).toEqual(["DP"]);
  });
  it("detecta quando ninguém mais poderia gerenciar cargos", () => {
    expect(wouldLockOut(deleteRole("coordenacao", seedRoles, people).roles)).toBe(true);
  });
});
