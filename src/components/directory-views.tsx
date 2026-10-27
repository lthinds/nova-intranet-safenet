import { useMemo, useRef, useState, useEffect } from "react";
import { AppWindow, Cake, GraduationCap, Mail, Megaphone, Phone, Search, UserRound, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { daysToNextBirthday, matches, tenureYears, type DirectoryEntry } from "@/lib/directory";

export type SearchHit = { kind: "app" | "aviso" | "treinamento" | "pessoa"; id: string; title: string; subtitle: string };

const kindMeta = {
  app: { label: "Aplicações", icon: AppWindow },
  aviso: { label: "Avisos", icon: Megaphone },
  treinamento: { label: "Treinamentos", icon: GraduationCap },
  pessoa: { label: "Pessoas", icon: UserRound },
} as const;

export function GlobalSearch({ sources, onPick }: { sources: SearchHit[]; onPick: (hit: SearchHit) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const hits = useMemo(() => sources.filter((s) => matches(`${s.title} ${s.subtitle}`, q)).slice(0, 12), [sources, q]);
  const groups = (Object.keys(kindMeta) as SearchHit["kind"][]).map((k) => ({ k, items: hits.filter((h) => h.kind === k) })).filter((g) => g.items.length);
  return (
    <div ref={box} className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); if (e.key === "Enter" && hits[0]) { onPick(hits[0]); setOpen(false); setQ(""); } }} placeholder="Buscar no portal…" aria-label="Busca geral" className="h-10 pl-9" />
      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-auto rounded-lg border bg-popover p-2 text-popover-foreground shadow-xl">
          {groups.length ? groups.map(({ k, items }) => {
            const Icon = kindMeta[k].icon;
            return <div key={k} className="mb-1"><p className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">{kindMeta[k].label}</p>{items.map((h) => <button key={h.kind + h.id} onClick={() => { onPick(h); setOpen(false); setQ(""); }} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted"><Icon className="size-4 shrink-0 text-primary" /><span className="min-w-0"><strong className="block truncate text-xs">{h.title}</strong><small className="block truncate text-[11px] text-muted-foreground">{h.subtitle}</small></span></button>)}</div>;
          }) : <p className="p-4 text-center text-xs text-muted-foreground">Nada encontrado para “{q}”.</p>}
        </div>
      )}
    </div>
  );
}

type Person = DirectoryEntry & { status: string; initials: string };

export function DirectoryView({ people, focus }: { people: Person[]; focus?: string | null }) {
  const [q, setQ] = useState("");
  const [area, setArea] = useState("Todas");
  const areas = ["Todas", ...Array.from(new Set(people.map((p) => p.area))).sort()];
  const list = people.filter((p) => p.status === "Ativo" && (area === "Todas" || p.area === area) && (!q.trim() || matches(`${p.name} ${p.email} ${p.area} ${p.roles.join(" ")} ${p.extension ?? ""}`, q)));
  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px]">
        <label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, cargo, setor ou ramal…" className="h-10 pl-9" aria-label="Buscar colaborador" /></label>
        <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Filtrar por setor" className="h-10 rounded-md border bg-background px-3 text-sm">{areas.map((a) => <option key={a}>{a}</option>)}</select>
      </div>
      <p className="text-xs text-muted-foreground"><strong className="text-foreground">{list.length}</strong> colaboradores</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => (
          <div key={p.email} className={`rounded-lg border bg-card p-5 shadow-sm ${focus === p.email ? "ring-2 ring-primary" : ""}`}>
            <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{p.initials}</span><div className="min-w-0"><strong className="block truncate text-sm">{p.name}</strong><span className="text-xs text-muted-foreground">{p.area}</span></div></div>
            <div className="mt-3 flex flex-wrap gap-1">{p.roles.map((r) => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}</div>
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <a href={`mailto:${p.email}`} className="flex items-center gap-2 hover:text-primary"><Mail className="size-3.5" />{p.email}</a>
              {p.extension && <span className="flex items-center gap-2"><Phone className="size-3.5" />Ramal {p.extension}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BirthdaysView({ people, now }: { people: Person[]; now: Date }) {
  const active = people.filter((p) => p.status === "Ativo");
  const birthdays = active.filter((p) => p.birthDate).map((p) => ({ p, days: daysToNextBirthday(p.birthDate!, now) })).filter((x) => x.days <= 60).sort((a, b) => a.days - b.days);
  const tenure = active.filter((p) => p.hireDate).map((p) => ({ p, years: tenureYears(p.hireDate!, now), days: daysToNextBirthday(p.hireDate!, now) })).sort((a, b) => a.days - b.days);
  const fmt = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  return (
    <div className="space-y-5">
      <div className="rounded-md border border-primary/15 bg-accent p-3 text-xs text-muted-foreground">Área visível somente para RH e DP. Os demais colaboradores não veem datas de nascimento nem de admissão.</div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold"><Cake className="size-4 text-brand-magenta" />Aniversariantes (próximos 60 dias)</h2>
          <ul className="space-y-2">{birthdays.map(({ p, days }) => <li key={p.email} className="flex items-center justify-between rounded-md border p-3"><span><strong className="block text-sm">{p.name}</strong><small className="text-xs text-muted-foreground">{p.area} · {fmt(p.birthDate!)}</small></span><Badge variant="outline" className={days === 0 ? "border-success/20 bg-success-soft text-success" : ""}>{days === 0 ? "Hoje" : `em ${days} dias`}</Badge></li>)}{!birthdays.length && <li className="text-xs text-muted-foreground">Nenhum aniversário próximo.</li>}</ul>
        </section>
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold"><Award className="size-4 text-brand-orange" />Tempo de casa</h2>
          <ul className="space-y-2">{tenure.map(({ p, years, days }) => <li key={p.email} className="flex items-center justify-between rounded-md border p-3"><span><strong className="block text-sm">{p.name}</strong><small className="text-xs text-muted-foreground">Admissão em {new Date(`${p.hireDate}T00:00:00`).toLocaleDateString("pt-BR")}</small></span><span className="text-right"><strong className="block text-sm">{years} {years === 1 ? "ano" : "anos"}</strong><small className="text-[11px] text-muted-foreground">{days === 0 ? "completa hoje" : `completa ${years + 1} em ${days} dias`}</small></span></li>)}</ul>
        </section>
      </div>
    </div>
  );
}
