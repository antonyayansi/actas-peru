import { bestNameMatch, containsDni, flatten, redactDni, squash } from "./text";
import type { Autoridad, Catalog, ClaseDocumento, ParsedActa } from "./types";

const MESES: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

function emptyParse(clase: ClaseDocumento): ParsedActa {
  return {
    clase,
    departamento: null,
    provincia: null,
    distrito: null,
    departamentoCodigo: null,
    provinciaCodigo: null,
    ubigeo: null,
    lugarId: null,
    ambito: null,
    provinciasParciales: [],
    fechaActa: null,
    autoridad: null,
    confianza: "baja",
  };
}

export function stripPdfBoilerplate(text: string): string {
  return text.replace(/Esta es una copia aut[eé]ntica imprimible[\s\S]{0,900}?c[oó]digo QR\.?/gi, " ");
}

function organizacionValida(value: string | null): string | null {
  if (!value) return null;
  const flat = value.replace(/\s+/g, " ").trim();
  if (!flat || flat.length > 90) return null;
  if (/copia aut[eé]ntica|c[oó]digo qr|jurado nacional|disposici[oó]n complementaria/i.test(flat)) return null;
  if (flat.split(/\s+/).length > 10) return null;
  return flat;
}

export function detectClase(head: string): ClaseDocumento {
  const flat = flatten(head).toUpperCase();
  if (flat.includes("ACTA DESCENTRALIZADA") || flat.includes("PROCLAMACION DESCENTRALIZADA")) {
    return "computo_regional_descentralizado";
  }
  if (/MUNICIPALES\s+DISTRITALES\s+ELECTAS/.test(flat)) return "autoridades_distritales";
  if (/MUNICIPALES\s+PROVINCIALES\s+ELECTAS/.test(flat)) return "autoridades_provinciales";
  if (/AUTORIDADES\s+REGIONALES\s+ELECTAS/.test(flat)) return "autoridades_regionales";
  return "desconocido";
}

export function parseFechaActa(text: string): string | null {
  const flat = flatten(text);
  const match = flat.match(/(\d{1,2})\s+de\s+([A-Za-zÁÉÍÓÚáéíóúñ]+)\s+de\s+(20\d{2})/i);
  if (!match) return null;
  const day = Number(match[1]);
  const month = MESES[match[2].toLowerCase()];
  const year = Number(match[3]);
  if (!month || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function matchDepartamento(window: string, catalog: Catalog) {
  return bestNameMatch(window, catalog.departamentos);
}

function matchProvincia(window: string, catalog: Catalog, departamentoCodigo: string) {
  const options = catalog.provincias.filter((item) => item.departamentoCodigo === departamentoCodigo);
  return bestNameMatch(window, options);
}

function matchDistrito(window: string, catalog: Catalog, provinciaCodigo: string) {
  const options = catalog.distritos.filter((item) => item.provinciaCodigo === provinciaCodigo);
  return bestNameMatch(window, options);
}

function splitProvincias(raw: string): string[] {
  return raw
    .split(/\s+Y\s+|,\s*/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 2 && !/^EN\b/i.test(part));
}

function autoridadLimpia(cargo: string, nombre: string, organizacion: string | null): Autoridad | null {
  const org = organizacion ? redactDni(organizacion) : null;
  let name = redactDni(nombre);
  if (org) {
    const words = name.split(/\s+/).filter(Boolean);
    const orgSquash = squash(org);
    for (let size = 1; size < words.length; size += 1) {
      const tail = words.slice(-size).join(" ");
      if (squash(tail) === orgSquash) {
        name = words.slice(0, -size).join(" ");
        break;
      }
    }
  }
  name = redactDni(name);
  const tokens = name.split(/\s+/).filter(Boolean);
  if (tokens.length < 2 || tokens.length > 7 || containsDni(name)) return null;
  return {
    cargo,
    nombre: name,
    organizacion: org && !containsDni(org) ? org : null,
  };
}

function extraerAutoridadMunicipal(text: string, cargo: "DISTRITAL" | "PROVINCIAL"): Autoridad | null {
  const marker = text.search(/PROCLAMACI[ÓO]N DE ALCALDE/i);
  if (marker < 0) return null;
  const section = flatten(text.slice(marker, marker + 2500));
  const orgMatch = section.match(/a la organizaci[oó]n pol[ií]tica\s+(.+?),\s*al haber/i);
  const line = section.match(
    new RegExp(`ALCALDE\\s+${cargo}\\s+\\d{8}\\s+(.+?)(?=\\s+REGIDOR\\b|$)`, "i"),
  );
  if (!line) return null;
  const etiqueta = cargo === "DISTRITAL" ? "Alcalde distrital" : "Alcalde provincial";
  return autoridadLimpia(etiqueta, line[1], organizacionValida(orgMatch?.[1] ?? null));
}

export function parseActa(text: string, catalog: Catalog): ParsedActa {
  const clean = stripPdfBoilerplate(text);
  const head = flatten(clean.slice(0, 1600));
  const clase = detectClase(head);
  const parsed = emptyParse(clase);
  parsed.fechaActa = parseFechaActa(clean);

  if (clase === "computo_regional_descentralizado") {
    const depMatch = head.match(/departamento de\s+(.+?)(?:,|\s+siendo|\s+se reun|\s+sobre\b|$)/i);
    const dep = depMatch ? matchDepartamento(depMatch[1], catalog) : null;
    const provMatch = head.match(/PROVINCIAS DE\s+(.+?)\s+En\b/i);
    const nombres = provMatch ? splitProvincias(provMatch[1]) : [];
    parsed.provinciasParciales = nombres.map((nombre) => {
      if (!dep) return nombre;
      return matchProvincia(nombre, catalog, dep.codigo)?.nombre ?? nombre;
    });
    if (dep) {
      parsed.departamento = dep.nombre;
      parsed.departamentoCodigo = dep.codigo;
      parsed.ambito = "regional_parcial";
      parsed.lugarId = `regional:${dep.codigo}`;
      parsed.confianza = "alta";
    }
    parsed.autoridad = null;
    return parsed;
  }

  const place = String.raw`[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s+(?!En\b|Siendo\b|se\b)[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+){0,6}`;
  if (clase === "autoridades_distritales") {
    const match = head.match(
      new RegExp(`DISTRITO DE\\s+(${place}),\\s*PROVINCIA DE\\s+(${place}),\\s*DEPARTAMENTO DE\\s+(${place})`, "i"),
    );
    if (!match) return parsed;
    const dep = matchDepartamento(match[3], catalog);
    const prov = dep ? matchProvincia(match[2], catalog, dep.codigo) : null;
    const dist = prov ? matchDistrito(match[1], catalog, prov.codigo) : null;
    if (!dep || !prov || !dist) return parsed;
    parsed.departamento = dep.nombre;
    parsed.provincia = prov.nombre;
    parsed.distrito = dist.nombre;
    parsed.departamentoCodigo = dep.codigo;
    parsed.provinciaCodigo = prov.codigo;
    parsed.ubigeo = dist.ubigeo;
    parsed.lugarId = dist.lugarId;
    parsed.ambito = "distrital";
    parsed.confianza = "alta";
    parsed.autoridad = extraerAutoridadMunicipal(clean, "DISTRITAL");
    return parsed;
  }

  if (clase === "autoridades_provinciales") {
    const match = head.match(new RegExp(`PROVINCIA DE\\s+(${place}),\\s*DEPARTAMENTO DE\\s+(${place})`, "i"));
    if (!match) return parsed;
    const dep = matchDepartamento(match[2], catalog);
    const prov = dep ? matchProvincia(match[1], catalog, dep.codigo) : null;
    if (!dep || !prov) return parsed;
    parsed.departamento = dep.nombre;
    parsed.provincia = prov.nombre;
    parsed.departamentoCodigo = dep.codigo;
    parsed.provinciaCodigo = prov.codigo;
    parsed.ubigeo = `${prov.codigo}00`;
    parsed.lugarId = `provincial:${prov.codigo}`;
    parsed.ambito = "provincial";
    parsed.confianza = "alta";
    parsed.autoridad = extraerAutoridadMunicipal(clean, "PROVINCIAL");
    return parsed;
  }

  if (clase === "autoridades_regionales") {
    const match = head.match(/DEPARTAMENTO DE\s+(.+?)(?:\s+En\b|,|\s+siendo|$)/i);
    const dep = match ? matchDepartamento(match[1], catalog) : null;
    if (!dep) return parsed;
    parsed.departamento = dep.nombre;
    parsed.departamentoCodigo = dep.codigo;
    parsed.ubigeo = `${dep.codigo}0000`;
    parsed.lugarId = `regional:${dep.codigo}`;
    parsed.ambito = "regional";
    parsed.confianza = "alta";
    return parsed;
  }

  return parsed;
}
