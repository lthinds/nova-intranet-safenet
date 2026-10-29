import { useEffect, useMemo, useState, type ComponentType } from "react";
import { appsData, deriveGroups, OTHER_GROUP } from "@/data/apps";
import { trainingsData } from "@/data/trainings";
import { canSeeApp, demoProfiles, fetchUserInfo, SIGN_OUT_URL } from "@/lib/keycloak";
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
  UserCog,
  X,
  Star,
  Contact,
  Cake,
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
  safenetMarkUrl,
  sortByDateDesc,
  type Announcement,
} from "@/components/portal-communications";
import { RolesView } from "@/components/roles-view";
import { BirthdaysView, DirectoryView, GlobalSearch, type SearchHit } from "@/components/directory-views";
import { canSeeHrData, identityFromLogin, readStats, toggleFavorite, type DirectoryEntry } from "@/lib/directory";
import { deleteRole, hasPermission, seedRoles, type Role } from "@/lib/roles";

type View = "inicio" | "avisos" | "treinamentos" | "aplicacoes" | "colaboradores" | "acessos" | "gestao" | "cargos" | "diretorio" | "aniversarios";
type Integration = "SSO integrado" | "Link externo";

type AppItem = {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  integration: Integration;
  status: "Disponível" | "Em breve";
  icon: ComponentType<{ className?: string }>;
  recent?: boolean;
  keycloakGroup?: string | undefined;
};

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  clock: Clock3, mail: Mail, car: Car, file: FileText, monitor: MonitorCheck, radio: Radio, ticket: TicketCheck,
  help: CircleHelp, chart: BarChart3, grid: Grid2X2, briefcase: BriefcaseBusiness, book: BookOpen, users: Users,
};

const apps: AppItem[] = appsData.map((a) => ({
  id: a.id,
  name: a.name,
  description: a.description,
  url: a.url,
  category: a.group || OTHER_GROUP,
  integration: a.integration === "sso" ? "SSO integrado" : "Link externo",
  status: a.status === "em_breve" ? "Em breve" : "Disponível",
  icon: iconMap[a.icon] ?? AppWindow,
  recent: Boolean(a.recent),
  keycloakGroup: a.keycloakGroup,
}));


type Person = DirectoryEntry & { status: string; initials: string };

const seedPeople: Person[] = [
  { name: "Marina Alves", email: "marina.alves@safenettecnologia.com.br", area: "Monitoramento", roles: ["Coordenação", "Monitoramento"], status: "Ativo", initials: "MA", phone: "(11) 98765-2101", birthDate: "1988-11-03", hireDate: "2016-03-14" },
  { name: "Rafael Costa", email: "rafael.costa@safenettecnologia.com.br", area: "Operacional", roles: ["Operacional", "Monitoramento"], status: "Ativo", initials: "RC", phone: "(11) 98765-2230", birthDate: "1995-10-29", hireDate: "2021-10-30" },
  { name: "Paulo Mendes", email: "paulo.mendes@safenettecnologia.com.br", area: "Monitoramento", roles: ["Supervisor", "Monitoramento", "Frota"], status: "Ativo", initials: "PM", phone: "(11) 98765-2177", birthDate: "1987-06-08", hireDate: "2017-09-11" },
  { name: "Ana Souza", email: "ana.souza@safenettecnologia.com.br", area: "RH", roles: ["RH"], status: "Ativo", initials: "AS", phone: "(11) 98765-2050", birthDate: "1990-12-12", hireDate: "2019-02-01" },
  { name: "Beatriz Lima", email: "beatriz.lima@safenettecnologia.com.br", area: "Comercial", roles: ["Comercial", "Licitações", "Marketing"], status: "Ativo", initials: "BL", phone: "(11) 98765-2310", birthDate: "1992-11-20", hireDate: "2022-07-04" },
  { name: "Carlos Nunes", email: "carlos.nunes@safenettecnologia.com.br", area: "Técnico", roles: ["Técnico"], status: "Bloqueado", initials: "CN", phone: "(11) 98765-2405", birthDate: "1985-01-15", hireDate: "2014-05-20" },
  { name: "João Pereira", email: "joao.pereira@safenettecnologia.com.br", area: "Licitações", roles: ["Licitações"], status: "Pendente", initials: "JP" },
];

const navItems: Array<{ id: View; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "inicio", label: "Visão geral", icon: LayoutDashboard },
  { id: "avisos", label: "Avisos", icon: Megaphone },
  { id: "aplicacoes", label: "Aplicações", icon: AppWindow },
  { id: "treinamentos", label: "Treinamentos", icon: GraduationCap },
  { id: "diretorio", label: "Diretório", icon: Contact },
  { id: "aniversarios", label: "Aniversários e tempo de casa", icon: Cake },
  { id: "colaboradores", label: "Colaboradores", icon: Users },
  { id: "acessos", label: "Acessos", icon: ShieldEllipsis },
  { id: "gestao", label: "Gestão de aplicações", icon: Settings },
  { id: "cargos", label: "Cargos e permissões", icon: UserCog },
];

type ModalState = null | { kind: "add" } | { kind: "approve" | "block" | "unblock"; email: string };

/** Abas visíveis conforme as permissões do portal somadas de todos os cargos do usuário. */
export function viewsAllowed(p: { canManageRoles: boolean; canManagePeople: boolean; canManageApps: boolean; canSeeHr?: boolean }): View[] {
  const v: View[] = ["inicio", "avisos", "aplicacoes", "treinamentos", "diretorio"];
  if (p.canSeeHr) v.push("aniversarios");
  // RH/DP manage collaborator data (not permissions), so they also see the people list.
  if (p.canManagePeople || p.canSeeHr) v.push("colaboradores");
  if (p.canManagePeople) v.push("acessos");
  if (p.canManageApps) v.push("gestao");
  if (p.canManageRoles) v.push("cargos");
  return v;
}

const categories = ["Todos", ...deriveGroups(appsData)];

export function PortalPrototype() {
  const [view, setView] = useState<View>("inicio");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [now] = useState(() => new Date());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => makeSeedAnnouncements(new Date()));
  const [courses] = useState(() => trainingsData);
  const [profileIndex, setProfileIndex] = useState(0);
  const [liveUser, setLiveUser] = useState<{ name: string; email: string; groups: string[] } | null>(null);
  useEffect(() => { fetchUserInfo(demoProfiles[0]!).then(({ user, demo }) => { if (!demo) setLiveUser(user); }); }, []);
  const profile = demoProfiles[profileIndex] ?? demoProfiles[0]!;
  const currentUser = liveUser ? { ...liveUser, roles: [] as string[], label: "Colaborador" } : profile;
  const initials = currentUser.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const visibleApps = useMemo(() => apps.filter((app) => canSeeApp(app, currentUser.groups)), [currentUser.groups]);
  // Read confirmations are kept per collaborator, so a confirmed notice never pops up again on later logins.
  const ackKey = `safenet-ack:${currentUser.email}`;
  const [acknowledged, setAcknowledgedState] = useState<string[]>([]);
  const [ackLoaded, setAckLoaded] = useState(false);
  useEffect(() => {
    try { setAcknowledgedState(JSON.parse(window.localStorage.getItem(ackKey) ?? "[]")); } catch { setAcknowledgedState([]); }
    setAckLoaded(true);
  }, [ackKey]);
  const setAcknowledged = (update: string[] | ((list: string[]) => string[])) => setAcknowledgedState((list) => {
    const next = typeof update === "function" ? update(list) : update;
    window.localStorage.setItem(ackKey, JSON.stringify(next));
    return next;
  });
  const [showMandatory, setShowMandatory] = useState(true);
  const [createNotice, setCreateNotice] = useState(false);
  const [openNotice, setOpenNotice] = useState<Announcement | null>(null);
  const [editingNotice, setEditingNotice] = useState<Announcement | null>(null);
  const [dark, setDark] = useState(false);
  const [roles, setRoles] = useState<Role[]>(seedRoles);
  const [profileOpen, setProfileOpen] = useState(false);
  const [people, setPeople] = useState<Person[]>(seedPeople);
  const canManageRoles = hasPermission(currentUser.roles, roles, "gerenciar_cargos");
  const canPublish = hasPermission(currentUser.roles, roles, "publicar_avisos");
  const canManagePeople = hasPermission(currentUser.roles, roles, "gerenciar_colaboradores");
  const canManageApps = hasPermission(currentUser.roles, roles, "gerenciar_aplicacoes");
  const canSeeHr = canSeeHrData(currentUser.roles);
  const allowedViews = viewsAllowed({ canManageRoles, canManagePeople, canManageApps, canSeeHr });
  const favKey = `safenet-fav:${currentUser.email}`;
  const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => { try { setFavorites(JSON.parse(window.localStorage.getItem(favKey) ?? "[]")); } catch { setFavorites([]); } }, [favKey]);
  const toggleFav = (id: string) => setFavorites((list) => { const next = toggleFavorite(list, id); window.localStorage.setItem(favKey, JSON.stringify(next)); return next; });
  const [focusPerson, setFocusPerson] = useState<string | null>(null);
  useEffect(() => { if (!allowedViews.includes(view)) setView("inicio"); }, [view, allowedViews]);
  const pendingCount = people.filter((p) => p.status === "Pendente").length;
  const [launching, setLaunching] = useState<AppItem | null>(null);

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
  const unreadCount = announcements.filter((item) => isActive(item, now) && isRecipient(item, currentUser) && !acknowledged.includes(item.id)).length;
  const acksByEmail = useMemo(() => {
    const out: Record<string, string[]> = {};
    if (typeof window === "undefined") return out;
    for (const p of people) { try { out[p.email] = JSON.parse(window.localStorage.getItem(`safenet-ack:${p.email}`) ?? "[]"); } catch { out[p.email] = []; } }
    out[currentUser.email] = acknowledged;
    return out;
  }, [people, acknowledged, currentUser.email]);
  const searchSources: SearchHit[] = useMemo(() => [
    ...visibleApps.map((a) => ({ kind: "app" as const, id: a.id, title: a.name, subtitle: `${a.category} · ${a.description}` })),
    ...announcements.filter((n) => isActive(n, now) && isRecipient(n, currentUser)).map((n) => ({ kind: "aviso" as const, id: n.id, title: n.title, subtitle: n.summary })),
    ...courses.map((c, i) => ({ kind: "treinamento" as const, id: String(i), title: c.curso, subtitle: `${c.fabricante} · ${c.modalidade}` })),
    ...people.filter((p) => p.status === "Ativo").map((p) => ({ kind: "pessoa" as const, id: p.email, title: p.name, subtitle: `${p.area} · ${p.roles.join(", ")}${p.phone ? ` · ${p.phone}` : ""}` })),
  ], [visibleApps, announcements, courses, people, now, currentUser]);
  function pickHit(h: SearchHit) {
    if (h.kind === "app") { const a = visibleApps.find((x) => x.id === h.id); if (a) setSelectedApp(a); }
    if (h.kind === "aviso") { const n = announcements.find((x) => x.id === h.id); if (n) setOpenNotice(n); }
    if (h.kind === "treinamento") navigate("treinamentos");
    if (h.kind === "pessoa") { setFocusPerson(h.id); navigate("diretorio"); }
  }
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
    return visibleApps.filter((app) => {
      const categoryMatches = category === "Todos" || app.category === category;
      const queryMatches = !needle || `${app.name} ${app.description} ${app.category}`.toLocaleLowerCase("pt-BR").includes(needle);
      return categoryMatches && queryMatches;
    });
  }, [category, query, visibleApps]);

  function navigate(next: View) {
    setView(next);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3200);
  }

  const titles: Record<View, { title: string; description: string }> = {
    inicio: { title: `Bom dia, ${currentUser.name.split(" ")[0]}`, description: "Aqui está o que você precisa para começar o dia." },
    avisos: { title: "Avisos e comunicados", description: "Todos os comunicados da empresa, organizados por data." },
    treinamentos: { title: "Treinamentos", description: "Cursos e capacitações disponíveis para as equipes." },
    aplicacoes: { title: "Aplicações", description: "Acesse as ferramentas disponíveis para o seu perfil." },
    colaboradores: { title: "Colaboradores", description: "Aprove cadastros e acompanhe a situação das contas." },
    acessos: { title: "Gestão de acessos", description: "Defina quais ferramentas cada colaborador visualiza no portal." },
    cargos: { title: "Cargos e permissões", description: "Crie cargos e defina o que cada um vê e administra no portal." },
    diretorio: { title: "Diretório de colaboradores", description: "Encontre colegas por nome, setor, cargo ou telefone." },
    aniversarios: { title: "Aniversários e tempo de casa", description: "Datas comemorativas da equipe (exclusivo RH e DP)." },
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
          {navItems.filter((item) => allowedViews.includes(item.id)).map((item) => {
            const Icon = item.icon;
            return <Button key={item.id} variant="ghost" onClick={() => navigate(item.id)} className={cn("h-11 w-full justify-start px-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", view === item.id && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm")}><Icon />{item.label}{item.id === "avisos" && unreadCount > 0 && <span className="ml-auto grid size-5 place-items-center rounded-full bg-brand-orange text-[10px] font-bold text-primary-foreground" aria-label={`${unreadCount} não lidos`}>{unreadCount}</span>}{item.id === "colaboradores" && pendingCount > 0 && <span className="ml-auto grid size-5 place-items-center rounded-full bg-warning text-warning-foreground text-[10px] font-bold">{pendingCount}</span>}</Button>;
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <a href={SIGN_OUT_URL} onClick={(e) => { if (!liveUser) { e.preventDefault(); showNotice("Em produção, Sair encerra a sessão no Keycloak (/oauth2/sign_out)."); } }} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-sidebar-accent">
            <span className="grid size-9 place-items-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">{initials}</span>
            <span className="min-w-0"><strong className="block truncate text-xs">{currentUser.name}</strong><small className="block truncate text-[10px] text-sidebar-foreground/50">Sair</small></span>
            <LogOut className="size-4 text-sidebar-foreground/45" />
          </a>
        </div>
      </aside>

      {mobileOpen && <button className="fixed inset-0 z-30 bg-overlay lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" />}

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-20 grid h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm md:px-8">
          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu /></Button>
          <div className="min-w-0"><GlobalSearch sources={searchSources} onPick={pickHit} /></div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden h-8 gap-2 border-success/20 bg-success-soft text-success xl:flex"><span className="size-1.5 rounded-full bg-success" /> Rede interna</Badge>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}>{dark ? <Sun /> : <Moon />}</Button>
            <Button variant="ghost" size="icon" aria-label="Avisos" onClick={() => navigate("avisos")} className="relative"><Bell />{unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-brand-orange text-[9px] font-bold text-primary-foreground">{unreadCount}</span>}</Button>
            <Button variant="ghost" size="sm" onClick={() => setProfileOpen(true)} aria-label="Meu perfil"><UserCheck /><span className="hidden sm:inline">Meu perfil</span></Button>
            <span className="hidden h-6 w-px bg-border sm:block" />
            {liveUser ? <span className="hidden items-center gap-2 px-2 md:flex"><span className="grid size-8 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{initials}</span><strong className="text-xs">{currentUser.name}</strong></span> : <label className="relative hidden items-center gap-2 rounded-md px-2 py-1 hover:bg-muted md:flex" title="Simular usuário (demonstração do /oauth2/userinfo)"><span className="grid size-8 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{initials}</span><span><strong className="block text-xs">{currentUser.name}</strong><small className="block text-[10px] text-muted-foreground">{profile.label} · {currentUser.groups.length} grupos</small></span><ChevronDown className="size-3 text-muted-foreground" /><select aria-label="Simular usuário" className="absolute inset-0 cursor-pointer opacity-0" value={profileIndex} onChange={(e) => { setProfileIndex(Number(e.target.value)); setAckLoaded(false); setShowMandatory(true); }}>{demoProfiles.map((p, i) => <option key={p.email} value={i}>{p.name} — {p.label}</option>)}</select></label>}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
          <div className="mb-7 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div className="min-w-0"><p className="mb-2 text-[10px] font-bold uppercase text-primary">Central de aplicações</p><h1 className="font-display text-2xl font-bold md:text-[30px]">{currentTitle.title}</h1><p className="mt-1 text-sm text-muted-foreground">{currentTitle.description}</p></div>
            {view === "gestao" && canManageApps && <Button onClick={() => setModal({ kind: "add" })}><Plus /> Nova aplicação</Button>}
          </div>

          {view === "inicio" && <HomeView favorites={favorites} onToggleFav={toggleFav} apps={visibleApps} navigate={navigate} onSelect={setSelectedApp} latest={sortByDateDesc(announcements).filter((item) => isActive(item, now)).slice(0, 2)} onOpenNotice={setOpenNotice} />}
          {view === "avisos" && <NoticesView items={announcements} now={now} acknowledged={acknowledged} onCreate={canPublish ? () => setCreateNotice(true) : undefined} onOpen={(item) => { setOpenNotice(item); if (!item.mandatory && !acknowledged.includes(item.id)) setAcknowledged((l) => [...l, item.id]); }} extra={canPublish ? (item) => { const recips = people.filter((p) => p.status === "Ativo" && isRecipient(item, p)); const st = readStats(recips, acksByEmail, item.id); return <Badge variant="outline" className="border-info/20 bg-info-soft text-info" title={`${st.pending} pendentes`}><Eye className="mr-1 size-3" />{st.read}/{st.total} leram</Badge>; } : undefined} />}
          {view === "treinamentos" && <TrainingsView courses={courses} now={now} />}
          {view === "aplicacoes" && <ApplicationsView favorites={favorites} onToggleFav={toggleFav} apps={filteredApps} query={query} setQuery={setQuery} category={category} setCategory={setCategory} onSelect={setSelectedApp} />}
          {view === "diretorio" && <DirectoryView people={people} focus={focusPerson} />}
          {view === "aniversarios" && canSeeHr && <BirthdaysView people={people} now={now} />}
          {view === "colaboradores" && (canManagePeople || canSeeHr) && <PeopleView people={people} setPeople={setPeople} roleNames={roles.map((r) => r.name)} setModal={setModal} showNotice={showNotice} canManageAccess={canManagePeople} canEditData={canSeeHr || canManagePeople} />}
          {view === "cargos" && canManageRoles && <RolesView roles={roles} people={people} apps={apps.map((a) => ({ id: a.id, name: a.name }))} onSave={(role, prev) => { setRoles((list) => list.some((r) => r.id === role.id) ? list.map((r) => (r.id === role.id ? role : r)) : [...list, role]); if (prev && prev !== role.name) setPeople((list) => list.map((p) => ({ ...p, roles: p.roles.map((n) => (n === prev ? role.name : n)) }))); showNotice(prev ? `Cargo ${role.name} atualizado.` : `Cargo ${role.name} criado.`); }} onDelete={(id) => { const name = roles.find((r) => r.id === id)?.name; const res = deleteRole(id, roles, people); setRoles(res.roles); setPeople(res.people); showNotice(`Cargo ${name} excluído.`); }} />}
          {view === "acessos" && canManagePeople && <AccessView access={access} setAccess={setAccess} showNotice={showNotice} />}
          {view === "gestao" && canManageApps && <ManagementView onSelect={setSelectedApp} />}
        </main>
      </div>

      {profileOpen && <ProfileDialog me={people.find((p) => p.email === currentUser.email) ?? { name: currentUser.name, email: currentUser.email, area: "", roles: currentUser.roles, status: "Ativo", initials }} onClose={() => setProfileOpen(false)} onSave={(data) => { setPeople((list) => list.some((p) => p.email === currentUser.email) ? list.map((p) => (p.email === currentUser.email ? { ...p, ...data } : p)) : [...list, { name: currentUser.name, email: currentUser.email, area: "", roles: currentUser.roles, status: "Ativo", initials, ...data }]); setProfileOpen(false); showNotice("Seus dados foram atualizados."); }} />}
      <ApplicationDialog app={selectedApp} onClose={() => setSelectedApp(null)} onLaunch={setLaunching} />
      <LaunchOverlay app={launching} onDone={() => setLaunching(null)} />
      <ActionDialog modal={modal} setModal={setModal} people={people} onConfirm={(kind, email) => {
        const target = people.find((p) => p.email === email);
        if (!target) return;
        if (kind === "approve") { setPeople((list) => list.map((p) => (p.email === email ? { ...p, status: "Ativo" } : p))); showNotice(`Cadastro de ${target.name} aprovado. O acesso ao portal foi liberado.`); }
        if (kind === "block") { setPeople((list) => list.map((p) => (p.email === email ? { ...p, status: "Bloqueado" } : p))); showNotice(`${target.name} bloqueado. Login impedido e sessões encerradas nos sistemas próprios.`); }
        if (kind === "unblock") { setPeople((list) => list.map((p) => (p.email === email ? { ...p, status: "Ativo" } : p))); showNotice(`${target.name} desbloqueado.`); }
      }} showNotice={showNotice} />
      <NoticeDetailDialog item={openNotice} onClose={() => setOpenNotice(null)} onEdit={canPublish ? (item) => { setOpenNotice(null); setEditingNotice(item); setCreateNotice(true); } : undefined} />
      <CreateNoticeDialog roles={roles.map((r) => r.name)} directory={people} open={createNotice} editing={editingNotice} onClose={() => { setCreateNotice(false); setEditingNotice(null); }} onUpdate={(item) => { setAnnouncements((list) => list.map((a) => (a.id === item.id ? item : a))); setCreateNotice(false); setEditingNotice(null); showNotice("Aviso atualizado."); }} onCreate={(data, expiration, customDate) => {
        const published = new Date();
        setAnnouncements((list) => [{ ...data, id: `n${published.getTime()}`, publishedAt: published.toISOString(), expiresAt: computeExpiration(published, expiration, customDate) }, ...list]);
        setCreateNotice(false);
        showNotice(data.mandatory ? "Aviso publicado. Ele aparecerá em tela cheia no próximo login." : "Aviso publicado na aba Avisos.");
      }} />
      {showMandatory && ackLoaded && <MandatoryNoticeOverlay items={pendingMandatory} onAcknowledge={(id) => setAcknowledged((list) => [...list, id])} />}

      {notice && <div role="status" className="fixed bottom-5 right-5 z-[70] flex max-w-sm items-start gap-3 rounded-md border border-success/20 bg-foreground px-4 py-3 text-background shadow-xl"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success text-success-foreground"><Check className="size-3" /></span><p className="text-xs leading-5">{notice}</p></div>}
    </div>
  );
}

function HomeView({ apps, navigate, onSelect, latest, onOpenNotice, favorites, onToggleFav }: { favorites: string[]; onToggleFav: (id: string) => void; apps: AppItem[]; navigate: (view: View) => void; onSelect: (app: AppItem) => void; latest: Announcement[]; onOpenNotice: (item: Announcement) => void }) {
  const favApps = apps.filter((app) => favorites.includes(app.id));
  const recent = favApps.length ? favApps : apps.filter((app) => app.recent);
  return <div className="space-y-7">
    <HeroCarousel onOpenNotices={() => navigate("avisos")} />
    <section>
      <SectionHeading title={favApps.length ? "Seus favoritos" : "Sugeridos para você"} action={<Button variant="ghost" size="sm" onClick={() => navigate("aplicacoes")}>Ver todos <ArrowRight /></Button>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{recent.map((app) => <AppCard key={app.name} app={app} onClick={() => onSelect(app)} compact favorite={favorites.includes(app.id)} onToggleFav={() => onToggleFav(app.id)} />)}</div>
      {!favApps.length && <p className="mt-3 text-xs text-muted-foreground">Dica: toque na estrela de um aplicativo para fixá-lo aqui.</p>}
    </section>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,.7fr)]">
      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"><SectionHeading title="Visão do portal" /><div className="grid gap-3 sm:grid-cols-3"><Metric value="17" label="Aplicações cadastradas" icon={AppWindow} /><Metric value="12" label="Liberadas para você" icon={BadgeCheck} /><Metric value="100%" label="Serviços disponíveis" icon={ShieldCheck} /></div></section>
      <section className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"><SectionHeading title="Avisos recentes" action={<Button variant="ghost" size="sm" onClick={() => navigate("avisos")}>Ver todos <ArrowRight /></Button>} /><div className="space-y-3">{latest.map((item) => <button key={item.id} onClick={() => onOpenNotice(item)} className="block w-full rounded-md border p-3 text-left hover:bg-muted/50"><SectorBadge sector={item.sector} /><strong className="mt-2 block text-sm">{item.title}</strong><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.summary}</p></button>)}</div></section>
    </div>
  </div>;
}

function ApplicationsView({ apps: visibleApps, query, setQuery, category, setCategory, onSelect, favorites, onToggleFav }: { favorites: string[]; onToggleFav: (id: string) => void; apps: AppItem[]; query: string; setQuery: (value: string) => void; category: string; setCategory: (value: string) => void; onSelect: (app: AppItem) => void }) {
  return <div className="space-y-5">
    <div className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_auto]">
      <label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar aplicação ou recurso..." className="h-10 pl-9" /><span className="sr-only">Buscar aplicações</span></label>
      <Select value={category} onValueChange={setCategory}><SelectTrigger className="h-10"><SelectValue /></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
      <Button variant="outline" className="h-10"><ListFilter /> Filtros</Button>
    </div>
    <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground"><strong className="text-foreground">{visibleApps.length}</strong> aplicações encontradas</p><div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><Eye className="size-4" /> Mostrando apenas ferramentas dos seus grupos (GS_App)</div></div>
    {visibleApps.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[...visibleApps].sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id))).map((app) => <AppCard key={app.name} app={app} onClick={() => onSelect(app)} favorite={favorites.includes(app.id)} onToggleFav={() => onToggleFav(app.id)} />)}</div> : <div className="grid min-h-72 place-items-center rounded-lg border border-dashed bg-card text-center"><div><Search className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">Nenhuma aplicação encontrada</h2><p className="mt-1 text-sm text-muted-foreground">Tente outro termo ou categoria.</p></div></div>}
  </div>;
}

type PersonData = Pick<Person, "phone" | "birthDate" | "hireDate" | "area">;

function ProfileDialog({ me, onClose, onSave }: { me: Person; onClose: () => void; onSave: (data: Pick<Person, "phone" | "birthDate">) => void }) {
  const [phone, setPhone] = useState(me.phone ?? "");
  const [birthDate, setBirthDate] = useState(me.birthDate ?? "");
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Meu perfil</DialogTitle><DialogDescription>Nome e e-mail vêm do seu login corporativo e não podem ser alterados aqui.</DialogDescription></DialogHeader>
    <div className="space-y-3 py-2">
      <label className="block text-xs font-medium">Nome<Input className="mt-1" value={me.name} readOnly disabled /></label>
      <label className="block text-xs font-medium">E-mail corporativo<Input className="mt-1" value={me.email} readOnly disabled /></label>
      <label className="block text-xs font-medium">Telefone<Input className="mt-1" type="tel" placeholder="(11) 90000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
      <label className="block text-xs font-medium">Data de nascimento<Input className="mt-1" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></label>
      <p className="text-[11px] text-muted-foreground">Sua data de nascimento só é visível para o RH e o DP.</p>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={() => onSave({ phone: phone || undefined, birthDate: birthDate || undefined })}>Salvar</Button></DialogFooter></DialogContent></Dialog>;
}

function PersonDataDialog({ person, onClose, onSave }: { person: Person | null; onClose: () => void; onSave: (data: Person) => void }) {
  const isNew = !person;
  const [login, setLogin] = useState("");
  const [area, setArea] = useState(person?.area ?? "");
  const [phone, setPhone] = useState(person?.phone ?? "");
  const [birthDate, setBirthDate] = useState(person?.birthDate ?? "");
  const [hireDate, setHireDate] = useState(person?.hireDate ?? "");
  const id = isNew ? identityFromLogin(login) : { name: person.name, email: person.email };
  const valid = isNew ? /^[a-z]+\.[a-z]+$/i.test(login.trim()) && area.trim() : true;
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{isNew ? "Novo colaborador" : `Dados cadastrais de ${person.name}`}</DialogTitle><DialogDescription>{isNew ? "Informe o login corporativo (nome.sobrenome). Nome e e-mail são gerados automaticamente. Funções e acessos são definidos depois pela Coordenação." : "Dados cadastrais. Funções e acessos não são alterados aqui."}</DialogDescription></DialogHeader>
    <div className="space-y-3 py-2">
      {isNew && <label className="block text-xs font-medium">Login corporativo<Input className="mt-1" placeholder="nome.sobrenome" value={login} onChange={(e) => setLogin(e.target.value)} /></label>}
      <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-medium">Nome<Input className="mt-1" value={id.name} readOnly disabled /></label><label className="block text-xs font-medium">E-mail<Input className="mt-1" value={login || !isNew ? id.email : ""} readOnly disabled /></label></div>
      <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-medium">Área / setor<Input className="mt-1" placeholder="Ex.: Monitoramento" value={area} onChange={(e) => setArea(e.target.value)} /></label><label className="block text-xs font-medium">Telefone<Input className="mt-1" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></label></div>
      <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-medium">Data de nascimento<Input className="mt-1" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></label><label className="block text-xs font-medium">Data de admissão<Input className="mt-1" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} /></label></div>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!valid} onClick={() => { const data: PersonData = { area: area.trim(), phone: phone || undefined, birthDate: birthDate || undefined, hireDate: hireDate || undefined }; onSave(isNew ? { ...id, roles: [], status: "Pendente", initials: id.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(), ...data } : { ...person, ...data }); }}>{isNew ? "Cadastrar" : "Salvar dados"}</Button></DialogFooter></DialogContent></Dialog>;
}

function PeopleView({ people, setPeople, roleNames, setModal, showNotice, canManageAccess, canEditData }: { people: Person[]; setPeople: React.Dispatch<React.SetStateAction<Person[]>>; roleNames: string[]; setModal: (value: ModalState) => void; showNotice: (message: string) => void; canManageAccess: boolean; canEditData: boolean }) {
  const [editing, setEditing] = useState<Person | null>(null);
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const [dataFor, setDataFor] = useState<Person | null | "new">(null);
  const toggle = (r: string) => setDraftRoles((list) => (list.includes(r) ? list.filter((x) => x !== r) : [...list, r]));
  const pending = people.filter((p) => p.status === "Pendente");
  return <div className="space-y-5">
    {dataFor && <PersonDataDialog person={dataFor === "new" ? null : dataFor} onClose={() => setDataFor(null)} onSave={(p) => { if (dataFor === "new" && people.some((x) => x.email === p.email)) { showNotice(`${p.email} já está cadastrado.`); return; } setPeople((list) => dataFor === "new" ? [...list, p] : list.map((x) => (x.email === p.email ? p : x))); showNotice(dataFor === "new" ? `${p.name} cadastrado. Aguardando a Coordenação liberar o acesso.` : `Dados de ${p.name} atualizados.`); setDataFor(null); }} />}
    {editing && <Dialog open onOpenChange={(o) => !o && setEditing(null)}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Funções de {editing.name}</DialogTitle><DialogDescription>Um colaborador pode ter várias funções. Ele verá todas as áreas do portal liberadas para qualquer uma delas. As permissões dentro de cada sistema continuam sendo definidas no próprio sistema.</DialogDescription></DialogHeader><div className="grid grid-cols-2 gap-2">{roleNames.map((r) => <label key={r} className={cn("flex items-center gap-2 rounded-md border p-3 text-sm", draftRoles.includes(r) && "border-primary bg-accent")}><Checkbox checked={draftRoles.includes(r)} onCheckedChange={() => toggle(r)} />{r}</label>)}</div><DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button disabled={!draftRoles.length} onClick={() => { setPeople((list) => list.map((p) => (p.email === editing.email ? { ...p, roles: draftRoles } : p))); showNotice(`Funções de ${editing.name} atualizadas.`); setEditing(null); }}>Salvar funções</Button></DialogFooter></DialogContent></Dialog>}
    {!canManageAccess && <section className="rounded-lg border border-info/20 bg-info-soft p-4 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Modo RH/DP:</strong> você pode cadastrar colaboradores e editar dados cadastrais. Aprovação, funções e bloqueios são feitos pela Coordenação.</section>}
    {canManageAccess && <section className="rounded-lg border border-warning/25 bg-warning-soft p-4"><div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-md bg-warning text-warning-foreground"><UserCheck className="size-5" /></span><div className="min-w-0"><strong className="text-sm">{pending.length ? `${pending.length} cadastro(s) aguardando aprovação` : "Nenhum cadastro pendente"}</strong><p className="mt-0.5 text-xs text-muted-foreground">Revise os dados antes de liberar o acesso ao portal.</p></div>{pending[0] && <Button size="sm" onClick={() => setModal({ kind: "approve", email: pending[0]!.email })}>Revisar</Button>}</div></section>}
    <div className="grid gap-3 sm:grid-cols-3"><Metric value={String(people.filter((p) => p.status === "Ativo").length)} label="Colaboradores ativos" icon={Users} /><Metric value={String(pending.length)} label="Aguardando aprovação" icon={Clock3} /><Metric value={String(people.filter((p) => p.status === "Bloqueado").length)} label="Contas bloqueadas" icon={LockKeyhole} /></div>
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="grid gap-3 border-b p-4 md:grid-cols-[minmax(0,1fr)_180px_auto]"><label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar nome ou e-mail..." className="pl-9" /></label><Select defaultValue="todos"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os status</SelectItem><SelectItem value="ativo">Ativos</SelectItem><SelectItem value="pendente">Pendentes</SelectItem><SelectItem value="bloqueado">Bloqueados</SelectItem></SelectContent></Select>{canEditData ? <Button onClick={() => setDataFor("new")}><Plus /> Novo colaborador</Button> : <span />}</div>
      <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-muted/60 text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Colaborador</th><th className="px-4 py-3 font-medium">Área</th><th className="px-4 py-3 font-medium">Telefone</th><th className="px-4 py-3 font-medium">Funções no portal</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Ações</th></tr></thead><tbody>{people.map((person) => <tr key={person.email} className="border-t hover:bg-muted/30"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-muted font-bold text-primary">{person.initials}</span><div><strong className="block text-sm">{person.name}</strong><span className="text-muted-foreground">{person.email}</span></div></div></td><td className="px-4 py-4">{person.area || "—"}</td><td className="px-4 py-4">{person.phone ?? "—"}</td><td className="px-4 py-4"><div className="flex max-w-64 flex-wrap gap-1">{person.roles.length ? person.roles.map((r) => <Badge key={r} variant="outline">{r}</Badge>) : <span className="text-muted-foreground">A definir</span>}</div></td><td className="px-4 py-4"><StatusBadge status={person.status} /></td><td className="px-4 py-4"><div className="flex justify-end gap-1">
        {canEditData && <Button variant="ghost" size="icon" onClick={() => setDataFor(person)} aria-label={`Dados cadastrais de ${person.name}`} title="Dados cadastrais"><FileText /></Button>}
        {canManageAccess && (person.status === "Pendente" ? <Button size="sm" onClick={() => setModal({ kind: "approve", email: person.email })}>Aprovar</Button> : <><Button variant="ghost" size="icon" onClick={() => { setEditing(person); setDraftRoles(person.roles); }} aria-label={`Funções de ${person.name}`} title="Funções no portal"><Settings /></Button>{person.status === "Bloqueado" ? <Button variant="outline" size="sm" onClick={() => setModal({ kind: "unblock", email: person.email })}>Desbloquear</Button> : <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setModal({ kind: "block", email: person.email })} aria-label={`Bloquear ${person.name}`}><LockKeyhole /></Button>}</>)}
      </div></td></tr>)}</tbody></table></div>
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

function AppCard({ app, onClick, compact = false, favorite = false, onToggleFav }: { app: AppItem; onClick: () => void; compact?: boolean; favorite?: boolean; onToggleFav?: () => void }) {
  const Icon = app.icon;
  return <div className="relative">{onToggleFav && <button onClick={onToggleFav} aria-label={favorite ? `Remover ${app.name} dos favoritos` : `Fixar ${app.name} nos favoritos`} aria-pressed={favorite} className="absolute bottom-3 right-3 z-10 grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-brand-orange"><Star className={cn("size-4", favorite && "fill-brand-orange text-brand-orange")} /></button>}<button onClick={onClick} className={cn("group flex h-full w-full min-h-48 flex-col rounded-lg border bg-card p-5 text-left text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md", compact && "min-h-40 p-4")}><div className="flex w-full items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-md bg-accent text-primary"><Icon className="size-5" /></span><Badge variant="outline" className={cn("border-success/15 bg-success-soft text-success", app.status === "Em breve" && "border-border bg-muted text-muted-foreground")}>{app.status}</Badge></div><h3 className="mt-4 text-sm font-bold">{app.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{app.description}</p><span className="mt-auto flex items-center gap-1 pt-4 text-xs font-bold text-primary">{app.status === "Em breve" ? "Ver detalhes" : "Acessar"}<ArrowRight className="size-3 transition-transform group-hover:translate-x-1" /></span></button></div>;
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

function ApplicationDialog({ app, onClose, onLaunch }: { app: AppItem | null; onClose: () => void; onLaunch: (app: AppItem) => void }) {
  if (!app) return null;
  const Icon = app.icon;
  const pending = !app.url || app.url === "#";
  const unavailable = app.status === "Em breve" || pending;
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="max-w-xl"><DialogHeader><div className="mb-3 flex items-center gap-3"><span className="grid size-12 place-items-center rounded-md bg-accent text-primary"><Icon className="size-6" /></span><div><DialogTitle>{app.name}</DialogTitle><p className="mt-1 text-xs text-muted-foreground">{app.category}</p></div></div><DialogDescription>{app.description}</DialogDescription></DialogHeader><div className="space-y-3 py-2"><div className="grid grid-cols-2 gap-3"><div className="rounded-md border p-3"><span className="text-[10px] uppercase text-muted-foreground">Forma de acesso</span><div className="mt-2"><IntegrationBadge type={app.integration} /></div></div><div className="rounded-md border p-3"><span className="text-[10px] uppercase text-muted-foreground">Disponibilidade</span><div className="mt-2"><StatusBadge status={pending ? "Endereço pendente" : app.status} /></div></div></div><div className="rounded-md bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">{app.integration === "SSO integrado" ? "Você entra com o login único da empresa. As permissões internas continuam definidas neste sistema." : "Ferramenta de terceiros: abre em nova aba e pode pedir login próprio."}</div></div><DialogFooter><Button variant="outline" onClick={onClose}>Fechar</Button><Button disabled={unavailable} onClick={() => { onClose(); onLaunch(app); }}>{app.integration === "SSO integrado" ? <KeyRound /> : <ExternalLink />}{unavailable ? "Indisponível" : "Abrir aplicação"}</Button></DialogFooter></DialogContent></Dialog>;
}

function LaunchOverlay({ app, onDone }: { app: AppItem | null; onDone: () => void }) {
  useEffect(() => {
    if (!app) return;
    const t = window.setTimeout(() => {
      if (app.integration === "Link externo") window.open(app.url, "_blank", "noopener,noreferrer");
      else window.location.assign(app.url);
      onDone();
    }, 1400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app]);
  if (!app) return null;
  const Icon = app.icon;
  const sso = app.integration === "SSO integrado";
  return <div role="status" className="fixed inset-0 z-[80] grid place-items-center bg-overlay backdrop-blur-sm"><div className="w-[min(92vw,380px)] rounded-lg border bg-card p-7 text-center shadow-2xl"><span className="mx-auto grid size-14 place-items-center rounded-md bg-accent text-primary"><Icon className="size-7" /></span><h2 className="mt-4 font-display text-lg font-bold">Abrindo {app.name}</h2><p className="mt-1 text-xs text-muted-foreground">{sso ? "Validando seu login único…" : "Abrindo em uma nova aba…"}</p><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/2 animate-pulse rounded-full bg-primary" /></div><Button variant="ghost" size="sm" className="mt-4" onClick={onDone}>Cancelar</Button></div></div>;
}

function ActionDialog({ modal, setModal, people, onConfirm, showNotice }: { modal: ModalState; setModal: (value: ModalState) => void; people: Person[]; onConfirm: (kind: "approve" | "block" | "unblock", email: string) => void; showNotice: (message: string) => void }) {
  if (!modal) return null;
  const person = modal.kind !== "add" ? people.find((p) => p.email === modal.email) : undefined;
  const content = {
    add: { title: "Cadastrar nova aplicação", description: "Defina como a ferramenta aparecerá no portal.", confirm: "Cadastrar aplicação" },
    approve: { title: "Aprovar novo colaborador", description: `Revise os dados antes de liberar a conta de ${person?.name ?? ""}.`, confirm: "Aprovar cadastro" },
    block: { title: `Bloquear ${person?.name ?? "colaborador"}`, description: "O login é impedido na hora e as sessões abertas nos sistemas próprios integrados são encerradas.", confirm: "Confirmar bloqueio" },
    unblock: { title: `Desbloquear ${person?.name ?? "colaborador"}`, description: "O colaborador volta a entrar no portal com os mesmos cargos de antes.", confirm: "Desbloquear" },
  }[modal.kind];
  const body = modal.kind === "add" ? <div className="space-y-4 py-2"><label className="block text-xs font-medium">Nome da aplicação<Input className="mt-1" placeholder="Ex.: Central de CFTV" /></label><div className="grid grid-cols-2 gap-3"><label className="block text-xs font-medium">Categoria<Select defaultValue="operacional"><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="operacional">Operacional</SelectItem><SelectItem value="comercial">Comercial</SelectItem><SelectItem value="tecnico">Técnico</SelectItem><SelectItem value="rh">RH</SelectItem></SelectContent></Select></label><label className="block text-xs font-medium">Tipo de acesso<Select defaultValue="sso"><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sso">SSO integrado</SelectItem><SelectItem value="externo">Link externo</SelectItem></SelectContent></Select></label></div><label className="block text-xs font-medium">Endereço da aplicação<Input className="mt-1" placeholder="https://..." /></label><div className="rounded-md border border-primary/15 bg-accent p-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Vínculo corporativo:</strong> aplicações próprias usarão o e-mail corporativo único para localizar a conta já existente.</div></div>
    : modal.kind === "approve" ? <div className="space-y-4 py-2"><div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md border p-4"><span className="grid size-10 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{person?.initials}</span><div><strong className="block text-sm">{person?.name}</strong><span className="text-xs text-muted-foreground">{person?.email} · {person?.area}</span></div></div><label className="flex items-center gap-2 text-xs"><Checkbox defaultChecked /> Confirmo que o e-mail corporativo e a área estão corretos.</label></div>
    : modal.kind === "block" ? <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-xs leading-5 text-muted-foreground"><strong className="text-destructive">Efeito:</strong> {person?.name} perde o acesso ao portal e aos sistemas próprios imediatamente. Ferramentas de terceiros não permitem encerrar a sessão remotamente.</div>
    : null;
  return <Dialog open onOpenChange={(open) => !open && setModal(null)}><DialogContent><DialogHeader><DialogTitle>{content.title}</DialogTitle><DialogDescription>{content.description}</DialogDescription></DialogHeader>{body}<DialogFooter><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button variant={modal.kind === "block" ? "destructive" : "default"} onClick={() => { const m = modal; setModal(null); if (m.kind === "add") showNotice("Aplicação cadastrada."); else onConfirm(m.kind, m.email); }}>{content.confirm}</Button></DialogFooter></DialogContent></Dialog>;
}
