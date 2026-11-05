import assert from "node:assert/strict";
import test from "node:test";
import { esHabil, NORMA_PLAZOS, plazosErm, sumarHabiles } from "../src/lib/plazos";

test("quince días hábiles desde el 30 de setiembre de 2026 caen el 22 de octubre", () => {
  assert.equal(esHabil("2026-10-08"), false);
  assert.equal(sumarHabiles("2026-09-30", 15), "2026-10-22");
  assert.equal(sumarHabiles("2026-12-31", 3), "2027-01-06");
  assert.equal(sumarHabiles("2026-12-31", 5), "2027-01-08");
});

test("la calculadora ERM separa el equipo entrante según la proclamación", () => {
  const plazos = plazosErm("2026-11-05");
  const porId = Object.fromEntries(plazos.map((plazo) => [plazo.id, plazo.fecha]));
  assert.equal(porId.etts, "2026-07-31");
  assert.equal(porId["rct-inicial"], "2026-10-22");
  assert.equal(porId.ette, "2026-11-10");
  assert.equal(porId.comision, "2026-11-17");
  assert.equal(porId.acta, "2027-01-08");
  assert.equal(porId["acta-envio"], "2027-01-12");
  assert.equal(plazosErm(null).find((plazo) => plazo.id === "ette")?.fecha, null);
});

test("la norma y los anexos apuntan a gob.pe", () => {
  for (const url of [NORMA_PLAZOS.directivaPdf, NORMA_PLAZOS.modificatoriaPdf, ...NORMA_PLAZOS.formatos.map((item) => item.url)]) {
    assert.match(url, /^https:\/\/cdn\.www\.gob\.pe\//);
  }
  assert.match(NORMA_PLAZOS.ficha, /3468455-016-2022-cg-previ/);
});
