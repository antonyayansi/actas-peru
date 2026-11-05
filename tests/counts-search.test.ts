import assert from "node:assert/strict";
import test from "node:test";
import { catalogoAlineado, loadCatalog } from "../src/lib/catalog";
import { bloqueaCierre } from "../src/lib/corpus";
import { resumir } from "../src/lib/counts";
import { buscar } from "../src/lib/search";
import type { PdfEntry } from "../src/lib/types";
import { actaChallabamba, corpusDe, fila, fixtureCatalog } from "./helpers";

const now = new Date("2026-11-05T19:00:00-05:00");
const catalog = fixtureCatalog();

function corpusChallabamba(extraPending: boolean) {
  const pdfs: Record<string, PdfEntry> = {
    "proclamaciones/challabamba.pdf": { status: "ok", error: null, parsed: actaChallabamba() },
  };
  const rows = [
    fila({
      idProclamacion: 1009,
      actaProclamacion: "proclamaciones/challabamba.pdf",
      fechaHora: "03/11/2026 10:00:00 AM",
    }),
    fila({
      idProclamacion: 1503,
      txJEE: "JEE QUISPICANCHI",
      tipoEleccion: "REGIONAL",
      fechaHora: "05/11/2026 09:00:00 AM",
      actaProclamacion: extraPending ? "proclamaciones/regional.pdf" : "",
    }),
  ];
  if (!extraPending) {
    rows[1].actaProclamacion = "proclamaciones/regional.pdf";
    pdfs["proclamaciones/regional.pdf"] = {
      status: "ok",
      error: null,
      parsed: {
        clase: "computo_regional_descentralizado",
        departamento: "CUSCO",
        provincia: null,
        distrito: null,
        departamentoCodigo: "08",
        provinciaCodigo: null,
        ubigeo: null,
        lugarId: "regional:08",
        ambito: "regional_parcial",
        provinciasParciales: ["PAUCARTAMBO", "QUISPICANCHI"],
        fechaActa: "2026-11-05",
        autoridad: null,
        confianza: "alta",
      },
    };
  }
  return corpusDe(rows, pdfs, now);
}

test("el padrón INEI más Santa Rosa de Loreto cuadra con 25, 196 y 1 696", () => {
  const full = loadCatalog();
  assert.equal(full.departamentos.length, 25);
  assert.equal(full.provincias.length, 196);
  assert.equal(full.distritos.filter((item) => item.esCapitalProvincial).length, 196);
  assert.equal(full.distritos.filter((item) => !item.esCapitalProvincial).length, 1696);
  const santa = full.distritos.find((item) => item.nombre === "SANTA ROSA DE LORETO");
  assert.ok(santa);
  assert.equal(santa?.ubigeo, null);
  assert.equal(santa?.suplemento, true);
  assert.equal(santa?.provincia, "MARISCAL RAMON CASTILLA");
  assert.equal(catalogoAlineado(full), true);
  assert.equal(full.advertencias.length, 0);
});

test("con PDFs abiertos no hay porcentaje ni faltante definitivo", () => {
  const corpus = corpusChallabamba(true);
  assert.ok(bloqueaCierre(corpus));
  const resumen = resumir(catalog, corpus, { departamento: "08" });
  const distrital = resumen.tipos.find((item) => item.ambito === "distrital");
  assert.equal(distrital?.conActa, 1);
  assert.equal(distrital?.esperados, 2);
  assert.equal(distrital?.porcentaje, null);
  assert.equal(distrital?.sinPublicacionEncontrada, null);
  const regional = resumen.tipos.find((item) => item.ambito === "regional");
  assert.equal(regional?.conActa, 0);
  const texto = resumen.textos.join(" ");
  assert.match(texto, /no se calcula el porcentaje/i);
  assert.doesNotMatch(texto, /faltan por proclamar/i);
  assert.doesNotMatch(texto, /falta proclamar/i);
});

test("al cerrar la lectura, la brecha es sin publicación encontrada y no proclama faltante", () => {
  const corpus = corpusChallabamba(false);
  assert.equal(bloqueaCierre(corpus), null);
  const resumen = resumir(catalog, corpus, { provincia: "0811" });
  const distrital = resumen.tipos.find((item) => item.ambito === "distrital");
  const provincial = resumen.tipos.find((item) => item.ambito === "provincial");
  assert.equal(resumen.cierre, true);
  assert.equal(distrital?.esperados, 1);
  assert.equal(distrital?.conActa, 1);
  assert.equal(distrital?.sinPublicacionEncontrada, 0);
  assert.equal(distrital?.porcentaje, 100);
  assert.equal(provincial?.esperados, 1);
  assert.equal(provincial?.conActa, 0);
  assert.equal(provincial?.sinPublicacionEncontrada, 1);
  assert.equal(resumen.actasParcialesRegionales, 1);
  const regional = resumen.tipos.find((item) => item.ambito === "regional");
  assert.equal(regional?.esperados, 0);
  assert.equal(regional?.conActa, 0);
  const texto = resumen.textos.join(" ");
  assert.match(texto, /sin publicación encontrada/i);
  assert.match(texto, /no afirma que la proclamación no haya ocurrido/i);
  assert.match(texto, /no se cuentan como proclamación del gobernador/i);
  assert.doesNotMatch(texto, /faltan por proclamar/i);
});

test("sin datos válidos el resumen no finge ceros", () => {
  const corpus = corpusDe([], {}, now);
  const vacio = { ...corpus, listingStatus: "sin_datos" as const, datosValidos: false, documents: [], scopes: [] };
  const resumen = resumir(catalog, vacio, {});
  assert.equal(resumen.datosValidos, false);
  assert.equal(resumen.tipos.every((item) => item.conActa === null), true);
  assert.match(resumen.textos.join(" "), /no se muestran ceros/i);
});

test("la búsqueda ignora tildes y no mueve Challabamba a Quispicanchi", () => {
  const corpus = corpusChallabamba(false);
  const porTilde = buscar(catalog, corpus, { q: "Chállabamba" });
  assert.equal(porTilde.resultados.some((item) => item.titulo === "Challabamba"), true);
  const porFiltro = buscar(catalog, corpus, { provincia: "0812" });
  assert.equal(porFiltro.resultados.some((item) => item.titulo === "Challabamba"), false);
  const porJee = buscar(catalog, corpus, { q: "Quispicanchi" });
  const challa = porJee.resultados.find((item) => item.titulo === "Challabamba");
  assert.ok(challa);
  assert.match(challa.lugar, /Paucartambo/);
  assert.doesNotMatch(challa.lugar, /Quispicanchi/);
});

test("Sullana capital no aparece como municipalidad distrital faltante", () => {
  const corpus = corpusDe([], {}, now);
  const cerrado = { ...corpus, documents: [], scopes: [] };
  assert.equal(bloqueaCierre(cerrado), null);
  const busqueda = buscar(catalog, cerrado, { distrito: "200601", estado: "todos" });
  const capital = busqueda.resultados.find((item) => item.titulo === "Sullana" && item.esCapitalProvincial);
  assert.ok(capital);
  assert.match(capital.estadoEtiqueta, /capital/i);
  assert.equal(busqueda.resumen.tipos.find((item) => item.ambito === "distrital")?.esperados, 0);
});

test("el filtro de Cusco recalcula el resumen y no usa el total nacional", () => {
  const corpus = corpusChallabamba(false);
  const resumen = resumir(catalog, corpus, { departamento: "08" });
  const distrital = resumen.tipos.find((item) => item.ambito === "distrital");
  assert.equal(distrital?.esperados, 2);
  assert.notEqual(distrital?.esperados, 1696);
  assert.match(resumen.textos.join(" "), /en este recorte/i);
});
