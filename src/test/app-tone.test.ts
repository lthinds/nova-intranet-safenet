import { describe, expect, it } from "vitest";
import { appTone } from "@/data/apps";
describe("cor do ícone por função", () => {
  it("sem funções = acesso geral", () => expect(appTone([])).toBe("geral"));
  it("várias funções usam a cor da primeira marcada", () => {
    expect(appTone(["Comercial", "Monitoramento"])).toBe("comercial");
    expect(appTone(["Monitoramento", "Comercial"])).toBe("monitoramento");
  });
  it("RH e DP compartilham magenta", () => expect(appTone(["DP"])).toBe("rh"));
});
