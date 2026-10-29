import { useState } from "react";
import { Briefcase, Download, FileText, Newspaper, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
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

/* ---------------- Escala do monitoramento ---------------- */

export type Shift = { day: string; turno: "Diurno" | "Noturno"; operators: string[]; supervisor: string };
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export const seedSchedule: Shift[] = DAYS.flatMap((day, i) => [
  { day, turno: "Diurno" as const, operators: i % 2 ? ["Rafael Costa", "Lívia Prado"] : ["Bruno Teles", "Camila Reis"], supervisor: "Paulo Mendes" },
  { day, turno: "Noturno" as const, operators: i % 2 ? ["Bruno Teles", "Camila Reis"] : ["Rafael Costa", "Lívia Prado"], supervisor: i % 2 ? "Marina Alves" : "Paulo Mendes" },
]);

export function ScheduleView({ schedule, setSchedule, canEdit, showNotice }: { schedule: Shift[]; setSchedule: (fn: (l: Shift[]) => Shift[]) => void; canEdit: boolean; showNotice: (m: string) => void }) {
  const [edit, setEdit] = useState<Shift | null>(null);
  return <div className="space-y-4">
    <p className="text-xs text-muted-foreground">Turnos 12x36 · Diurno 07h–19h · Noturno 19h–07h. {canEdit ? "Clique em um turno para ajustar." : "Somente supervisores do Monitoramento podem editar."}</p>
    <div className="overflow-x-auto rounded-lg border bg-card shadow-sm"><table className="w-full min-w-[760px] text-sm">
      <thead><tr className="border-b bg-muted/40"><th className="p-3 text-left text-xs">Turno</th>{DAYS.map((d) => <th key={d} className="p-3 text-left text-xs">{d}</th>)}</tr></thead>
      <tbody>{(["Diurno", "Noturno"] as const).map((t) => <tr key={t} className="border-b last:border-0"><td className="p-3 align-top text-xs font-semibold">{t}</td>{DAYS.map((d) => { const s = schedule.find((x) => x.day === d && x.turno === t)!; return <td key={d} className="p-2 align-top"><button disabled={!canEdit} onClick={() => setEdit(s)} className={cn("w-full rounded-md border p-2 text-left text-xs", canEdit && "hover:border-primary hover:bg-muted/50")}>{s.operators.map((o) => <span key={o} className="block">{o}</span>)}<span className="mt-1 block text-[10px] font-semibold text-primary">Sup.: {s.supervisor}</span></button></td>; })}</tr>)}</tbody>
    </table></div>
    {edit && <ShiftDialog shift={edit} onClose={() => setEdit(null)} onSave={(s) => { setSchedule((l) => l.map((x) => (x.day === s.day && x.turno === s.turno ? s : x))); setEdit(null); showNotice(`Escala de ${s.day} (${s.turno}) atualizada.`); }} />}
  </div>;
}

function ShiftDialog({ shift, onClose, onSave }: { shift: Shift; onClose: () => void; onSave: (s: Shift) => void }) {
  const [ops, setOps] = useState(shift.operators.join("\n"));
  const [sup, setSup] = useState(shift.supervisor);
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-md">
    <DialogHeader><DialogTitle>{shift.day} · {shift.turno}</DialogTitle><DialogDescription>Um operador por linha.</DialogDescription></DialogHeader>
    <Textarea rows={4} value={ops} onChange={(e) => setOps(e.target.value)} />
    <Input value={sup} onChange={(e) => setSup(e.target.value)} placeholder="Supervisor de plantão" />
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={() => onSave({ ...shift, operators: ops.split("\n").map((s) => s.trim()).filter(Boolean), supervisor: sup.trim() })}>Salvar</Button></DialogFooter>
  </DialogContent></Dialog>;
}

/* ---------------- Barra lateral da visão geral ---------------- */

export type Job = { id: string; title: string; area: string; until: string };
export const seedJobs: Job[] = [
  { id: "j1", title: "Operador de monitoramento (noturno)", area: "Monitoramento", until: "2026-11-15" },
  { id: "j2", title: "Técnico de instalação CFTV", area: "Técnico", until: "2026-11-30" },
];

export function JobsBox({ jobs, setJobs, canEdit }: { jobs: Job[]; setJobs: (fn: (l: Job[]) => Job[]) => void; canEdit: boolean }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState(""); const [area, setArea] = useState(""); const [until, setUntil] = useState("");
  return <section className="rounded-lg border bg-card p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold"><Briefcase className="size-4 text-primary" /> Vagas abertas</h2>{canEdit && <Button size="sm" variant="ghost" onClick={() => setAdding((v) => !v)} aria-label="Nova vaga">{adding ? <X /> : <Plus />}</Button>}</div>
    {adding && <div className="mb-3 space-y-2 rounded-md border p-3"><Input placeholder="Cargo da vaga" value={title} onChange={(e) => setTitle(e.target.value)} /><Input placeholder="Área" value={area} onChange={(e) => setArea(e.target.value)} /><Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} /><Button size="sm" className="w-full" disabled={!title.trim()} onClick={() => { setJobs((l) => [{ id: `j${Date.now()}`, title: title.trim(), area: area.trim(), until }, ...l]); setTitle(""); setArea(""); setUntil(""); setAdding(false); }}>Publicar vaga</Button></div>}
    <ul className="space-y-2">{jobs.map((j) => <li key={j.id} className="flex items-start justify-between gap-2 rounded-md border p-3"><div><strong className="block text-xs">{j.title}</strong><span className="text-[11px] text-muted-foreground">{j.area}{j.until && ` · até ${new Date(j.until + "T12:00").toLocaleDateString("pt-BR")}`}</span></div>{canEdit && <Button size="icon" variant="ghost" className="size-7" onClick={() => setJobs((l) => l.filter((x) => x.id !== j.id))} aria-label="Remover vaga"><Trash2 className="size-3.5" /></Button>}</li>)}</ul>
    {!jobs.length && <p className="text-xs text-muted-foreground">Nenhuma vaga aberta no momento.</p>}
    <p className="mt-3 text-[11px] text-muted-foreground">Interessado? Fale com o RH.</p>
  </section>;
}

/** Itens de exemplo. Em produção, este feed pode vir de RSS de portais de tecnologia e segurança. */
const newsItems = [
  { title: "Novas regras para empresas de segurança privada entram em vigor", source: "Segurança & Cia", date: "27/10", url: "#" },
  { title: "Câmeras com análise de vídeo ganham espaço no monitoramento", source: "Tecnologia Hoje", date: "26/10", url: "#" },
  { title: "Como evitar golpes de engenharia social no ambiente corporativo", source: "Cyber News", date: "24/10", url: "#" },
  { title: "Rastreamento veicular: tendências para frotas em 2027", source: "Frota Brasil", date: "22/10", url: "#" },
  { title: "Atualização de firmware corrige falhas em gravadores de vídeo", source: "Tecnologia Hoje", date: "20/10", url: "#" },
];

export function NewsBox() {
  return <section className="rounded-lg border bg-card p-4 shadow-sm">
    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><Newspaper className="size-4 text-primary" /> Notícias de tecnologia e segurança</h2>
    <ul className="divide-y">{newsItems.map((n) => <li key={n.title}><a href={n.url} onClick={(e) => n.url === "#" && e.preventDefault()} className="block py-3 hover:text-primary"><strong className="block text-xs leading-5">{n.title}</strong><span className="text-[11px] text-muted-foreground">{n.source} · {n.date}</span></a></li>)}</ul>
  </section>;
}
