import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import JSZip from "jszip";
import { armarPaquete } from "../src/lib/paquete/armar";
import { cifrasDe } from "../src/lib/paquete/cifras";
import { RUTA_COTABAMBAS, RUTA_PARURO } from "../src/lib/paquete/oficinas";
import { archivosDe, PIEZAS_COMPLETAS } from "../src/lib/paquete/pedido";
import type { LibroRepOpmi } from "../src/lib/inversiones/parse";

function libro(ruta: string): LibroRepOpmi {
  return JSON.parse(readFileSync(ruta, "utf8")) as LibroRepOpmi;
}

async function nombres(buffer: Buffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(buffer);
  return Object.keys(zip.files).filter((nombre) => !nombre.endsWith("/"));
}

test("el paquete de Cotabambas no copia la ruta confirmada de Paruro", async () => {
  const cot = libro("data/inversiones/cotabambas.json");
  const buffer = await armarPaquete({ libro: cot, ruta: RUTA_COTABAMBAS });
  const lista = await nombres(buffer);
  assert.ok(lista.some((nombre) => nombre.endsWith("presentacion.pptx")));
  assert.ok(lista.some((nombre) => nombre.endsWith("guia_de_campo.docx")));
  assert.ok(lista.some((nombre) => nombre.endsWith(".svg")));
  assert.equal(lista.some((nombre) => nombre.includes("ATM")), false);
  const pptx = await JSZip.loadAsync(await (await JSZip.loadAsync(buffer)).file(lista.find((nombre) => nombre.endsWith(".pptx"))!)!.async("nodebuffer"));
  const slide = await pptx.file("ppt/slides/slide1.xml")!.async("string");
  assert.match(slide, /COTABAMBAS/);
  assert.match(slide, /Fiorela Aguilar Merma/);
  assert.doesNotMatch(slide, /PARURO/);
  assert.equal(cifrasDe(cot).pim, 146089453);
  assert.equal(cifrasDe(cot, true).pimPropio, 132214684);
});

test("el paquete de Paruro conserva el Área Técnica Municipal como punto provisional", async () => {
  const par = libro("data/inversiones/paruro.json");
  const buffer = await armarPaquete({ libro: par, ruta: RUTA_PARURO });
  const lista = await nombres(buffer);
  assert.equal(RUTA_PARURO.puntos.length, 42);
  assert.ok(RUTA_PARURO.puntos.some((punto) => punto.codigo === "27" && punto.nombre.includes("Área Técnica")));
  assert.ok(lista.some((nombre) => nombre.includes("27_")));
  const guiaZip = await JSZip.loadAsync(await (await JSZip.loadAsync(buffer)).file(lista.find((nombre) => nombre.endsWith("guia_de_campo.docx"))!)!.async("nodebuffer"));
  const guia = await guiaZip.file("word/document.xml")!.async("string");
  assert.match(guia, /PARURO/);
  assert.equal(cifrasDe(par).conCui, 88);
  assert.equal(par.inversiones.some((fila) => fila.celdas.cui === "2569650"), false);
  assert.equal(lista.some((nombre) => nombre.includes("2569650")), false);
  assert.ok(lista.some((nombre) => nombre.endsWith("devengado_mensual.svg")));
  assert.deepEqual(lista.sort(), archivosDe(par.opmi || "entidad", RUTA_PARURO, PIEZAS_COMPLETAS).sort());
  const acta = lista.find((nombre) => nombre.includes("/puntos/"));
  const actaXml = await (await JSZip.loadAsync(await (await JSZip.loadAsync(buffer)).file(acta!)!.async("nodebuffer"))).file("word/document.xml")!.async("string");
  assert.match(actaXml, /cantSplit/);
});

test("una pieza apagada no entra y un punto editado sí cambia el archivo", async () => {
  const cot = libro("data/inversiones/cotabambas.json");
  const ruta = structuredClone(RUTA_COTABAMBAS);
  ruta.puntos[0].nombre = "Mesa de prueba Cotabambas";
  const piezas = { ...PIEZAS_COMPLETAS, presentacion: false, pdf: false };
  const buffer = await armarPaquete({ libro: cot, ruta, piezas });
  const lista = await nombres(buffer);
  assert.equal(lista.some((nombre) => nombre.endsWith(".pptx")), false);
  assert.ok(lista.some((nombre) => nombre.includes("Mesa_de_prueba_Cotabambas")));
  assert.equal(lista.some((nombre) => nombre.includes("Área_Técnica")), false);
});
