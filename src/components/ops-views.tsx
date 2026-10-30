import { useEffect, useState } from "react";
import { getNews } from "@/lib/news.functions";
import type { NewsItem } from "@/lib/news";
import { Briefcase, ChevronLeft, ChevronRight, Download, FileText, Newspaper, Paperclip, Pencil, Plus, Trash2, Upload, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* ---------------- Manuais & guias ---------------- */

export type Manual = { id: string; title: string; description: string; area: string; audience: string[]; fileName: string; url: string; updatedAt: string };

export const seedManuals: Manual[] = [
  { id: "m1", title: "POP — Atendimento a disparo de alarme", description: "Passo a passo do operador ao receber um disparo.", area: "Monitoramento", audience: ["Monitoramento"], fileName: "pop-disparo-alarme.pdf", url: "#", updatedAt: "2026-10-02" },
  { id: "m2", title: "Checklist de saída de viatura", description: "Inspeção obrigatória antes de cada turno.", area: "Frota", audience: ["Frota", "Monitoramento"], fileName: "checklist-viatura.pdf", url: "#", updatedAt: "2026-09-18" },
  { id: "m3", title: "Código de conduta", description: "Regras de convivência e ética da Safenet.", area: "RH", audience: [], fileName: "codigo-de-conduta.pdf", url: "#", updatedAt: "2026-08-01" },
  { id: "m4", title: "Instalação de câmeras IP", description: "Procedimento técnico de instalação e testes.", area: "Técnico", audience: ["Técnico"], fileName: "instalacao-cameras.pdf", url: "#", updatedAt: "2026-07-22" },
];

/** Um manual é visível para toda a empresa (público vazio), para as funções escolhidas, ou para quem gerencia a área. */
export function canSeeManual(m: Manual, userRoles: string[], managed: string[]) {
  return m.audience.length === 0 || m.audience.some((r) => userRoles.includes(r)) || managed.includes(m.area);
}

export function ManualsView({ manuals, setManuals, userRoles, managedAreas, roleNames, showNotice }: { manuals: Manual[]; setManuals: (fn: (l: Manual[]) => Manual[]) => void; userRoles: string[]; managedAreas: string[]; roleNames: string[]; showNotice: (m: string) => void }) {
  const [editing, setEditing] = useState<Manual | null | "new">(null);
  const [area, setArea] = useState("Todas");
  const visible = manuals.filter((m) => canSeeManual(m, userRoles, managedAreas));
  const areas = ["Todas", ...new Set(visible.map((m) => m.area))];
  const list = visible.filter((m) => area === "Todas" || m.area === area);
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">{areas.map((a) => <Button key={a} size="sm" variant={a === area ? "default" : "outline"} onClick={() => setArea(a)}>{a}</Button>)}</div>
      {managedAreas.length > 0 && <Button onClick={() => setEditing("new")}><Upload /> Enviar manual</Button>}
    </div>
    {managedAreas.length > 0 && <p className="text-xs text-muted-foreground">Você pode publicar manuais de: <strong className="text-foreground">{managedAreas.join(", ")}</strong></p>}
    <div className="grid gap-3 md:grid-cols-2">{list.map((m) => <article key={m.id} className="flex gap-4 rounded-lg border bg-card p-4 shadow-sm">
      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-destructive/10 text-destructive"><FileText className="size-5" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{m.area}</Badge><span className="text-[11px] text-muted-foreground">Atualizado em {new Date(m.updatedAt + "T12:00").toLocaleDateString("pt-BR")}</span></div>
        <h3 className="mt-2 text-sm font-semibold">{m.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Visível para: {m.audience.length ? m.audience.join(", ") : "toda a empresa"}</p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" asChild><a href={m.url} target="_blank" rel="noreferrer" onClick={(e) => { if (m.url === "#") { e.preventDefault(); showNotice("Arquivo de exemplo: envie um PDF real para abri-lo."); } }}><Download /> Abrir PDF</a></Button>
          {managedAreas.includes(m.area) && <><Button size="sm" variant="ghost" onClick={() => setEditing(m)} aria-label="Editar"><Pencil /></Button><Button size="sm" variant="ghost" onClick={() => { setManuals((l) => l.filter((x) => x.id !== m.id)); showNotice("Manual removido."); }} aria-label="Excluir"><Trash2 /></Button></>}
        </div>
      </div>
    </article>)}</div>
    {!list.length && <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum manual disponível para você.</p>}
    {editing && <ManualDialog initial={editing === "new" ? null : editing} areas={managedAreas} roleNames={roleNames} onClose={() => setEditing(null)} onSave={(m) => { setManuals((l) => l.some((x) => x.id === m.id) ? l.map((x) => (x.id === m.id ? m : x)) : [m, ...l]); setEditing(null); showNotice("Manual publicado."); }} />}
  </div>;
}

function ManualDialog({ initial, areas, roleNames, onClose, onSave }: { initial: Manual | null; areas: string[]; roleNames: string[]; onClose: () => void; onSave: (m: Manual) => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [area, setArea] = useState(initial?.area ?? areas[0] ?? "");
  const [audience, setAudience] = useState<string[]>(initial?.audience ?? []);
  const [file, setFile] = useState<{ name: string; url: string } | null>(initial ? { name: initial.fileName, url: initial.url } : null);
  const ok = title.trim() && area && file;
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-lg">
    <DialogHeader><DialogTitle>{initial ? "Editar manual" : "Enviar manual ou guia"}</DialogTitle><DialogDescription>Somente PDF. Você só publica nas áreas que supervisiona.</DialogDescription></DialogHeader>
    <div className="space-y-3">
      <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="Descrição curta" value={description} onChange={(e) => setDescription(e.target.value)} />
      <label className="block text-xs font-semibold">Área<select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={area} onChange={(e) => setArea(e.target.value)}>{areas.map((a) => <option key={a}>{a}</option>)}</select></label>
      <div><p className="text-xs font-semibold">Quem pode ver</p><div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant={audience.length === 0 ? "default" : "outline"} onClick={() => setAudience([])}>Toda a empresa</Button>
        {roleNames.filter((r) => r !== "Supervisor").map((r) => <Button type="button" key={r} size="sm" variant={audience.includes(r) ? "default" : "outline"} onClick={() => setAudience((l) => l.includes(r) ? l.filter((x) => x !== r) : [...l, r])}>{r}</Button>)}
      </div></div>
      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed p-4 text-sm hover:bg-muted/50"><Upload className="size-4" />{file ? file.name : "Selecionar arquivo PDF"}<input type="file" accept="application/pdf" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile({ name: f.name, url: URL.createObjectURL(f) }); }} /></label>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!ok} onClick={() => onSave({ id: initial?.id ?? `m${Date.now()}`, title: title.trim(), description: description.trim(), area, audience, fileName: file!.name, url: file!.url, updatedAt: new Date().toISOString().slice(0, 10) })}>Publicar</Button></DialogFooter>
  </DialogContent></Dialog>;
}

/* ---------------- Escala do monitoramento (mensal, 12x36) ---------------- */

export type Turno = "Diurno" | "Noturno";
/** Ajuste manual de um turno; dias sem ajuste seguem o rodízio 12x36 padrão. */
export type Shift = { date: string; turno: Turno; operators: string[]; supervisor: string };
export const seedSchedule: Shift[] = [];

const TEAMS: Record<Turno, [string[], string[]]> = {
  Diurno: [["Bruno Teles", "Camila Reis"], ["Rafael Costa", "Lívia Prado"]],
  Noturno: [["Diego Santos", "Fernanda Luz"], ["Gustavo Melo", "Helena Dias"]],
};
const SUP: Record<Turno, [string, string]> = { Diurno: ["Paulo Mendes", "Marina Alves"], Noturno: ["Marina Alves", "Paulo Mendes"] };

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Rodízio 12x36: cada equipe trabalha 12h e folga 36h, ou seja, alterna dia sim, dia não. */
export function defaultShift(date: string, turno: Turno): Shift {
  const [y = 0, m = 1, d = 1] = date.split("-").map(Number);
  const n = Math.round(Date.UTC(y, m - 1, d) / 86400000) % 2;
  return { date, turno, operators: TEAMS[turno][n]!, supervisor: SUP[turno][n]! };
}

export function shiftFor(overrides: Shift[], date: string, turno: Turno) {
  return overrides.find((s) => s.date === date && s.turno === turno) ?? defaultShift(date, turno);
}

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function ScheduleView({ schedule, setSchedule, canEdit, showNotice }: { schedule: Shift[]; setSchedule: (fn: (l: Shift[]) => Shift[]) => void; canEdit: boolean; showNotice: (m: string) => void }) {
  const today = new Date();
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [edit, setEdit] = useState<Shift | null>(null);
  const first = new Date(ym.y, ym.m, 1).getDay();
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());
  const move = (delta: number) => setYm(({ y, m }) => { const d = new Date(y, m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2"><Button size="icon" variant="outline" onClick={() => move(-1)} aria-label="Mês anterior"><ChevronLeft /></Button><h2 className="min-w-40 text-center font-display text-base font-bold">{MONTHS[ym.m]} {ym.y}</h2><Button size="icon" variant="outline" onClick={() => move(1)} aria-label="Próximo mês"><ChevronRight /></Button></div>
      <p className="text-xs text-muted-foreground">12x36 · Diurno 07h–19h · Noturno 19h–07h. {canEdit ? "Clique em um turno para ajustar." : "Somente Supervisor do Monitoramento e Coordenação editam."}</p>
    </div>
    <div className="overflow-x-auto rounded-lg border bg-card shadow-sm"><div className="grid min-w-[860px] grid-cols-7">
      {WEEK.map((w) => <div key={w} className="border-b bg-muted/40 p-2 text-xs font-semibold">{w}</div>)}
      {Array.from({ length: first }, (_, i) => <div key={`e${i}`} className="border-b border-r bg-muted/20" />)}
      {Array.from({ length: days }, (_, i) => { const date = iso(ym.y, ym.m, i + 1); return <div key={date} className={cn("min-h-32 space-y-1 border-b border-r p-1.5", date === todayIso && "bg-accent/50")}>
        <span className={cn("block text-xs font-bold", date === todayIso && "text-primary")}>{i + 1}</span>
        {(["Diurno", "Noturno"] as const).map((t) => { const s = shiftFor(schedule, date, t); return <button key={t} disabled={!canEdit} onClick={() => setEdit(s)} className={cn("w-full rounded border p-1 text-left text-[10px] leading-4", t === "Diurno" ? "bg-warning-soft/60" : "bg-info-soft/60", canEdit && "hover:border-primary")}>
          <strong className="block">{t === "Diurno" ? "☀ Diurno" : "☾ Noturno"}</strong>{s.operators.map((o) => <span key={o} className="block truncate">{o}</span>)}<span className="block truncate font-semibold text-primary">Sup.: {s.supervisor}</span></button>; })}
      </div>; })}
    </div></div>
    {edit && <ShiftDialog shift={edit} onClose={() => setEdit(null)} onSave={(s) => { setSchedule((l) => [...l.filter((x) => !(x.date === s.date && x.turno === s.turno)), s]); setEdit(null); showNotice(`Escala de ${new Date(s.date + "T12:00").toLocaleDateString("pt-BR")} (${s.turno}) atualizada.`); }} />}
  </div>;
}

function ShiftDialog({ shift, onClose, onSave }: { shift: Shift; onClose: () => void; onSave: (s: Shift) => void }) {
  const [ops, setOps] = useState(shift.operators.join("\n"));
  const [sup, setSup] = useState(shift.supervisor);
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-md">
    <DialogHeader><DialogTitle>{new Date(shift.date + "T12:00").toLocaleDateString("pt-BR")} · {shift.turno}</DialogTitle><DialogDescription>Um operador por linha.</DialogDescription></DialogHeader>
    <Textarea rows={4} value={ops} onChange={(e) => setOps(e.target.value)} />
    <Input value={sup} onChange={(e) => setSup(e.target.value)} placeholder="Supervisor de plantão" />
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={() => onSave({ ...shift, operators: ops.split("\n").map((s) => s.trim()).filter(Boolean), supervisor: sup.trim() })}>Salvar</Button></DialogFooter>
  </DialogContent></Dialog>;
}

/* ---------------- Vagas abertas ---------------- */

export type JobApplication = { kind: "interesse" | "indicacao"; name: string; email: string; phone: string; info: string; fileName: string; sentBy: string };
export type Job = { id: string; title: string; area: string; until: string; applications?: JobApplication[] };
export const seedJobs: Job[] = [
  { id: "j1", title: "Operador de monitoramento (noturno)", area: "Monitoramento", until: "2026-11-15" },
  { id: "j2", title: "Técnico de instalação CFTV", area: "Técnico", until: "2026-11-30" },
];

export const RESUME_MAX_MB = 10;
const RESUME_EXT = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp", "heic"];
/** Currículo: PDF, Word ou imagem, até 10 MB. Retorna a mensagem de erro ou null. */
export function validateResume(file: { name: string; size: number }) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!RESUME_EXT.includes(ext)) return "Formato não aceito. Envie PDF, Word (.doc/.docx) ou imagem (JPG, PNG).";
  if (file.size > RESUME_MAX_MB * 1024 * 1024) return `Arquivo maior que ${RESUME_MAX_MB} MB.`;
  return null;
}

export function JobsBox({ jobs, setJobs, canEdit, user, showNotice }: { jobs: Job[]; setJobs: (fn: (l: Job[]) => Job[]) => void; canEdit: boolean; user: { name: string; email: string }; showNotice: (m: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<Job | null>(null);
  const [title, setTitle] = useState(""); const [area, setArea] = useState(""); const [until, setUntil] = useState("");
  return <section className="rounded-lg border bg-card p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold"><Briefcase className="size-4 text-primary" /> Vagas abertas</h2>{canEdit && <Button size="sm" variant="ghost" onClick={() => setAdding((v) => !v)} aria-label="Nova vaga">{adding ? <X /> : <Plus />}</Button>}</div>
    {adding && <div className="mb-3 space-y-2 rounded-md border p-3"><Input placeholder="Cargo da vaga" value={title} onChange={(e) => setTitle(e.target.value)} /><Input placeholder="Área" value={area} onChange={(e) => setArea(e.target.value)} /><Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} /><Button size="sm" className="w-full" disabled={!title.trim()} onClick={() => { setJobs((l) => [{ id: `j${Date.now()}`, title: title.trim(), area: area.trim(), until }, ...l]); setTitle(""); setArea(""); setUntil(""); setAdding(false); }}>Publicar vaga</Button></div>}
    <ul className="space-y-2">{jobs.map((j) => <li key={j.id} className="flex items-start justify-between gap-2 rounded-md border p-3 hover:border-primary">
      <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(j)}><strong className="block text-xs">{j.title}</strong><span className="text-[11px] text-muted-foreground">{j.area}{j.until && ` · até ${new Date(j.until + "T12:00").toLocaleDateString("pt-BR")}`}</span>
        <span className="mt-1 block text-[11px] font-semibold text-primary">Tenho interesse / indicar alguém →</span>
        {canEdit && !!j.applications?.length && <Badge variant="outline" className="mt-1"><Users className="mr-1 size-3" />{j.applications.length} recebido(s)</Badge>}</button>
      {canEdit && <Button size="icon" variant="ghost" className="size-7" onClick={() => setJobs((l) => l.filter((x) => x.id !== j.id))} aria-label="Remover vaga"><Trash2 className="size-3.5" /></Button>}</li>)}</ul>
    {!jobs.length && <p className="text-xs text-muted-foreground">Nenhuma vaga aberta no momento.</p>}
    {open && <ApplyDialog job={open} user={user} onClose={() => setOpen(null)} onSend={(a) => { setJobs((l) => l.map((x) => (x.id === open.id ? { ...x, applications: [...(x.applications ?? []), a] } : x))); setOpen(null); showNotice(a.kind === "interesse" ? "Interesse enviado ao RH." : "Indicação enviada ao RH."); }} />}
  </section>;
}

function ApplyDialog({ job, user, onClose, onSend }: { job: Job; user: { name: string; email: string }; onClose: () => void; onSend: (a: JobApplication) => void }) {
  const [kind, setKind] = useState<JobApplication["kind"]>("interesse");
  const self = kind === "interesse";
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [info, setInfo] = useState("");
  const [file, setFile] = useState<File | null>(null); const [error, setError] = useState<string | null>(null);
  const finalName = self ? user.name : name.trim(); const finalEmail = self ? user.email : email.trim();
  const ok = finalName && /\S+@\S+\.\S+/.test(finalEmail) && !error;
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-lg">
    <DialogHeader><DialogTitle>{job.title}</DialogTitle><DialogDescription>{job.area}{job.until && ` · inscrições até ${new Date(job.until + "T12:00").toLocaleDateString("pt-BR")}`}</DialogDescription></DialogHeader>
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">{(["interesse", "indicacao"] as const).map((k) => <Button key={k} type="button" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)}>{k === "interesse" ? "Tenho interesse" : "Quero indicar alguém"}</Button>)}</div>
      {self ? <p className="rounded-md bg-muted/60 p-3 text-xs">Enviando como <strong>{user.name}</strong> ({user.email})</p> : <><Input placeholder="Nome da pessoa indicada" value={name} onChange={(e) => setName(e.target.value)} /><Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} /></>}
      <Input placeholder="Telefone (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Textarea placeholder={self ? "Conte por que você se interessa pela vaga" : "Por que você indica essa pessoa? Experiência, relação etc."} value={info} onChange={(e) => setInfo(e.target.value)} />
      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed p-4 text-sm hover:bg-muted/50"><Paperclip className="size-4" /><span className="min-w-0 flex-1 truncate">{file ? file.name : "Anexar currículo (opcional)"}</span>{file && <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); setError(null); }} aria-label="Remover arquivo"><X className="size-4" /></button>}
        <input type="file" accept=".pdf,.doc,.docx,image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const err = validateResume(f); setError(err); setFile(err ? null : f); }} /></label>
      <p className={cn("text-[11px]", error ? "text-destructive" : "text-muted-foreground")}>{error ?? `PDF, Word ou imagem (JPG, PNG) · até ${RESUME_MAX_MB} MB`}</p>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!ok} onClick={() => onSend({ kind, name: finalName, email: finalEmail, phone: phone.trim(), info: info.trim(), fileName: file?.name ?? "", sentBy: user.email })}>Enviar ao RH</Button></DialogFooter>
  </DialogContent></Dialog>;
}

/* ---------------- Notícias ---------------- */

export function NewsBox() {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  useEffect(() => { getNews().then(setItems).catch(() => setItems([])); }, []);
  return <section className="rounded-lg border bg-card p-4 shadow-sm">
    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><Newspaper className="size-4 text-primary" /> Notícias de tecnologia e segurança</h2>
    {items === null && <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="flex gap-3"><div className="size-16 shrink-0 animate-pulse rounded-md bg-muted" /><div className="flex-1 space-y-2"><div className="h-3 animate-pulse rounded bg-muted" /><div className="h-3 w-2/3 animate-pulse rounded bg-muted" /></div></div>)}</div>}
    {items?.length === 0 && <p className="text-xs text-muted-foreground">Não foi possível carregar as notícias agora.</p>}
    <ul className="divide-y">{items?.map((n) => <li key={n.url}><a href={n.url} target="_blank" rel="noreferrer" className="group flex gap-3 py-3">
      {n.image ? <img src={n.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-16 shrink-0 rounded-md bg-muted object-cover" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} /> : <span className="grid size-16 shrink-0 place-items-center rounded-md bg-accent text-primary"><Newspaper className="size-5" /></span>}
      <span className="min-w-0"><strong className="line-clamp-3 block text-xs leading-5 group-hover:text-primary">{n.title}</strong><span className="text-[11px] text-muted-foreground">{n.source}{n.date && ` · ${new Date(n.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`}</span></span>
    </a></li>)}</ul>
  </section>;
}
