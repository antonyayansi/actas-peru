import assert from "node:assert/strict";
import test from "node:test";
import { CESE_REGIONAL_MUNICIPAL, hitosRegionales } from "../src/lib/grafica";

test("el cronograma regional y municipal de 2026 usa el cese del 31 de diciembre", () => {
  const porId = Object.fromEntries(hitosRegionales(CESE_REGIONAL_MUNICIPAL, "2026-11-03").map((hito) => [hito.id, hito.fecha]));
  assert.equal(porId.etts, "2026-07-31");
  assert.equal(porId["etts-registro"], "2026-08-03");
  assert.equal(porId["corte-inicial"], "2026-09-30");
  assert.equal(porId["rct-inicial"], "2026-10-22");
  assert.equal(porId["rct-publicacion"], "2026-10-29");
  assert.equal(porId.ette, "2026-11-06");
  assert.equal(porId.comision, "2026-11-13");
  assert.equal(porId["corte-final"], "2026-12-31");
  assert.equal(porId["rct-final"], "2027-01-06");
  assert.equal(porId["tg-institucional"], "2027-01-06");
  assert.equal(porId["tg-territorial"], "2027-01-06");
  assert.equal(porId.acta, "2027-01-08");
  assert.equal(porId["acta-envio"], "2027-01-12");
  assert.equal(porId.publicacion, "2027-01-15");
  assert.equal(hitosRegionales(CESE_REGIONAL_MUNICIPAL, null).find((hito) => hito.id === "ette")?.fecha, null);
});

test("otro cese mueve el equipo saliente y el cierre, y el corte inicial sigue en setiembre", () => {
  const porId = Object.fromEntries(hitosRegionales("2027-12-31", null).map((hito) => [hito.id, hito.fecha]));
  assert.equal(porId.etts, "2027-07-31");
  assert.equal(porId["corte-inicial"], "2027-09-30");
  assert.equal(porId.acta, "2028-01-07");
});
