import { cuiDe, esLegacy, numero, sumarPresentes, type LibroRepOpmi } from "../inversiones/parse";

export interface CifrasPaquete {
  registros: number;
  conCui: number;
  legados: string[];
  pliegoPropio: string | null;
  registrosPropio: number;
  registrosOtros: number;
  pim: number;
  devengado: number;
  pimPropio: number;
  devengadoPropio: number;
  estados: { nombre: string; cantidad: number }[];
  meses: { mes: string; suma: number; presentes: number }[];
  etDe: number;
  avances: number;
  contratos: number;
  contratosConMonto: number;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];

export function cifrasDe(libro: LibroRepOpmi, soloPropio = false): CifrasPaquete {
  const base = soloPropio && libro.pliegoPropio
    ? libro.inversiones.filter((fila) => fila.celdas.pliego_entidad_uei_uf === libro.pliegoPropio)
    : libro.inversiones;
  const cuis = new Set(base.map(cuiDe).filter((cui): cui is string => Boolean(cui)));
  const propios = libro.pliegoPropio
    ? libro.inversiones.filter((fila) => fila.celdas.pliego_entidad_uei_uf === libro.pliegoPropio)
    : [];
  const estados = new Map<string, number>();
  for (const fila of base) {
    const nombre = typeof fila.celdas.estado === "string" ? fila.celdas.estado : "Sin dato";
    estados.set(nombre, (estados.get(nombre) || 0) + 1);
  }
  const contratos = libro.contratos.filter((fila) => cuis.has(cuiDe(fila) || ""));
  return {
    registros: base.length,
    conCui: cuis.size,
    legados: base.filter(esLegacy).map((fila) => String(fila.celdas.codigo_snip)),
    pliegoPropio: libro.pliegoPropio,
    registrosPropio: propios.length,
    registrosOtros: libro.inversiones.length - propios.length,
    pim: sumarPresentes(base, "pim_2026").suma,
    devengado: sumarPresentes(base, "devengado_2026").suma,
    pimPropio: sumarPresentes(propios, "pim_2026").suma,
    devengadoPropio: sumarPresentes(propios, "devengado_2026").suma,
    estados: [...estados.entries()].map(([nombre, cantidad]) => ({ nombre, cantidad })),
    meses: MESES.map((mes) => ({ mes, ...sumarPresentes(base, `devengado_2026_${mes}`) })),
    etDe: libro.etDe.filter((fila) => cuis.has(cuiDe(fila) || "")).length,
    avances: libro.avanceFisico.filter((fila) => cuis.has(cuiDe(fila) || "")).length,
    contratos: contratos.length,
    contratosConMonto: contratos.filter((fila) => numero(fila.celdas.monto_contratado_total) != null).length,
  };
}

export function soles(valor: number): string {
  return new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
}
