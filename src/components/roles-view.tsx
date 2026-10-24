import { useState } from "react";
import { AlertTriangle, Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { countMembers, permissionLabels, wouldLockOut, type PortalPermission, type Role } from "@/lib/roles";

type AppRef = { id: string; name: string };
type Props = {
  roles: Role[];
  people: Array<{ roles: string[] }>;
  apps: AppRef[];
  onSave: (role: Role, previousName?: string) => void;
  onDelete: (roleId: string) => void;
};

const allPerms = Object.keys(permissionLabels) as PortalPermission[];

export function RolesView({ roles, people, apps, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<Role | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");

  function openNew() { setIsNew(true); setError(""); setEditing({ id: `r${Date.now()}`, name: "", apps: [], permissions: [] }); }
  function openEdit(r: Role) { setIsNew(false); setError(""); setEditing({ ...r }); }
  function openDelete(r: Role) { setDeleting(r); setStep(1); setConfirmText(""); }

  function save() {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) return setError("Informe o nome do cargo.");
    if (roles.some((r) => r.id !== editing.id && r.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) return setError("Já existe um cargo com esse nome.");
    const next = roles.map((r) => (r.id === editing.id ? { ...editing, name } : r));
    if (!isNew && wouldLockOut(next)) return setError("Ao menos um cargo precisa manter a permissão de gerenciar cargos.");
    onSave({ ...editing, name }, isNew ? undefined : roles.find((r) => r.id === editing.id)?.name);
    setEditing(null);
  }

  const deletingCount = deleting ? countMembers(deleting.name, people) : 0;
  const deleteBlocked = deleting ? wouldLockOut(roles.filter((r) => r.id !== deleting.id)) : false;

  return <div className="space-y-5">
    <section className="grid gap-4 rounded-lg border border-info/20 bg-info-soft p-4 md:grid-cols-[auto_minmax(0,1fr)_auto]">
      <span className="grid size-10 place-items-center rounded-md bg-info text-info-foreground"><ShieldCheck className="size-5" /></span>
      <div><strong className="text-sm">Cargos controlam o que cada pessoa vê no portal</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">Um colaborador pode ter vários cargos e recebe tudo o que qualquer um deles libera. O que ele pode fazer dentro de cada sistema continua definido no próprio sistema.</p></div>
      <Button onClick={openNew} className="h-fit"><Plus /> Novo cargo</Button>
    </section>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {roles.map((r) => {
        const n = countMembers(r.name, people);
        return <article key={r.id} className="flex flex-col rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div><h3 className="font-display text-sm font-bold">{r.name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3" /> {n} {n === 1 ? "colaborador" : "colaboradores"}</p></div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label={`Editar ${r.name}`}><Pencil /></Button>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDelete(r)} aria-label={`Excluir ${r.name}`}><Trash2 /></Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-1">{r.permissions.length ? r.permissions.map((p) => <Badge key={p} variant="outline" className="border-primary/20 bg-accent text-primary">{permissionLabels[p].label}</Badge>) : <span className="text-xs text-muted-foreground">Sem permissões administrativas</span>}</div>
          <p className="mt-auto pt-4 text-xs text-muted-foreground">{r.apps.length} {r.apps.length === 1 ? "ferramenta liberada" : "ferramentas liberadas"}</p>
        </article>;
      })}
    </div>

    {editing && <Dialog open onOpenChange={(o) => !o && setEditing(null)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{isNew ? "Novo cargo" : `Editar ${roles.find((r) => r.id === editing.id)?.name}`}</DialogTitle><DialogDescription>Defina o nome, o que o cargo pode administrar no portal e quais ferramentas ele vê.</DialogDescription></DialogHeader>
        <div className="space-y-5">
          <label className="block space-y-1.5"><span className="text-xs font-semibold">Nome do cargo</span><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Ex.: Supervisor noturno" /></label>
          <div className="space-y-2"><span className="text-xs font-semibold">Permissões no portal</span>
            {allPerms.map((p) => { const on = editing.permissions.includes(p); return <label key={p} className={cn("flex items-start gap-3 rounded-md border p-3", on && "border-primary bg-accent")}><Checkbox checked={on} onCheckedChange={() => setEditing({ ...editing, permissions: on ? editing.permissions.filter((x) => x !== p) : [...editing.permissions, p] })} className="mt-0.5" /><span><strong className="block text-sm">{permissionLabels[p].label}</strong><span className="text-xs text-muted-foreground">{permissionLabels[p].description}</span></span></label>; })}
          </div>
          <div className="space-y-2"><span className="text-xs font-semibold">Ferramentas visíveis</span>
            <div className="grid gap-2 sm:grid-cols-2">{apps.map((a) => { const on = editing.apps.includes(a.id); return <label key={a.id} className={cn("flex items-center gap-2 rounded-md border p-2.5 text-xs", on && "border-primary bg-accent")}><Checkbox checked={on} onCheckedChange={() => setEditing({ ...editing, apps: on ? editing.apps.filter((x) => x !== a.id) : [...editing.apps, a.id] })} />{a.name}</label>; })}</div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button onClick={save}>Salvar cargo</Button></DialogFooter>
      </DialogContent>
    </Dialog>}

    {deleting && <Dialog open onOpenChange={(o) => !o && setDeleting(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Excluir o cargo {deleting.name}?</DialogTitle><DialogDescription>{step === 1 ? "Confira o impacto antes de continuar." : "Última confirmação."}</DialogDescription></DialogHeader>
        {deleteBlocked ? <p className="rounded-md border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">Este é o único cargo que pode gerenciar cargos. Dê essa permissão a outro cargo antes de excluí-lo.</p> : <>
          <div className={cn("flex gap-3 rounded-md border p-3", deletingCount ? "border-warning/30 bg-warning-soft" : "bg-muted/50")}>
            <AlertTriangle className={cn("size-5 shrink-0", deletingCount ? "text-warning" : "text-muted-foreground")} />
            <p className="text-sm">{deletingCount ? <><strong>{deletingCount} {deletingCount === 1 ? "colaborador está" : "colaboradores estão"} neste cargo.</strong> Eles perderão as ferramentas e permissões que vêm dele.</> : "Nenhum colaborador está neste cargo."}</p>
          </div>
          {step === 2 && <label className="block space-y-1.5"><span className="text-xs">Digite <strong>{deleting.name}</strong> para confirmar</span><Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoFocus /></label>}
        </>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button>
          {!deleteBlocked && (step === 1
            ? <Button variant="destructive" onClick={() => setStep(2)}>Continuar</Button>
            : <Button variant="destructive" disabled={confirmText.trim() !== deleting.name} onClick={() => { onDelete(deleting.id); setDeleting(null); }}><Trash2 /> Excluir definitivamente</Button>)}
        </DialogFooter>
      </DialogContent>
    </Dialog>}
  </div>;
}
