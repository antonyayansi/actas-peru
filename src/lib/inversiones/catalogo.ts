import { readFileSync } from "fs";
import path from "path";
import type { LibroRepOpmi } from "./parse";

export const ENTIDADES = [
  {
    id: "cotabambas",
    opmi: "23407",
    nombre: "Municipalidad Provincial de Cotabambas",
    url: "https://ofi5.mef.gob.pe/inviertews/Repseguim/RepOpmi?opmi=23407",
    archivo: "data/inversiones/cotabambas.json",
  },
  {
    id: "paruro",
    opmi: "21572",
    nombre: "Municipalidad Provincial de Paruro",
    url: "https://ofi5.mef.gob.pe/inviertews/Repseguim/RepOpmi?opmi=21572",
    archivo: "data/inversiones/paruro.json",
  },
] as const;

export type IdEntidad = (typeof ENTIDADES)[number]["id"];

export function cargarEntidad(id: string): LibroRepOpmi {
  const entidad = ENTIDADES.find((item) => item.id === id);
  if (!entidad) throw new Error("Entidad no incluida en el piloto.");
  const file = path.join(process.cwd(), entidad.archivo);
  return JSON.parse(readFileSync(file, "utf8")) as LibroRepOpmi;
}
