import { describe, expect, it } from "vitest";
import { recordUse, topUsed } from "@/lib/directory";
import { defaultShift, shiftFor, validateResume } from "@/components/ops-views";
import { parseRss } from "@/lib/news";

describe("usadas frequentemente", () => {
  it("mostra no máximo 6, das mais abertas para as menos", () => {
    const apps = Array.from({ length: 8 }, (_, i) => ({ id: `a${i}`, name: `App ${i}` }));
    let u: Record<string, number> = {};
    apps.forEach((a, i) => { for (let k = 0; k <= i; k++) u = recordUse(u, a.id); });
    const top = topUsed(apps, u, 6);
    expect(top).toHaveLength(6);
    expect(top[0]!.id).toBe("a7");
  });
  it("ignora apps nunca abertas", () => {
    expect(topUsed([{ id: "x", name: "X" }], {}, 6)).toEqual([]);
  });
});

describe("escala 12x36", () => {
  it("a mesma equipe não trabalha em dias seguidos", () => {
    expect(defaultShift("2026-11-01", "Diurno").operators).not.toEqual(defaultShift("2026-11-02", "Diurno").operators);
    expect(defaultShift("2026-11-01", "Diurno").operators).toEqual(defaultShift("2026-11-03", "Diurno").operators);
  });
  it("ajuste manual substitui o rodízio só naquele dia", () => {
    const o = [{ date: "2026-11-05", turno: "Noturno" as const, operators: ["Fulano"], supervisor: "S" }];
    expect(shiftFor(o, "2026-11-05", "Noturno").operators).toEqual(["Fulano"]);
    expect(shiftFor(o, "2026-11-05", "Diurno").operators).not.toEqual(["Fulano"]);
  });
});

describe("currículo", () => {
  it("aceita PDF, Word e imagem até 10 MB", () => {
    for (const n of ["cv.pdf", "cv.docx", "cv.doc", "cv.jpg", "cv.png"]) expect(validateResume({ name: n, size: 1024 })).toBeNull();
  });
  it("recusa acima de 10 MB e outros formatos", () => {
    expect(validateResume({ name: "cv.pdf", size: 10 * 1024 * 1024 + 1 })).not.toBeNull();
    expect(validateResume({ name: "cv.exe", size: 10 })).not.toBeNull();
  });
});

describe("feed de notícias", () => {
  it("lê título, link e miniatura do RSS", () => {
    const xml = `<rss><channel><item><title><![CDATA[Nova câmera]]></title><link>https://x.com/a</link><pubDate>Fri, 30 Oct 2026 10:00:00 GMT</pubDate><media:content url="https://x.com/i.jpg" /></item></channel></rss>`;
    const [n] = parseRss(xml, "Canaltech");
    expect(n).toMatchObject({ title: "Nova câmera", url: "https://x.com/a", image: "https://x.com/i.jpg", source: "Canaltech" });
  });
});

import { buildMonth } from "@/components/ops-views";
describe("montagem de escala", () => {
  it("aplica equipe ímpar nos dias ímpares e par nos pares do mês", () => {
    const tpl = { count: 1, slots: { impar: { Diurno: ["A"], Noturno: ["B"] }, par: { Diurno: ["C"], Noturno: ["D"] } } };
    const m = buildMonth(2026, 10, tpl);
    expect(m).toHaveLength(60);
    expect(m.find((s) => s.date === "2026-11-03" && s.turno === "Diurno")!.operators).toEqual(["A"]);
    expect(m.find((s) => s.date === "2026-11-04" && s.turno === "Noturno")!.operators).toEqual(["D"]);
  });
});
