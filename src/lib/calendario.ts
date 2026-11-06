import { titleCase } from "./text";
import type { Autoridad } from "./types";

export interface FuenteCalendario {
  key: string;
  fechaActa: string | null;
  ambito: string;
  departamento: string;
  provincia: string | null;
  distrito: string | null;
  autoridad: Autoridad | null;
  pdfUrl: string | null;
  transmisionUrl: string | null;
  jee: string;
}

export interface ActaCalendario {
  id: string;
  fecha: string;
  ambito: "regional" | "provincial" | "distrital";
  titulo: string;
  lugar: string;
  autoridad: Autoridad | null;
  pdfUrl: string | null;
  transmisionUrl: string | null;
  jee: string;
}

const ORDEN = { regional: 0, provincial: 1, distrital: 2 };

export function hoyLima(ahora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

export function actasParaCalendario(scopes: FuenteCalendario[]): ActaCalendario[] {
  const actas: ActaCalendario[] = [];
  for (const scope of scopes) {
    const fecha = scope.fechaActa?.slice(0, 10) ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) continue;
    if (scope.ambito !== "regional" && scope.ambito !== "provincial" && scope.ambito !== "distrital") continue;
    const ambito = scope.ambito;
    const titulo =
      ambito === "distrital"
        ? titleCase(scope.distrito || "Distrito")
        : ambito === "provincial"
          ? `Provincia de ${titleCase(scope.provincia || "")}`
          : `Región ${titleCase(scope.departamento)}`;
    const lugar = [
      ambito === "distrital" && scope.provincia ? `Provincia de ${titleCase(scope.provincia)}` : null,
      titleCase(scope.departamento),
    ]
      .filter(Boolean)
      .join(" · ");
    actas.push({
      id: scope.key,
      fecha,
      ambito,
      titulo,
      lugar,
      autoridad: scope.autoridad,
      pdfUrl: scope.pdfUrl,
      transmisionUrl: scope.transmisionUrl,
      jee: scope.jee,
    });
  }
  return actas.sort((a, b) => a.fecha.localeCompare(b.fecha) || ORDEN[a.ambito] - ORDEN[b.ambito] || a.titulo.localeCompare(b.titulo, "es"));
}

export function conteoPorDia(actas: ActaCalendario[], ambito?: ActaCalendario["ambito"]): Map<string, number> {
  const conteo = new Map<string, number>();
  for (const acta of actas) {
    if (ambito && acta.ambito !== ambito) continue;
    conteo.set(acta.fecha, (conteo.get(acta.fecha) ?? 0) + 1);
  }
  return conteo;
}

export function rejillaMes(anio: number, mes: number): (string | null)[][] {
  const inicio = (new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay() + 6) % 7;
  const cantidad = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const celdas: (string | null)[] = Array.from({ length: inicio }, () => null);
  for (let dia = 1; dia <= cantidad; dia += 1) {
    celdas.push(`${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`);
  }
  while (celdas.length % 7 !== 0) celdas.push(null);
  const semanas: (string | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}
