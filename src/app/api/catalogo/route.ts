import { NextResponse } from "next/server";
import { DENOMINADOR, loadCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export function GET() {
  const catalog = loadCatalog();
  const departamentos = catalog.departamentos.map((dep) => ({
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
  }));
  return NextResponse.json({
    departamentos,
    advertencias: catalog.advertencias,
    denominador: DENOMINADOR,
  });
}
