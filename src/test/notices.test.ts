import { describe, expect, it } from "vitest";
import { computeExpiration, isActive, type Announcement } from "@/components/portal-communications";

const base = new Date("2026-10-19T12:00:00Z");

describe("expiração de avisos", () => {
  it("24 horas expira um dia após a publicação", () => {
    expect(computeExpiration(base, "1")).toBe("2026-10-20T12:00:00.000Z");
  });
  it("30 dias expira 30 dias após a publicação", () => {
    expect(computeExpiration(base, "30")).toBe("2026-11-18T12:00:00.000Z");
  });
  it("aviso expirado deixa de ser vigente", () => {
    const item = { expiresAt: "2026-10-18T00:00:00.000Z" } as Announcement;
    expect(isActive(item, base)).toBe(false);
  });
});

import { isRecipient, type Announcement } from "@/components/portal-communications";
describe("notice audience", () => {
  const base = { id: "x", title: "t", summary: "s", body: "b", sector: "RH", author: "RH", publishedAt: "", expiresAt: "", mandatory: true } as Announcement;
  const user = { name: "Ana", email: "ana@x.com", roles: ["Frota", "Técnico"] };
  it("everyone receives company-wide notices", () => expect(isRecipient(base, user)).toBe(true));
  it("role audience matches any of the user's roles", () => {
    expect(isRecipient({ ...base, audience: { mode: "funcoes", roles: ["Técnico"] } }, user)).toBe(true);
    expect(isRecipient({ ...base, audience: { mode: "funcoes", roles: ["RH"] } }, user)).toBe(false);
  });
  it("individual audience only reaches listed people", () => {
    expect(isRecipient({ ...base, audience: { mode: "individual", people: ["ana@x.com"] } }, user)).toBe(true);
    expect(isRecipient({ ...base, audience: { mode: "individual", people: ["bob@x.com"] } }, user)).toBe(false);
  });
});
