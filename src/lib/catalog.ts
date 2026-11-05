import fs from "fs";
import path from "path";
import { squash, titleCase } from "./text";
import type { Catalog, Departamento, Distrito, Provincia, RawDistrito } from "./types";
import { SUPLEMENTOS } from "./catalog-shared";

export { DENOMINADOR, SUPLEMENTOS, catalogoAlineado } from "./catalog-shared";

const DEP_MOSTRAR: Record<string, string> = {
  ANCASH: "Áncash",
  APURIMAC: "Apurímac",
  HUANUCO: "Huánuco",
  JUNIN: "Junín",
  SANMARTIN: "San Martín",
};

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
