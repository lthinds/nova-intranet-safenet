// Diretório de colaboradores, favoritos, busca (sem IA) e dados restritos ao RH/DP.

export type DirectoryEntry = { name: string; email: string; area: string; roles: string[]; extension?: string; phone?: string; birthDate?: string; hireDate?: string };

/** Aniversários e tempo de casa: somente RH e DP. */
export const HR_DATA_ROLES = ["RH", "DP"];
export function canSeeHrData(userRoles: string[]) {
  return userRoles.some((r) => HR_DATA_ROLES.includes(r));
}

/** Remove datas pessoais para quem não é RH/DP. */
export function publicEntry<T extends DirectoryEntry>(p: T): Omit<T, "birthDate" | "hireDate"> {
  const { birthDate: _b, hireDate: _h, ...rest } = p;
  return rest;
}

export function tenureYears(hireDate: string, now: Date) {
  const h = new Date(`${hireDate}T00:00:00`);
  let y = now.getFullYear() - h.getFullYear();
  if (now.getMonth() < h.getMonth() || (now.getMonth() === h.getMonth() && now.getDate() < h.getDate())) y--;
  return Math.max(0, y);
}

/** Dias até o próximo aniversário (0 = hoje). */
export function daysToNextBirthday(birthDate: string, now: Date) {
  const [, m, d] = birthDate.split("-").map(Number);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), m! - 1, d!);
  if (next < today) next = new Date(now.getFullYear() + 1, m! - 1, d!);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

/** Busca simples por texto (sem acentos/maiúsculas). Todas as palavras precisam aparecer. */
export function matches(text: string, query: string) {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return false;
  const hay = norm(text);
  return words.every((w) => hay.includes(w));
}

export function toggleFavorite(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** Quantos destinatários confirmaram a leitura. */
export function readStats(recipients: Array<{ email: string }>, acksByEmail: Record<string, string[]>, noticeId: string) {
  const read = recipients.filter((p) => (acksByEmail[p.email] ?? []).includes(noticeId)).length;
  return { read, total: recipients.length, pending: recipients.length - read };
}
