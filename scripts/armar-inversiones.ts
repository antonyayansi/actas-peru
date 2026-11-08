import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { leerRepOpmi } from "../src/lib/inversiones/parse";

const fuentes = [
  {
    archivo: "data/fuentes/repopmi/cotabambas-23407.xlsx",
    opmi: "23407",
    url: "https://ofi5.mef.gob.pe/inviertews/Repseguim/RepOpmi?opmi=23407",
    salida: "data/inversiones/cotabambas.json",
  },
  {
    archivo: "data/fuentes/repopmi/paruro-21572.xlsx",
    opmi: "21572",
    url: "https://ofi5.mef.gob.pe/inviertews/Repseguim/RepOpmi?opmi=21572",
    salida: "data/inversiones/paruro.json",
  },
];

async function main() {
  mkdirSync("data/inversiones", { recursive: true });
  for (const fuente of fuentes) {
    const libro = await leerRepOpmi(readFileSync(fuente.archivo), fuente.archivo, fuente.opmi, fuente.url);
    writeFileSync(fuente.salida, JSON.stringify(libro));
    console.log(fuente.salida, libro.inversiones.length, libro.entidad);
  }
}

main();
