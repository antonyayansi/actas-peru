import { DENOMINADOR } from "./catalog-shared";
import { saludDelRecorte } from "./counts";
import { metricasPorDepartamento } from "./mapa-metricas";
import { buscar, consultaDeGrupo } from "./search";
import { fechaHoraLima } from "./text";
import type { Ambito, Catalog, Corpus, Filtro } from "./types";

export interface IndiceEstatico {
  corpus: Corpus;
  catalog: Catalog;
  denominador: unknown;
  ubigeo: { archivo: string; nota: string };
}

export interface ConsultaFiltro {
  q?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  tipo?: string;
  estado?: string;
  pagina?: number;
  paginaProvincial?: number;
  paginaRegional?: number;
  qRegional?: string;
  qProvincial?: string;
  qDistrital?: string;
}

export function actasUbicadas(scopes: { lugarId: string; ambito: string }[]) {
  const regional = new Set<string>();
  const provincial = new Set<string>();
  const distrital = new Set<string>();
  for (const scope of scopes) {
    if (scope.ambito === "regional") regional.add(scope.lugarId);
    else if (scope.ambito === "provincial") provincial.add(scope.lugarId);
    else if (scope.ambito === "distrital") distrital.add(scope.lugarId);
  }
  return { regional, provincial, distrital };
}

export function catalogoVisible(catalog: Catalog, scopes: { lugarId: string; ambito: string }[] = []) {
  const actas = actasUbicadas(scopes);
  return {
    departamentos: catalog.departamentos.map((dep) => ({
      codigo: dep.codigo,
      nombre: dep.nombreMostrar,
      conActa: actas.regional.has(`regional:${dep.codigo}`),
      provincias: catalog.provincias
        .filter((prov) => prov.departamentoCodigo === dep.codigo)
        .map((prov) => ({
          codigo: prov.codigo,
          nombre: prov.nombreMostrar,
          conActa: actas.provincial.has(`provincial:${prov.codigo}`),
          distritos: catalog.distritos
            .filter((dist) => dist.provinciaCodigo === prov.codigo)
            .map((dist) => ({
              lugarId: dist.lugarId,
              nombre: dist.nombreMostrar,
              esCapitalProvincial: dist.esCapitalProvincial,
              suplemento: dist.suplemento,
              nota: dist.nota,
              conActa: actas.distrital.has(dist.lugarId),
            })),
        })),
    })),
    denominador: {
      fuentes: DENOMINADOR.fuentes.map((fuente) => ({ nombre: fuente.nombre, detalle: fuente.detalle, url: fuente.url })),
    },
  };
}

function aviso(corpus: Corpus): string | null {
  if (corpus.listingStatus === "error_con_datos_previos" || corpus.listingStatus === "parcial") {
    return corpus.listingError || "La última lectura del listado no se completó. Siguen visibles los datos válidos anteriores.";
  }
  if (corpus.challengeStopped && corpus.challengeDetail) return corpus.challengeDetail;
  return null;
}

export function consultar(indice: IndiceEstatico, entrada: ConsultaFiltro) {
  const tipo = entrada.tipo;
  const filtro: Filtro = {
    q: entrada.q || undefined,
    departamento: entrada.departamento || undefined,
    provincia: entrada.provincia || undefined,
    distrito: entrada.distrito || undefined,
    tipo: tipo === "distrital" || tipo === "provincial" || tipo === "regional" ? (tipo as Ambito) : "todos",
    estado: (entrada.estado as Filtro["estado"]) || "todos",
  };
  const pagina = Number(entrada.pagina || 1);
  const paginaProvincial = Number(entrada.paginaProvincial || 1);
  const paginaRegional = Number(entrada.paginaRegional || 1);
  const qColumna = {
    regional: entrada.qRegional,
    provincial: entrada.qProvincial,
    distrital: entrada.qDistrital,
  };
  const busqueda = buscar(indice.catalog, indice.corpus, filtro, Number.isFinite(pagina) ? pagina : 1, 20);
  const tiposVisibles = filtro.tipo && filtro.tipo !== "todos" ? [filtro.tipo] : (["regional", "provincial", "distrital"] as const);
  const titulos = { regional: "Gobiernos regionales", provincial: "Provinciales", distrital: "Distritales" } as const;
  const grupos = tiposVisibles.map((ambito) => {
    const paginaGrupo = ambito === "distrital" ? pagina : ambito === "provincial" ? paginaProvincial : paginaRegional;
    const tamano = ambito === "regional" ? 25 : 6;
    const encontrado = buscar(indice.catalog, indice.corpus, consultaDeGrupo(filtro, ambito, qColumna[ambito]), Number.isFinite(paginaGrupo) ? paginaGrupo : 1, tamano);
    return {
      ambito,
      titulo: titulos[ambito],
      resultados: encontrado.resultados,
      total: encontrado.total,
      pagina: encontrado.pagina,
      paginas: encontrado.paginas,
    };
  });
  const corpus = indice.corpus;
  return {
    listo: true as const,
    ...busqueda,
    ingestion: {
      listingStatus: corpus.listingStatus,
      listingError: corpus.listingError,
      declaredTotal: corpus.declaredTotal,
      filas: corpus.documents.length,
      pdfConRuta: corpus.pdfConRuta,
      pdfOk: corpus.pdfOk,
      pdfRevision: corpus.pdfRevision,
      pdfError: corpus.pdfError,
      pdfSinDescargar: corpus.pdfSinDescargar,
      trabajando: corpus.trabajando,
      challengeStopped: corpus.challengeStopped,
      challengeDetail: corpus.challengeDetail,
      listingSyncedAt: corpus.listingSyncedAt,
      listingSyncedLabel: fechaHoraLima(corpus.listingSyncedAt),
      ultimoAvanceLabel: fechaHoraLima(corpus.ultimoAvanceEn),
      generadoLabel: fechaHoraLima(corpus.generatedAt),
      intervalMinutes: corpus.intervalMinutes,
      datosValidos: corpus.datosValidos,
      recorte: saludDelRecorte(corpus, filtro),
    },
    aviso: aviso(corpus),
    denominador: indice.denominador,
    ubigeo: indice.ubigeo,
    porDepartamento: metricasPorDepartamento(indice.catalog, indice.corpus),
    grupos,
  };
}
