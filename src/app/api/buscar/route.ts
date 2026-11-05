import { NextRequest, NextResponse } from "next/server";
import { loadCatalog } from "@/lib/catalog";
import { metricasPorDepartamento } from "@/lib/mapa-metricas";
import { buscar } from "@/lib/search";
import { fechaHoraLima } from "@/lib/text";
import type { Ambito, Filtro } from "@/lib/types";
import { readSnapshot } from "@/indexer/state";

export const dynamic = "force-dynamic";

function aviso(snapshotTime: string | null, syncedAt: string | null, status: string, error: string | null, challenge: boolean, detail: string | null, trabajando: boolean, intervalMinutes: number): string | null {
  if (status === "error_con_datos_previos" || status === "parcial") {
    return error || "La última lectura del listado no se completó. Siguen visibles los datos válidos anteriores.";
  }
  if (challenge && detail) return detail;
  if (!trabajando && syncedAt) {
    const age = Date.now() - new Date(syncedAt).getTime();
    const limit = Math.max(intervalMinutes, 30) * 3 * 60_000;
    if (age > limit) {
      return `Datos posiblemente desactualizados. Última sincronización exitosa: ${fechaHoraLima(syncedAt)}.`;
    }
  }
  if (!snapshotTime) return null;
  return null;
}

export function GET(request: NextRequest) {
  const snapshot = readSnapshot();
  if (!snapshot) {
    return NextResponse.json({
      listo: false,
      mensaje: "El índice todavía no tiene una sincronización válida. No se muestran ceros.",
    });
  }
  const params = request.nextUrl.searchParams;
  const tipo = params.get("tipo");
  const filtro: Filtro = {
    q: params.get("q") || undefined,
    departamento: params.get("departamento") || undefined,
    provincia: params.get("provincia") || undefined,
    distrito: params.get("distrito") || undefined,
    tipo: tipo === "distrital" || tipo === "provincial" || tipo === "regional" ? (tipo as Ambito) : "todos",
    estado: (params.get("estado") as Filtro["estado"]) || "todos",
  };
  const pagina = Number(params.get("pagina") || 1);
  const catalogo = loadCatalog();
  const busqueda = buscar(catalogo, snapshot.corpus, filtro, Number.isFinite(pagina) ? pagina : 1, 20);
  const corpus = snapshot.corpus;
  return NextResponse.json({
    listo: true,
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
    },
    aviso: aviso(
      corpus.generatedAt,
      corpus.listingSyncedAt,
      corpus.listingStatus,
      corpus.listingError,
      corpus.challengeStopped,
      corpus.challengeDetail,
      corpus.trabajando,
      corpus.intervalMinutes,
    ),
    denominador: snapshot.denominador,
    ubigeo: snapshot.ubigeo,
    porDepartamento: metricasPorDepartamento(catalogo, snapshot.corpus),
  });
}
