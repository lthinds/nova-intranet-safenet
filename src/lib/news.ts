/** Feeds RSS aprovados pelo gestor para o quadro de notícias da visão geral. */
export const NEWS_SOURCES = [
  { name: "Canaltech", url: "https://canaltech.com.br/rss/seguranca/" },
  { name: "G1 Tecnologia", url: "https://g1.globo.com/rss/g1/tecnologia/" },
  { name: "Olhar Digital", url: "https://olhardigital.com.br/editorias/seguranca/feed/" },
  { name: "TecMundo", url: "https://rss.tecmundo.com.br/feed" },
  { name: "IP News", url: "https://ipnews.com.br/feed/" },
] as const;

export type NewsItem = { title: string; url: string; source: string; date: string; image?: string | undefined };

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();

function tag(block: string, name: string) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1] ?? "") : "";
}

/** Extrai itens de um RSS, com a imagem vinda de media:content, enclosure ou o primeiro <img> do texto. */
export function parseRss(xml: string, source: string, limit = 4): NewsItem[] {
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  return items.slice(0, limit).map((block) => {
    const image =
      block.match(/<media:(?:content|thumbnail)[^>]*url="([^"]+)"/i)?.[1] ??
      block.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i)?.[1] ??
      decode(block).match(/<img[^>]*src=["']([^"']+)["']/i)?.[1];
    const pub = tag(block, "pubDate");
    const d = pub ? new Date(pub) : null;
    return {
      title: tag(block, "title").replace(/<[^>]+>/g, ""),
      url: tag(block, "link"),
      source,
      date: d && !isNaN(d.getTime()) ? d.toISOString() : "",
      image: image ? decode(image) : undefined,
    };
  }).filter((i) => i.title && i.url.startsWith("http"));
}

/** Intercala as fontes por data, mais recentes primeiro. */
export function mergeNews(lists: NewsItem[][], limit = 10) {
  return lists.flat().sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}
