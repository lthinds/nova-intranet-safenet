import { describe, expect, it } from "vitest";
import { canSeeManual, seedManuals } from "@/components/ops-views";
const rh = seedManuals.find((m) => m.area === "RH")!;
describe("segmentação de manuais", () => {
  it("operador de monitoramento não vê manual do RH", () => expect(canSeeManual(rh, ["Monitoramento"], [])).toBe(false));
  it("equipe do RH vê manual do RH", () => expect(canSeeManual(rh, ["RH"], [])).toBe(true));
  it("Coordenação (gerencia todas as áreas) vê", () => expect(canSeeManual(rh, ["Coordenação"], ["RH"])).toBe(true));
});
