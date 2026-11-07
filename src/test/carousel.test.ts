import { describe, it, expect } from "vitest";
import { carouselItems, makeSeedAnnouncements, type Announcement } from "@/components/portal-communications";

const now = new Date("2026-11-07T12:00:00Z");
const base = (id: string, o: Partial<Announcement>): Announcement => ({ id, title: id, summary: "", body: "", sector: "RH", author: "RH", publishedAt: "2026-11-06T00:00:00Z", expiresAt: "2026-11-20T00:00:00Z", mandatory: false, ...o });

describe("carrossel da página inicial", () => {
  it("mostra só avisos marcados como destaque", () => {
    const r = carouselItems([base("a", { featured: true }), base("b", {})], now);
    expect(r.map((x) => x.id)).toEqual(["a"]);
  });
  it("destaque expirado sai do carrossel", () => {
    const r = carouselItems([base("a", { featured: true, expiresAt: "2026-11-01T00:00:00Z" }), base("b", {})], now);
    expect(r.map((x) => x.id)).toEqual(["b"]);
  });
  it("sem destaques, mostra os 4 avisos ativos mais recentes", () => {
    expect(carouselItems(makeSeedAnnouncements(now).map((a) => ({ ...a, featured: false })), now)).toHaveLength(4);
  });
});
