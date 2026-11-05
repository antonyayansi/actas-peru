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
      frase: resumen.cierre
        ? "Sin publicación encontrada no significa que falte la proclamación."
        : "Se muestra lo ya ubicado. La lectura no está cerrada: el mapa no pinta la ausencia ni calcula un porcentaje.",
    };
  });
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
