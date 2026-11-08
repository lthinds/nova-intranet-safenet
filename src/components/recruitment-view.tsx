import { useState } from "react";
import { Briefcase, Download, Pencil, Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { APPLICATION_STATUSES, isJobOpen, type ApplicationStatus, type Job, type JobApplication } from "@/components/ops-views";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<JobApplication["kind"], string> = { interesse: "Interesse interno", indicacao: "Indicação", externa: "Página pública" };
const fmt = (d?: string) => (d ? new Date(d + "T12:00").toLocaleDateString("pt-BR") : "—");

/** Tela exclusiva de RH e DP: publica/encerra vagas e acompanha currículos e indicações. */
export function RecruitmentView({ jobs, setJobs, showNotice }: { jobs: Job[]; setJobs: (fn: (l: Job[]) => Job[]) => void; showNotice: (m: string) => void }) {
  const [tab, setTab] = useState<"vagas" | "candidaturas">("vagas");
  const [editing, setEditing] = useState<Job | "new" | null>(null);
  const [jobFilter, setJobFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "todas">("todas");
  const [openApp, setOpenApp] = useState<{ jobId: string; app: JobApplication } | null>(null);

  const all = jobs.flatMap((j) => (j.applications ?? []).map((a) => ({ job: j, app: a })));
  const filtered = all.filter(({ job, app }) => (jobFilter === "todas" || job.id === jobFilter) && (statusFilter === "todas" || (app.status ?? "Novo") === statusFilter));
  const updateApp = (jobId: string, app: JobApplication) => setJobs((l) => l.map((j) => (j.id === jobId ? { ...j, applications: (j.applications ?? []).map((a) => (a.id === app.id ? app : a)) } : j)));

  return <div className="space-y-4">
    <div>
      <h1 className="font-display text-2xl font-bold">Vagas e Indicações</h1>
      <p className="text-sm text-muted-foreground">Só RH e DP veem esta tela. Publique vagas, encerre quando preencher e acompanhe quem se candidatou ou foi indicado.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat label="Vagas abertas" value={jobs.filter(isJobOpen).length} />
      <Stat label="Candidaturas recebidas" value={all.length} />
      <Stat label="Novas, sem triagem" value={all.filter((x) => (x.app.status ?? "Novo") === "Novo").length} />
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <Button variant={tab === "vagas" ? "default" : "outline"} onClick={() => setTab("vagas")}><Briefcase /> Vagas</Button>
      <Button variant={tab === "candidaturas" ? "default" : "outline"} onClick={() => setTab("candidaturas")}><Users /> Candidaturas e indicações</Button>
      {tab === "vagas" && <Button className="ml-auto" onClick={() => setEditing("new")}><Plus /> Nova vaga</Button>}
    </div>

    {tab === "vagas" ? <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full text-sm"><thead className="bg-muted/60 text-left text-xs text-muted-foreground"><tr><th className="p-3">Vaga</th><th className="p-3">Área</th><th className="p-3">Inscrições até</th><th className="p-3">Recebidas</th><th className="p-3">Situação</th><th className="p-3 text-right">Ações</th></tr></thead>
        <tbody>{jobs.map((j) => <tr key={j.id} className="border-t">
          <td className="p-3 font-semibold">{j.title}</td><td className="p-3">{j.area || "—"}</td><td className="p-3">{fmt(j.until)}</td>
          <td className="p-3"><button className="text-primary underline-offset-2 hover:underline" onClick={() => { setJobFilter(j.id); setStatusFilter("todas"); setTab("candidaturas"); }}>{j.applications?.length ?? 0}</button></td>
          <td className="p-3"><Badge variant={isJobOpen(j) ? "default" : "outline"}>{isJobOpen(j) ? "Aberta" : "Encerrada"}</Badge></td>
          <td className="p-3 text-right whitespace-nowrap">
            <Button size="sm" variant="ghost" onClick={() => setEditing(j)}><Pencil /> Editar</Button>
            <Button size="sm" variant="outline" onClick={() => { setJobs((l) => l.map((x) => (x.id === j.id ? { ...x, status: isJobOpen(j) ? "encerrada" : "aberta" } : x))); showNotice(isJobOpen(j) ? "Vaga encerrada. Ela saiu do mural." : "Vaga reaberta e de volta ao mural."); }}>{isJobOpen(j) ? "Encerrar" : "Reabrir"}</Button>
          </td></tr>)}</tbody></table>
      {!jobs.length && <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma vaga cadastrada.</p>}
    </div> : <>
      <div className="flex flex-wrap gap-2">
        <select className="h-9 rounded-md border bg-background px-2 text-sm" value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} aria-label="Filtrar por vaga"><option value="todas">Todas as vagas</option>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select>
        <select className="h-9 rounded-md border bg-background px-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "todas")} aria-label="Filtrar por situação"><option value="todas">Todas as situações</option>{APPLICATION_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm"><thead className="bg-muted/60 text-left text-xs text-muted-foreground"><tr><th className="p-3">Nome</th><th className="p-3">Vaga</th><th className="p-3">Origem</th><th className="p-3">Recebido</th><th className="p-3">Situação</th><th className="p-3">Currículo</th></tr></thead>
          <tbody>{filtered.map(({ job, app }) => <tr key={app.id} className="cursor-pointer border-t hover:bg-muted/40" onClick={() => setOpenApp({ jobId: job.id, app })}>
            <td className="p-3"><strong className="block">{app.name}</strong><span className="text-xs text-muted-foreground">{app.email}</span></td>
            <td className="p-3">{job.title}</td><td className="p-3">{KIND_LABEL[app.kind]}</td><td className="p-3">{fmt(app.sentAt)}</td>
            <td className="p-3"><StatusBadge s={app.status ?? "Novo"} /></td>
            <td className="p-3">{app.fileName ? <span className="flex items-center gap-1 text-xs text-primary"><Download className="size-3.5" />{app.fileName}</span> : <span className="text-xs text-muted-foreground">Sem anexo</span>}</td></tr>)}</tbody></table>
        {!filtered.length && <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma candidatura com esses filtros.</p>}
      </div>
    </>}

    {editing && <JobDialog job={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={(j) => { setJobs((l) => (l.some((x) => x.id === j.id) ? l.map((x) => (x.id === j.id ? j : x)) : [j, ...l])); setEditing(null); showNotice(editing === "new" ? "Vaga publicada no mural." : "Vaga atualizada."); }} />}
    {openApp && <ApplicationDialog app={openApp.app} job={jobs.find((j) => j.id === openApp.jobId)!} onClose={() => setOpenApp(null)} onSave={(a) => { updateApp(openApp.jobId, a); setOpenApp(null); showNotice("Candidatura atualizada."); }} />}
  </div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border bg-card p-4"><span className="text-xs text-muted-foreground">{label}</span><strong className="font-display block text-2xl">{value}</strong></div>;
}

function StatusBadge({ s }: { s: ApplicationStatus }) {
  const tone = s === "Novo" ? "bg-brand-cyan/15 text-brand-cyan" : s === "Aprovado" ? "bg-brand-green/15 text-brand-green" : s === "Descartado" ? "bg-muted text-muted-foreground" : s === "Entrevista" ? "bg-brand-orange/15 text-brand-orange" : "bg-brand-magenta/15 text-brand-magenta";
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", tone)}>{s}</span>;
}

function JobDialog({ job, onClose, onSave }: { job: Job | null; onClose: () => void; onSave: (j: Job) => void }) {
  const [title, setTitle] = useState(job?.title ?? ""); const [area, setArea] = useState(job?.area ?? "");
  const [until, setUntil] = useState(job?.until ?? ""); const [description, setDescription] = useState(job?.description ?? "");
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-lg">
    <DialogHeader><DialogTitle>{job ? "Editar vaga" : "Nova vaga"}</DialogTitle><DialogDescription>Vagas abertas aparecem no mural da página inicial e na página pública de candidatura.</DialogDescription></DialogHeader>
    <div className="space-y-3">
      <label className="block text-xs font-semibold">Cargo da vaga<Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label className="block text-xs font-semibold">Área<Input className="mt-1" value={area} onChange={(e) => setArea(e.target.value)} /></label>
      <label className="block text-xs font-semibold">Inscrições até<Input className="mt-1" type="date" value={until} onChange={(e) => setUntil(e.target.value)} /></label>
      <label className="block text-xs font-semibold">Descrição e requisitos<Textarea className="mt-1" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!title.trim()} onClick={() => onSave({ ...(job ?? { id: `j${Date.now()}`, status: "aberta" as const }), title: title.trim(), area: area.trim(), until, description: description.trim() })}>{job ? "Salvar" : "Publicar vaga"}</Button></DialogFooter>
  </DialogContent></Dialog>;
}

function ApplicationDialog({ app, job, onClose, onSave }: { app: JobApplication; job: Job; onClose: () => void; onSave: (a: JobApplication) => void }) {
  const [status, setStatus] = useState<ApplicationStatus>(app.status ?? "Novo"); const [notes, setNotes] = useState(app.notes ?? "");
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-lg">
    <DialogHeader><DialogTitle>{app.name}</DialogTitle><DialogDescription>{job.title} · {KIND_LABEL[app.kind]} · recebido em {fmt(app.sentAt)}</DialogDescription></DialogHeader>
    <div className="space-y-3 text-sm">
      <dl className="grid grid-cols-[110px_1fr] gap-y-1"><dt className="text-muted-foreground">E-mail</dt><dd>{app.email}</dd><dt className="text-muted-foreground">Telefone</dt><dd>{app.phone || "—"}</dd><dt className="text-muted-foreground">Enviado por</dt><dd>{app.sentBy}</dd></dl>
      {app.info && <p className="rounded-md bg-muted/60 p-3">{app.info}</p>}
      {app.fileName ? <Button variant="outline" size="sm" onClick={() => alert("No protótipo o arquivo não é baixado de verdade.")}><Download /> Baixar {app.fileName}</Button> : <p className="text-xs text-muted-foreground">Nenhum currículo anexado.</p>}
      <label className="block text-xs font-semibold">Situação
        <select className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)}>{APPLICATION_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
      <label className="block text-xs font-semibold">Anotações do RH/DP (o candidato não vê)<Textarea className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Fechar</Button><Button onClick={() => onSave({ ...app, status, notes: notes.trim() })}>Salvar</Button></DialogFooter>
  </DialogContent></Dialog>;
}
