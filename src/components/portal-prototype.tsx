import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  AppWindow,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Car,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  ExternalLink,
  Eye,
  FileText,
  Grid2X2,
  KeyRound,
  LayoutDashboard,
  Link2,
  ListFilter,
  LockKeyhole,
  LogOut,
  Megaphone,
  Moon,
  GraduationCap,
  Sun,
  Mail,
  Menu,
  MonitorCheck,
  MoreHorizontal,
  Plus,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  ShieldEllipsis,
  SlidersHorizontal,
  TicketCheck,
  UserCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  CreateNoticeDialog,
  HeroCarousel,
  MandatoryNoticeOverlay,
  isRecipient,
  NoticeDetailDialog,
  NoticesView,
  SectorBadge,
  TrainingsView,
  computeExpiration,
  isActive,
  makeSeedAnnouncements,
  makeSeedCourses,
  safenetMarkUrl,
  sortByDateDesc,
  type Announcement,
} from "@/components/portal-communications";

type View = "inicio" | "avisos" | "treinamentos" | "aplicacoes" | "colaboradores" | "acessos" | "gestao" | "login";
type Integration = "SSO integrado" | "Link externo";

type AppItem = {
  name: string;
  description: string;
  category: string;
  integration: Integration;
  status: "Disponível" | "Em breve";
  icon: ComponentType<{ className?: string }>;
  recent?: boolean;
};

const apps: AppItem[] = [
  { name: "Ponto — Pontotel", description: "Registro e acompanhamento do ponto.", category: "Acesso rápido", integration: "Link externo", status: "Disponível", icon: Clock3, recent: true },
  { name: "Webmail", description: "E-mail corporativo e agenda.", category: "Acesso rápido", integration: "Link externo", status: "Disponível", icon: Mail, recent: true },
  { name: "Relatório de Frota", description: "Preenchimento e relatórios de frota.", category: "Operacional", integration: "SSO integrado", status: "Disponível", icon: Car, recent: true },
  { name: "Relatório de Monitoramento", description: "Relatórios semanais do monitoramento.", category: "Operacional", integration: "SSO integrado", status: "Disponível", icon: FileText },
  { name: "Monitoramento", description: "Plantão, alarmes e CFTV em tempo real.", category: "Operacional", integration: "SSO integrado", status: "Disponível", icon: MonitorCheck, recent: true },
  { name: "Segware Cloud", description: "Software de monitoramento parceiro.", category: "Operacional", integration: "Link externo", status: "Disponível", icon: Radio },
  { name: "Auvo — Ordens de Serviço", description: "Ordens de serviço do operacional.", category: "Operacional", integration: "Link externo", status: "Disponível", icon: TicketCheck },
  { name: "Auvo Desk — Chamados", description: "Abertura e acompanhamento de chamados.", category: "Operacional", integration: "Link externo", status: "Disponível", icon: CircleHelp },
  { name: "Dashboard Comercial", description: "Pipeline, contratos e prospecção.", category: "Comercial", integration: "SSO integrado", status: "Disponível", icon: BarChart3 },
  { name: "Planilha Comercial", description: "Base viva de contratos e histórico.", category: "Comercial", integration: "Link externo", status: "Disponível", icon: Grid2X2 },
  { name: "Gestor de Pregões", description: "Fluxo completo dos processos licitatórios.", category: "Licitações", integration: "SSO integrado", status: "Disponível", icon: BriefcaseBusiness },
  { name: "Painel de Licitações", description: "Indicadores e recortes comerciais.", category: "Licitações", integration: "SSO integrado", status: "Disponível", icon: BarChart3 },
  { name: "Dahua Academy", description: "Agenda de treinamentos técnicos.", category: "Treinamentos", integration: "Link externo", status: "Disponível", icon: BookOpen },
  { name: "Hikvision eLearning", description: "Portal de treinamento Hikvision.", category: "Treinamentos", integration: "Link externo", status: "Disponível", icon: BookOpen },
  { name: "Intelbras — Treinamentos", description: "Portal de treinamentos Intelbras.", category: "Treinamentos", integration: "Link externo", status: "Disponível", icon: BookOpen },
  { name: "Manuais técnicos", description: "Biblioteca de procedimentos técnicos.", category: "Técnico", integration: "SSO integrado", status: "Em breve", icon: FileText },
  { name: "Gestor de Recrutamento", description: "Vagas, currículos e candidatos.", category: "RH", integration: "SSO integrado", status: "Disponível", icon: Users },
];

const currentUser = { name: "Marina Alves", email: "marina.alves@empresa.com.br", roles: ["Coordenação", "Monitoramento"] };
const portalRoles = ["Coordenação", "RH", "DP", "Marketing", "Monitoramento", "Operacional", "Frota", "Comercial", "Licitações", "Técnico"];

type Person = { name: string; email: string; area: string; roles: string[]; status: string; initials: string };

const seedPeople: Person[] = [
  { name: "Marina Alves", email: "marina.alves@empresa.com.br", area: "Monitoramento", roles: ["Coordenação", "Monitoramento"], status: "Ativo", initials: "MA" },
  { name: "Rafael Costa", email: "rafael.costa@empresa.com.br", area: "Operacional", roles: ["Operacional", "Frota"], status: "Ativo", initials: "RC" },
  { name: "Beatriz Lima", email: "beatriz.lima@empresa.com.br", area: "Comercial", roles: ["Comercial", "Licitações", "Marketing"], status: "Ativo", initials: "BL" },
  { name: "Carlos Nunes", email: "carlos.nunes@empresa.com.br", area: "Técnico", roles: ["Técnico"], status: "Bloqueado", initials: "CN" },
  { name: "João Pereira", email: "joao.pereira@empresa.com.br", area: "Licitações", roles: ["Licitações"], status: "Pendente", initials: "JP" },
];

const navItems: Array<{ id: View; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "inicio", label: "Visão geral", icon: LayoutDashboard },
  { id: "avisos", label: "Avisos", icon: Megaphone },
  { id: "aplicacoes", label: "Aplicações", icon: AppWindow },
  { id: "treinamentos", label: "Treinamentos", icon: GraduationCap },
  { id: "colaboradores", label: "Colaboradores", icon: Users },
  { id: "acessos", label: "Acessos", icon: ShieldEllipsis },
  { id: "gestao", label: "Gestão de aplicações", icon: Settings },
];

const categories = ["Todos", "Acesso rápido", "Operacional", "Comercial", "Licitações", "Treinamentos", "Técnico", "RH"];

export function PortalPrototype() {
  const [view, setView] = useState<View>("inicio");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null);
  const [modal, setModal] = useState<"add" | "approve" | "block" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [now] = useState(() => new Date());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => makeSeedAnnouncements(new Date()));
  const [courses] = useState(() => makeSeedCourses(new Date()));
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [showMandatory, setShowMandatory] = useState(true);
  const [createNotice, setCreateNotice] = useState(false);
  const [openNotice, setOpenNotice] = useState<Announcement | null>(null);
  const [editingNotice, setEditingNotice] = useState<Announcement | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(window.localStorage.getItem("safenet-theme") === "dark");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    window.localStorage.setItem("safenet-theme", next ? "dark" : "light");
  }

  const pendingMandatory = sortByDateDesc(announcements).filter((item) => item.mandatory && isActive(item, now) && isRecipient(item, currentUser) && !acknowledged.includes(item.id));
  const [access, setAccess] = useState<Record<string, boolean>>({
    "Ponto — Pontotel": true,
    Webmail: true,
    "Relatório de Frota": true,
    Monitoramento: true,
    "Dashboard Comercial": false,
    "Gestor de Pregões": false,
  });

  const filteredApps = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    return apps.filter((app) => {
      const categoryMatches = category === "Todos" || app.category === category;
      const queryMatches = !needle || `${app.name} ${app.description} ${app.category}`.toLocaleLowerCase("pt-BR").includes(needle);
      return categoryMatches && queryMatches;
    });
  }, [category, query]);

  function navigate(next: View) {
    setView(next);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3200);
  }

  if (view === "login") {
    return <LoginScreen onEnter={() => { setShowMandatory(true); navigate("inicio"); }} />;
  }

  const titles: Record<Exclude<View, "login">, { title: string; description: string }> = {
    inicio: { title: "Bom dia, Marina", description: "Aqui está o que você precisa para começar o dia." },
    avisos: { title: "Avisos e comunicados", description: "Todos os comunicados da empresa, organizados por data." },
    treinamentos: { title: "Treinamentos", description: "Cursos e capacitações disponíveis para as equipes." },
    aplicacoes: { title: "Aplicações", description: "Acesse as ferramentas disponíveis para o seu perfil." },
    colaboradores: { title: "Colaboradores", description: "Aprove cadastros e acompanhe a situação das contas." },
    acessos: { title: "Gestão de acessos", description: "Defina quais ferramentas cada colaborador visualiza no portal." },
    gestao: { title: "Gestão de aplicações", description: "Cadastre ferramentas e escolha como cada acesso será realizado." },
  };

  const currentTitle = titles[view];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-6">
          <button className="flex items-center gap-3 text-left" onClick={() => navigate("inicio")} aria-label="Ir para a visão geral">
            <span className="grid size-10 place-items-center rounded-md bg-card p-1.5"><img src={safenetMarkUrl} alt="Safenet" className="size-full object-contain" /></span>
            <span><strong className="font-display block text-[15px] font-bold tracking-[0.25em]">SAFENET</strong><small className="block text-[10px] font-semibold uppercase text-sidebar-foreground/55">Portal corporativo</small></span>
          </button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X /></Button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Navegação principal">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase text-sidebar-foreground/45">Portal</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return <Button key={item.id} variant="ghost" onClick={() => navigate(item.id)} className={cn("h-11 w-full justify-start px-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", view === item.id && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm")}><Icon />{item.label}{item.id === "colaboradores" && <span className="ml-auto grid size-5 place-items-center rounded-full bg-warning text-warning-foreground text-[10px] font-bold">1</span>}</Button>;
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button onClick={() => navigate("login")} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-sidebar-accent">
            <span className="grid size-9 place-items-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">MA</span>
            <span className="min-w-0"><strong className="block truncate text-xs">Marina Alves</strong><small className="block truncate text-[10px] text-sidebar-foreground/50">Coordenadora</small></span>
            <LogOut className="size-4 text-sidebar-foreground/45" />
          </button>
        </div>
      </aside>

      {mobileOpen && <button className="fixed inset-0 z-30 bg-overlay lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" />}

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-20 grid h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm md:px-8">
          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu /></Button>
          <div className="hidden min-w-0 items-center gap-2 text-xs text-muted-foreground sm:flex"><span>Portal</span><span>/</span><strong className="truncate text-foreground">{currentTitle.title}</strong></div>
          <div className="sm:hidden" />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden h-8 gap-2 border-success/20 bg-success-soft text-success sm:flex"><span className="size-1.5 rounded-full bg-success" /> Rede interna</Badge>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}>{dark ? <Sun /> : <Moon />}</Button>
            <Button variant="ghost" size="icon" aria-label="Avisos" onClick={() => navigate("avisos")} className="relative"><Bell /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-warning" /></Button>
            <span className="hidden h-6 w-px bg-border sm:block" />
            <button onClick={() => navigate("login")} className="hidden items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-muted md:flex"><span className="grid size-8 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">MA</span><span><strong className="block text-xs">Marina Alves</strong><small className="block text-[10px] text-muted-foreground">Coordenadora</small></span><ChevronDown className="size-3 text-muted-foreground" /></button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
          <div className="mb-7 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div className="min-w-0"><p className="mb-2 text-[10px] font-bold uppercase text-primary">Central de aplicações</p><h1 className="font-display text-2xl font-bold md:text-[30px]">{currentTitle.title}</h1><p className="mt-1 text-sm text-muted-foreground">{currentTitle.description}</p></div>
            {view === "gestao" && <Button onClick={() => setModal("add")}><Plus /> Nova aplicação</Button>}
          </div>

          {view === "inicio" && <HomeView navigate={navigate} onSelect={setSelectedApp} latest={sortByDateDesc(announcements).filter((item) => isActive(item, now)).slice(0, 2)} onOpenNotice={setOpenNotice} />}
          {view === "avisos" && <NoticesView items={announcements} now={now} acknowledged={acknowledged} onCreate={() => setCreateNotice(true)} onOpen={setOpenNotice} />}
          {view === "treinamentos" && <TrainingsView courses={courses} now={now} />}
          {view === "aplicacoes" && <ApplicationsView apps={filteredApps} query={query} setQuery={setQuery} category={category} setCategory={setCategory} onSelect={setSelectedApp} />}
          {view === "colaboradores" && <PeopleView setModal={setModal} showNotice={showNotice} />}
          {view === "acessos" && <AccessView access={access} setAccess={setAccess} showNotice={showNotice} />}
          {view === "gestao" && <ManagementView onSelect={setSelectedApp} />}
        </main>
      </div>

      <ApplicationDialog app={selectedApp} onClose={() => setSelectedApp(null)} showNotice={showNotice} />
      <ActionDialog modal={modal} setModal={setModal} showNotice={showNotice} />
      <NoticeDetailDialog item={openNotice} onClose={() => setOpenNotice(null)} onEdit={(item) => { setOpenNotice(null); setEditingNotice(item); setCreateNotice(true); }} />
      <CreateNoticeDialog roles={portalRoles} directory={seedPeople} open={createNotice} editing={editingNotice} onClose={() => { setCreateNotice(false); setEditingNotice(null); }} onUpdate={(item) => { setAnnouncements((list) => list.map((a) => (a.id === item.id ? item : a))); setCreateNotice(false); setEditingNotice(null); showNotice("Aviso atualizado."); }} onCreate={(data, expiration, customDate) => {
        const published = new Date();
        setAnnouncements((list) => [{ ...data, id: `n${published.getTime()}`, publishedAt: published.toISOString(), expiresAt: computeExpiration(published, expiration, customDate) }, ...list]);
        setCreateNotice(false);
        showNotice(data.mandatory ? "Aviso publicado. Ele aparecerá em tela cheia no próximo login." : "Aviso publicado na aba Avisos.");
      }} />
      {showMandatory && <MandatoryNoticeOverlay items={pendingMandatory} onAcknowledge={(id) => setAcknowledged((list) => [...list, id])} />}

      {notice && <div role="status" className="fixed bottom-5 right-5 z-[70] flex max-w-sm items-start gap-3 rounded-md border border-success/20 bg-foreground px-4 py-3 text-background shadow-xl"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success text-success-foreground"><Check className="size-3" /></span><p className="text-xs leading-5">{notice}</p></div>}
    </div>
  );
}

function HomeView({ navigate, onSelect, latest, onOpenNotice }: { navigate: (view: View) => void; onSelect: (app: AppItem) => void; latest: Announcement[]; onOpenNotice: (item: Announcement) => void }) {
  const recent = apps.filter((app) => app.recent);
  return <div className="space-y-7">
    <HeroCarousel onOpenNotices={() => navigate("avisos")} />
    <section>
      <SectionHeading title="Acessados recentemente" action={<Button variant="ghost" size="sm" onClick={() => navigate("aplicacoes")}>Ver todos <ArrowRight /></Button>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{recent.map((app) => <AppCard key={app.name} app={app} onClick={() => onSelect(app)} compact />)}</div>
    </section>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,.7fr)]">
      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"><SectionHeading title="Visão do portal" /><div className="grid gap-3 sm:grid-cols-3"><Metric value="17" label="Aplicações cadastradas" icon={AppWindow} /><Metric value="12" label="Liberadas para você" icon={BadgeCheck} /><Metric value="100%" label="Serviços disponíveis" icon={ShieldCheck} /></div></section>
      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"><SectionHeading title="Avisos recentes" action={<Button variant="ghost" size="sm" onClick={() => navigate("avisos")}>Ver todos <ArrowRight /></Button>} /><div className="space-y-3">{latest.map((item) => <button key={item.id} onClick={() => onOpenNotice(item)} className="block w-full rounded-md border p-3 text-left hover:bg-muted/50"><SectorBadge sector={item.sector} /><strong className="mt-2 block text-sm">{item.title}</strong><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.summary}</p></button>)}</div></section>
    </div>
  </div>;
}

function ApplicationsView({ apps: visibleApps, query, setQuery, category, setCategory, onSelect }: { apps: AppItem[]; query: string; setQuery: (value: string) => void; category: string; setCategory: (value: string) => void; onSelect: (app: AppItem) => void }) {
  return <div className="space-y-5">
    <div className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_auto]">
      <label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar aplicação ou recurso..." className="h-10 pl-9" /><span className="sr-only">Buscar aplicações</span></label>
      <Select value={category} onValueChange={setCategory}><SelectTrigger className="h-10"><SelectValue /></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
      <Button variant="outline" className="h-10"><ListFilter /> Filtros</Button>
    </div>
    <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground"><strong className="text-foreground">{visibleApps.length}</strong> aplicações encontradas</p><div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><Eye className="size-4" /> Mostrando apenas ferramentas autorizadas</div></div>
    {visibleApps.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleApps.map((app) => <AppCard key={app.name} app={app} onClick={() => onSelect(app)} />)}</div> : <div className="grid min-h-72 place-items-center rounded-lg border border-dashed bg-card text-center"><div><Search className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">Nenhuma aplicação encontrada</h2><p className="mt-1 text-sm text-muted-foreground">Tente outro termo ou categoria.</p></div></div>}
  </div>;
}

function PeopleView({ setModal, showNotice }: { setModal: (value: "approve" | "block" | null) => void; showNotice: (message: string) => void }) {
  const [people, setPeople] = useState<Person[]>(seedPeople);
  const [editing, setEditing] = useState<Person | null>(null);
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const toggle = (r: string) => setDraftRoles((list) => (list.includes(r) ? list.filter((x) => x !== r) : [...list, r]));
  return <div className="space-y-5">
    {editing && <Dialog open onOpenChange={(o) => !o && setEditing(null)}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Funções de {editing.name}</DialogTitle><DialogDescription>Um colaborador pode ter várias funções. Ele verá todas as áreas do portal liberadas para qualquer uma delas. As permissões dentro de cada sistema continuam sendo definidas no próprio sistema.</DialogDescription></DialogHeader><div className="grid grid-cols-2 gap-2">{portalRoles.map((r) => <label key={r} className={cn("flex items-center gap-2 rounded-md border p-3 text-sm", draftRoles.includes(r) && "border-primary bg-accent")}><Checkbox checked={draftRoles.includes(r)} onCheckedChange={() => toggle(r)} />{r}</label>)}</div><DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button disabled={!draftRoles.length} onClick={() => { setPeople((list) => list.map((p) => (p.email === editing.email ? { ...p, roles: draftRoles } : p))); showNotice(`Funções de ${editing.name} atualizadas.`); setEditing(null); }}>Salvar funções</Button></DialogFooter></DialogContent></Dialog>}
    <section className="rounded-lg border border-warning/25 bg-warning-soft p-4"><div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-md bg-warning text-warning-foreground"><UserCheck className="size-5" /></span><div className="min-w-0"><strong className="text-sm">1 cadastro aguarda aprovação</strong><p className="mt-0.5 text-xs text-muted-foreground">Revise os dados antes de liberar o acesso ao portal.</p></div><Button size="sm" onClick={() => setModal("approve")}>Revisar</Button></div></section>
    <div className="grid gap-3 sm:grid-cols-3"><Metric value="48" label="Colaboradores ativos" icon={Users} /><Metric value="1" label="Aguardando aprovação" icon={Clock3} /><Metric value="2" label="Contas bloqueadas" icon={LockKeyhole} /></div>
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="grid gap-3 border-b p-4 md:grid-cols-[minmax(0,1fr)_180px_auto]"><label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar nome ou e-mail..." className="pl-9" /></label><Select defaultValue="todos"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os status</SelectItem><SelectItem value="ativo">Ativos</SelectItem><SelectItem value="pendente">Pendentes</SelectItem><SelectItem value="bloqueado">Bloqueados</SelectItem></SelectContent></Select><Button variant="outline"><SlidersHorizontal /> Filtrar</Button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-muted/60 text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Colaborador</th><th className="px-4 py-3 font-medium">Área</th><th className="px-4 py-3 font-medium">Funções no portal</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Ações</th></tr></thead><tbody>{people.map((person) => <tr key={person.email} className="border-t hover:bg-muted/30"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-muted font-bold text-primary">{person.initials}</span><div><strong className="block text-sm">{person.name}</strong><span className="text-muted-foreground">{person.email}</span></div></div></td><td className="px-4 py-4">{person.area}</td><td className="px-4 py-4"><div className="flex max-w-64 flex-wrap gap-1">{person.roles.map((r) => <Badge key={r} variant="outline">{r}</Badge>)}</div></td><td className="px-4 py-4"><StatusBadge status={person.status} /></td><td className="px-4 py-4"><div className="flex justify-end gap-1">{person.status === "Pendente" ? <Button size="sm" onClick={() => setModal("approve")}>Aprovar</Button> : <><Button variant="ghost" size="icon" onClick={() => { setEditing(person); setDraftRoles(person.roles); }} aria-label={`Editar ${person.name}`}><Settings /></Button><Button variant="ghost" size="icon" onClick={() => setModal("block")} aria-label={`Mais ações para ${person.name}`}><MoreHorizontal /></Button></>}</div></td></tr>)}</tbody></table></div>
    </section>
  </div>;
}

function AccessView({ access, setAccess, showNotice }: { access: Record<string, boolean>; setAccess: (value: Record<string, boolean>) => void; showNotice: (message: string) => void }) {
  const columns = ["Ponto — Pontotel", "Webmail", "Relatório de Frota", "Monitoramento", "Dashboard Comercial", "Gestor de Pregões"];
  return <div className="space-y-5">
    <section className="grid gap-4 rounded-lg border border-info/20 bg-info-soft p-4 md:grid-cols-[auto_minmax(0,1fr)_auto]"><span className="grid size-10 place-items-center rounded-md bg-info text-info-foreground"><ShieldCheck className="size-5" /></span><div><strong className="text-sm">O portal controla visibilidade e acesso</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">Os perfis e permissões internas continuam administrados em cada aplicação. Alterar esta matriz não muda o que o colaborador pode fazer dentro dos sistemas.</p></div><Badge variant="outline" className="h-fit w-fit border-info/20 bg-background text-info">Regra de segurança</Badge></section>
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm"><div className="grid gap-3 border-b p-4 md:grid-cols-[minmax(0,1fr)_220px_auto]"><label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar colaborador..." className="pl-9" /></label><Select defaultValue="rafael"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rafael">Rafael Costa — Operacional</SelectItem><SelectItem value="beatriz">Beatriz Lima — Comercial</SelectItem><SelectItem value="carlos">Carlos Nunes — Técnico</SelectItem></SelectContent></Select><Button onClick={() => showNotice("Alterações salvas apenas nesta demonstração visual.")}><Check /> Salvar alterações</Button></div>
      <div className="p-5"><div className="mb-5 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">RC</span><div><h2 className="text-sm font-bold">Rafael Costa</h2><p className="text-xs text-muted-foreground">Operacional · Colaborador</p></div><Badge className="ml-auto bg-success-soft text-success hover:bg-success-soft">4 de 6 acessos</Badge></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{columns.map((name) => { const app = apps.find((item) => item.name === name); const Icon = app?.icon ?? AppWindow; return <div key={name} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border p-4"><span className="grid size-9 place-items-center rounded-md bg-accent text-primary"><Icon className="size-4" /></span><div className="min-w-0"><strong className="block truncate text-xs">{name}</strong><span className="text-[10px] text-muted-foreground">{app?.integration}</span></div><Switch checked={Boolean(access[name])} onCheckedChange={(checked) => setAccess({ ...access, [name]: checked })} aria-label={`Acesso a ${name}`} /></div>; })}</div></div>
    </section>
    <section className="rounded-lg border bg-card p-5 shadow-sm"><SectionHeading title="Como funciona" /><div className="grid gap-5 md:grid-cols-3"><FlowStep number="01" title="Acesso ao portal" text="O colaborador entra com a senha própria da intranet." /><FlowStep number="02" title="Ferramentas visíveis" text="A matriz define quais aplicações aparecem para cada pessoa." /><FlowStep number="03" title="Permissões internas" text="Cada sistema continua responsável por seus perfis e operações." /></div></section>
  </div>;
}

function ManagementView({ onSelect }: { onSelect: (app: AppItem) => void }) {
  return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-3"><Metric value="9" label="SSO integrado" icon={KeyRound} /><Metric value="7" label="Links externos" icon={ExternalLink} /><Metric value="1" label="Em configuração" icon={Clock3} /></div><section className="overflow-hidden rounded-lg border bg-card shadow-sm"><div className="grid gap-3 border-b p-4 md:grid-cols-[minmax(0,1fr)_220px]"><label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar aplicação..." className="pl-9" /></label><Select defaultValue="todas"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todos os tipos</SelectItem><SelectItem value="sso">SSO integrado</SelectItem><SelectItem value="externo">Link externo</SelectItem></SelectContent></Select></div><div className="divide-y">{apps.slice(0, 10).map((app) => { const Icon = app.icon; return <div key={app.name} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 md:grid-cols-[auto_minmax(0,1.5fr)_minmax(150px,.7fr)_130px_auto]"><span className="grid size-10 place-items-center rounded-md bg-accent text-primary"><Icon className="size-5" /></span><div className="min-w-0"><strong className="block truncate text-sm">{app.name}</strong><span className="block truncate text-xs text-muted-foreground">{app.category}</span></div><div className="hidden md:block"><IntegrationBadge type={app.integration} /></div><span className="hidden text-xs text-muted-foreground md:block">{app.status}</span><Button variant="ghost" size="icon" onClick={() => onSelect(app)} aria-label={`Configurar ${app.name}`}><Settings /></Button></div>; })}</div></section></div>;
}

function AppCard({ app, onClick, compact = false }: { app: AppItem; onClick: () => void; compact?: boolean }) {
  const Icon = app.icon;
  return <button onClick={onClick} className={cn("group flex min-h-48 flex-col rounded-lg border bg-card p-5 text-left text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md", compact && "min-h-40 p-4")}><div className="flex w-full items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-md bg-accent text-primary"><Icon className="size-5" /></span><Badge variant="outline" className={cn("border-success/15 bg-success-soft text-success", app.status === "Em breve" && "border-border bg-muted text-muted-foreground")}>{app.status}</Badge></div><h3 className="mt-4 text-sm font-bold">{app.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{app.description}</p><span className="mt-auto flex items-center gap-1 pt-4 text-xs font-bold text-primary">{app.status === "Em breve" ? "Ver detalhes" : "Acessar"}<ArrowRight className="size-3 transition-transform group-hover:translate-x-1" /></span></button>;
}

function Metric({ value, label, icon: Icon }: { value: string; label: string; icon: ComponentType<{ className?: string }> }) {
  return <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md border bg-card p-4 shadow-sm"><span className="grid size-10 place-items-center rounded-md bg-accent text-primary"><Icon className="size-5" /></span><div><strong className="block text-xl font-bold">{value}</strong><span className="text-[11px] text-muted-foreground">{label}</span></div></div>;
}

function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"><div className="flex min-w-0 items-center gap-2"><span className="h-5 w-1 rounded-full bg-primary" /><h2 className="truncate text-sm font-bold">{title}</h2></div>{action}</div>;
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={cn(status === "Ativo" && "border-success/20 bg-success-soft text-success", status === "Pendente" && "border-warning/20 bg-warning-soft text-warning", status === "Bloqueado" && "border-destructive/20 bg-destructive/10 text-destructive")}>{status}</Badge>;
}

function IntegrationBadge({ type }: { type: Integration }) {
  return <Badge variant="outline" className={type === "SSO integrado" ? "border-primary/20 bg-accent text-primary" : "border-info/20 bg-info-soft text-info"}>{type === "SSO integrado" ? <KeyRound className="mr-1 size-3" /> : <ExternalLink className="mr-1 size-3" />}{type}</Badge>;
}

function FlowStep({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="flex gap-3"><span className="text-2xl font-bold text-primary/25">{number}</span><div><strong className="text-xs">{title}</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></div></div>;
}

function ApplicationDialog({ app, onClose, showNotice }: { app: AppItem | null; onClose: () => void; showNotice: (message: string) => void }) {
  if (!app) return null;
  const Icon = app.icon;
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="max-w-xl"><DialogHeader><div className="mb-3 flex items-center gap-3"><span className="grid size-12 place-items-center rounded-md bg-accent text-primary"><Icon className="size-6" /></span><div><DialogTitle>{app.name}</DialogTitle><p className="mt-1 text-xs text-muted-foreground">{app.category}</p></div></div><DialogDescription>{app.description}</DialogDescription></DialogHeader><div className="space-y-3 py-2"><div className="grid grid-cols-2 gap-3"><div className="rounded-md border p-3"><span className="text-[10px] uppercase text-muted-foreground">Forma de acesso</span><div className="mt-2"><IntegrationBadge type={app.integration} /></div></div><div className="rounded-md border p-3"><span className="text-[10px] uppercase text-muted-foreground">Disponibilidade</span><div className="mt-2"><StatusBadge status={app.status} /></div></div></div><div className="rounded-md bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">{app.integration === "SSO integrado" ? "Na versão final, seu e-mail corporativo vinculará a conta existente e o acesso acontecerá pelo portal. As permissões internas permanecerão neste sistema." : "Esta aplicação é de terceiros. O portal abrirá o endereço externo e o acesso poderá solicitar credenciais próprias."}</div></div><DialogFooter><Button variant="outline" onClick={onClose}>Fechar</Button><Button disabled={app.status === "Em breve"} onClick={() => { onClose(); showNotice(app.integration === "SSO integrado" ? "Abertura com SSO simulada no protótipo." : "Abertura do link externo simulada no protótipo."); }}>{app.integration === "SSO integrado" ? <KeyRound /> : <ExternalLink />}{app.status === "Em breve" ? "Indisponível" : "Abrir aplicação"}</Button></DialogFooter></DialogContent></Dialog>;
}

function ActionDialog({ modal, setModal, showNotice }: { modal: "add" | "approve" | "block" | null; setModal: (value: null) => void; showNotice: (message: string) => void }) {
  if (!modal) return null;
  const content = {
    add: { title: "Cadastrar nova aplicação", description: "Defina como a ferramenta aparecerá no portal.", confirm: "Cadastrar aplicação" },
    approve: { title: "Aprovar novo colaborador", description: "Revise os dados antes de liberar a conta de João Pereira.", confirm: "Aprovar cadastro" },
    block: { title: "Bloquear colaborador", description: "Esta ação impedirá novos acessos e, na versão final, encerrará as sessões nos sistemas próprios integrados.", confirm: "Confirmar bloqueio" },
  }[modal];
  return <Dialog open onOpenChange={(open) => !open && setModal(null)}><DialogContent><DialogHeader><DialogTitle>{content.title}</DialogTitle><DialogDescription>{content.description}</DialogDescription></DialogHeader>{modal === "add" ? <div className="space-y-4 py-2"><label className="block text-xs font-medium">Nome da aplicação<Input className="mt-1" placeholder="Ex.: Central de CFTV" /></label><div className="grid grid-cols-2 gap-3"><label className="block text-xs font-medium">Categoria<Select defaultValue="operacional"><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="operacional">Operacional</SelectItem><SelectItem value="comercial">Comercial</SelectItem><SelectItem value="tecnico">Técnico</SelectItem><SelectItem value="rh">RH</SelectItem></SelectContent></Select></label><label className="block text-xs font-medium">Tipo de acesso<Select defaultValue="sso"><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sso">SSO integrado</SelectItem><SelectItem value="externo">Link externo</SelectItem></SelectContent></Select></label></div><label className="block text-xs font-medium">Endereço da aplicação<Input className="mt-1" placeholder="https://..." /></label><div className="rounded-md border border-primary/15 bg-accent p-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Vínculo corporativo:</strong> aplicações próprias usarão o e-mail corporativo único para localizar a conta já existente.</div></div> : modal === "approve" ? <div className="space-y-4 py-2"><div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md border p-4"><span className="grid size-10 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">JP</span><div><strong className="block text-sm">João Pereira</strong><span className="text-xs text-muted-foreground">joao.pereira@empresa.com.br · Licitações</span></div></div><label className="flex items-center gap-2 text-xs"><Checkbox defaultChecked /> Confirmo que o e-mail corporativo e a área estão corretos.</label></div> : <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-xs leading-5 text-muted-foreground"><strong className="text-destructive">Efeito previsto:</strong> Carlos Nunes perderá acesso ao portal imediatamente. Sistemas de terceiros não permitem encerramento remoto de sessão.</div>}<DialogFooter><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button variant={modal === "block" ? "destructive" : "default"} onClick={() => { setModal(null); showNotice(modal === "add" ? "Aplicação cadastrada na demonstração." : modal === "approve" ? "Cadastro aprovado na demonstração." : "Bloqueio global simulado com sucesso."); }}>{content.confirm}</Button></DialogFooter></DialogContent></Dialog>;
}

function LoginScreen({ onEnter }: { onEnter: () => void }) {
  return <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.15fr)_minmax(440px,.85fr)]"><section className="relative hidden overflow-hidden bg-hero p-12 before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-brand-gradient text-hero-foreground lg:flex lg:flex-col lg:justify-between"><div className="flex items-center gap-3"><img src={safenetMarkUrl} alt="Safenet" className="size-11" /><div><strong className="font-display block tracking-[0.3em]">SAFENET</strong><span className="text-[10px] uppercase text-hero-foreground/55">Portal corporativo</span></div></div><div className="max-w-xl"><p className="mb-3 text-xs font-bold uppercase text-hero-accent">Acesso centralizado</p><h1 className="text-5xl font-bold leading-tight">Seu trabalho começa em um só lugar.</h1><p className="mt-5 max-w-lg text-sm leading-6 text-hero-foreground/65">Acesse com segurança as ferramentas autorizadas para o seu perfil.</p></div><p className="text-xs text-hero-foreground/45">Ambiente interno · Acesso monitorado</p></section><section className="flex items-center justify-center px-5 py-10"><div className="w-full max-w-sm"><div className="mb-8 lg:hidden"><img src={safenetMarkUrl} alt="Safenet" className="size-11" /><strong className="font-display mt-3 block tracking-[0.3em]">SAFENET</strong></div><Badge variant="outline" className="mb-5 border-primary/20 bg-accent text-primary">Protótipo de apresentação</Badge><h2 className="text-3xl font-bold">Bem-vindo de volta</h2><p className="mt-2 text-sm text-muted-foreground">Use seu e-mail corporativo para acessar o portal.</p><form className="mt-8 space-y-4" onSubmit={(event) => { event.preventDefault(); onEnter(); }}><label className="block text-xs font-medium">E-mail corporativo<Input className="mt-1 h-11" type="email" defaultValue="marina.alves@empresa.com.br" /></label><label className="block text-xs font-medium">Senha<Input className="mt-1 h-11" type="password" defaultValue="demonstracao" /></label><div className="flex items-center justify-between text-xs"><label className="flex items-center gap-2"><Checkbox /> Lembrar de mim</label><button type="button" className="font-semibold text-primary">Esqueci minha senha</button></div><Button type="submit" className="h-11 w-full">Entrar no portal <ArrowRight /></Button></form><div className="mt-6 rounded-md bg-muted p-3 text-center text-[11px] leading-5 text-muted-foreground">Esta tela é apenas visual. Nenhuma credencial é validada ou armazenada.</div></div></section></main>;
}