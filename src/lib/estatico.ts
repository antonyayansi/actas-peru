import { DENOMINADOR } from "./catalog-shared";
import { saludDelRecorte } from "./counts";
import { metricasPorDepartamento } from "./mapa-metricas";
import { buscar } from "./search";
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
}

export function catalogoVisible(catalog: Catalog) {
  return {
    departamentos: catalog.departamentos.map((dep) => ({
      codigo: dep.codigo,
      nombre: dep.nombreMostrar,
      provincias: catalog.provincias
        .filter((prov) => prov.departamentoCodigo === dep.codigo)
        .map((prov) => ({
          codigo: prov.codigo,
          nombre: prov.nombreMostrar,
          distritos: catalog.distritos
            .filter((dist) => dist.provinciaCodigo === prov.codigo)
            .map((dist) => ({
              lugarId: dist.lugarId,
              nombre: dist.nombreMostrar,
              esCapitalProvincial: dist.esCapitalProvincial,
              suplemento: dist.suplemento,
              nota: dist.nota,
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
  const busqueda = buscar(indice.catalog, indice.corpus, filtro, Number.isFinite(pagina) ? pagina : 1, 20);
  const tiposVisibles = filtro.tipo && filtro.tipo !== "todos" ? [filtro.tipo] : (["regional", "provincial", "distrital"] as const);
  const titulos = { regional: "Gobiernos regionales", provincial: "Provinciales", distrital: "Distritales" } as const;
  const grupos = tiposVisibles.map((ambito) => {
    const paginaGrupo = ambito === "distrital" ? pagina : ambito === "provincial" ? paginaProvincial : 1;
    const tamano = ambito === "regional" ? 8 : 6;
    const encontrado = buscar(indice.catalog, indice.corpus, { ...filtro, tipo: ambito }, Number.isFinite(paginaGrupo) ? paginaGrupo : 1, tamano);
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
