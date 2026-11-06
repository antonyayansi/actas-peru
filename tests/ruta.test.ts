import assert from "node:assert/strict";
import test from "node:test";
import { escritorioComun, estadoPlazo } from "../src/lib/ruta";

test("el escritorio marca lo ya corrido y lo que falta, con el cese el 31 de diciembre", () => {
  const escritorio = escritorioComun("2026-11-06");
  const etts = escritorio.salienteAntes[0];
  const acta = escritorio.salienteDespues.find((paso) => paso.id === "acta");
  const publicar = escritorio.entranteDespues.find((paso) => paso.id === "publicacion");
  assert.equal(escritorio.cese, "2026-12-31");
  assert.equal(etts.fecha, "2026-07-31");
  assert.equal(etts.estado, "corrio");
  assert.equal(acta?.fecha, "2027-01-08");
  assert.equal(acta?.estado, "falta");
  assert.equal(publicar?.fecha, "2027-01-15");
  assert.equal(estadoPlazo("2026-11-06", "2026-11-06"), "hoy");
});
