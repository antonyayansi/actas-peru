import { buildCatalog } from "../src/lib/catalog";
import { construirCorpus } from "../src/lib/corpus";
import type { Catalog, ListingRow, ParsedActa, PdfEntry } from "../src/lib/types";

export function fixtureCatalog(): Catalog {
  return buildCatalog([
    { ubigeo: "081101", departamento: "CUSCO", provincia: "PAUCARTAMBO", distrito: "PAUCARTAMBO", esCapitalProvincial: true },
    { ubigeo: "081103", departamento: "CUSCO", provincia: "PAUCARTAMBO", distrito: "CHALLABAMBA", esCapitalProvincial: false },
    { ubigeo: "081201", departamento: "CUSCO", provincia: "QUISPICANCHI", distrito: "URCOS", esCapitalProvincial: true },
    { ubigeo: "081202", departamento: "CUSCO", provincia: "QUISPICANCHI", distrito: "ANDAHUAYLILLAS", esCapitalProvincial: false },
    { ubigeo: "190101", departamento: "PASCO", provincia: "PASCO", distrito: "CHAUPIMARCA", esCapitalProvincial: true },
    { ubigeo: "190107", departamento: "PASCO", provincia: "PASCO", distrito: "PAUCARTAMBO", esCapitalProvincial: false },
    { ubigeo: "200601", departamento: "PIURA", provincia: "SULLANA", distrito: "SULLANA", esCapitalProvincial: true },
    { ubigeo: "200602", departamento: "PIURA", provincia: "SULLANA", distrito: "BELLAVISTA", esCapitalProvincial: false },
    { ubigeo: "160401", departamento: "LORETO", provincia: "MARISCAL RAMON CASTILLA", distrito: "RAMON CASTILLA", esCapitalProvincial: true },
    { ubigeo: "160403", departamento: "LORETO", provincia: "MARISCAL RAMON CASTILLA", distrito: "YAVARI", esCapitalProvincial: false },
  ]);
}

export function fila(partial: Partial<ListingRow> & Pick<ListingRow, "idProclamacion">): ListingRow {
  return {
    txJEE: "JEE QUISPICANCHI",
    tipoEleccion: "MUNICIPAL DISTRITAL",
    fechaHora: "03/11/2026 10:00:00 AM",
    transmision: "",
    actaProclamacion: "",
    ...partial,
  };
}

export function actaChallabamba(fecha = "2026-11-03", nombre = "CELSO QUISPE CHIPANA"): ParsedActa {
  return {
    clase: "autoridades_distritales",
    departamento: "CUSCO",
    provincia: "PAUCARTAMBO",
    distrito: "CHALLABAMBA",
    departamentoCodigo: "08",
    provinciaCodigo: "0811",
    ubigeo: "081103",
    lugarId: "distrital:081103",
    ambito: "distrital",
    provinciasParciales: [],
    fechaActa: fecha,
    autoridad: { cargo: "Alcalde distrital", nombre, organizacion: "ACCIÓN POPULAR" },
    confianza: "alta",
  };
}

export function corpusDe(
  rows: ListingRow[],
  pdfs: Record<string, PdfEntry> = {},
  now = new Date("2026-11-05T19:00:00-05:00"),
) {
  return construirCorpus({
    rows,
    pdfs,
    now,
    generatedAt: now.toISOString(),
    listingSyncedAt: now.toISOString(),
    listingStatus: "ok",
    listingError: null,
    declaredTotal: rows.length,
    partial: false,
    challengeStopped: false,
    challengeDetail: null,
    trabajando: false,
    ultimoAvanceEn: now.toISOString(),
    intervalMinutes: 30,
  });
}
