// =============================================================================
// CAMADA DE CONEXÃO COM O SERVIDOR DA SAFENET (TrueNAS)
// -----------------------------------------------------------------------------
// >>> PARA O CLAUDE / GESTOR: leia docs/GUIA_CLAUDE_E_GESTOR.md antes de mexer.
//
// O portal NÃO tem banco próprio. Todas as leituras e gravações passam por aqui
// e vão para uma API REST que o gestor vai subir no TrueNAS.
//
// - Com VITE_API_BASE_URL definido (ex.: "/api" atrás do mesmo proxy OIDC),
//   as chamadas vão para o servidor real, com o cookie de sessão do Keycloak.
// - Sem VITE_API_BASE_URL (prévia/apresentação), toda função devolve `null`
//   e as telas continuam usando os dados de exemplo locais.
//
// TODO(integração): trocar os useState de dados de exemplo em
// src/components/portal-prototype.tsx por chamadas a `api.*` abaixo.
// =============================================================================

import type { AppItemData } from "@/data/apps";
import type { Role } from "@/lib/roles";
import type { DirectoryEntry } from "@/lib/directory";
import type { Announcement } from "@/components/portal-communications";
import type { Job, JobApplication, Manual, Shift } from "@/components/ops-views";

export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

/** true quando o portal está ligado ao servidor real. */
export const apiEnabled = () => API_BASE_URL.length > 0;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Chamada base. Envia o cookie do proxy OIDC (credentials: "include").
 * Retorna null quando a API não está configurada (modo demonstração).
 * 401 => sessão expirou: recarrega a página para o proxy pedir login de novo.
 */
export async function request<T>(method: Method, path: string, body?: unknown, fetcher: typeof fetch = fetch): Promise<T | null> {
  if (!apiEnabled()) return null;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetcher(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });
  if (res.status === 401 && typeof window !== "undefined") window.location.reload();
  if (!res.ok) throw new ApiError(res.status, (await res.text().catch(() => "")) || res.statusText);
  if (res.status === 204) return null;
  return (await res.json()) as T;
}

const get = <T>(p: string) => request<T>("GET", p);
const post = <T>(p: string, b?: unknown) => request<T>("POST", p, b);
const put = <T>(p: string, b?: unknown) => request<T>("PUT", p, b);
const patch = <T>(p: string, b?: unknown) => request<T>("PATCH", p, b);
const del = (p: string) => request<null>("DELETE", p);
const enc = encodeURIComponent;

/** Contrato completo. Cada endpoint está documentado em docs/GUIA_CLAUDE_E_GESTOR.md. */
export const api = {
  aplicacoes: {
    listar: () => get<AppItemData[]>("/aplicacoes"),
    criar: (a: AppItemData) => post<AppItemData>("/aplicacoes", a),
    atualizar: (a: AppItemData) => put<AppItemData>(`/aplicacoes/${enc(a.id)}`, a),
    remover: (id: string) => del(`/aplicacoes/${enc(id)}`),
    registrarAbertura: (id: string) => post<null>(`/aplicacoes/${enc(id)}/aberturas`),
  },
  favoritos: {
    listar: () => get<string[]>("/me/favoritos"),
    salvar: (ids: string[]) => put<string[]>("/me/favoritos", ids),
  },
  avisos: {
    listar: () => get<Announcement[]>("/avisos"),
    criar: (a: Omit<Announcement, "id">) => post<Announcement>("/avisos", a),
    atualizar: (a: Announcement) => put<Announcement>(`/avisos/${enc(a.id)}`, a),
    remover: (id: string) => del(`/avisos/${enc(id)}`),
    /** Ids dos avisos obrigatórios já confirmados pelo usuário logado. */
    confirmados: () => get<string[]>("/me/avisos-confirmados"),
    confirmar: (id: string) => post<null>(`/avisos/${enc(id)}/confirmacoes`),
  },
  vagas: {
    listar: () => get<Job[]>("/vagas"),
    criar: (j: Omit<Job, "id">) => post<Job>("/vagas", j),
    atualizar: (j: Job) => put<Job>(`/vagas/${enc(j.id)}`, j),
    remover: (id: string) => del(`/vagas/${enc(id)}`),
  },
  candidaturas: {
    /** Somente RH/DP. */
    listar: (vagaId?: string) => get<(JobApplication & { jobId: string })[]>(vagaId ? `/candidaturas?vaga=${enc(vagaId)}` : "/candidaturas"),
    /** multipart/form-data: campos de JobApplication + arquivo "curriculo" (opcional, até 10 MB). */
    enviar: (vagaId: string, dados: FormData) => post<JobApplication>(`/vagas/${enc(vagaId)}/candidaturas`, dados),
    atualizar: (id: string, mudanca: Pick<JobApplication, "status" | "notes">) => patch<JobApplication>(`/candidaturas/${enc(id)}`, mudanca),
    urlCurriculo: (id: string) => `${API_BASE_URL}/candidaturas/${enc(id)}/curriculo`,
  },
  manuais: {
    listar: () => get<Manual[]>("/manuais"),
    /** multipart/form-data: title, description, area, audience (JSON) + arquivo "pdf". */
    enviar: (dados: FormData) => post<Manual>("/manuais", dados),
    atualizar: (id: string, dados: FormData) => put<Manual>(`/manuais/${enc(id)}`, dados),
    remover: (id: string) => del(`/manuais/${enc(id)}`),
  },
  escala: {
    /** mes no formato "2026-11". */
    listar: (mes: string) => get<Shift[]>(`/escala?mes=${enc(mes)}`),
    salvar: (mes: string, turnos: Shift[]) => put<Shift[]>(`/escala?mes=${enc(mes)}`, turnos),
  },
  colaboradores: {
    listar: () => get<DirectoryEntry[]>("/colaboradores"),
    meuPerfil: () => get<DirectoryEntry>("/me/perfil"),
    salvarMeuPerfil: (p: Partial<DirectoryEntry>) => put<DirectoryEntry>("/me/perfil", p),
    /** RH/DP editam dados; Coordenação edita funções. */
    atualizar: (email: string, p: Partial<DirectoryEntry>) => put<DirectoryEntry>(`/colaboradores/${enc(email)}`, p),
  },
  cargos: {
    listar: () => get<Role[]>("/cargos"),
    criar: (r: Omit<Role, "id">) => post<Role>("/cargos", r),
    atualizar: (r: Role) => put<Role>(`/cargos/${enc(r.id)}`, r),
    remover: (id: string) => del(`/cargos/${enc(id)}`),
  },
  publico: {
    /** Rotas sem login: /candidatura e /autoavaliacao. */
    candidatura: (dados: FormData) => post<null>("/publico/candidaturas", dados),
    autoavaliacao: (dados: Record<string, string>) => post<null>("/publico/autoavaliacoes", dados),
  },
};

/** Usa a API se configurada; senão (ou em caso de erro) devolve o valor local. */
export async function withFallback<T>(call: () => Promise<T | null>, local: T): Promise<T> {
  try {
    return (await call()) ?? local;
  } catch (e) {
    console.warn("[api] servidor indisponível, usando dados locais", e);
    return local;
  }
}
