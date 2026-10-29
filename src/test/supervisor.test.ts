import { describe, expect, it } from "vitest";
import { canManageArea, supervisedAreas } from "@/lib/roles";

const areas = ["Monitoramento", "Frota", "Operacional", "RH", "Técnico"];

describe("supervisor somado por área", () => {
  it("Supervisor sozinho não supervisiona nada", () => expect(supervisedAreas(["Supervisor"], areas)).toEqual([]));
  it("área sem Supervisor não dá poder de edição", () => expect(canManageArea(["Monitoramento"], "Monitoramento", areas)).toBe(false));
  it("Supervisor + Monitoramento edita Monitoramento, não Operacional", () => {
    expect(canManageArea(["Supervisor", "Monitoramento"], "Monitoramento", areas)).toBe(true);
    expect(canManageArea(["Supervisor", "Monitoramento"], "Operacional", areas)).toBe(false);
  });
  it("Supervisor de Operacional não ajusta a escala do Monitoramento", () => expect(canManageArea(["Supervisor", "Operacional"], "Monitoramento", areas)).toBe(false));
  it("um supervisor pode supervisionar várias áreas", () => expect(supervisedAreas(["Supervisor", "Monitoramento", "Frota"], areas)).toEqual(["Monitoramento", "Frota"]));
  it("Coordenação gerencia todas as áreas", () => expect(supervisedAreas(["Coordenação"], areas)).toEqual(areas));
});
