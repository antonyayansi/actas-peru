import { delayMs } from "./state";
import type { ListingRow } from "../lib/types";

const LIST_URL = "https://portal.jne.gob.pe/portal/Pagina/Lista_ProclamacionResultadosERM/";
const PAGE_URL = "https://portal.jne.gob.pe/portal/Pagina/ProclamacionResultadoERM";
const USER_AGENT = "PlanitecActasERM/1.0 (buscador civico independiente; contacto local)";

export class SourceChallenge extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceChallenge";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function headers(accept: string): HeadersInit {
  return {
    Accept: accept,
    "User-Agent": USER_AGENT,
    Referer: PAGE_URL,
    Origin: "https://portal.jne.gob.pe",
  };
}

function challengeText(status: number, body: Uint8Array, contentType: string): string | null {
  if (status === 401 || status === 403 || status === 429 || status === 503) {
    return `La fuente respondió HTTP ${status}. Se detiene esta pasada, sin reintentos de evasión.`;
  }
  const head = Buffer.from(body.subarray(0, 900)).toString("utf8").toLowerCase();
  const blocked =
    head.includes("captcha") ||
    head.includes("imperva") ||
    head.includes("access denied") ||
    head.includes("attention required") ||
    head.includes("cf-browser-verification") ||
    head.includes("just a moment");
  if (blocked) return "La fuente mostró un desafío o bloqueo. Se detiene esta pasada.";
  if (contentType.includes("text/html") && !head.trim().startsWith("{") && !head.includes("%pdf")) {
    return "La fuente devolvió HTML en lugar de datos. Se detiene esta pasada.";
  }
  return null;
}

async function postListing(start: number, length: number, echo: number): Promise<{ declared: number; rows: ListingRow[] }> {
  const params = new URLSearchParams();
  params.set("sEcho", String(echo));
  params.set("iColumns", "5");
  params.set("iDisplayStart", String(start));
  params.set("iDisplayLength", String(length));
  params.set("mDataProp_0", "txJEE");
  params.set("mDataProp_1", "fechaHora");
  params.set("mDataProp_2", "tipoEleccion");
  params.set("mDataProp_3", "transmision");
  params.set("mDataProp_4", "actaProclamacion");
  params.set("iSortingCols", "0");

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(LIST_URL, {
        method: "POST",
        headers: {
          ...headers("application/json, text/javascript, */*; q=0.01"),
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: params,
        signal: AbortSignal.timeout(120_000),
      });
      const bytes = new Uint8Array(await response.arrayBuffer());
      const type = response.headers.get("content-type") || "";
      const blocked = challengeText(response.status, bytes, type);
      if (blocked) throw new SourceChallenge(blocked);
      if (!response.ok) throw new Error(`HTTP ${response.status} al leer el listado`);
      const payload = JSON.parse(Buffer.from(bytes).toString("utf8")) as {
        iTotalRecords?: number;
        aaData?: ListingRow[];
      };
      return {
        declared: Number(payload.iTotalRecords || 0),
        rows: Array.isArray(payload.aaData) ? payload.aaData : [],
      };
    } catch (error) {
      if (error instanceof SourceChallenge) throw error;
      lastError = error instanceof Error ? error : new Error("fallo de red");
      if (attempt < 3) await sleep(attempt * 3000);
    }
  }
  throw lastError || new Error("no se pudo leer el listado");
}

export async function fetchListing(): Promise<{ rows: ListingRow[]; declared: number; complete: boolean }> {
  const byId = new Map<number, ListingRow>();
  let start = 0;
  let declared = 0;
  let echo = 1;
  const length = 200;
  while (echo <= 40) {
    const page = await postListing(start, length, echo);
    declared = page.declared;
    if (page.rows.length === 0) break;
    for (const row of page.rows) {
      if (row && typeof row.idProclamacion === "number") byId.set(row.idProclamacion, row);
    }
    start += page.rows.length;
    console.log(`listado ${byId.size}/${declared || "?"}`);
    if (declared && start >= declared) break;
    echo += 1;
    await sleep(delayMs());
  }
  return {
    rows: [...byId.values()],
    declared,
    complete: declared > 0 && byId.size >= declared,
  };
}

export async function fetchPdf(pdfPath: string): Promise<Uint8Array> {
  const url = `https://portal.jne.gob.pe/portal_documentos/files/${pdfPath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: headers("application/pdf,*/*"),
        signal: AbortSignal.timeout(90_000),
      });
      const bytes = new Uint8Array(await response.arrayBuffer());
      const type = response.headers.get("content-type") || "";
      const blocked = challengeText(response.status, bytes, type);
      if (blocked) throw new SourceChallenge(blocked);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const signature = Buffer.from(bytes.subarray(0, 5)).toString("utf8");
      if (!signature.startsWith("%PDF")) throw new Error("la respuesta no es un PDF");
      return bytes;
    } catch (error) {
      if (error instanceof SourceChallenge) throw error;
      lastError = error instanceof Error ? error : new Error("fallo al descargar el PDF");
      if (attempt < 2) await sleep(4000);
    }
  }
  throw lastError || new Error("no se pudo descargar el PDF");
}
