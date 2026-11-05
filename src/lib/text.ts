const MINOR = new Set(["de", "del", "la", "las", "los", "y", "e", "o"]);

export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

export function squash(value: string): string {
  return stripAccents(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function repairDuplicatedAccent(value: string): string {
  return value.replace(/([AaEeIiOoUu])([ÁÉÍÓÚáéíóú])/g, (all, base, accented) => {
    const bare = accented.normalize("NFD").replace(/\p{M}/gu, "");
    return bare.toLowerCase() === base.toLowerCase() ? accented : all;
  });
}

export function flatten(value: string): string {
  return repairDuplicatedAccent(value)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]*\r?\n[ \t]*/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function spellingVariants(value: string): string[] {
  const base = squash(value);
  const variants = new Set([base]);
  if (base.includes("RAIMONDI")) variants.add(base.replaceAll("RAIMONDI", "RAYMONDI"));
  if (base.includes("RAYMONDI")) variants.add(base.replaceAll("RAYMONDI", "RAIMONDI"));
  return [...variants];
}

export function titleCase(input: string): string {
  const parts = input.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return parts
    .map((word, index) =>
      index > 0 && MINOR.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

export function redactDni(value: string): string {
  return value
    .replace(/\b\d{8}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function containsDni(value: string): boolean {
  return /\b\d{8}\b/.test(value);
}

export function tokensOf(query: string): string[] {
  return squash(query)
    .replace(/([0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Z0-9]+/)
    .filter((token) => token.length > 0);
}

export function matchesQuery(haystack: string, query: string): boolean {
  const tokens = query
    .trim()
    .split(/\s+/)
    .map((token) => squash(token))
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const flat = squash(haystack);
  return tokens.every((token) => flat.includes(token));
}

export function miles(value: number): string {
  const negative = value < 0;
  const body = Math.abs(Math.round(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  return negative ? `-${body}` : body;
}

export function porcentajeTexto(value: number): string {
  return `${value.toFixed(1).replace(".", ",")} %`;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function fechaCorta(iso: string | null): string | null {
  if (!iso) return null;
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const month = MESES[Number(match[2]) - 1];
  if (!month) return null;
  return `${Number(match[3])} ${month} ${match[1]}`;
}

export function fechaHoraLima(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${formatted} (Lima)`;
}

export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function pdfPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const clean = path.replace(/^\/+/, "").trim();
  if (!clean || clean.includes("..")) return null;
  const encoded = clean.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `https://portal.jne.gob.pe/portal_documentos/files/${encoded}`;
}

export function bestNameMatch<T extends { nombre: string }>(window: string, items: T[]): T | null {
  const target = squash(window);
  if (!target) return null;
  const targetVariants = new Set(spellingVariants(window));
  let best: T | null = null;
  let bestScore = -1;
  for (const item of items) {
    const name = squash(item.nombre);
    if (!name) continue;
    const sameSpelling = spellingVariants(item.nombre).some((variant) => targetVariants.has(variant));
    let score = -1;
    if (sameSpelling) score = 5000 + name.length;
    else if (target.startsWith(name) && target.length - name.length <= 1) score = 3000 + name.length;
    else if (name.startsWith(target) && name.length - target.length <= 1 && target.length >= 4) {
      score = 2000 + target.length;
    }
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}
