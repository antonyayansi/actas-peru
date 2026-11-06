import assert from "node:assert/strict";
import test from "node:test";
import { actasParaCalendario, conteoPorDia, hoyLima, rejillaMes, type FuenteCalendario } from "../src/lib/calendario";

function fuente(parcial: Partial<FuenteCalendario> & Pick<FuenteCalendario, "key" | "fechaActa" | "ambito">): FuenteCalendario {
  return {
    departamento: "Cusco",
    provincia: "Calca",
    distrito: "Calca",
    autoridad: null,
    pdfUrl: null,
    transmisionUrl: null,
    jee: "JEE Calca",
    ...parcial,
  };
}

test("agrupa por la fecha del acta y deja fuera lo que no es proclamación de un ámbito", () => {
  const actas = actasParaCalendario([
    fuente({ key: "d", fechaActa: "2026-11-06", ambito: "distrital" }),
    fuente({ key: "r", fechaActa: "2026-11-06T18:00:00-05:00", ambito: "regional", distrito: null, provincia: null }),
    fuente({ key: "sin", fechaActa: null, ambito: "provincial" }),
    fuente({ key: "parcial", fechaActa: "2026-11-06", ambito: "regional_parcial" }),
  ]);
  assert.equal(actas.length, 2);
  assert.deepEqual(actas.map((acta) => acta.ambito), ["regional", "distrital"]);
  assert.equal(conteoPorDia(actas).get("2026-11-06"), 2);
  assert.equal(conteoPorDia(actas, "regional").get("2026-11-06"), 1);
  assert.equal(conteoPorDia(actas, "provincial").get("2026-11-06"), undefined);
  assert.equal(conteoPorDia(actas, "distrital").get("2026-11-06"), 1);
});

test("noviembre 2026 empieza en domingo y la grilla abre en lunes", () => {
  const semanas = rejillaMes(2026, 11);
  assert.equal(semanas[0][6], "2026-11-01");
  assert.equal(semanas[0][0], null);
  assert.equal(semanas.at(-1)?.[0], "2026-11-30");
});

test("la fecha de Lima no se corre al día anterior cerca de la medianoche", () => {
  assert.equal(hoyLima(new Date("2026-11-06T04:30:00.000Z")), "2026-11-05");
  assert.equal(hoyLima(new Date("2026-11-06T15:00:00.000Z")), "2026-11-06");
});
