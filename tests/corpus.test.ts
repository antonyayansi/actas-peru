import assert from "node:assert/strict";
import test from "node:test";
import { dedupeAmbitos, integrarListado } from "../src/lib/corpus";
import { actaChallabamba, corpusDe, fila } from "./helpers";

const now = new Date("2026-11-05T19:00:00-05:00");

test("deduplica por ámbito, ubigeo y proceso y conserva la publicación más reciente", () => {
  const corpus = corpusDe(
    [
      fila({ idProclamacion: 10, fechaHora: "03/11/2026 10:00:00 AM", actaProclamacion: "proclamaciones/a.pdf" }),
      fila({ idProclamacion: 11, fechaHora: "04/11/2026 11:00:00 AM", actaProclamacion: "proclamaciones/b.pdf" }),
    ],
    {
      "proclamaciones/a.pdf": { status: "ok", error: null, parsed: actaChallabamba("2026-11-03", "CELSO QUISPE CHIPANA") },
      "proclamaciones/b.pdf": { status: "ok", error: null, parsed: actaChallabamba("2026-11-04", "OTRO NOMBRE ELECTO") },
    },
    now,
  );
  assert.equal(corpus.documents.length, 2);
  assert.equal(corpus.scopes.length, 1);
  const scope = corpus.scopes[0];
  assert.equal(scope.key, "distrital|distrital:081103|ERM-2026");
  assert.equal(scope.fuentes.length, 2);
  assert.equal(scope.autoridad?.nombre, "OTRO NOMBRE ELECTO");
  assert.equal(scope.fechaActa, "2026-11-04");
  assert.deepEqual(
    scope.fuentes.map((item) => item.idProclamacion).sort(),
    [10, 11],
  );
  assert.equal(dedupeAmbitos(corpus.documents).length, 1);
});

test("una fila futura sin PDF no crea un ámbito ni cuenta como acta", () => {
  const corpus = corpusDe(
    [fila({ idProclamacion: 90, fechaHora: "19/11/2026 11:30:00 AM", tipoEleccion: "MUNICIPAL DISTRITAL" })],
    {},
    now,
  );
  assert.equal(corpus.scopes.length, 0);
  assert.equal(corpus.documents[0].estado, "programada_sin_acta");
  assert.equal(corpus.documents[0].futura, true);
});

test("si el listado falla se conserva la última data y no queda en cero", () => {
  const previous = {
    rows: [fila({ idProclamacion: 7, actaProclamacion: "proclamaciones/a.pdf" })],
    syncedAt: "2026-11-05T18:00:00.000Z",
    declaredTotal: 1,
  };
  const failed = integrarListado(previous, { ok: false, error: "tiempo de espera agotado", at: "2026-11-05T20:00:00.000Z" });
  assert.equal(failed.status, "error_con_datos_previos");
  assert.equal(failed.rows.length, 1);
  assert.equal(failed.rows[0].idProclamacion, 7);
  assert.equal(failed.syncedAt, previous.syncedAt);

  const empty = integrarListado(
    { rows: [], syncedAt: null, declaredTotal: null },
    { ok: false, error: "sin conexión", at: "2026-11-05T20:00:00.000Z" },
  );
  assert.equal(empty.status, "sin_datos");
  assert.equal(empty.rows.length, 0);

  const corpus = corpusDe(empty.rows, {}, now);
  const replaced = {
    ...corpus,
    listingStatus: empty.status,
    listingError: empty.error,
    datosValidos: false,
    documents: [],
    scopes: [],
  };
  assert.equal(replaced.datosValidos, false);
  assert.notEqual(replaced.listingStatus, "ok");
});

test("una lectura parcial no borra filas ya guardadas", () => {
  const merged = integrarListado(
    {
      rows: [fila({ idProclamacion: 1 }), fila({ idProclamacion: 2 })],
      syncedAt: "2026-11-05T18:00:00.000Z",
      declaredTotal: 4,
    },
    {
      ok: true,
      complete: false,
      declared: 4,
      at: "2026-11-05T20:00:00.000Z",
      rows: [fila({ idProclamacion: 2, txJEE: "JEE NUEVO" }), fila({ idProclamacion: 3 })],
    },
  );
  assert.equal(merged.status, "parcial");
  assert.equal(merged.rows.length, 3);
  assert.equal(merged.rows.find((row) => row.idProclamacion === 2)?.txJEE, "JEE NUEVO");
});
