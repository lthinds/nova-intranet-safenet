import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  ExternalLink,
  ImageIcon,
  Pencil,
  Upload,
  X,
  Youtube,
  GraduationCap,
  HeartHandshake,
  Megaphone,
  Pause,
  Play,
  Plus,
  ScrollText,
  ShieldAlert,
  Users,
} from "lucide-react";

import markAsset from "@/assets/safenet-mark.png.asset.json";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const safenetMarkUrl = markAsset.url;

export type Sector = "RH" | "DP" | "Marketing" | "Coordenação";
export const publisherSectors: Sector[] = ["Coordenação", "RH", "DP", "Marketing"];

export type Announcement = {
  id: string;
  title: string;
  summary: string;
  body: string;
  sector: Sector;
  author: string;
  publishedAt: string;
  expiresAt: string;
  mandatory: boolean;
  imageUrl?: string | undefined;
  videoUrl?: string | undefined;
  audience?: Audience | undefined;
  /** Shown in the home carousel while active. */
  featured?: boolean | undefined;
  /** Short label on the carousel card, e.g. "Novo benefício". */
  tag?: string | undefined;
};

export const FEATURE_TAGS = ["Comunicado", "Novo benefício", "Política interna", "Reunião", "Evento", "Campanha"];

/** Carousel content: active featured notices for the viewer; falls back to the 4 most recent active ones. */
export function carouselItems(items: Announcement[], now: Date, canSee: (a: Announcement) => boolean = () => true) {
  const active = sortByDateDesc(items).filter((a) => isActive(a, now) && canSee(a));
  const featured = active.filter((a) => a.featured);
  return featured.length ? featured : active.slice(0, 4);
}

/** Who receives a notice: everyone, anyone holding one of the roles, or specific people (by e-mail). */
export type Audience = { mode: "todos" } | { mode: "funcoes"; roles: string[] } | { mode: "individual"; people: string[] };
export type Recipient = { name: string; email: string; roles: string[] };

export function isRecipient(item: Announcement, user: Recipient) {
  const a = item.audience ?? { mode: "todos" };
  if (a.mode === "todos") return true;
  if (a.mode === "funcoes") return a.roles.some((r) => user.roles.includes(r));
  return a.people.includes(user.email);
}

export function audienceLabel(a: Audience | undefined) {
  if (!a || a.mode === "todos") return "Público: toda a empresa";
  if (a.mode === "funcoes") return `Funções: ${a.roles.join(", ")}`;
  return `${a.people.length} ${a.people.length === 1 ? "destinatário" : "destinatários"} específicos`;
}

function AudiencePicker({ value, onChange, roles, directory }: { value: Audience; onChange: (a: Audience) => void; roles: string[]; directory: Recipient[] }) {
  const [query, setQuery] = useState("");
  const modes: [Audience["mode"], string][] = [["todos", "Toda a empresa"], ["funcoes", "Por função"], ["individual", "Colaboradores específicos"]];
  const selected = value.mode === "individual" ? value.people : [];
  const suggestions = query.trim() ? directory.filter((p) => !selected.includes(p.email) && `${p.name} ${p.email}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6) : [];
  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="flex items-center gap-2 text-xs font-bold"><Users className="size-4 text-primary" />Quem recebe este aviso</p>
      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
        {modes.map(([m, label]) => (
          <button key={m} type="button" role="radio" aria-checked={value.mode === m} onClick={() => value.mode !== m && onChange(m === "todos" ? { mode: "todos" } : m === "funcoes" ? { mode: "funcoes", roles: [] } : { mode: "individual", people: [] })} className={cn("rounded-md border px-3 py-2 text-left text-xs font-semibold transition-colors", value.mode === m ? "border-primary bg-accent text-foreground" : "text-muted-foreground hover:bg-muted")}>
            <span className={cn("mr-2 inline-block size-2.5 rounded-full border", value.mode === m && "border-primary bg-primary")} />{label}
          </button>
        ))}
      </div>
      {value.mode === "todos" && <p className="text-xs text-muted-foreground">Será exibido para todos os {directory.length} colaboradores cadastrados.</p>}
      {value.mode === "funcoes" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {roles.map((r) => { const on = value.roles.includes(r); return <button key={r} type="button" aria-pressed={on} onClick={() => onChange({ mode: "funcoes", roles: on ? value.roles.filter((x) => x !== r) : [...value.roles, r] })} className={cn("rounded-full border px-3 py-1 text-xs font-medium", on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>{r}</button>; })}
          </div>
          <p className="text-xs text-muted-foreground">{value.roles.length ? `Recebem: quem tiver qualquer uma das ${value.roles.length} funções marcadas.` : "Marque ao menos uma função."}</p>
        </div>
      )}
      {value.mode === "individual" && (
        <div className="space-y-2">
          {!!selected.length && <div className="flex flex-wrap gap-1.5">{selected.map((email) => { const p = directory.find((d) => d.email === email); return <span key={email} className="inline-flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-xs font-medium">{p?.name ?? email}<button type="button" aria-label={`Remover ${p?.name ?? email}`} onClick={() => onChange({ mode: "individual", people: selected.filter((x) => x !== email) })}><X className="size-3" /></button></span>; })}</div>}
          <div className="relative">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Digite o nome ou e-mail do colaborador" />
            {!!suggestions.length && <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">{suggestions.map((p) => <li key={p.email}><button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { onChange({ mode: "individual", people: [...selected, p.email] }); setQuery(""); }}><strong className="block">{p.name}</strong><span className="text-xs text-muted-foreground">{p.email}</span></button></li>)}</ul>}
          </div>
          {!selected.length && <p className="text-xs text-muted-foreground">Adicione ao menos um colaborador.</p>}
        </div>
      )}
    </div>
  );
}

/** Extracts the video id from common YouTube link formats. */
export function youtubeId(url: string): string | null {
  const m = url.trim().match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

export function NoticeBody({ item }: { item: Announcement }) {
  const vid = item.videoUrl ? youtubeId(item.videoUrl) : null;
  return (
    <div className="mt-3 space-y-3">
      {item.imageUrl && <img src={item.imageUrl} alt="" className="max-h-80 w-full rounded-md border object-cover" />}
      {item.body.split(/\n\s*\n/).map((p, i) => <p key={i} className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{p}</p>)}
      {vid && <div className="aspect-video overflow-hidden rounded-md border"><iframe className="size-full" src={`https://www.youtube-nocookie.com/embed/${vid}`} title="Vídeo do aviso" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen /></div>}
    </div>
  );
}

const DAY = 86_400_000;

export function isActive(item: Announcement, now: Date) {
  return new Date(item.expiresAt).getTime() > now.getTime();
}

/** Expiration chosen by the publisher at creation time. */
export function computeExpiration(publishedAt: Date, option: string, customDate?: string) {
  if (option === "custom" && customDate) return new Date(`${customDate}T23:59:00`).toISOString();
  const days = { "1": 1, "7": 7, "15": 15, "30": 30 }[option] ?? 7;
  return new Date(publishedAt.getTime() + days * DAY).toISOString();
}

export function sortByDateDesc(items: Announcement[]) {
  return [...items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function makeSeedAnnouncements(now: Date): Announcement[] {
  const at = (offsetDays: number) => new Date(now.getTime() + offsetDays * DAY).toISOString();
  return [
    { id: "a1", title: "Novo protocolo de bloqueio de credenciais", summary: "A partir de segunda, todo acesso suspenso deve ser comunicado à coordenação em até 1 hora.", body: "Para reforçar a segurança operacional, qualquer suspeita de uso indevido de credenciais deve ser reportada imediatamente à coordenação de plantão. O bloqueio será aplicado no portal e encerrará as sessões nos sistemas próprios. Leia o procedimento completo no manual operacional.", sector: "Coordenação", author: "Marina Alves", publishedAt: at(-0.2), expiresAt: at(10), mandatory: true },
    { id: "a2", title: "Prazo de entrega dos documentos do plano de saúde", summary: "Envie a documentação dos dependentes até sexta-feira para garantir a inclusão.", body: "Colaboradores que desejam incluir dependentes no novo plano de saúde devem entregar a documentação ao DP até sexta-feira. Após o prazo, a inclusão ficará para o próximo ciclo.", sector: "DP", author: "Departamento Pessoal", publishedAt: at(-1), expiresAt: at(4), mandatory: true },
    { id: "a3", title: "Campanha Safenet Mais Segura", summary: "Nova identidade das viaturas e uniformes começa a circular este mês.", body: "O Marketing apresenta a campanha institucional do semestre. Veja as orientações de uso da marca nas viaturas, uniformes e redes sociais.", sector: "Marketing", author: "Marketing", publishedAt: at(-6), expiresAt: at(20), mandatory: false },
    { id: "a4", title: "Atualização do regulamento interno", summary: "Versão revisada com regras de uso de frota e de equipamentos.", body: "O regulamento interno foi revisado. Os principais pontos: uso de veículos fora do expediente, guarda de equipamentos e conduta em atendimento a clientes.", sector: "RH", author: "Recursos Humanos", publishedAt: at(-18), expiresAt: at(-3), mandatory: true },
    { id: "a5", title: "Telemedicina 24h para você e sua família", summary: "Consultas online sem custo, liberadas para todos os colaboradores e dependentes.", body: "Consultas online sem custo, liberadas para todos os colaboradores e dependentes.", sector: "RH", author: "Recursos Humanos", publishedAt: at(-2), expiresAt: at(30), mandatory: false, featured: true, tag: "Novo benefício" },
    { id: "a6", title: "Nova política de banco de horas", summary: "Compensação em até 90 dias e consulta do saldo direto no Ponto.", body: "Compensação em até 90 dias e consulta do saldo direto no Ponto.", sector: "DP", author: "Departamento Pessoal", publishedAt: at(-3), expiresAt: at(30), mandatory: false, featured: true, tag: "Política interna" },
    { id: "a7", title: "Alinhamento geral com as coordenações", summary: "Quinta, 14h, no auditório e com transmissão online para os plantões.", body: "Quinta, 14h, no auditório e com transmissão online para os plantões.", sector: "RH", author: "Recursos Humanos", publishedAt: at(-4), expiresAt: at(7), mandatory: false, featured: true, tag: "Reunião" },
    { id: "a8", title: "Confraternização de fim de ano", summary: "Inscrições abertas para colaboradores e acompanhantes até 30/11.", body: "Inscrições abertas para colaboradores e acompanhantes até 30/11.", sector: "RH", author: "Recursos Humanos", publishedAt: at(-5), expiresAt: at(40), mandatory: false, featured: true, tag: "Evento" },
  ];
}

type Tone = "green" | "magenta" | "cyan" | "orange";
const tagStyle: Record<string, { icon: ComponentType<{ className?: string }>; tone: Tone }> = {
  "Novo benefício": { icon: HeartHandshake, tone: "magenta" },
  "Política interna": { icon: ScrollText, tone: "cyan" },
  Reunião: { icon: Users, tone: "orange" },
  Evento: { icon: CalendarDays, tone: "green" },
  Campanha: { icon: Megaphone, tone: "orange" },
};
const sectorName: Record<Sector, string> = { RH: "Recursos Humanos", DP: "Departamento Pessoal", Marketing: "Marketing", Coordenação: "Coordenação" };

const toneClass: Record<Tone, string> = {
  green: "bg-brand-green text-hero-accent-foreground",
  magenta: "bg-brand-magenta text-hero-foreground",
  cyan: "bg-brand-cyan text-hero-accent-foreground",
  orange: "bg-brand-orange text-hero-foreground",
};

export function HeroCarousel({ onSearch, items, onOpen }: { onSearch: (q: string) => void; items: Announcement[]; onOpen?: (item: Announcement) => void }) {
  const posts = items;
  const [term, setTerm] = useState("");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (posts.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % posts.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused, posts.length]);

  const post = posts[index % Math.max(posts.length, 1)];
  const tag = post ? post.tag || "Comunicado" : "";
  const style = tagStyle[tag] ?? { icon: Megaphone, tone: "cyan" as Tone };
  const Icon = style.icon;
  const go = (step: number) => setIndex((value) => (value + step + posts.length) % posts.length);

  return (
    <section className="relative overflow-hidden rounded-xl bg-hero text-hero-foreground shadow-sm" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carrossel" aria-label="Atualizações do RH e DP">
      <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />
      <img src={safenetMarkUrl} alt="" aria-hidden="true" className="pointer-events-none absolute -right-10 -bottom-12 hidden size-72 opacity-15 md:block" />
      <div className="relative grid min-h-[280px] gap-6 p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:p-9">
        <div className="self-center">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase text-hero-accent"><span className="h-px w-6 bg-hero-accent" /> Central de aplicações</p>
          <h2 className="font-display max-w-md text-2xl font-bold leading-tight md:text-[34px]">Tudo o que você precisa, em um só lugar.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-hero-foreground/70">Acompanhe as novidades do RH e do DP e acesse suas ferramentas com segurança.</p>
          <form role="search" onSubmit={(e) => { e.preventDefault(); onSearch(term.trim()); }} className="mt-5 flex max-w-md gap-2"><input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Buscar aplicação, ferramenta..." aria-label="Buscar aplicações" className="h-10 min-w-0 flex-1 rounded-md border border-hero-foreground/20 bg-hero-foreground/10 px-3 text-sm text-hero-foreground placeholder:text-hero-foreground/50 outline-none focus:border-hero-accent" /><Button type="submit" variant="outline" className="h-10 border-hero-foreground/20 bg-transparent text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground">Buscar <ArrowRight /></Button></form>
        </div>
        {post && <article key={post.id} className="animate-in fade-in slide-in-from-right-4 self-center rounded-lg border border-hero-foreground/10 bg-hero-foreground/5 p-5 backdrop-blur-sm duration-500" aria-live={paused ? "polite" : "off"}>
          <div className="flex items-center gap-2">
            <span className={cn("grid size-9 place-items-center rounded-md", toneClass[style.tone])}><Icon className="size-4" /></span>
            <Badge className={cn("hover:opacity-100", toneClass[style.tone])}>{tag}</Badge>
            <span className="ml-auto text-[10px] font-bold uppercase text-hero-foreground/60">{sectorName[post.sector]}</span>
          </div>
          <h3 className="font-display mt-4 text-lg font-bold leading-snug md:text-xl">{onOpen ? <button className="text-left hover:underline" onClick={() => onOpen(post)}>{post.title}</button> : post.title}</h3>
          <p className="mt-2 text-sm leading-6 text-hero-foreground/75">{post.summary}</p>
          <div className="mt-5 flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-hero-foreground/60"><CalendarDays className="size-3.5" />Até {fmt(post.expiresAt)}</span>
            <div className="ml-auto flex items-center gap-1">
              <Button size="icon" variant="ghost" className="size-8 text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground" onClick={() => go(-1)} aria-label="Post anterior"><ChevronLeft /></Button>
              <Button size="icon" variant="ghost" className="size-8 text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground" onClick={() => setPaused((v) => !v)} aria-label={paused ? "Retomar carrossel" : "Pausar carrossel"}>{paused ? <Play /> : <Pause />}</Button>
              <Button size="icon" variant="ghost" className="size-8 text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground" onClick={() => go(1)} aria-label="Próximo post"><ChevronRight /></Button>
            </div>
          </div>
          <div className="mt-4 flex gap-1.5">{posts.map((item, i) => <button key={item.id} onClick={() => setIndex(i)} aria-label={`Ir para o post ${i + 1}`} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-hero-accent" : "w-1.5 bg-hero-foreground/30")} />)}</div>
        </article>}
      </div>
    </section>
  );
}

const sectorTone: Record<Sector, string> = {
  RH: "border-brand-magenta/30 bg-brand-magenta/10 text-brand-magenta",
  DP: "border-brand-cyan/30 bg-brand-cyan/10 text-primary",
  Marketing: "border-brand-orange/30 bg-brand-orange/10 text-brand-orange",
  Coordenação: "border-brand-green/30 bg-brand-green/10 text-success",
};

export function SectorBadge({ sector }: { sector: Sector }) {
  return <Badge variant="outline" className={sectorTone[sector]}>{sector}</Badge>;
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export function MandatoryNoticeOverlay({ items, onAcknowledge }: { items: Announcement[]; onAcknowledge: (id: string) => void }) {
  const [checked, setChecked] = useState(false);
  const current = items[0];
  useEffect(() => setChecked(false), [current?.id]);
  if (!current) return null;
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="mandatory-title" className="fixed inset-0 z-[80] grid place-items-center bg-overlay p-3 backdrop-blur-md sm:p-6">
      <div className="relative flex h-full max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-card text-card-foreground shadow-2xl sm:max-h-[calc(100vh-3rem)]">
        <div className="h-1.5 bg-brand-gradient" />
        <div className="grid flex-1 overflow-y-auto md:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
          <div className="relative flex flex-col justify-between gap-6 overflow-hidden bg-hero p-8 text-hero-foreground md:p-10">
            <img src={safenetMarkUrl} alt="" aria-hidden="true" className="absolute -bottom-16 -left-16 size-72 opacity-10" />
            <div className="relative flex items-center gap-3"><img src={safenetMarkUrl} alt="Safenet" className="size-10" /><div><strong className="font-display block tracking-[0.3em]">SAFENET</strong><span className="text-[10px] uppercase text-hero-foreground/60">Comunicado oficial</span></div></div>
            <div className="relative"><span className="grid size-14 place-items-center rounded-full bg-brand-orange text-hero-foreground"><ShieldAlert className="size-7" /></span><p className="mt-5 text-xs font-bold uppercase text-hero-accent">Leitura obrigatória</p><p className="mt-2 text-sm leading-6 text-hero-foreground/70">Este aviso precisa ser lido antes de acessar o portal. Depois, ele continua disponível na aba Avisos.</p></div>
            {items.length > 1 && <p className="relative text-xs text-hero-foreground/60">Aviso 1 de {items.length} pendentes</p>}
          </div>
          <div className="flex flex-col p-8 md:p-10">
            <div className="flex flex-wrap items-center gap-2"><SectorBadge sector={current.sector} /><span className="text-xs text-muted-foreground">Publicado em {fmt(current.publishedAt)} · por {current.author}</span></div>
            <h2 id="mandatory-title" className="font-display mt-4 text-2xl font-bold leading-tight md:text-4xl">{current.title}</h2>
            <p className="mt-4 text-base font-semibold leading-7">{current.summary}</p>
            <NoticeBody item={current} />
            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" /> Vigente até {fmt(current.expiresAt)}</p>
            <div className="mt-auto space-y-4 pt-8">
              <label className="flex items-center gap-3 rounded-md border p-4 text-sm"><Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} /> Li e estou ciente deste comunicado.</label>
              <Button size="lg" className="w-full" disabled={!checked} onClick={() => onAcknowledge(current.id)}>{items.length > 1 ? "Confirmar e ver próximo aviso" : "Confirmar e entrar no portal"} <ArrowRight /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NoticesView({ items, now, acknowledged, onCreate, onOpen, extra }: { items: Announcement[]; now: Date; acknowledged: string[]; onCreate?: (() => void) | undefined; onOpen: (item: Announcement) => void; extra?: ((item: Announcement) => React.ReactNode) | undefined }) {
  const [sector, setSector] = useState("todos");
  const [status, setStatus] = useState("todos");
  const list = useMemo(() => sortByDateDesc(items).filter((item) => (sector === "todos" || item.sector === sector) && (status === "todos" || (status === "vigente") === isActive(item, now))), [items, sector, status, now]);
  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-lg border border-info/20 bg-info-soft p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <span className="grid size-10 place-items-center rounded-md bg-info text-info-foreground"><Megaphone className="size-5" /></span>
        <div><strong className="text-sm">Coordenação, RH, DP e Marketing podem publicar avisos</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">Avisos obrigatórios aparecem em tela cheia logo após o login. Cada publicação define até quando fica vigente.</p></div>
        {onCreate && <Button onClick={onCreate}><Plus /> Novo aviso</Button>}
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select value={sector} onValueChange={setSector}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os setores</SelectItem>{publisherSectors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Vigentes e expirados</SelectItem><SelectItem value="vigente">Somente vigentes</SelectItem><SelectItem value="expirado">Somente expirados</SelectItem></SelectContent></Select>
      </div>
      <ol className="relative space-y-4 border-l pl-6">
        {list.map((item) => {
          const active = isActive(item, now);
          return (
            <li key={item.id} className="relative">
              <span className={cn("absolute -left-[31px] top-5 size-3 rounded-full ring-4 ring-background", active ? "bg-primary" : "bg-muted-foreground/40")} />
              <button onClick={() => onOpen(item)} className={cn("w-full rounded-lg border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md", !active && "opacity-70")}>
                <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold">{fmt(item.publishedAt)}</span><SectorBadge sector={item.sector} />{item.mandatory && <Badge variant="outline" className="border-brand-orange/30 bg-brand-orange/10 text-brand-orange"><BellRing className="mr-1 size-3" />Tela cheia no login</Badge>}<Badge variant="outline" className={active ? "border-success/20 bg-success-soft text-success" : "bg-muted text-muted-foreground"}>{active ? `Vigente até ${fmt(item.expiresAt)}` : `Expirou em ${fmt(item.expiresAt)}`}</Badge><Badge variant="outline"><Users className="mr-1 size-3" />{audienceLabel(item.audience)}</Badge>{acknowledged.includes(item.id) && <span className="text-[11px] text-muted-foreground">· Leitura confirmada</span>}{extra?.(item)}</div>
                <h3 className="font-display mt-3 text-base font-bold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                <span className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">Ler aviso completo <ArrowRight className="size-3" /></span>
              </button>
            </li>
          );
        })}
        {!list.length && <li className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum aviso para os filtros selecionados.</li>}
      </ol>
    </div>
  );
}

export function NoticeDetailDialog({ item, onClose, onEdit }: { item: Announcement | null; onClose: () => void; onEdit?: ((item: Announcement) => void) | undefined }) {
  if (!item) return null;
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto"><DialogHeader><div className="flex flex-wrap items-center gap-2"><SectorBadge sector={item.sector} /><span className="text-xs text-muted-foreground">{fmt(item.publishedAt)} · {item.author}</span></div><DialogTitle className="font-display pt-2 text-xl">{item.title}</DialogTitle><DialogDescription className="text-sm font-semibold text-foreground">{item.summary}</DialogDescription></DialogHeader><NoticeBody item={item} /><p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" />Vigência até {fmt(item.expiresAt)}</p><DialogFooter>{onEdit && <Button variant="outline" onClick={() => onEdit(item)}><Pencil />Editar aviso</Button>}<Button onClick={onClose}>Fechar</Button></DialogFooter></DialogContent></Dialog>;
}

export type NoticeDraft = Omit<Announcement, "id" | "publishedAt" | "expiresAt">;

export function CreateNoticeDialog({ open, editing, onClose, onCreate, onUpdate, roles = [], directory = [] }: { open: boolean; editing?: Announcement | null; onClose: () => void; onCreate: (item: NoticeDraft, expiration: string, customDate?: string) => void; onUpdate?: (item: Announcement) => void; roles?: string[]; directory?: Recipient[] }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [sector, setSector] = useState<Sector>("RH");
  const [mandatory, setMandatory] = useState(true);
  const [expiration, setExpiration] = useState("7");
  const [customDate, setCustomDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [audience, setAudience] = useState<Audience>({ mode: "todos" });
  const [featured, setFeatured] = useState(false);
  const [tag, setTag] = useState("Comunicado");

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? ""); setSummary(editing?.summary ?? ""); setBody(editing?.body ?? "");
    setSector(editing?.sector ?? "RH"); setMandatory(editing?.mandatory ?? true);
    setImageUrl(editing?.imageUrl ?? ""); setVideoUrl(editing?.videoUrl ?? "");
    setAudience(editing?.audience ?? { mode: "todos" });
    setFeatured(editing?.featured ?? false); setTag(editing?.tag ?? "Comunicado");
    setExpiration(editing ? "custom" : "7"); setCustomDate(editing ? editing.expiresAt.slice(0, 10) : "");
  }, [open, editing]);

  if (!open) return null;
  const audienceOk = audience.mode === "todos" || (audience.mode === "funcoes" ? audience.roles.length > 0 : audience.people.length > 0);
  const videoInvalid = videoUrl.trim() !== "" && !youtubeId(videoUrl);
  const valid = title.trim() && summary.trim() && audienceOk && !videoInvalid && (expiration !== "custom" || customDate);
  const onFile = (file?: File) => { if (!file) return; const r = new FileReader(); r.onload = () => setImageUrl(String(r.result)); r.readAsDataURL(file); };
  const draft: NoticeDraft = { title, summary, body: body || summary, sector, mandatory, author: sector === "Coordenação" ? "Marina Alves" : sector, imageUrl: imageUrl || undefined, videoUrl: videoUrl.trim() || undefined, audience, featured, tag: featured ? tag : undefined };
  const preview = { ...draft, id: "preview", publishedAt: new Date().toISOString(), expiresAt: new Date().toISOString() };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Editar aviso" : "Publicar novo aviso"}</DialogTitle><DialogDescription>Disponível para Coordenação, RH, DP e Marketing.</DialogDescription></DialogHeader>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,.9fr)]">
          <div className="space-y-4">
            <label className="block text-xs font-medium">Título<Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Mudança no horário do plantão" /></label>
            <label className="block text-xs font-medium">Subtítulo<Input className="mt-1" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Uma frase com o mais importante" /></label>
            <label className="block text-xs font-medium">Corpo do aviso<Textarea className="mt-1" rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Use uma linha em branco para separar parágrafos." /></label>
            <div className="space-y-2 rounded-md border p-3">
              <p className="flex items-center gap-2 text-xs font-bold"><ImageIcon className="size-4 text-primary" />Imagem (opcional)</p>
              <div className="flex gap-2"><Input value={imageUrl.startsWith("data:") ? "Imagem enviada do computador" : imageUrl} readOnly={imageUrl.startsWith("data:")} onChange={(e) => setImageUrl(e.target.value)} placeholder="Cole o endereço de uma imagem" /><Button variant="outline" asChild><label className="cursor-pointer"><Upload />Enviar<input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} /></label></Button>{imageUrl && <Button variant="ghost" size="icon" onClick={() => setImageUrl("")} aria-label="Remover imagem"><X /></Button>}</div>
            </div>
            <div className="space-y-2 rounded-md border p-3">
              <p className="flex items-center gap-2 text-xs font-bold"><Youtube className="size-4 text-brand-orange" />Vídeo do YouTube (opcional)</p>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
              {videoInvalid && <p className="text-xs text-destructive">Link do YouTube não reconhecido.</p>}
            </div>
            <AudiencePicker value={audience} onChange={setAudience} roles={roles} directory={directory} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium">Setor responsável<Select value={sector} onValueChange={(v) => setSector(v as Sector)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{publisherSectors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></label>
              <label className="block text-xs font-medium">Expira em<Select value={expiration} onValueChange={setExpiration}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">24 horas</SelectItem><SelectItem value="7">7 dias</SelectItem><SelectItem value="15">15 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="custom">Escolher data</SelectItem></SelectContent></Select></label>
            </div>
            {expiration === "custom" && <label className="block text-xs font-medium">Data de expiração<Input className="mt-1" type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} /></label>}
            <label className="flex items-start gap-3 rounded-md border border-brand-orange/25 bg-brand-orange/5 p-3 text-xs leading-5"><Switch checked={mandatory} onCheckedChange={setMandatory} /><span><strong className="block text-sm">Exibir em tela cheia após o login</strong>O colaborador só entra no portal depois de confirmar a leitura.</span></label>
            <div className="space-y-3 rounded-md border border-brand-cyan/25 bg-brand-cyan/5 p-3 text-xs leading-5">
              <label className="flex items-start gap-3"><Switch checked={featured} onCheckedChange={setFeatured} /><span><strong className="block text-sm">Destacar no carrossel da página inicial</strong>Aparece no topo da Visão geral até a data de expiração.</span></label>
              {featured && <label className="block text-xs font-medium">Etiqueta do destaque<Select value={tag} onValueChange={setTag}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{FEATURE_TAGS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></label>}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase text-muted-foreground">Pré-visualização</p>
            <div className="flex flex-wrap items-center gap-2"><SectorBadge sector={sector} /><Badge variant="outline"><Users className="mr-1 size-3" />{audienceLabel(audience)}</Badge></div>
            <h3 className="font-display mt-3 text-lg font-bold">{title || "Título do aviso"}</h3>
            <p className="mt-1 text-sm font-semibold">{summary || "Subtítulo do aviso"}</p>
            <NoticeBody item={preview} />
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!valid} onClick={() => {
          if (editing && onUpdate) onUpdate({ ...editing, ...draft, author: editing.author, expiresAt: computeExpiration(new Date(editing.publishedAt), expiration, customDate) });
          else onCreate(draft, expiration, customDate);
        }}>{editing ? "Salvar alterações" : "Publicar aviso"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Same shape as the current intranet feed (/api/dados/treinamentos → { cursos: [...] }). */
export type TrainingCourse = { curso: string; fabricante: string; data_inicio: string; data_fim: string; hora_inicio?: string; hora_fim?: string; modalidade: string; gratuito: boolean; setor?: string | undefined; link_inscricao: string };

export function makeSeedCourses(now: Date): TrainingCourse[] {
  const d = (offset: number) => new Date(now.getTime() + offset * DAY).toISOString().slice(0, 10);
  return [
    { curso: "Videomonitoramento com IA — DSS Pro", fabricante: "Dahua Academy", data_inicio: d(0), data_fim: d(2), hora_inicio: "09:00", hora_fim: "12:00", modalidade: "Online ao vivo", gratuito: true, setor: "Monitoramento", link_inscricao: "#" },
    { curso: "Instalação de câmeras AcuSense", fabricante: "Hikvision eLearning", data_inicio: d(5), data_fim: d(5), hora_inicio: "14:00", hora_fim: "17:00", modalidade: "Online", gratuito: true, setor: "Técnico", link_inscricao: "#" },
    { curso: "Centrais de alarme AMT 8000", fabricante: "Intelbras", data_inicio: d(12), data_fim: d(13), hora_inicio: "08:30", hora_fim: "17:30", modalidade: "Presencial", gratuito: false, setor: "Técnico", link_inscricao: "#" },
  ];
}

export function daysUntil(iso: string, now: Date) {
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const [y = 0, m = 1, d = 1] = iso.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / DAY);
}

export function TrainingsView({ courses, now, canCreate, onCreate, completed, onToggleDone }: { courses: TrainingCourse[]; now: Date; canCreate?: boolean; onCreate?: (c: TrainingCourse) => void; completed: string[]; onToggleDone: (curso: string) => void }) {
  const [creating, setCreating] = useState(false);
  const all = [...courses].sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
  const suggested = all.filter((c) => !completed.includes(c.curso) && (!c.data_fim || daysUntil(c.data_fim, now) >= 0));
  const done = all.filter((c) => completed.includes(c.curso));
  const card = (c: TrainingCourse, isDone: boolean) => {
    const start = daysUntil(c.data_inicio, now);
    const live = !!c.data_inicio && start <= 0;
    return (
      <article key={c.curso} className={cn("flex flex-col rounded-lg border bg-card p-5 shadow-sm", isDone && "opacity-80")}>
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-accent text-primary"><GraduationCap className="size-5" /></span>
          {isDone ? <Badge variant="outline" className="border-success/20 bg-success-soft text-success">Concluído</Badge> : !c.data_inicio ? <Badge variant="outline">Sem data limite</Badge> : <div className={cn("rounded-md px-3 py-1.5 text-center", live ? "bg-brand-orange text-hero-foreground" : "bg-muted")}>{live ? <strong className="text-[10px] uppercase leading-tight">Acontecendo<br />agora</strong> : <><strong className="block text-lg leading-none">{start}</strong><span className="text-[10px] text-muted-foreground">{start === 1 ? "dia" : "dias"}</span></>}</div>}
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase text-primary">{c.fabricante}</p>
        <h3 className="font-display mt-1 text-sm font-bold">{c.curso}</h3>
        {c.data_inicio && <p className="mt-2 text-xs text-muted-foreground">{new Date(`${c.data_inicio}T12:00`).toLocaleDateString("pt-BR")}{c.data_fim !== c.data_inicio && ` a ${new Date(`${c.data_fim}T12:00`).toLocaleDateString("pt-BR")}`}{c.hora_inicio && ` · ${c.hora_inicio}–${c.hora_fim ?? ""}`}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5"><Badge variant="outline">{c.modalidade}</Badge>{c.gratuito && <Badge variant="outline" className="border-success/20 bg-success-soft text-success">Gratuito</Badge>}{c.setor && <Badge variant="outline">{c.setor}</Badge>}</div>
        <div className="mt-auto flex gap-2 pt-4">
          {!isDone && <Button variant="outline" size="sm" className="flex-1" asChild><a href={c.link_inscricao} target="_blank" rel="noreferrer" onClick={(e) => c.link_inscricao === "#" && e.preventDefault()}>Inscrever-se <ExternalLink /></a></Button>}
          <Button size="sm" variant={isDone ? "ghost" : "default"} className="flex-1" onClick={() => onToggleDone(c.curso)}>{isDone ? "Desmarcar" : "Marcar como feito"}</Button>
        </div>
      </article>
    );
  };
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-base font-bold">Treinamentos ou cursos sugeridos</h2>{canCreate && <Button size="sm" onClick={() => setCreating(true)}><Plus /> Novo treinamento</Button>}</div>
        {suggested.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{suggested.map((c) => card(c, false))}</div> : <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum curso sugerido pendente.</p>}
      </section>
      <section>
        <h2 className="font-display mb-3 text-base font-bold">Treinamentos concluídos <span className="text-sm font-normal text-muted-foreground">({done.length})</span></h2>
        {done.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{done.map((c) => card(c, true))}</div> : <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Marque um curso como feito para ele aparecer aqui.</p>}
      </section>
      {creating && <CourseDialog onClose={() => setCreating(false)} onSave={(c) => { onCreate?.(c); setCreating(false); }} />}
    </div>
  );
}

function CourseDialog({ onClose, onSave }: { onClose: () => void; onSave: (c: TrainingCourse) => void }) {
  const [hasDates, setHasDates] = useState(false);
  const [f, setF] = useState({ curso: "", fabricante: "", data_inicio: "", data_fim: "", modalidade: "Online", setor: "", link_inscricao: "", gratuito: true });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const ok = f.curso.trim() && (!hasDates || f.data_inicio);
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-lg">
    <DialogHeader><DialogTitle>Novo treinamento ou curso</DialogTitle><DialogDescription>O card aparece em "Cursos sugeridos" para todos.</DialogDescription></DialogHeader>
    <div className="space-y-3">
      <Input placeholder="Nome do curso" value={f.curso} onChange={set("curso")} />
      <Input placeholder="Instituição / fabricante" value={f.fabricante} onChange={set("fabricante")} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={hasDates} onChange={(e) => setHasDates(e.target.checked)} /> Este curso tem data limite</label>
      {hasDates && <div className="grid grid-cols-2 gap-2"><label className="text-xs font-semibold">Início<Input type="date" value={f.data_inicio} onChange={set("data_inicio")} /></label><label className="text-xs font-semibold">Fim<Input type="date" value={f.data_fim} onChange={set("data_fim")} /></label></div>}
      <div className="grid grid-cols-2 gap-2"><Input placeholder="Modalidade" value={f.modalidade} onChange={set("modalidade")} /><Input placeholder="Setor (opcional)" value={f.setor} onChange={set("setor")} /></div>
      <Input placeholder="Link de inscrição" value={f.link_inscricao} onChange={set("link_inscricao")} />
      <label className="flex items-center gap-2 text-sm"><Switch checked={f.gratuito} onCheckedChange={(v) => setF((x) => ({ ...x, gratuito: v }))} /> Gratuito</label>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!ok} onClick={() => onSave({ ...f, curso: f.curso.trim(), data_inicio: hasDates ? f.data_inicio : "", data_fim: hasDates ? f.data_fim || f.data_inicio : "", setor: f.setor || undefined, link_inscricao: f.link_inscricao || "#" })}>Publicar</Button></DialogFooter>
  </DialogContent></Dialog>;
}
