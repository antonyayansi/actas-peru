import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { cuiDe, esLegacy, leerRepOpmi, sumarPresentes } from "../src/lib/inversiones/parse";
import type { Fila, LibroRepOpmi } from "../src/lib/inversiones/parse";

function libro(nombre: string): LibroRepOpmi {
  return JSON.parse(readFileSync(nombre, "utf8")) as LibroRepOpmi;
}

function propias(filas: Fila[], pliego: string): Fila[] {
  return filas.filter((fila) => fila.celdas.pliego_entidad_uei_uf === pliego);
}

test("Cotabambas conserva 414 CUI, el SNIP legado y los montos del pliego", () => {
  const cot = libro("data/inversiones/cotabambas.json");
  assert.equal(cot.inversiones.length, 415);
  assert.equal(cot.inversiones.filter((fila) => cuiDe(fila)).length, 414);
  const legado = cot.inversiones.find(esLegacy);
  assert.equal(legado?.celdas.codigo_snip, 117348);
  assert.equal(sumarPresentes(cot.inversiones, "pim_2026").suma, 146089453);
  assert.equal(sumarPresentes(cot.inversiones, "devengado_2026").suma, 75777679.51);
  const municipal = propias(cot.inversiones, "MUNICIPALIDAD PROVINCIAL DE COTABAMBAS");
  assert.equal(municipal.length, 403);
  assert.equal(cot.inversiones.length - municipal.length, 12);
  assert.equal(sumarPresentes(municipal, "pim_2026").suma, 132214684);
  assert.equal(sumarPresentes(municipal, "devengado_2026").suma, 68123352.91);
  assert.equal(cot.inversiones.filter((fila) => fila.celdas.pia_2026 == null).length, 305);
});

test("el CUI 2569650 no confunde financiero, ejecución y físico", () => {
  const cot = libro("data/inversiones/cotabambas.json");
  const fila = cot.inversiones.find((item) => cuiDe(item) === "2569650");
  assert.ok(fila);
  assert.equal(fila.celdas.avance_financiero_acumulado, 54.82);
  assert.equal(fila.celdas.avance_de_ejecucion_de_la_inversion, 28.25);
  assert.equal(fila.celdas.avance_fisico_de_la_inversion, 26.3);
  assert.equal(fila.celdas.costo_de_inversion_total, 10851831.39);
  assert.equal(fila.celdas.monto_viable, 12807112.78);
  const fisico = cot.avanceFisico.filter((item) => cuiDe(item) === "2569650");
  assert.equal(fisico[0]?.celdas.ultimo_periodo_registrado, 202609);
  assert.equal(fisico[0]?.celdas.real_acumulado, 26.31);
  assert.equal(cot.etDe.filter((item) => cuiDe(item) === "2569650").length, 2);
  assert.equal(cot.contratos.filter((item) => cuiDe(item) === "2569650").length, 8);
  const repetido = cot.contratos.filter((item) => cuiDe(item) === "2569650").map((item) => item.celdas.monto_contratado_total);
  assert.ok(repetido.length > 1);
});

test("Paruro no hereda filas de Cotabambas", () => {
  const par = libro("data/inversiones/paruro.json");
  const cot = libro("data/inversiones/cotabambas.json");
  assert.equal(par.opmi, "21572");
  assert.equal(par.inversiones.length, 88);
  assert.equal(new Set(par.inversiones.map(cuiDe)).size, 88);
  assert.equal(par.inversiones.some((fila) => cuiDe(fila) === "2569650"), false);
  assert.equal(cot.inversiones.some((fila) => cuiDe(fila) === "2569650"), true);
});

test("INFOBRAS cruza 206 CUI y no sustituye el físico de setiembre", () => {
  const cruce = JSON.parse(readFileSync("data/inversiones/infobras-cotabambas.json", "utf8")) as {
    cui: number;
    filas: number;
    obras: { cui: string; codigoInfobras: string; mesAvance: string; fisicoRealTexto: string }[];
  };
  assert.equal(cruce.cui, 206);
  assert.equal(cruce.filas, 214);
  const obra = cruce.obras.find((item) => item.cui === "2569650");
  assert.equal(obra?.codigoInfobras, "505198");
  assert.equal(obra?.mesAvance, "2");
  assert.equal(obra?.fisicoRealTexto, "4 87");
});

test("el directorio OPMI y el SSI no entran como cartera", async () => {
  await assert.rejects(
    () => leerRepOpmi(readFileSync("data/fuentes/no-cartera/directorio-opmi.xlsx"), "directorio.xlsx", null, "https://ejemplo"),
    /directorio o comunicado/,
  );
  await assert.rejects(
    () => leerRepOpmi(readFileSync("data/fuentes/no-cartera/ssi.xlsx"), "ssi.xlsx", null, "https://ejemplo"),
    /PIM 2023/,
  );
});
