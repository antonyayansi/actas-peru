import { extractText } from "unpdf";
import { loadCatalog } from "../lib/catalog";
import { integrarListado, parseListDate } from "../lib/corpus";
import { parseActa } from "../lib/parser";
import { containsDni, redactDni } from "../lib/text";
import type { ListingRow, ParsedActa } from "../lib/types";
import { fetchListing, fetchPdf, SourceChallenge } from "./jne";
import { delayMs, loadState, PARSER_VERSION, publish, saveState, type IndexState, type PdfState } from "./state";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitize(parsed: ParsedActa): ParsedActa {
  if (!parsed.autoridad) return parsed;
  const nombre = redactDni(parsed.autoridad.nombre);
  const organizacion = parsed.autoridad.organizacion ? redactDni(parsed.autoridad.organizacion) : null;
  if (!nombre || containsDni(nombre) || nombre.split(/\s+/).length < 2) {
    return { ...parsed, autoridad: null };
  }
  return {
    ...parsed,
    autoridad: { ...parsed.autoridad, nombre, organizacion: organizacion && !containsDni(organizacion) ? organizacion : null },
  };
}

function needsPdf(state: IndexState, pdfPath: string): boolean {
  const current = state.pdfs[pdfPath];
  if (!current) return true;
  if (current.status === "ok") {
    if (current.parserVersion !== PARSER_VERSION) return true;
    return current.parsed?.confianza === "baja" && current.attempts < 3;
  }
  return current.attempts < 2;
}

export async function runCycle(): Promise<void> {
  const state = loadState();
  const now = new Date();
  state.intervalMinutes = Number(process.env.INDEX_INTERVAL_MINUTES || state.intervalMinutes || 30);
  state.trabajando = true;
  state.challengeStopped = false;
  state.challengeDetail = null;
  state.ultimoAvanceEn = now.toISOString();
  saveState(state);
  publish(state, now);

  try {
    const fetched = await fetchListing();
    const integrated = integrarListado(
      { rows: state.listingRows, syncedAt: state.listingSyncedAt, declaredTotal: state.declaredTotal },
      { ok: true, rows: fetched.rows, declared: fetched.declared, complete: fetched.complete, at: new Date().toISOString() },
    );
    state.listingRows = integrated.rows;
    state.listingStatus = integrated.status;
    state.listingError = integrated.error;
    state.partial = integrated.partial;
    state.declaredTotal = integrated.declaredTotal;
    state.listingSyncedAt = integrated.syncedAt;
  } catch (error) {
    const challenge = error instanceof SourceChallenge;
    const message = error instanceof Error ? error.message : "fallo al leer el listado";
    const integrated = integrarListado(
      { rows: state.listingRows, syncedAt: state.listingSyncedAt, declaredTotal: state.declaredTotal },
      { ok: false, error: message, at: new Date().toISOString() },
    );
    state.listingRows = integrated.rows;
    state.listingStatus = integrated.status;
    state.listingError = integrated.error;
    state.partial = integrated.partial;
    state.declaredTotal = integrated.declaredTotal;
    state.listingSyncedAt = integrated.syncedAt;
    if (challenge) {
      state.challengeStopped = true;
      state.challengeDetail = message;
    }
    console.error(`listado: ${message}`);
  }

  state.ultimoAvanceEn = new Date().toISOString();
  saveState(state);
  publish(state);

  if (state.challengeStopped) {
    state.trabajando = false;
    saveState(state);
    publish(state);
    return;
  }

  const catalog = loadCatalog();
  const queue = state.listingRows
    .filter((row) => row.actaProclamacion && needsPdf(state, row.actaProclamacion))
    .sort((a, b) => (parseListDate(a.fechaHora)?.getTime() || 0) - (parseListDate(b.fechaHora)?.getTime() || 0));

  console.log(`pdfs pendientes ${queue.length}`);
  let processed = 0;
  for (const row of queue) {
    const pdfPath = row.actaProclamacion;
    const previous = state.pdfs[pdfPath];
    const previousParsed = previous?.parsed ?? null;
    const previousWasOk = previous?.status === "ok" && Boolean(previousParsed);
    const entry: PdfState = previous || { status: "pending", error: null, parsed: null, attempts: 0, fetchedAt: null };
    entry.attempts += 1;
    try {
      const bytes = await fetchPdf(pdfPath);
      const extracted = await extractText(bytes, { mergePages: true });
      const rawText = Array.isArray(extracted.text) ? extracted.text.join("\n") : String(extracted.text || "");
      const parsed = sanitize(parseActa(rawText, catalog));
      entry.status = "ok";
      entry.parsed = parsed;
      entry.error = null;
      entry.parserVersion = PARSER_VERSION;
      entry.fetchedAt = new Date().toISOString();
    } catch (error) {
      const challenge = error instanceof SourceChallenge;
      entry.fetchedAt = new Date().toISOString();
      if (previousWasOk && previousParsed) {
        entry.status = "ok";
        entry.parsed = previousParsed;
        entry.error = null;
        entry.parserVersion = PARSER_VERSION;
      } else {
        entry.status = "error";
        entry.error = error instanceof Error ? error.message : "error al leer el PDF";
      }
      state.pdfs[pdfPath] = entry;
      if (challenge) {
        state.challengeStopped = true;
        state.challengeDetail = entry.error;
        state.ultimoAvanceEn = new Date().toISOString();
        state.trabajando = false;
        saveState(state);
        publish(state);
        console.error(`desafío en PDF ${row.idProclamacion}: ${entry.error}`);
        return;
      }
    }
    state.pdfs[pdfPath] = entry;
    processed += 1;
    state.ultimoAvanceEn = new Date().toISOString();
    if (processed % 10 === 0 || processed === queue.length) {
      saveState(state);
      const corpus = publish(state);
      console.log(
        `pdf ${processed}/${queue.length} leídos=${corpus.pdfOk} revisión=${corpus.pdfRevision} error=${corpus.pdfError}`,
      );
    }
    await sleep(delayMs());
  }

  state.trabajando = false;
  state.ultimoAvanceEn = new Date().toISOString();
  saveState(state);
  publish(state);
}

export function queueSize(rows: ListingRow[], pdfs: IndexState["pdfs"]): number {
  return rows.filter((row) => row.actaProclamacion && (!pdfs[row.actaProclamacion] || pdfs[row.actaProclamacion].status !== "ok")).length;
}
