import { resumir } from "./counts";
import type { Catalog, Corpus } from "./types";

export interface MetricaTipo {
  ubicadas: number | null;
  esperadas: number | null;
  porcentaje: number | null;
}

export interface MetricaDepartamento {
  codigo: string;
  nombre: string;
  cierre: boolean;
  regional: MetricaTipo;
  provincial: MetricaTipo;
  distrital: MetricaTipo;
  frase: string;
}

function tomar(resumen: ReturnType<typeof resumir>, ambito: "regional" | "provincial" | "distrital"): MetricaTipo {
  const tipo = resumen.tipos.find((item) => item.ambito === ambito);
  return {
    ubicadas: tipo?.conActa ?? null,
    esperadas: tipo?.esperados ?? null,
    porcentaje: tipo?.porcentaje ?? null,
  };
}

export function metricasPorDepartamento(catalog: Catalog, corpus: Corpus): MetricaDepartamento[] {
  return catalog.departamentos.map((dep) => {
    const resumen = resumir(catalog, corpus, { departamento: dep.codigo });
    return {
      codigo: dep.codigo,
      nombre: dep.nombreMostrar,
      cierre: resumen.cierre,
      regional: tomar(resumen, "regional"),
      provincial: tomar(resumen, "provincial"),
      distrital: tomar(resumen, "distrital"),
      frase: "El color es la parte de actas ya ubicadas. Un tono claro no afirma que falte la proclamación.",
    };
  });
}

export type NivelCalor = "sin-dato" | "ninguna" | "inicio" | "avance" | "mayoria" | "alta";

export function coberturaDepartamento(metrica: MetricaDepartamento | undefined): {
  porcentaje: number | null;
  nivel: NivelCalor;
  ubicadas: number | null;
  esperadas: number | null;
} {
  if (!metrica) return { porcentaje: null, nivel: "sin-dato", ubicadas: null, esperadas: null };
  const partes = [metrica.regional, metrica.provincial, metrica.distrital];
  if (partes.some((parte) => parte.ubicadas === null || parte.esperadas === null)) {
    return { porcentaje: null, nivel: "sin-dato", ubicadas: null, esperadas: null };
  }
  const ubicadas = partes.reduce((suma, parte) => suma + (parte.ubicadas ?? 0), 0);
  const esperadas = partes.reduce((suma, parte) => suma + (parte.esperadas ?? 0), 0);
  if (esperadas <= 0) return { porcentaje: null, nivel: "sin-dato", ubicadas, esperadas };
  const porcentaje = (ubicadas / esperadas) * 100;
  const nivel: NivelCalor = ubicadas === 0
    ? "ninguna"
    : porcentaje < 25
      ? "inicio"
      : porcentaje < 50
        ? "avance"
        : porcentaje < 75
          ? "mayoria"
          : "alta";
  return { porcentaje, nivel, ubicadas, esperadas };
}

export function fraseMapa(metrica: MetricaDepartamento | undefined): string {
  if (!metrica) return "Elija un departamento en el mapa o en la lista.";
  const linea = (titulo: string, tipo: MetricaTipo) => {
    if (tipo.ubicadas === null || tipo.esperadas === null) return `${titulo}: total pendiente de verificar.`;
    return `${titulo}: ${tipo.ubicadas} con acta ubicada, de ${tipo.esperadas} del catálogo.`;
  };
  return [
    metrica.nombre,
    linea("Distritales", metrica.distrital),
    linea("Provinciales", metrica.provincial),
    linea("Gobierno regional", metrica.regional),
    metrica.frase,
  ].join(" ");
}
