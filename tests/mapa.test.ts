import assert from "node:assert/strict";
import test from "node:test";
import { loadCatalog } from "../src/lib/catalog";
import { aplicarDepartamento, DEPARTAMENTOS_MAPA } from "../src/lib/mapa";
import { fraseMapa, metricasPorDepartamento } from "../src/lib/mapa-metricas";
import { squash } from "../src/lib/text";
import type { Documento } from "../src/lib/types";
import { actaChallabamba, corpusDe, fila, fixtureCatalog } from "./helpers";

test("el mapa tiene 25 departamentos y separa Lima de Callao", () => {
  assert.equal(DEPARTAMENTOS_MAPA.length, 25);
  const codigos = DEPARTAMENTOS_MAPA.map((item) => item.codigo);
  assert.equal(new Set(codigos).size, 25);
  assert.ok(codigos.includes("15"));
  assert.ok(codigos.includes("07"));
  const lima = DEPARTAMENTOS_MAPA.find((item) => item.codigo === "15");
  const callao = DEPARTAMENTOS_MAPA.find((item) => item.codigo === "07");
  assert.equal(lima?.nombreFuente, "Lima");
  assert.equal(callao?.nombreFuente, "El Callao");
  assert.equal(callao?.partes, 3);
  assert.ok(!DEPARTAMENTOS_MAPA.some((item) => /metropolitana/i.test(item.nombreFuente)));
  assert.notEqual(lima?.d, callao?.d);
});

test("los nombres del mapa coinciden con el catálogo aunque lleven tilde", () => {
  const catalog = loadCatalog();
  for (const dep of DEPARTAMENTOS_MAPA) {
    const oficial = catalog.departamentos.find((item) => item.codigo === dep.codigo);
    assert.ok(oficial, dep.codigo);
    const fuente = dep.nombreFuente.replace(/^El /, "");
    assert.equal(squash(fuente), squash(oficial!.nombre));
  }
  assert.equal(catalog.departamentos.find((item) => item.codigo === "02")?.nombreMostrar, "Áncash");
  assert.equal(catalog.departamentos.find((item) => item.codigo === "12")?.nombreMostrar, "Junín");
});

test("elegir un departamento en el mapa cambia el filtro y limpiar lo borra", () => {
  const elegido = aplicarDepartamento({ q: "alcalde", provincia: "1501", distrito: "150101" }, "15");
  assert.equal(elegido.departamento, "15");
  assert.equal(elegido.provincia, undefined);
  assert.equal(elegido.distrito, undefined);
  assert.equal(elegido.q, "alcalde");
  const callao = aplicarDepartamento(elegido, "07");
  assert.equal(callao.departamento, "07");
  const limpio = aplicarDepartamento(callao, null);
  assert.equal(limpio.departamento, undefined);
  assert.equal(limpio.q, "alcalde");
});

test("las métricas del mapa separan Lima y Callao y no convierten la revisión en ausencia", () => {
  const catalog = loadCatalog();
  const corpus = corpusDe([
    fila({
      idProclamacion: 1,
      txJEE: "JEE LIMA",
      actaProclamacion: "proclamaciones/revision.pdf",
      tipoEleccion: "MUNICIPAL DISTRITAL",
    }),
  ]);
  const revision: Documento = {
    ...corpus.documents[0],
    estado: "pendiente_revision",
    departamentoCodigo: null,
  };
  const abierto = { ...corpus, documents: [revision], scopes: [] };
  const metricas = metricasPorDepartamento(catalog, abierto);
  const lima = metricas.find((item) => item.codigo === "15");
  const callao = metricas.find((item) => item.codigo === "07");
  assert.ok(lima && callao);
  assert.notEqual(lima.distrital.esperadas, callao.distrital.esperadas);
  assert.equal(lima.distrital.ubicadas, 0);
  assert.equal(callao.distrital.ubicadas, 0);
  assert.equal(lima.distrital.porcentaje, null);
  assert.equal(lima.cierre, false);
  assert.match(fraseMapa(lima), /no pinta la ausencia/i);
  assert.doesNotMatch(fraseMapa(lima), /sin proclamar/i);
  assert.equal(metricas.reduce((sum, item) => sum + (item.distrital.esperadas ?? 0), 0), 1696);
  assert.equal(metricas.reduce((sum, item) => sum + (item.provincial.esperadas ?? 0), 0), 196);
  assert.equal(metricas.reduce((sum, item) => sum + (item.regional.esperadas ?? 0), 0), 25);
});

test("un acta de Cusco no se cuenta en otro departamento del mapa", () => {
  const catalog = fixtureCatalog();
  const corpus = corpusDe(
    [fila({ idProclamacion: 9, actaProclamacion: "proclamaciones/c.pdf" })],
    { "proclamaciones/c.pdf": { status: "ok", error: null, parsed: actaChallabamba() } },
  );
  const metricas = metricasPorDepartamento(catalog, corpus);
  const cusco = metricas.find((item) => item.nombre === "Cusco");
  const piura = metricas.find((item) => item.nombre === "Piura");
  assert.equal(cusco?.distrital.ubicadas, 1);
  assert.equal(cusco?.distrital.esperadas, 2);
  assert.equal(piura?.distrital.ubicadas, 0);
  assert.doesNotMatch(fraseMapa(cusco), /sin proclamar/i);
});
