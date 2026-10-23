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
