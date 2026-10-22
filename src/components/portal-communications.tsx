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
  imageUrl?: string;
  videoUrl?: string;
};

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
  ];
}

type Post = { tag: string; sector: "RH" | "DP"; title: string; text: string; date: string; icon: ComponentType<{ className?: string }>; tone: "green" | "magenta" | "cyan" | "orange" };

const posts: Post[] = [
  { tag: "Novo benefício", sector: "RH", title: "Telemedicina 24h para você e sua família", text: "Consultas online sem custo, liberadas para todos os colaboradores e dependentes.", date: "Vigente a partir de 01/11", icon: HeartHandshake, tone: "magenta" },
  { tag: "Política interna", sector: "DP", title: "Nova política de banco de horas", text: "Compensação em até 90 dias e consulta do saldo direto no Ponto.", date: "Publicado em 15/10", icon: ScrollText, tone: "cyan" },
  { tag: "Reunião", sector: "RH", title: "Alinhamento geral com as coordenações", text: "Quinta, 14h, no auditório e com transmissão online para os plantões.", date: "23/10 · 14h", icon: Users, tone: "orange" },
  { tag: "Evento", sector: "RH", title: "Confraternização de fim de ano", text: "Inscrições abertas para colaboradores e acompanhantes até 30/11.", date: "13/12 · 19h", icon: CalendarDays, tone: "green" },
];

const toneClass: Record<Post["tone"], string> = {
  green: "bg-brand-green text-hero-accent-foreground",
  magenta: "bg-brand-magenta text-hero-foreground",
  cyan: "bg-brand-cyan text-hero-accent-foreground",
  orange: "bg-brand-orange text-hero-foreground",
};

export function HeroCarousel({ onOpenNotices }: { onOpenNotices: () => void }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % posts.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const post = posts[index] ?? posts[0]!;
  const Icon = post.icon;
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
          <Button variant="outline" onClick={onOpenNotices} className="mt-5 border-hero-foreground/20 bg-transparent text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground">Ver todos os avisos <ArrowRight /></Button>
        </div>
        <article key={index} className="animate-in fade-in slide-in-from-right-4 self-center rounded-lg border border-hero-foreground/10 bg-hero-foreground/5 p-5 backdrop-blur-sm duration-500" aria-live={paused ? "polite" : "off"}>
          <div className="flex items-center gap-2">
            <span className={cn("grid size-9 place-items-center rounded-md", toneClass[post.tone])}><Icon className="size-4" /></span>
            <Badge className={cn("hover:opacity-100", toneClass[post.tone])}>{post.tag}</Badge>
            <span className="ml-auto text-[10px] font-bold uppercase text-hero-foreground/60">{post.sector === "RH" ? "Recursos Humanos" : "Departamento Pessoal"}</span>
          </div>
          <h3 className="font-display mt-4 text-lg font-bold leading-snug md:text-xl">{post.title}</h3>
          <p className="mt-2 text-sm leading-6 text-hero-foreground/75">{post.text}</p>
          <div className="mt-5 flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-hero-foreground/60"><CalendarDays className="size-3.5" />{post.date}</span>
            <div className="ml-auto flex items-center gap-1">
              <Button size="icon" variant="ghost" className="size-8 text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground" onClick={() => go(-1)} aria-label="Post anterior"><ChevronLeft /></Button>
              <Button size="icon" variant="ghost" className="size-8 text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground" onClick={() => setPaused((v) => !v)} aria-label={paused ? "Retomar carrossel" : "Pausar carrossel"}>{paused ? <Play /> : <Pause />}</Button>
              <Button size="icon" variant="ghost" className="size-8 text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground" onClick={() => go(1)} aria-label="Próximo post"><ChevronRight /></Button>
            </div>
          </div>
          <div className="mt-4 flex gap-1.5">{posts.map((item, i) => <button key={item.title} onClick={() => setIndex(i)} aria-label={`Ir para o post ${i + 1}`} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-hero-accent" : "w-1.5 bg-hero-foreground/30")} />)}</div>
        </article>
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

export function NoticesView({ items, now, acknowledged, onCreate, onOpen }: { items: Announcement[]; now: Date; acknowledged: string[]; onCreate: () => void; onOpen: (item: Announcement) => void }) {
  const [sector, setSector] = useState("todos");
  const [status, setStatus] = useState("todos");
  const list = useMemo(() => sortByDateDesc(items).filter((item) => (sector === "todos" || item.sector === sector) && (status === "todos" || (status === "vigente") === isActive(item, now))), [items, sector, status, now]);
  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-lg border border-info/20 bg-info-soft p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <span className="grid size-10 place-items-center rounded-md bg-info text-info-foreground"><Megaphone className="size-5" /></span>
        <div><strong className="text-sm">Coordenação, RH, DP e Marketing podem publicar avisos</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">Avisos obrigatórios aparecem em tela cheia logo após o login. Cada publicação define até quando fica vigente.</p></div>
        <Button onClick={onCreate}><Plus /> Novo aviso</Button>
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
                <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold">{fmt(item.publishedAt)}</span><SectorBadge sector={item.sector} />{item.mandatory && <Badge variant="outline" className="border-brand-orange/30 bg-brand-orange/10 text-brand-orange"><BellRing className="mr-1 size-3" />Tela cheia no login</Badge>}<Badge variant="outline" className={active ? "border-success/20 bg-success-soft text-success" : "bg-muted text-muted-foreground"}>{active ? `Vigente até ${fmt(item.expiresAt)}` : `Expirou em ${fmt(item.expiresAt)}`}</Badge>{acknowledged.includes(item.id) && <span className="text-[11px] text-muted-foreground">· Leitura confirmada</span>}</div>
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

export function NoticeDetailDialog({ item, onClose, onEdit }: { item: Announcement | null; onClose: () => void; onEdit?: (item: Announcement) => void }) {
  if (!item) return null;
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto"><DialogHeader><div className="flex flex-wrap items-center gap-2"><SectorBadge sector={item.sector} /><span className="text-xs text-muted-foreground">{fmt(item.publishedAt)} · {item.author}</span></div><DialogTitle className="font-display pt-2 text-xl">{item.title}</DialogTitle><DialogDescription className="text-sm font-semibold text-foreground">{item.summary}</DialogDescription></DialogHeader><NoticeBody item={item} /><p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" />Vigência até {fmt(item.expiresAt)}</p><DialogFooter>{onEdit && <Button variant="outline" onClick={() => onEdit(item)}><Pencil />Editar aviso</Button>}<Button onClick={onClose}>Fechar</Button></DialogFooter></DialogContent></Dialog>;
}

export type NoticeDraft = Omit<Announcement, "id" | "publishedAt" | "expiresAt">;

export function CreateNoticeDialog({ open, editing, onClose, onCreate, onUpdate }: { open: boolean; editing?: Announcement | null; onClose: () => void; onCreate: (item: NoticeDraft, expiration: string, customDate?: string) => void; onUpdate?: (item: Announcement) => void }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [sector, setSector] = useState<Sector>("RH");
  const [mandatory, setMandatory] = useState(true);
  const [expiration, setExpiration] = useState("7");
  const [customDate, setCustomDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? ""); setSummary(editing?.summary ?? ""); setBody(editing?.body ?? "");
    setSector(editing?.sector ?? "RH"); setMandatory(editing?.mandatory ?? true);
    setImageUrl(editing?.imageUrl ?? ""); setVideoUrl(editing?.videoUrl ?? "");
    setExpiration(editing ? "custom" : "7"); setCustomDate(editing ? editing.expiresAt.slice(0, 10) : "");
  }, [open, editing]);

  if (!open) return null;
  const videoInvalid = videoUrl.trim() !== "" && !youtubeId(videoUrl);
  const valid = title.trim() && summary.trim() && !videoInvalid && (expiration !== "custom" || customDate);
  const onFile = (file?: File) => { if (!file) return; const r = new FileReader(); r.onload = () => setImageUrl(String(r.result)); r.readAsDataURL(file); };
  const draft: NoticeDraft = { title, summary, body: body || summary, sector, mandatory, author: sector === "Coordenação" ? "Marina Alves" : sector, imageUrl: imageUrl || undefined, videoUrl: videoUrl.trim() || undefined };
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
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium">Setor responsável<Select value={sector} onValueChange={(v) => setSector(v as Sector)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{publisherSectors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></label>
              <label className="block text-xs font-medium">Expira em<Select value={expiration} onValueChange={setExpiration}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">24 horas</SelectItem><SelectItem value="7">7 dias</SelectItem><SelectItem value="15">15 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="custom">Escolher data</SelectItem></SelectContent></Select></label>
            </div>
            {expiration === "custom" && <label className="block text-xs font-medium">Data de expiração<Input className="mt-1" type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} /></label>}
            <label className="flex items-start gap-3 rounded-md border border-brand-orange/25 bg-brand-orange/5 p-3 text-xs leading-5"><Switch checked={mandatory} onCheckedChange={setMandatory} /><span><strong className="block text-sm">Exibir em tela cheia após o login</strong>O colaborador só entra no portal depois de confirmar a leitura.</span></label>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase text-muted-foreground">Pré-visualização</p>
            <SectorBadge sector={sector} />
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
export type TrainingCourse = { curso: string; fabricante: string; data_inicio: string; data_fim: string; hora_inicio?: string; hora_fim?: string; modalidade: string; gratuito: boolean; setor?: string; link_inscricao: string };

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

export function TrainingsView({ courses, now }: { courses: TrainingCourse[]; now: Date }) {
  const list = courses.filter((c) => daysUntil(c.data_fim, now) >= 0).sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-lg border border-dashed border-warning/40 bg-warning-soft p-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
        <span className="grid size-10 place-items-center rounded-md bg-warning text-warning-foreground"><Database className="size-5" /></span>
        <div><strong className="text-sm">Origem dos cursos aguardando confirmação</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">Na intranet atual, os cursos vêm de uma lista atualizada por uma rotina interna (agenda Dahua Academy e parceiros). Esta área já usa o mesmo formato e será ligada à fonte oficial quando confirmada. Os cursos abaixo são exemplos.</p></div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => {
          const start = daysUntil(c.data_inicio, now);
          const live = start <= 0;
          return (
            <article key={c.curso} className="flex flex-col rounded-lg border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-md bg-accent text-primary"><GraduationCap className="size-5" /></span>
                <div className={cn("rounded-md px-3 py-1.5 text-center", live ? "bg-brand-orange text-hero-foreground" : "bg-muted")}>{live ? <strong className="text-[10px] uppercase leading-tight">Acontecendo<br />agora</strong> : <><strong className="block text-lg leading-none">{start}</strong><span className="text-[10px] text-muted-foreground">{start === 1 ? "dia" : "dias"}</span></>}</div>
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase text-primary">{c.fabricante}</p>
              <h3 className="font-display mt-1 text-sm font-bold">{c.curso}</h3>
              <p className="mt-2 text-xs text-muted-foreground">{new Date(`${c.data_inicio}T12:00`).toLocaleDateString("pt-BR")}{c.data_fim !== c.data_inicio && ` a ${new Date(`${c.data_fim}T12:00`).toLocaleDateString("pt-BR")}`} · {c.hora_inicio}–{c.hora_fim}</p>
              <div className="mt-3 flex flex-wrap gap-1.5"><Badge variant="outline">{c.modalidade}</Badge>{c.gratuito && <Badge variant="outline" className="border-success/20 bg-success-soft text-success">Gratuito</Badge>}{c.setor && <Badge variant="outline">{c.setor}</Badge>}</div>
              <Button variant="outline" size="sm" className="mt-auto w-full" asChild><a href={c.link_inscricao} onClick={(e) => e.preventDefault()}>Inscrever-se <ExternalLink /></a></Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
