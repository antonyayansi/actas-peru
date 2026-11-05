import fs from "fs";
import path from "path";
import { squash, titleCase } from "./text";
import type { Catalog, Departamento, Distrito, Provincia, RawDistrito } from "./types";

const DEP_MOSTRAR: Record<string, string> = {
  ANCASH: "Áncash",
  APURIMAC: "Apurímac",
  HUANUCO: "Huánuco",
  JUNIN: "Junín",
  SANMARTIN: "San Martín",
};

export const SUPLEMENTOS: RawDistrito[] = [
  {
    ubigeo: null,
    departamento: "LORETO",
    provincia: "MARISCAL RAMON CASTILLA",
    distrito: "SANTA ROSA DE LORETO",
    esCapitalProvincial: false,
    suplemento: true,
    nota: "Creado por Ley N.° 32403, publicada el 3 de julio de 2025. La ONPE informó que elige alcalde distrital en las ERM 2026. El archivo INEI de ubigeos usado (2022, 1 891 distritos) no lo trae, así que no se le asigna código.",
  },
];

export const DENOMINADOR = {
  regional: 25,
  provincial: 196,
  distrital: 1696,
  fuentes: [
    {
      nombre: "JNE, INFOgob Serie ERM 2026, Reporte N.° 1",
      detalle:
        "25 gobiernos regionales, 196 municipios provinciales y 1 696 municipios distritales.",
      url: "https://cdn.www.gob.pe/uploads/document/file/10282706/8355445-elecciones-regionales-y-municipales-2026-resultados-de-las-elecciones-primarias-y-sus-modalidades.pdf",
    },
    {
      nombre: "ONPE, 4 de octubre de 2026",
      detalle:
        "25 gobernadores, 196 alcaldes provinciales y 1 696 alcaldes distritales. Menciona 1 892 distritos, incluidos Alto Trujillo y Santa Rosa de Loreto.",
      url: "https://www.gob.pe/institucion/onpe/noticias/1452513-onpe-mas-de-26-millones-de-ciudadanos-eligen-hoy-sus-autoridades-regionales-y-municipales",
    },
    {
      nombre: "INEI, Directorio nacional de municipalidades 2026",
      detalle:
        "196 municipalidades provinciales y 1 696 distritales. Las personas listadas allí son autoridades vigentes al 13 de marzo de 2026, no las electas en octubre. Solo se usa el conteo. No entran las 3 085 municipalidades de centros poblados.",
      url: "https://cdn.www.gob.pe/uploads/document/file/9866441/8058591-directorio-nacional-de-gobiernos-regionales-municipalidades-provinciales-distritales-y-de-centros-poblados-2026.pdf",
    },
  ],
} as const;

function mostrarDepartamento(nombre: string): string {
  return DEP_MOSTRAR[squash(nombre)] ?? titleCase(nombre);
}

export function buildCatalog(rows: RawDistrito[], suplementos: RawDistrito[] = []): Catalog {
  const advertencias: string[] = [];
  const departamentos = new Map<string, Departamento>();
  const provincias = new Map<string, Provincia>();
  const distritos: Distrito[] = [];

  for (const row of rows) {
    if (!row.ubigeo || row.ubigeo.length < 6) {
      advertencias.push(`Fila de ubigeo incompleta: ${row.distrito}`);
      continue;
    }
    const depCodigo = row.ubigeo.slice(0, 2);
    const provCodigo = row.ubigeo.slice(0, 4);
    if (!departamentos.has(depCodigo)) {
      departamentos.set(depCodigo, {
        codigo: depCodigo,
        nombre: row.departamento,
        nombreMostrar: mostrarDepartamento(row.departamento),
      });
    }
    if (!provincias.has(provCodigo)) {
      provincias.set(provCodigo, {
        codigo: provCodigo,
        departamentoCodigo: depCodigo,
        nombre: row.provincia,
        nombreMostrar: titleCase(row.provincia),
      });
    }
    distritos.push({
      ubigeo: row.ubigeo,
      lugarId: `distrital:${row.ubigeo}`,
      departamentoCodigo: depCodigo,
      provinciaCodigo: provCodigo,
      departamento: row.departamento,
      provincia: row.provincia,
      nombre: row.distrito,
      nombreMostrar: titleCase(row.distrito),
      esCapitalProvincial: row.esCapitalProvincial || row.ubigeo.endsWith("01"),
      suplemento: Boolean(row.suplemento),
      nota: row.nota ?? null,
    });
  }

  for (const extra of suplementos) {
    const dep = [...departamentos.values()].find((item) => squash(item.nombre) === squash(extra.departamento));
    const prov = [...provincias.values()].find(
      (item) =>
        item.departamentoCodigo === dep?.codigo && squash(item.nombre) === squash(extra.provincia),
    );
    if (!dep || !prov) {
      advertencias.push(
        `No se pudo ubicar el suplemento ${extra.distrito} en el archivo de ubigeos (${extra.provincia}, ${extra.departamento}).`,
      );
      continue;
    }
    const lugarId = `distrital:sn:${prov.codigo}:${squash(extra.distrito)}`;
    distritos.push({
      ubigeo: null,
      lugarId,
      departamentoCodigo: dep.codigo,
      provinciaCodigo: prov.codigo,
      departamento: dep.nombre,
      provincia: prov.nombre,
      nombre: extra.distrito,
      nombreMostrar: titleCase(extra.distrito),
      esCapitalProvincial: false,
      suplemento: true,
      nota: extra.nota ?? null,
    });
  }

  const byName = (a: { nombreMostrar: string }, b: { nombreMostrar: string }) =>
    a.nombreMostrar.localeCompare(b.nombreMostrar, "es");

  return {
    departamentos: [...departamentos.values()].sort(byName),
    provincias: [...provincias.values()].sort(byName),
    distritos: distritos.sort(byName),
    advertencias,
  };
}

let cached: Catalog | null = null;

export function loadCatalog(): Catalog {
  if (cached) return cached;
  const file = path.join(process.cwd(), "data", "ubigeo.json");
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as { distritos: RawDistrito[] };
  cached = buildCatalog(parsed.distritos, SUPLEMENTOS);
  return cached;
}

export function catalogoAlineado(catalog: Catalog): boolean {
  const distritales = catalog.distritos.filter((item) => !item.esCapitalProvincial).length;
  return (
    catalog.departamentos.length === DENOMINADOR.regional &&
    catalog.provincias.length === DENOMINADOR.provincial &&
    distritales === DENOMINADOR.distrital &&
    catalog.advertencias.length === 0
  );
}

export function departamentoDe(catalog: Catalog, codigo: string | null | undefined): Departamento | null {
  if (!codigo) return null;
  return catalog.departamentos.find((item) => item.codigo === codigo) ?? null;
}

export function provinciaDe(catalog: Catalog, codigo: string | null | undefined): Provincia | null {
  if (!codigo) return null;
  return catalog.provincias.find((item) => item.codigo === codigo) ?? null;
}

export function distritoDe(catalog: Catalog, lugarId: string | null | undefined): Distrito | null {
  if (!lugarId) return null;
  return catalog.distritos.find((item) => item.lugarId === lugarId || item.ubigeo === lugarId) ?? null;
}
