import { DENOMINADOR, loadCatalog } from "../lib/catalog";
import { construirCorpus } from "../lib/corpus";
import {
  MANIFEST_PATH,
  SEED_PATH,
  SNAPSHOT_PATH,
  SNAPSHOT_PREV_PATH,
  STATE_PATH,
  readJson,
  writeJson,
} from "../lib/store";
import type { Corpus, ListingRow, ListingStatus, ParsedActa } from "../lib/types";
import fs from "fs";

export const PARSER_VERSION = 2;

export interface PdfState {
  status: "ok" | "error" | "pending";
  error: string | null;
  parsed: ParsedActa | null;
  attempts: number;
  fetchedAt: string | null;
  parserVersion?: number;
}

export interface IndexState {
  version: 1;
  listingRows: ListingRow[];
  listingSyncedAt: string | null;
  listingError: string | null;
  listingStatus: ListingStatus;
  declaredTotal: number | null;
  partial: boolean;
  pdfs: Record<string, PdfState>;
  challengeStopped: boolean;
  challengeDetail: string | null;
  trabajando: boolean;
  ultimoAvanceEn: string | null;
  intervalMinutes: number;
}

export interface SnapshotFile {
  corpus: Corpus;
  denominador: typeof DENOMINADOR;
  ubigeo: {
    archivo: string;
    distritosEnArchivo: number;
    nota: string;
  };
}

const SEED_OBSERVED_AT = "2026-11-05T19:42:00.000Z";

export function intervalMinutes(): number {
  const value = Number(process.env.INDEX_INTERVAL_MINUTES || 30);
  return Number.isFinite(value) && value >= 5 ? value : 30;
}

export function delayMs(): number {
  const value = Number(process.env.INDEX_DELAY_MS || 900);
  return Number.isFinite(value) && value >= 400 ? value : 900;
}

export function emptyState(): IndexState {
  return {
    version: 1,
    listingRows: [],
    listingSyncedAt: null,
    listingError: null,
    listingStatus: "sin_datos",
    declaredTotal: null,
    partial: false,
    pdfs: {},
    challengeStopped: false,
    challengeDetail: null,
    trabajando: false,
    ultimoAvanceEn: null,
    intervalMinutes: intervalMinutes(),
  };
}

export function loadState(): IndexState {
  const saved = readJson<IndexState>(STATE_PATH);
  if (saved?.version === 1 && Array.isArray(saved.listingRows)) {
    return { ...emptyState(), ...saved, pdfs: saved.pdfs || {} };
  }
  const seed = readJson<{ rows?: ListingRow[]; declared?: number }>(SEED_PATH);
  if (seed?.rows?.length) {
    return {
      ...emptyState(),
      listingRows: seed.rows,
      listingSyncedAt: SEED_OBSERVED_AT,
      listingStatus: "ok",
      declaredTotal: seed.declared ?? seed.rows.length,
      ultimoAvanceEn: SEED_OBSERVED_AT,
    };
  }
  return emptyState();
}

export function saveState(state: IndexState): void {
  writeJson(STATE_PATH, state);
}

export function publish(state: IndexState, now = new Date()): Corpus {
  const corpus = construirCorpus({
    rows: state.listingRows,
    pdfs: state.pdfs,
    now,
    generatedAt: now.toISOString(),
    listingSyncedAt: state.listingSyncedAt,
    listingStatus: state.listingStatus,
    listingError: state.listingError,
    declaredTotal: state.declaredTotal,
    partial: state.partial,
    challengeStopped: state.challengeStopped,
    challengeDetail: state.challengeDetail,
    trabajando: state.trabajando,
    ultimoAvanceEn: state.ultimoAvanceEn,
    intervalMinutes: state.intervalMinutes || intervalMinutes(),
  });
  const snapshot: SnapshotFile = {
    corpus,
    denominador: DENOMINADOR,
    ubigeo: {
      archivo:
        "INEI, datos abiertos, UBIGEO 2022_1891 distritos.xlsx (metadata de la plataforma: 7 de septiembre de 2023).",
      distritosEnArchivo: 1891,
      nota: "Santa Rosa de Loreto se suma por la Ley N.° 32403 y el anuncio de la ONPE, sin código ubigeo porque ese archivo no lo trae. Alto Trujillo sí está en el archivo (130112).",
    },
  };
  if (fs.existsSync(SNAPSHOT_PATH)) {
    fs.copyFileSync(SNAPSHOT_PATH, SNAPSHOT_PREV_PATH);
  }
  writeJson(SNAPSHOT_PATH, snapshot);
  writeJson(MANIFEST_PATH, {
    generadoEn: corpus.generatedAt,
    zona: "America/Lima",
    listadoSincronizadoEn: corpus.listingSyncedAt,
    filasListado: corpus.documents.length,
    declaradoPorLaFuente: corpus.declaredTotal,
    ambitosConActaUbicada: corpus.scopes.length,
    pdfConRuta: corpus.pdfConRuta,
    pdfLeidos: corpus.pdfOk,
    pdfPendientes: corpus.pdfSinDescargar,
    pdfEnRevision: corpus.pdfRevision,
    pdfConError: corpus.pdfError,
    listado: corpus.listingStatus,
    desafio: corpus.challengeStopped ? corpus.challengeDetail : null,
    denominador: DENOMINADOR,
    catalogo: loadCatalog().advertencias,
  });
  return corpus;
}

let snapshotCache: { mtimeMs: number; data: SnapshotFile } | null = null;

export function readSnapshot(): SnapshotFile | null {
  const files = [SNAPSHOT_PATH, SNAPSHOT_PREV_PATH];
  for (const file of files) {
    try {
      const stat = fs.statSync(file);
      if (snapshotCache && snapshotCache.mtimeMs === stat.mtimeMs && file === SNAPSHOT_PATH) {
        return snapshotCache.data;
      }
      const data = readJson<SnapshotFile>(file);
      if (data?.corpus?.documents) {
        if (file === SNAPSHOT_PATH) snapshotCache = { mtimeMs: stat.mtimeMs, data };
        return data;
      }
    } catch {
      continue;
    }
  }
  snapshotCache = null;
  return null;
}
