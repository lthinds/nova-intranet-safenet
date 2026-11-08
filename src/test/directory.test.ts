import { describe, expect, it } from "vitest";
import { canSeeHrData, daysToNextBirthday, matches, publicEntry, readStats, tenureYears, toggleFavorite } from "@/lib/directory";

describe("diretório", () => {
  it("só RH e DP veem aniversários e tempo de casa", () => {
    expect(canSeeHrData(["RH"])).toBe(true);
    expect(canSeeHrData(["DP", "Comercial"])).toBe(true);
    expect(canSeeHrData(["Coordenação"])).toBe(false);
    expect(canSeeHrData(["Marketing"])).toBe(false);
  });
  it("dados públicos não levam datas pessoais", () => {
    const e = publicEntry({ name: "A", email: "a@x", area: "X", roles: [], birthDate: "1990-01-01", hireDate: "2020-01-01" });
    expect("birthDate" in e).toBe(false);
    expect("hireDate" in e).toBe(false);
  });
  it("tempo de casa e próximo aniversário", () => {
    const now = new Date(2026, 9, 26);
    expect(tenureYears("2020-10-27", now)).toBe(5);
    expect(tenureYears("2020-10-26", now)).toBe(6);
    expect(daysToNextBirthday("1990-10-26", now)).toBe(0);
    expect(daysToNextBirthday("1990-10-28", now)).toBe(2);
  });
  it("busca ignora acentos e exige todas as palavras", () => {
    expect(matches("Licitações e pregões", "licitacoes")).toBe(true);
    expect(matches("Ponto Pontotel", "ponto webmail")).toBe(false);
  });
  it("favoritar alterna", () => {
    expect(toggleFavorite(["a"], "a")).toEqual([]);
    expect(toggleFavorite([], "a")).toEqual(["a"]);
  });
  it("contagem de leitura", () => {
    expect(readStats([{ email: "a" }, { email: "b" }], { a: ["n1"] }, "n1")).toEqual({ read: 1, total: 2, pending: 1 });
  });
});

import { identityFromLogin } from "@/lib/directory";
describe("identidade a partir do login", () => {
  it("gera nome e e-mail corporativo de nome.sobrenome", () => {
    expect(identityFromLogin("novo.colaborador")).toEqual({ name: "Joao Pereira", email: "novo.colaborador@safenettecnologia.com.br" });
  });
});
