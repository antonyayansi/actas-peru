import type { Workbook, Worksheet } from "exceljs";

export type Celda = string | number | null;

export interface Fila {
  fila: number;
  celdas: Record<string, Celda>;
}

export interface LibroRepOpmi {
  opmi: string | null;
  entidad: string;
  pliegoPropio: string | null;
  archivo: string;
  exportadoEn: string | null;
  fuenteUrl: string;
  inversiones: Fila[];
  etDe: Fila[];
  avanceFisico: Fila[];
  contratos: Fila[];
  calidad: string[];
}

export class ErrorImportacion extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErrorImportacion";
  }
}

const HOJAS = ["Inversiones", "ET_DE", "Avance Fisico", "Contratos"] as const;

export function claveEncabezado(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[º°]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function valorCelda(value: unknown): Celda {
  if (value == null) return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value ? "SI" : "NO";
  if (typeof value === "object") {
    const record = value as { result?: unknown; text?: unknown; richText?: { text: string }[] };
    if ("result" in record) return valorCelda(record.result);
    if (Array.isArray(record.richText)) return valorCelda(record.richText.map((parte) => parte.text).join(""));
    if (typeof record.text === "string") return valorCelda(record.text);
    return null;
  }
  const texto = String(value).replace(/\s+/g, " ").trim();
  return texto === "" ? null : texto;
}

function leerHoja(ws: Worksheet): { exportadoEn: string | null; filas: Fila[] } {
  let encabezado = 0;
  let exportadoEn: string | null = null;
  ws.eachRow({ includeEmpty: false }, (row, numero) => {
    const primero = valorCelda(row.getCell(1).value);
    if (typeof primero === "string" && primero.toLowerCase().startsWith("fecha:")) exportadoEn = primero;
    const celdas = [1, 2, 3].map((col) => valorCelda(row.getCell(col).value));
    if (celdas.some((celda) => typeof celda === "string" && claveEncabezado(celda) === "cui")) encabezado = numero;
  });
  if (!encabezado) throw new ErrorImportacion(`La hoja ${ws.name} no tiene columna CUI.`);
  const titulo = ws.getRow(encabezado);
  const columnas: { col: number; clave: string }[] = [];
  titulo.eachCell({ includeEmpty: false }, (cell, col) => {
    const etiqueta = valorCelda(cell.value);
    if (typeof etiqueta === "string") columnas.push({ col, clave: claveEncabezado(etiqueta) });
  });
  const filas: Fila[] = [];
  for (let numero = encabezado + 1; numero <= ws.rowCount; numero += 1) {
    const row = ws.getRow(numero);
    const celdas: Record<string, Celda> = {};
    let vacia = true;
    for (const columna of columnas) {
      let valor = valorCelda(row.getCell(columna.col).value);
      if (columna.clave === "cui" && typeof valor === "number") valor = String(Math.trunc(valor));
      celdas[columna.clave] = valor;
      if (valor != null) vacia = false;
    }
    if (!vacia) filas.push({ fila: numero, celdas });
  }
  return { exportadoEn, filas };
}

export async function leerRepOpmi(buffer: Buffer, archivo: string, opmi: string | null, fuenteUrl: string): Promise<LibroRepOpmi> {
  const cargado = await import("exceljs");
  const ExcelJS = (cargado as { default?: { Workbook: new () => Workbook } }).default ?? (cargado as unknown as { Workbook: new () => Workbook });
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as Parameters<Workbook["xlsx"]["load"]>[0]);
  const nombres = wb.worksheets.map((hoja) => hoja.name);
  if (nombres.length === 1 && /anexo|comunicado|directorio/i.test(nombres[0] || "")) {
    throw new ErrorImportacion("Este archivo es un directorio o comunicado de unidades OPMI, no la cartera de inversiones.");
  }
  const faltan = HOJAS.filter((nombre) => !wb.getWorksheet(nombre));
  if (faltan.length) {
    const ssi = wb.getWorksheet("Inversiones");
    if (ssi && faltan.length) {
      const cabecera = ssi.getRow(7).values;
      const texto = Array.isArray(cabecera) ? cabecera.join(" ") : "";
      if (/PIM\s*2023|DEVENGADO\s*2023/i.test(texto)) {
        throw new ErrorImportacion("Este export SSI trae encabezados PIM 2023 o DEVENGADO 2023. No se renombran a 2026. No es el RepOpmi de cuatro hojas.");
      }
    }
    if (wb.getWorksheet("Resultados") || wb.getWorksheet("Cartera")) {
      throw new ErrorImportacion("Este archivo es Consulta Avanzada o PMI, no el RepOpmi de cuatro hojas. No se carga para no duplicar montos.");
    }
    throw new ErrorImportacion(`Faltan hojas del RepOpmi: ${faltan.join(", ")}.`);
  }
  const inversiones = leerHoja(wb.getWorksheet("Inversiones")!);
  const etDe = leerHoja(wb.getWorksheet("ET_DE")!);
  const avance = leerHoja(wb.getWorksheet("Avance Fisico")!);
  const contratos = leerHoja(wb.getWorksheet("Contratos")!);
  if (!inversiones.filas.length) throw new ErrorImportacion("La hoja Inversiones no tiene filas de datos.");
  const cuis = new Map<string, number>();
  for (const fila of inversiones.filas) {
    const cui = fila.celdas.cui;
    if (typeof cui !== "string" || !cui.trim()) continue;
    cuis.set(cui, (cuis.get(cui) || 0) + 1);
  }
  const duplicados = [...cuis.entries()].filter(([, veces]) => veces > 1);
  if (duplicados.length) {
    throw new ErrorImportacion(`Hay CUI repetidos en Inversiones: ${duplicados.map(([cui]) => cui).join(", ")}.`);
  }
  const pliegos = new Map<string, number>();
  for (const fila of inversiones.filas) {
    const pliego = fila.celdas.pliego_entidad_uei_uf;
    if (typeof pliego !== "string") continue;
    pliegos.set(pliego, (pliegos.get(pliego) || 0) + 1);
  }
  const pliegoPropio = [...pliegos.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const entidad = pliegoPropio || "Entidad sin pliego leído";
  const calidad = [
    "Los vacíos se conservan vacíos. No se convierten en cero.",
    "ET/DE, avance físico y contratos son listas aparte. No se multiplican el costo ni el devengado al unirlas.",
    "El monto contratado total puede repetirse en cada ítem del mismo proceso. No se suma entre ítems.",
    "El avance financiero, el avance de ejecución y el avance físico son medidas distintas.",
    `Exportación impresa: ${inversiones.exportadoEn || "sin fecha"}. Esa hora no es el corte de cada variable.`,
  ];
  return {
    opmi,
    entidad,
    pliegoPropio,
    archivo,
    exportadoEn: inversiones.exportadoEn,
    fuenteUrl,
    inversiones: inversiones.filas,
    etDe: etDe.filas,
    avanceFisico: avance.filas,
    contratos: contratos.filas,
    calidad,
  };
}

export function numero(valor: Celda): number | null {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

export function sumarPresentes(filas: Fila[], clave: string): { suma: number; presentes: number } {
  let suma = 0;
  let presentes = 0;
  for (const fila of filas) {
    const valor = numero(fila.celdas[clave]);
    if (valor == null) continue;
    suma += valor;
    presentes += 1;
  }
  return { suma: Math.round(suma * 100) / 100, presentes };
}

export function cuiDe(fila: Fila): string | null {
  const cui = fila.celdas.cui;
  return typeof cui === "string" && cui.trim() ? cui.trim() : null;
}

export function esLegacy(fila: Fila): boolean {
  return cuiDe(fila) == null && numero(fila.celdas.codigo_snip) != null;
}
