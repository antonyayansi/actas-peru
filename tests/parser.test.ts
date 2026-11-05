import assert from "node:assert/strict";
import test from "node:test";
import { buildCatalog } from "../src/lib/catalog";
import { parseActa } from "../src/lib/parser";
import { flatten } from "../src/lib/text";
import { fixtureCatalog } from "./helpers";

const catalog = fixtureCatalog();

const DISTRITAL = `
ELECCIONES REGIONALES Y MUNICIPALES 2026
JURADO ELECTORAL ESPECIAL DE QUISPICANCHI
ACTA DE PROCLAMACIÓN DE RESULTADOS DE CÓMPUTO Y DE AUTORIDADES
MUNICIPALES DISTRITALES ELECTAS
DISTRITO DE CHALLABAMBA, PROVINCIA DE PAUCARTAMBO, DEPARTAMENTO DE
CUSCO
En la ciudad de URCOS, provincia de QUISPICANCHI, departamento de CUSC O, siendo las 10:0 3 horas del 3 de Noviembre
de 2026, se reunió el Jurado Electoral Especial de QUISPICANCHI.
ALCALDE DISTRITAL 12345678 NOMBRE FALSO INSCRITO
8. PROCLAMACIÓN DE ALCALDE Y REGIDORES PARA EL CONCEJO MUNICIPAL DISTRITAL DE CHALLABAMBA
El Jurado Electoral Especial de QUISPICANCHI proclama ganador de las Elecciones Municipales 2026 en el distrito de CHALLABAMBA, a la organización política
ACCIÓN POPULAR, al haber obtenido la más alta votación, y procede a proclamar alcalde y regidores.
ALCALDE DISTRITAL  12345678  CELSO QUISPE CHIPANA ACCIÓN POPULAR
REGIDOR DISTRITAL 1 12345678 LEONOR CABRERA SORIA ACCIÓN POPULAR
`;

const PROVINCIAL = `
ACTA DE PROCLAMACIÓN DE RESULTADOS DE CÓMPUTO Y DE AUTORIDADES
MUNICIPALES PROVINCIALES ELECTAS
PROVINCIA DE SULLANA, DEPARTAMENTO DE PIURA
En la ciudad de SULLANA, siendo las 11:38 horas del 5 de Noviembre de 2026.
8. PROCLAMACIÓN DE ALCALDE Y REGIDORES PARA EL CONCEJO MUNICIPAL PROVINCIAL DE SULLANA
El Jurado proclama ganador de las Elecciones Municipales 2026 en la provincia de SULLANA, a la organización política ALIANZA PARA
EL PROGRESO, al haber obtenido la más alta votación.
ALCALDE PROVINCIAL 12345678 JOSE HILDEBRANDO CRISANTO VILELA ALIANZA PARA EL PROGRESO
REGIDOR PROVINCIAL 1 12345678 WENDY GENESIS RUBIO VEGAS ALIANZA PARA EL PROGRESO
`;

const REGIONAL = `
ACTA DESCENTRALIZADA DE PROCLAMACIÓN DE RESULTADOS DE
CÓMPUTO REGIONAL CORRESPONDIENTE A LAS PROVINCIAS DE
PAUCARTAMBO Y QUISPICANCHI
En la ciudad de URCOS, provincia de QUISPICANCHI, departamento de CUSCO, siendo las 09:0 7 horas del 5 de
Noviembre de 2026.
1 GOBERNADOR REGIONAL 12345678 LUIS ANGEL ARAGON CARREÑO INSCRITO
Siendo las 09:48 horas, se da por concluido el acto de proclamación descentralizada de resultados de cómputo.
`;

test("extrae distrito, provincia y alcalde sin DNI ni el candidato señuelo", () => {
  const parsed = parseActa(DISTRITAL, catalog);
  assert.equal(parsed.clase, "autoridades_distritales");
  assert.equal(parsed.confianza, "alta");
  assert.equal(parsed.ubigeo, "081103");
  assert.equal(parsed.distrito, "CHALLABAMBA");
  assert.equal(parsed.provincia, "PAUCARTAMBO");
  assert.equal(parsed.departamento, "CUSCO");
  assert.equal(parsed.fechaActa, "2026-11-03");
  assert.equal(parsed.autoridad?.nombre, "CELSO QUISPE CHIPANA");
  assert.equal(parsed.autoridad?.organizacion, "ACCIÓN POPULAR");
  assert.equal(parsed.autoridad?.cargo, "Alcalde distrital");
  assert.equal(JSON.stringify(parsed).includes("12345678"), false);
  assert.equal(JSON.stringify(parsed).includes("NOMBRE FALSO"), false);
  assert.equal(JSON.stringify(parsed).includes("LEONOR"), false);
});

test("ignora el pie de autenticidad metido entre la organización y el alcalde", () => {
  const text = `
ACTA DE PROCLAMACIÓN DE RESULTADOS DE CÓMPUTO Y DE AUTORIDADES
MUNICIPALES DISTRITALES ELECTAS
DISTRITO DE CHALLABAMBA, PROVINCIA DE PAUCARTAMBO, DEPARTAMENTO DE CUSCO
En la ciudad de URCOS, siendo las 10:03 horas del 3 de Noviembre de 2026.
8. PROCLAMACIÓN DE ALCALDE Y REGIDORES
proclama ganador, a la organización política
Esta es una copia auténtica imprimible de un documento electrónico archivado por el Jurado Nacional de
Elecciones. Su autenticidad e integridad pueden ser contrastadas leyendo el código QR.
PODEMOS PERÚ, al haber obtenido la más alta votación.
ALCALDE DISTRITAL 12345678 RAFAEL MENDOZA GUILLEN PODEMOS PERÚ
REGIDOR DISTRITAL 1 12345678 OTRA PERSONA PODEMOS PERÚ
`;
  const parsed = parseActa(text, catalog);
  assert.equal(parsed.autoridad?.nombre, "RAFAEL MENDOZA GUILLEN");
  assert.equal(parsed.autoridad?.organizacion, "PODEMOS PERÚ");
  assert.equal(JSON.stringify(parsed).includes("copia auténtica"), false);
  assert.equal(JSON.stringify(parsed).includes("12345678"), false);
});

test("no confunde Paucartambo de Pasco con la provincia de Cusco", () => {
  const parsed = parseActa(DISTRITAL, catalog);
  assert.equal(parsed.provinciaCodigo, "0811");
  assert.notEqual(parsed.ubigeo, "190107");
});

test("extrae alcalde provincial con organización en dos líneas", () => {
  const parsed = parseActa(PROVINCIAL, catalog);
  assert.equal(parsed.clase, "autoridades_provinciales");
  assert.equal(parsed.ambito, "provincial");
  assert.equal(parsed.ubigeo, "200600");
  assert.equal(parsed.lugarId, "provincial:2006");
  assert.equal(parsed.distrito, null);
  assert.equal(parsed.fechaActa, "2026-11-05");
  assert.equal(parsed.autoridad?.nombre, "JOSE HILDEBRANDO CRISANTO VILELA");
  assert.equal(parsed.autoridad?.organizacion, "ALIANZA PARA EL PROGRESO");
  assert.equal(JSON.stringify(parsed).includes("12345678"), false);
  assert.equal(JSON.stringify(parsed).includes("WENDY"), false);
});

test("cruza Raimondi del acta con Raymondi del ubigeo y no traga el resto del encabezado", () => {
  const catalog = buildCatalog([
    { ubigeo: "020301", departamento: "ANCASH", provincia: "ANTONIO RAYMONDI", distrito: "LLAMELLIN", esCapitalProvincial: true },
    { ubigeo: "020302", departamento: "ANCASH", provincia: "ANTONIO RAYMONDI", distrito: "ACZO", esCapitalProvincial: false },
    { ubigeo: "020503", departamento: "ANCASH", provincia: "BOLOGNESI", distrito: "ANTONIO RAYMONDI", esCapitalProvincial: false },
    { ubigeo: "120104", departamento: "JUNIN", provincia: "HUANCAYO", distrito: "CARHUACALLANGA", esCapitalProvincial: false },
    { ubigeo: "120101", departamento: "JUNIN", provincia: "HUANCAYO", distrito: "HUANCAYO", esCapitalProvincial: true },
    { ubigeo: "150101", departamento: "LIMA", provincia: "LIMA", distrito: "LIMA", esCapitalProvincial: true },
    { ubigeo: "150117", departamento: "LIMA", provincia: "LIMA", distrito: "LOS OLIVOS", esCapitalProvincial: false },
  ]);
  const aczo = parseActa(
    `MUNICIPALES DISTRITALES ELECTAS DISTRITO DE ACZO, PROVINCIA DE ANTONIO RAIMONDI, DEPARTAMENTO DE ANCASH En la ciudad de HUARI.`,
    catalog,
  );
  assert.equal(aczo.ubigeo, "020302");
  assert.equal(aczo.provincia, "ANTONIO RAYMONDI");
  const bolognesi = parseActa(
    `MUNICIPALES DISTRITALES ELECTAS DISTRITO DE ANTONIO RAIMONDI, PROVINCIA DE BOLOGNESI, DEPARTAMENTO DE ANCASH En la ciudad.`,
    catalog,
  );
  assert.equal(bolognesi.ubigeo, "020503");
  const junin = parseActa(
    `MUNICIPALES DISTRITALES ELECTAS DISTRITO DE CARHUACALLANGA, PROVINCIA DE HUANCAYO, DEPARTAMENTO DE JUNIÍN En la ciudad.`,
    catalog,
  );
  assert.equal(junin.ubigeo, "120104");
  assert.equal(junin.departamento, "JUNIN");
  const olivos = parseActa(
    `MUNICIPALES DISTRITALES ELECTAS DISTRITO DE Los Olivos, PROVINCIA DE Lima, DEPARTAMENTO DE Lima 1 ACTA DE PROCLAMACIÓN DE AUTORIDADES MUNICIPALES DISTRITALES ELECTAS DISTRITO DE LOS OLIVOS, PROVINCIA DE LIMA, DEPARTAMENTO DE LIMA En la ciudad.`,
    catalog,
  );
  assert.equal(olivos.ubigeo, "150117");
  assert.equal(flatten("JUNIÍN"), "JUNÍN");
});

test("el acta regional descentralizada no proclama gobernador", () => {
  const parsed = parseActa(REGIONAL, catalog);
  assert.equal(parsed.clase, "computo_regional_descentralizado");
  assert.equal(parsed.ambito, "regional_parcial");
  assert.equal(parsed.departamento, "CUSCO");
  assert.equal(parsed.autoridad, null);
  assert.deepEqual(parsed.provinciasParciales, ["PAUCARTAMBO", "QUISPICANCHI"]);
  assert.equal(parsed.fechaActa, "2026-11-05");
  assert.equal(JSON.stringify(parsed).includes("12345678"), false);
  assert.equal(JSON.stringify(parsed).includes("LUIS"), false);
});
