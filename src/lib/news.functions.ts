import { createServerFn } from "@tanstack/react-start";
import { NEWS_SOURCES, mergeNews, parseRss } from "@/lib/news";

/** Busca as notícias no servidor (os portais não permitem leitura direta pelo navegador). */
export const getNews = createServerFn({ method: "GET" }).handler(async () => {
  const lists = await Promise.all(NEWS_SOURCES.map(async (s) => {
    try {
      const res = await fetch(s.url, { headers: { "User-Agent": "Mozilla/5.0 (Safenet Intranet)" }, signal: AbortSignal.timeout(8000) });
      if (!res.ok) return [];
      return parseRss(await res.text(), s.name, 2);
    } catch { return []; }
  }));
  return mergeNews(lists, 10);
});
