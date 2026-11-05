import { catalogoAlineado, DENOMINADOR } from "./catalog";
import { bloqueaCierre } from "./corpus";
import { miles, porcentajeTexto } from "./text";
import type { Ambito, Catalog, Corpus, Documento, Filtro, Resumen, ResumenTipo } from "./types";

const ETIQUETAS: Record<Ambito, string> = {
  regional: "gobiernos regionales",
  provincial: "municipalidades provinciales",
  distrital: "municipalidades distritales",
};

export interface Recorte {
  regional: number | null;
  provincial: number | null;
  distrital: number | null;
  filtroActivo: boolean;
  esNacional: boolean;
}

export function recorteEsperado(catalog: Catalog, filtro: Filtro): Recorte {
  const filtroActivo = Boolean(filtro.departamento || filtro.provincia || filtro.distrito || (filtro.tipo && filtro.tipo !== "todos") || filtro.q);
  const alineado = catalogoAlineado(catalog);

  if (filtro.distrito) {
    const dist = catalog.distritos.find((item) => item.lugarId === filtro.distrito || item.ubigeo === filtro.distrito);
    return {
      regional: 0,
      provincial: 0,
      distrital: dist && !dist.esCapitalProvincial ? 1 : 0,
      filtroActivo: true,
      esNacional: false,
    };
  }

  if (filtro.provincia) {
    const elegibles = catalog.distritos.filter(
      (item) => item.provinciaCodigo === filtro.provincia && !item.esCapitalProvincial,
    );
    return {
      regional: 0,
      provincial: 1,
      distrital: elegibles.length,
      filtroActivo: true,
      esNacional: false,
    };
  }

  if (filtro.departamento) {
    const elegibles = catalog.distritos.filter(
      (item) => item.departamentoCodigo === filtro.departamento && !item.esCapitalProvincial,
    );
    const provincias = catalog.provincias.filter((item) => item.departamentoCodigo === filtro.departamento);
    return {
      regional: 1,
      provincial: provincias.length,
      distrital: elegibles.length,
      filtroActivo: true,
      esNacional: false,
    };
  }

  if (!alineado) {
    return {
      regional: null,
      provincial: null,
      distrital: null,
      filtroActivo,
      esNacional: true,
    };
  }

  return {
    regional: DENOMINADOR.regional,
    provincial: DENOMINADOR.provincial,
    distrital: DENOMINADOR.distrital,
    filtroActivo,
    esNacional: true,
  };
}

export interface SaludRecorte {
  activo: boolean;
  filas: number;
  pdfConRuta: number;
  pdfOk: number;
  pdfRevision: number;
  pdfError: number;
  pdfSinDescargar: number;
  sinTerritorio: number;
}

function documentoEnRecorte(doc: Documento, filtro: Filtro): boolean {
  if (filtro.distrito) {
    if (doc.lugarId !== filtro.distrito && doc.ubigeo !== filtro.distrito) return false;
  } else if (filtro.provincia) {
    if (doc.provinciaCodigo !== filtro.provincia) return false;
  } else if (filtro.departamento) {
    if (doc.departamentoCodigo !== filtro.departamento) return false;
  }
  if (filtro.tipo && filtro.tipo !== "todos") {
    if (filtro.tipo === "regional") {
      if (doc.ambito !== "regional" && doc.ambito !== "regional_parcial") return false;
    } else if (doc.ambito !== filtro.tipo) return false;
  }
  return true;
}

export function saludDelRecorte(corpus: Corpus, filtro: Filtro): SaludRecorte {
  const activo = Boolean(filtro.departamento || filtro.provincia || filtro.distrito || (filtro.tipo && filtro.tipo !== "todos"));
  const docs = activo ? corpus.documents.filter((doc) => documentoEnRecorte(doc, filtro)) : corpus.documents;
  const withPath = docs.filter((doc) => doc.pdfPath);
  return {
    activo,
    filas: docs.length,
    pdfConRuta: withPath.length,
    pdfOk: withPath.filter((doc) => doc.estado === "acta_publicada").length,
    pdfRevision: withPath.filter((doc) => doc.estado === "pendiente_revision").length,
    pdfError: withPath.filter((doc) => doc.estado === "error_fuente").length,
    pdfSinDescargar: withPath.filter((doc) => doc.estado === "pendiente_extraccion").length,
    sinTerritorio: corpus.documents.filter(
      (doc) => doc.pdfPath && !doc.departamentoCodigo && doc.estado !== "acta_publicada",
    ).length,
  };
}

function scopeEnRecorte(scope: Corpus["scopes"][number], filtro: Filtro): boolean {
  if (filtro.departamento && scope.departamentoCodigo !== filtro.departamento) return false;
  if (filtro.provincia) {
    if (scope.ambito === "regional") return false;
    if (scope.provinciaCodigo !== filtro.provincia) return false;
  }
  if (filtro.distrito) {
    if (scope.ambito !== "distrital") return false;
    if (scope.lugarId !== filtro.distrito && scope.ubigeo !== filtro.distrito) return false;
  }
  if (filtro.tipo && filtro.tipo !== "todos" && scope.ambito !== filtro.tipo) return false;
  return true;
}

function tipoVisible(ambito: Ambito, filtro: Filtro): boolean {
  return !filtro.tipo || filtro.tipo === "todos" || filtro.tipo === ambito;
}

export function resumir(catalog: Catalog, corpus: Corpus, filtro: Filtro): Resumen {
  const alineado = catalogoAlineado(catalog);
  const recorte = recorteEsperado(catalog, filtro);
  const motivo = bloqueaCierre(corpus);
  const cierre = motivo === null && (recorte.esNacional ? alineado : true);
  const documentosSinTerritorio = corpus.documents.filter(
    (doc) => doc.pdfPath && !doc.departamentoCodigo && doc.estado !== "acta_publicada",
  ).length;
  const actasParcialesRegionales = corpus.documents.filter((doc) => {
    if (doc.clase !== "computo_regional_descentralizado" || doc.estado !== "acta_publicada") return false;
    if (filtro.departamento && doc.departamentoCodigo !== filtro.departamento) return false;
    if (filtro.provincia) {
      const prov = catalog.provincias.find((item) => item.codigo === filtro.provincia);
      if (!prov) return false;
      const names = doc.provinciasParciales.map((item) => item.toUpperCase());
      if (!names.includes(prov.nombre.toUpperCase())) return false;
    }
    return true;
  }).length;

  const tipos: ResumenTipo[] = (["regional", "provincial", "distrital"] as Ambito[])
    .filter((ambito) => tipoVisible(ambito, filtro))
    .map((ambito) => {
      const esperados = recorte[ambito];
      const conActa = corpus.datosValidos
        ? corpus.scopes.filter((scope) => scope.ambito === ambito && scopeEnRecorte(scope, filtro)).length
        : null;
      const puedeCerrar = cierre && corpus.datosValidos && esperados !== null && conActa !== null;
      const sinPublicacionEncontrada = puedeCerrar ? Math.max(esperados - conActa, 0) : null;
      const porcentaje = puedeCerrar && esperados > 0 ? (conActa / esperados) * 100 : puedeCerrar && esperados === 0 ? null : null;
      return {
        ambito,
        etiqueta: ETIQUETAS[ambito],
        esperados,
        conActa,
        sinPublicacionEncontrada,
        porcentaje,
      };
    });

  return {
    filtroActivo: recorte.filtroActivo,
    cierre,
    motivoSinCierre: cierre ? null : motivo ?? (alineado ? null : "El padrón navegable no coincide con el denominador oficial. Total pendiente de verificar."),
    catalogoAlineado: alineado,
    datosValidos: corpus.datosValidos,
    tipos,
    documentosSinTerritorio,
    actasParcialesRegionales,
    textos: textosDelResumen(filtro, {
      datosValidos: corpus.datosValidos,
      cierre,
      motivo,
      alineado,
      esNacional: recorte.esNacional,
      filtroActivo: recorte.filtroActivo,
      tipos,
      documentosSinTerritorio,
      actasParcialesRegionales,
    }),
  };
}

function textosDelResumen(filtro: Filtro, input: {
  datosValidos: boolean;
  cierre: boolean;
  motivo: string | null;
  alineado: boolean;
  esNacional: boolean;
  filtroActivo: boolean;
  tipos: ResumenTipo[];
  documentosSinTerritorio: number;
  actasParcialesRegionales: number;
}): string[] {
  if (!input.datosValidos) {
    return [
      "No hay una sincronización válida del listado público. No se muestran ceros en lugar de los datos.",
    ];
  }

  const donde = input.esNacional ? "a nivel nacional" : "en este recorte";
  const lines = input.tipos.flatMap((tipo) => {
    if (tipo.esperados === 0) return [];
    if (tipo.esperados === null || tipo.conActa === null) {
      return [`${tipo.etiqueta}: total pendiente de verificar. No se calcula un porcentaje.`];
    }
    if (!input.cierre) {
      return [`De ${miles(tipo.esperados)} ${tipo.etiqueta} ${donde}, el índice ubicó ${miles(tipo.conActa)} con acta publicada. No se calcula el porcentaje ni un faltante definitivo: la lectura todavía no está cerrada.`];
    }
    if (tipo.sinPublicacionEncontrada === null || tipo.porcentaje === null) {
      return [`De ${miles(tipo.esperados)} ${tipo.etiqueta} ${donde}, hay ${miles(tipo.conActa)} con acta publicada encontrada.`];
    }
    return [`De ${miles(tipo.esperados)} ${tipo.etiqueta} ${donde}, ${miles(tipo.conActa)} tienen acta publicada encontrada (${porcentajeTexto(tipo.porcentaje)}) y ${miles(tipo.sinPublicacionEncontrada)} están sin publicación encontrada en el listado procesado. Esa diferencia no afirma que la proclamación no haya ocurrido.`];
  });

  if (!input.cierre) {
    lines.push(input.motivo || "Cobertura nacional no cerrada.");
    if (!input.alineado && input.esNacional) {
      lines.push("Total pendiente de verificar: el catálogo territorial no cuadra con el denominador oficial.");
    }
  }
  if (input.documentosSinTerritorio > 0) {
    lines.push(
      `${miles(input.documentosSinTerritorio)} documentos del listado aún no tienen territorio leído. Un filtro geográfico no los incluye.`,
    );
  }
  if (input.actasParcialesRegionales > 0) {
    lines.push(
      `${miles(input.actasParcialesRegionales)} actas regionales de este recorte son cómputos descentralizados de jurados. No se cuentan como proclamación del gobernador regional.`,
    );
  }
  if (filtro.q?.trim()) {
    lines.push("La frase buscada filtra las tarjetas. Estas cifras siguen el territorio elegido, no solo las coincidencias del texto.");
  }
  return lines;
}
