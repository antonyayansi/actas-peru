import { mkdirSync, writeFileSync } from "fs";
import { loadCatalog } from "../src/lib/catalog";
import { readSnapshot } from "../src/indexer/state";

const snapshot = readSnapshot();
if (!snapshot) {
  console.error("No hay data/snapshot.json. No se publica un índice vacío.");
  process.exit(1);
}

mkdirSync("public/datos", { recursive: true });
writeFileSync(
  "public/datos/indice.json",
  JSON.stringify({
    corpus: snapshot.corpus,
    catalog: loadCatalog(),
    denominador: snapshot.denominador,
    ubigeo: snapshot.ubigeo,
  }),
);
console.log("public/datos/indice.json listo");
