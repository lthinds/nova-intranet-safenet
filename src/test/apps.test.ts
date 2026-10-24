import { describe, expect, it } from "vitest";
import { deriveGroups, type AppItemData } from "@/data/apps";

const base = { description: "", url: "", icon: "x", integration: "link", status: "disponivel" } as const;

describe("deriveGroups", () => {
  it("adds a new group automatically and puts ungrouped apps in Outros", () => {
    const list: AppItemData[] = [
      { ...base, id: "a", name: "A", group: "Operacional" },
      { ...base, id: "b", name: "B", group: "Financeiro" },
      { ...base, id: "c", name: "C" },
      { ...base, id: "d", name: "D", group: "Operacional" },
    ];
    expect(deriveGroups(list)).toEqual(["Operacional", "Financeiro", "Outros"]);
  });
});

import { canSeeApp } from "@/lib/keycloak";
describe("visibilidade por grupo do Keycloak", () => {
  it("esconde app com grupo GS_App que o usuário não tem", () => {
    expect(canSeeApp({ keycloakGroup: "GS_App_frota" }, ["GS_App_pregoes"])).toBe(false);
  });
  it("mostra app quando o usuário tem o grupo (com ou sem barra inicial)", () => {
    expect(canSeeApp({ keycloakGroup: "GS_App_frota" }, ["/GS_App_frota"])).toBe(true);
  });
  it("app sem grupo é visível para todos", () => {
    expect(canSeeApp({}, [])).toBe(true);
  });
});
