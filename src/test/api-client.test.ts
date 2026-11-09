import { describe, expect, it } from "vitest";
import { apiEnabled, request, withFallback } from "@/lib/api-client";

describe("api-client sem servidor configurado", () => {
  it("fica desligado sem VITE_API_BASE_URL", () => {
    expect(apiEnabled()).toBe(false);
  });
  it("request devolve null e não chama a rede", async () => {
    let called = false;
    const r = await request("GET", "/avisos", undefined, (async () => { called = true; return new Response("[]"); }) as typeof fetch);
    expect(r).toBeNull();
    expect(called).toBe(false);
  });
  it("withFallback usa os dados locais quando a API falha", async () => {
    expect(await withFallback(async () => { throw new Error("offline"); }, ["local"])).toEqual(["local"]);
    expect(await withFallback(async () => null, 7)).toBe(7);
  });
});
