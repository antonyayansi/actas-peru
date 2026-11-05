import { resumir } from "./counts";
import { matchesQuery, titleCase } from "./text";
import type {
  Ambito,
  AmbitoIndexado,
  Catalog,
  Corpus,
  Distrito,
  Documento,
  Filtro,
  Resultado,
} from "./types";

export interface Busqueda {
  resultados: Resultado[];
  total: number;
  pagina: number;
  paginas: number;
  resumen: ReturnType<typeof resumir>;
}

function haystackScope(scope: AmbitoIndexado): string {
  return [
    scope.departamento,
    scope.provincia,
    scope.distrito,
    scope.ubigeo,
    scope.jee,
    scope.autoridad?.nombre,
    scope.autoridad?.organizacion,
    scope.ambito,
  ]
    .filter(Boolean)
    .join(" ");
}

function resultadoAmbito(
  scope: AmbitoIndexado,
  distrito: Distrito | null,
): Resultado {
  const lugar = [scope.distrito ? `Distrito de ${titleCase(scope.distrito)}` : null, scope.provincia ? `Provincia de ${titleCase(scope.provincia)}` : null, titleCase(scope.departamento)]
    .filter(Boolean)
    .join(" · ");
  const titulo =
    scope.ambito === "distrital"
      ? titleCase(scope.distrito || "Distrito")
      : scope.ambito === "provincial"
        ? `Provincia de ${titleCase(scope.provincia || "")}`
        : `Región ${titleCase(scope.departamento)}`;
  return {
    id: scope.key,
    tipoTarjeta: "ambito",
    ambito: scope.ambito,
    estado: "acta_publicada",
    estadoEtiqueta: "Acta publicada encontrada",
    titulo,
    lugar,
    jee: scope.jee,
    fechaActa: scope.fechaActa,
    fechaListado: scope.fechaListado,
    fechaListadoEsFutura: false,
    autoridad: scope.autoridad,
    pdfUrl: scope.pdfUrl,
    transmisionUrl: null,
    nota:
      scope.fuentes.length > 1
        ? `Hay ${scope.fuentes.length} publicaciones del listado para este mismo ámbito. Se muestra la más reciente.`
        : null,
    fuentes: scope.fuentes,
    esCapitalProvincial: Boolean(distrito?.esCapitalProvincial),
  };
}

function resultadoVacio(
  id: string,
  titulo: string,
  lugar: string,
  ambito: Resultado["ambito"],
  cierre: boolean,
  nota: string | null,
  esCapital: boolean,
): Resultado {
  const pendiente = !cierre;
  return {
    id,
    tipoTarjeta: "ambito",
    ambito,
    estado: esCapital ? "capital" : pendiente ? "pendiente_revision" : "sin_publicacion_encontrada",
    estadoEtiqueta: esCapital
      ? "Distrito capital, sin elección distrital aparte"
      : pendiente
        ? "Pendiente de extracción/revisión"
        : "Sin publicación encontrada",
    titulo,
    lugar,
    jee: null,
    fechaActa: null,
    fechaListado: null,
    fechaListadoEsFutura: false,
    autoridad: null,
    pdfUrl: null,
    transmisionUrl: null,
    nota,
    fuentes: [],
    esCapitalProvincial: esCapital,
  };
}

function resultadoEvento(doc: Documento): Resultado {
  const etiqueta =
    doc.estado === "pendiente_extraccion" || doc.estado === "pendiente_revision"
      ? "Pendiente de extracción/revisión"
      : doc.estado === "error_fuente"
        ? "Error al leer la fuente"
        : doc.estado === "programada_sin_acta"
          ? "Fecha futura en el listado, sin PDF"
          : doc.estado === "acta_publicada"
            ? "Acta publicada encontrada"
            : "Fila del listado sin PDF";
  const notaFutura = doc.futura && !doc.pdfPath
    ? "Una fila con fecha futura y sin PDF no garantiza que la proclamación esté pendiente ni que ya haya ocurrido."
    : doc.error;
  return {
    id: `evt-${doc.idProclamacion}`,
    tipoTarjeta: doc.ambito === "regional_parcial" ? "documento" : doc.dedupeKey ? "ambito" : "evento",
    ambito: doc.ambito,
    estado: doc.estado,
    estadoEtiqueta: doc.clase === "computo_regional_descentralizado" ? "Cómputo regional descentralizado" : etiqueta,
    titulo: doc.distrito
      ? titleCase(doc.distrito)
      : doc.provincia
        ? `Provincia de ${titleCase(doc.provincia)}`
        : doc.jee || "Evento del listado",
    lugar: [doc.distrito, doc.provincia, doc.departamento, doc.tipoListado].filter(Boolean).map((part) => titleCase(String(part))).join(" · ") || doc.tipoListado,
    jee: doc.jee,
    fechaActa: doc.fechaActa,
    fechaListado: doc.fechaListado,
    fechaListadoEsFutura: doc.futura,
    autoridad: doc.autoridad,
    pdfUrl: doc.pdfUrl,
    transmisionUrl: doc.transmisionUrl,
    nota:
      doc.clase === "computo_regional_descentralizado"
        ? `Acta descentralizada de cómputo en ${doc.provinciasParciales.join(", ") || "provincias del jurado"}. No proclama al gobernador regional.`
        : notaFutura,
    fuentes: [
      {
        idProclamacion: doc.idProclamacion,
        pdfUrl: doc.pdfUrl,
        fechaListado: doc.fechaListado,
        fechaActa: doc.fechaActa,
        jee: doc.jee,
      },
    ],
    esCapitalProvincial: false,
  };
}

function nivelDocumento(doc: Documento): Ambito | null {
  if (
    doc.ambito === "regional" ||
    doc.ambito === "regional_parcial" ||
    doc.clase === "computo_regional_descentralizado" ||
    doc.clase === "autoridades_regionales"
  ) {
    return "regional";
  }
  if (doc.ambito === "provincial" || doc.clase === "autoridades_provinciales") return "provincial";
  if (doc.ambito === "distrital" || doc.clase === "autoridades_distritales") return "distrital";
  const tipo = doc.tipoListado.toUpperCase();
  if (tipo.includes("REGIONAL")) return "regional";
  if (tipo.includes("PROVINCIAL")) return "provincial";
  if (tipo.includes("DISTRITAL")) return "distrital";
  return null;
}

function quiereLugaresVacios(filtro: Filtro): boolean {
  if (filtro.estado === "con_acta" || filtro.estado === "pendiente") return false;
  return Boolean(filtro.q || filtro.departamento || filtro.provincia || filtro.distrito || filtro.estado === "sin_acta");
}

function lugarCoincideTexto(texto: string, filtro: Filtro): boolean {
  if (!filtro.q) return true;
  return matchesQuery(texto, filtro.q);
}

export function buscar(catalog: Catalog, corpus: Corpus, filtro: Filtro, pagina = 1, tamano = 20): Busqueda {
  const resumen = resumir(catalog, corpus, filtro);
  const scopes = new Map(corpus.scopes.map((scope) => [scope.lugarId, scope]));
  const cards: Resultado[] = [];
  const seen = new Set<string>();

  const pushScope = (scope: AmbitoIndexado) => {
    if (seen.has(scope.key)) return;
    if (filtro.estado === "sin_acta" || filtro.estado === "pendiente") return;
    if (filtro.tipo && filtro.tipo !== "todos" && scope.ambito !== filtro.tipo) return;
    if (filtro.departamento && scope.departamentoCodigo !== filtro.departamento) return;
    if (filtro.provincia && (scope.ambito === "regional" || scope.provinciaCodigo !== filtro.provincia)) return;
    if (filtro.distrito && scope.lugarId !== filtro.distrito && scope.ubigeo !== filtro.distrito) return;
    if (!lugarCoincideTexto(haystackScope(scope), filtro)) return;
    const distrito = catalog.distritos.find((item) => item.lugarId === scope.lugarId) ?? null;
    cards.push(resultadoAmbito(scope, distrito));
    seen.add(scope.key);
  };

  if (!quiereLugaresVacios(filtro) && filtro.estado !== "pendiente") {
    for (const scope of corpus.scopes) pushScope(scope);
  } else if (filtro.estado !== "pendiente") {
    for (const dep of catalog.departamentos) {
      if (filtro.departamento && dep.codigo !== filtro.departamento) continue;
      if (filtro.provincia || filtro.distrito) continue;
      if (filtro.tipo && filtro.tipo !== "todos" && filtro.tipo !== "regional") continue;
      const lugarId = `regional:${dep.codigo}`;
      const scope = scopes.get(lugarId);
      const texto = `${dep.nombreMostrar} ${dep.nombre} región gobierno regional`;
      if (scope) {
        pushScope(scope);
        continue;
      }
      if (!lugarCoincideTexto(texto, filtro)) continue;
      if (filtro.estado === "con_acta") continue;
      cards.push(
        resultadoVacio(
          lugarId,
          `Región ${dep.nombreMostrar}`,
          dep.nombreMostrar,
          "regional",
          resumen.cierre,
          "La fórmula de gobernador y vicegobernador corresponde al departamento completo.",
          false,
        ),
      );
    }

    for (const prov of catalog.provincias) {
      if (filtro.departamento && prov.departamentoCodigo !== filtro.departamento) continue;
      if (filtro.provincia && prov.codigo !== filtro.provincia) continue;
      if (filtro.distrito) continue;
      if (filtro.tipo && filtro.tipo !== "todos" && filtro.tipo !== "provincial") continue;
      const lugarId = `provincial:${prov.codigo}`;
      const scope = scopes.get(lugarId);
      const dep = catalog.departamentos.find((item) => item.codigo === prov.departamentoCodigo);
      const texto = `${prov.nombre} ${prov.nombreMostrar} ${dep?.nombreMostrar ?? ""} provincia`;
      if (scope) {
        pushScope(scope);
        continue;
      }
      if (!lugarCoincideTexto(texto, filtro)) continue;
      cards.push(
        resultadoVacio(
          lugarId,
          `Provincia de ${prov.nombreMostrar}`,
          `${prov.nombreMostrar} · ${dep?.nombreMostrar ?? ""}`,
          "provincial",
          resumen.cierre,
          null,
          false,
        ),
      );
    }

    for (const dist of catalog.distritos) {
      if (filtro.departamento && dist.departamentoCodigo !== filtro.departamento) continue;
      if (filtro.provincia && dist.provinciaCodigo !== filtro.provincia) continue;
      if (filtro.distrito && dist.lugarId !== filtro.distrito && dist.ubigeo !== filtro.distrito) continue;
      if (filtro.tipo && filtro.tipo !== "todos" && filtro.tipo !== "distrital") continue;
      if (dist.esCapitalProvincial && filtro.estado === "sin_acta") continue;
      const scope = scopes.get(dist.lugarId);
      const dep = catalog.departamentos.find((item) => item.codigo === dist.departamentoCodigo);
      const texto = `${dist.nombre} ${dist.nombreMostrar} ${dist.provincia} ${dep?.nombre ?? ""} ${dist.ubigeo ?? ""}`;
      if (scope && !dist.esCapitalProvincial) {
        pushScope(scope);
        continue;
      }
      if (!lugarCoincideTexto(texto, filtro) && !(filtro.departamento || filtro.provincia || filtro.distrito)) continue;
      if (filtro.q && !lugarCoincideTexto(texto, filtro)) continue;
      if (!dist.esCapitalProvincial && filtro.estado === "con_acta") continue;
      if (dist.esCapitalProvincial && !(filtro.q || filtro.distrito)) continue;
      cards.push(
        resultadoVacio(
          dist.lugarId,
          dist.nombreMostrar,
          `Distrito de ${dist.nombreMostrar} · ${titleCase(dist.provincia)} · ${dep?.nombreMostrar ?? ""}`,
          "distrital",
          resumen.cierre,
          dist.esCapitalProvincial
            ? "Este distrito es capital de provincia. Su alcaldía se elige con la municipalidad provincial, no como municipalidad distrital."
            : dist.nota,
          dist.esCapitalProvincial,
        ),
      );
    }
  }

  const incluirEventos = filtro.estado === "pendiente" || Boolean(filtro.q);
  if (incluirEventos) {
    for (const doc of corpus.documents) {
      if (doc.dedupeKey && seen.has(doc.dedupeKey) && doc.estado === "acta_publicada" && doc.ambito !== "regional_parcial") {
        continue;
      }
      const pendiente = doc.estado === "pendiente_extraccion" || doc.estado === "pendiente_revision" || doc.estado === "error_fuente";
      const parcial = doc.clase === "computo_regional_descentralizado";
      if (filtro.estado === "pendiente" && !pendiente) continue;
      if (filtro.estado === "con_acta" && doc.estado !== "acta_publicada") continue;
      if (filtro.estado === "sin_acta") continue;
      if (!parcial && !pendiente && doc.estado !== "programada_sin_acta" && doc.estado !== "sin_acta_en_fila") continue;
      if (filtro.tipo && filtro.tipo !== "todos" && nivelDocumento(doc) !== filtro.tipo) continue;
      if (filtro.departamento && doc.departamentoCodigo && doc.departamentoCodigo !== filtro.departamento) continue;
      if (filtro.departamento && !doc.departamentoCodigo && filtro.estado !== "pendiente") continue;
      if (filtro.provincia && doc.provinciaCodigo && doc.provinciaCodigo !== filtro.provincia && !parcial) continue;
      const texto = `${doc.jee} ${doc.tipoListado} ${doc.fechaListadoTexto} ${doc.departamento ?? ""} ${doc.provincia ?? ""} ${doc.distrito ?? ""} ${doc.provinciasParciales.join(" ")}`;
      if (filtro.q && !matchesQuery(texto, filtro.q)) continue;
      if (!filtro.q && !pendiente && !parcial) continue;
      const card = resultadoEvento(doc);
      if (seen.has(card.id)) continue;
      cards.push(card);
      seen.add(card.id);
    }
  }

  cards.sort((a, b) => {
    const rank = (item: Resultado) => (item.estado === "acta_publicada" || item.estadoEtiqueta === "Cómputo regional descentralizado" ? 0 : item.esCapitalProvincial ? 2 : 1);
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    const ta = a.fechaActa || a.fechaListado || "";
    const tb = b.fechaActa || b.fechaListado || "";
    if (ta !== tb) return tb.localeCompare(ta);
    return a.titulo.localeCompare(b.titulo, "es");
  });

  const total = cards.length;
  const paginas = Math.max(1, Math.ceil(total / tamano));
  const paginaSegura = Math.min(Math.max(pagina, 1), paginas);
  const inicio = (paginaSegura - 1) * tamano;
  return {
    resultados: cards.slice(inicio, inicio + tamano),
    total,
    pagina: paginaSegura,
    paginas,
    resumen,
  };
}
