import { NextResponse } from "next/server";
import { DENOMINADOR, loadCatalog } from "@/lib/catalog";
import { actasUbicadas } from "@/lib/estatico";
import { readSnapshot } from "@/indexer/state";

export const dynamic = "force-dynamic";

export function GET() {
  const catalog = loadCatalog();
  const actas = actasUbicadas(readSnapshot()?.corpus.scopes ?? []);
  const departamentos = catalog.departamentos.map((dep) => ({
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
  }));
  return NextResponse.json({
    departamentos,
    advertencias: catalog.advertencias,
    denominador: DENOMINADOR,
  });
}
