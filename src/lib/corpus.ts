import { pdfPublicUrl, safeHttpUrl } from "./text";
import type {
  Ambito,
  AmbitoIndexado,
  Corpus,
  Documento,
  FuentePublicacion,
  ListingRow,
  ListingStatus,
  ParsedActa,
  PdfEntry,
} from "./types";
import { PROCESO } from "./types";

export function parseListDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[4]);
  const ampm = match[7].toUpperCase();
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  const iso = `${match[3]}-${match[2]}-${match[1]}T${String(hour).padStart(2, "0")}:${match[5]}:${match[6]}-05:00`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function listDateIso(value: string): string | null {
  return parseListDate(value)?.toISOString() ?? null;
}

function scopeKey(parsed: ParsedActa): string | null {
  if (!parsed.lugarId || parsed.confianza !== "alta") return null;
  if (parsed.ambito !== "distrital" && parsed.ambito !== "provincial" && parsed.ambito !== "regional") {
    return null;
  }
  return `${parsed.ambito}|${parsed.lugarId}|${PROCESO}`;
}

function instante(fechaActa: string | null, fechaListado: string | null): number {
  if (fechaActa) {
    const date = new Date(`${fechaActa}T12:00:00-05:00`);
    if (!Number.isNaN(date.getTime())) return date.getTime();
  }
  if (fechaListado) {
    const date = new Date(fechaListado);
    if (!Number.isNaN(date.getTime())) return date.getTime();
  }
  return 0;
}

export function documentoDesdeFila(
  row: ListingRow,
  pdfs: Record<string, PdfEntry>,
  now: Date,
): Documento {
  const fecha = parseListDate(row.fechaHora || "");
  const pdfPath = (row.actaProclamacion || "").trim();
  const base: Documento = {
    idProclamacion: row.idProclamacion,
    jee: (row.txJEE || "").trim(),
    tipoListado: (row.tipoEleccion || "").trim(),
    fechaListado: fecha ? fecha.toISOString() : null,
    fechaListadoTexto: row.fechaHora || "",
    futura: Boolean(fecha && fecha.getTime() > now.getTime()),
    transmisionUrl: safeHttpUrl(row.transmision),
    pdfPath: pdfPath || null,
    pdfUrl: pdfPublicUrl(pdfPath),
    estado: "sin_acta_en_fila",
    clase: null,
    departamento: null,
    provincia: null,
    distrito: null,
    departamentoCodigo: null,
    provinciaCodigo: null,
    ubigeo: null,
    lugarId: null,
    ambito: null,
    provinciasParciales: [],
    fechaActa: null,
    autoridad: null,
    error: null,
    dedupeKey: null,
  };

  if (!pdfPath) {
    base.estado = base.futura ? "programada_sin_acta" : "sin_acta_en_fila";
    return base;
  }

  const entry = pdfs[pdfPath];
  if (!entry || entry.status === "pending") {
    base.estado = "pendiente_extraccion";
    return base;
  }
  if (entry.status === "error") {
    base.estado = "error_fuente";
    base.error = entry.error;
    return base;
  }

  const parsed = entry.parsed;
  if (!parsed) {
    base.estado = "pendiente_revision";
    return base;
  }

  base.clase = parsed.clase;
  base.departamento = parsed.departamento;
  base.provincia = parsed.provincia;
  base.distrito = parsed.distrito;
  base.departamentoCodigo = parsed.departamentoCodigo;
  base.provinciaCodigo = parsed.provinciaCodigo;
  base.ubigeo = parsed.ubigeo;
  base.lugarId = parsed.lugarId;
  base.ambito = parsed.ambito;
  base.provinciasParciales = parsed.provinciasParciales;
  base.fechaActa = parsed.fechaActa;
  base.autoridad = parsed.autoridad;

  if (parsed.confianza !== "alta") {
    base.estado = "pendiente_revision";
    return base;
  }

  base.estado = "acta_publicada";
  base.dedupeKey = scopeKey(parsed);
  return base;
}

export function dedupeAmbitos(documents: Documento[]): AmbitoIndexado[] {
  const map = new Map<string, AmbitoIndexado>();
  for (const doc of documents) {
    if (doc.estado !== "acta_publicada" || !doc.dedupeKey || !doc.lugarId || !doc.departamento) continue;
    if (doc.ambito !== "distrital" && doc.ambito !== "provincial" && doc.ambito !== "regional") continue;
    const fuente: FuentePublicacion = {
      idProclamacion: doc.idProclamacion,
      pdfUrl: doc.pdfUrl,
      fechaListado: doc.fechaListado,
      fechaActa: doc.fechaActa,
      jee: doc.jee,
      transmisionUrl: doc.transmisionUrl,
    };
    const current = map.get(doc.dedupeKey);
    if (!current) {
      map.set(doc.dedupeKey, {
        key: doc.dedupeKey,
        lugarId: doc.lugarId,
        ambito: doc.ambito,
        ubigeo: doc.ubigeo,
        departamento: doc.departamento,
        provincia: doc.provincia,
        distrito: doc.distrito,
        departamentoCodigo: doc.departamentoCodigo || "",
        provinciaCodigo: doc.provinciaCodigo,
        fechaActa: doc.fechaActa,
        fechaListado: doc.fechaListado,
        autoridad: doc.autoridad,
        jee: doc.jee,
        pdfUrl: doc.pdfUrl,
        transmisionUrl: doc.transmisionUrl,
        fuentes: [fuente],
      });
      continue;
    }
    current.fuentes.push(fuente);
    const currentTime = instante(current.fechaActa, current.fechaListado);
    const nextTime = instante(doc.fechaActa, doc.fechaListado);
    if (nextTime >= currentTime) {
      current.fechaActa = doc.fechaActa;
      current.fechaListado = doc.fechaListado;
      current.autoridad = doc.autoridad ?? current.autoridad;
      current.jee = doc.jee || current.jee;
      current.pdfUrl = doc.pdfUrl ?? current.pdfUrl;
      current.transmisionUrl = doc.transmisionUrl ?? current.transmisionUrl;
    }
  }
  return [...map.values()];
}

export interface ListadoIntegrado {
  rows: ListingRow[];
  status: ListingStatus;
  error: string | null;
  partial: boolean;
  declaredTotal: number | null;
  syncedAt: string | null;
}

export function integrarListado(
  previous: { rows: ListingRow[]; syncedAt: string | null; declaredTotal: number | null },
  result:
    | { ok: true; rows: ListingRow[]; declared: number; complete: boolean; at: string }
    | { ok: false; error: string; at: string },
): ListadoIntegrado {
  if (!result.ok) {
    if (previous.rows.length > 0) {
      return {
        rows: previous.rows,
        status: "error_con_datos_previos",
        error: result.error,
        partial: false,
        declaredTotal: previous.declaredTotal,
        syncedAt: previous.syncedAt,
      };
    }
    return {
      rows: [],
      status: "sin_datos",
      error: result.error,
      partial: false,
      declaredTotal: null,
      syncedAt: null,
    };
  }

  if (!result.complete) {
    const merged = new Map<number, ListingRow>();
    for (const row of previous.rows) merged.set(row.idProclamacion, row);
    for (const row of result.rows) merged.set(row.idProclamacion, row);
    return {
      rows: [...merged.values()],
      status: "parcial",
      error: "La lectura del listado se interrumpió antes de completar las páginas. Se conservaron las filas ya obtenidas.",
      partial: true,
      declaredTotal: result.declared,
      syncedAt: previous.syncedAt,
    };
  }

  return {
    rows: result.rows,
    status: "ok",
    error: null,
    partial: false,
    declaredTotal: result.declared,
    syncedAt: result.at,
  };
}

export function construirCorpus(input: {
  rows: ListingRow[];
  pdfs: Record<string, PdfEntry>;
  now: Date;
  generatedAt: string;
  listingSyncedAt: string | null;
  listingStatus: ListingStatus;
  listingError: string | null;
  declaredTotal: number | null;
  partial: boolean;
  challengeStopped: boolean;
  challengeDetail: string | null;
  trabajando: boolean;
  ultimoAvanceEn: string | null;
  intervalMinutes: number;
}): Corpus {
  const documents = input.rows.map((row) => documentoDesdeFila(row, input.pdfs, input.now));
  const withPath = documents.filter((doc) => doc.pdfPath);
  const datosValidos = input.listingStatus !== "sin_datos";
  return {
    generatedAt: input.generatedAt,
    listingSyncedAt: input.listingSyncedAt,
    listingStatus: input.listingStatus,
    listingError: input.listingError,
    declaredTotal: input.declaredTotal,
    partial: input.partial,
    challengeStopped: input.challengeStopped,
    challengeDetail: input.challengeDetail,
    trabajando: input.trabajando,
    ultimoAvanceEn: input.ultimoAvanceEn,
    intervalMinutes: input.intervalMinutes,
    pdfConRuta: withPath.length,
    pdfOk: withPath.filter((doc) => doc.estado === "acta_publicada").length,
    pdfRevision: withPath.filter((doc) => doc.estado === "pendiente_revision").length,
    pdfError: withPath.filter((doc) => doc.estado === "error_fuente").length,
    pdfSinDescargar: withPath.filter((doc) => doc.estado === "pendiente_extraccion").length,
    pdfPendiente: withPath.filter((doc) => doc.estado === "pendiente_extraccion" || doc.estado === "pendiente_revision").length,
    documents,
    scopes: dedupeAmbitos(documents),
    datosValidos,
  };
}

export function bloqueaCierre(corpus: Corpus): string | null {
  if (!corpus.datosValidos) return "No hay un listado válido.";
  if (corpus.listingStatus === "error_con_datos_previos") {
    return "La última lectura del listado falló. Se conserva la anterior, sin cerrar la brecha.";
  }
  if (corpus.partial || corpus.listingStatus === "parcial") {
    return "El listado público no se leyó completo.";
  }
  if (corpus.challengeStopped) {
    return corpus.challengeDetail || "La fuente interrumpió la descarga. No se insiste ni se evade el control.";
  }
  const abierto = corpus.documents.some((doc) =>
    doc.estado === "pendiente_extraccion" || doc.estado === "pendiente_revision" || doc.estado === "error_fuente",
  );
  if (abierto) return "Todavía hay PDFs sin territorio confirmado.";
  return null;
}

export function esAmbitoMunicipal(ambito: string | null): ambito is Ambito {
  return ambito === "distrital" || ambito === "provincial" || ambito === "regional";
}
