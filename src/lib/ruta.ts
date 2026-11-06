import { CESE_ERM, plazosErm } from "./plazos";

export type EstadoPlazo = "corrio" | "hoy" | "falta";

export interface PasoEscritorio {
  id: string;
  titulo: string;
  fecha: string | null;
  nota: string;
  estado: EstadoPlazo | "segun-acta";
}

export interface Escritorio {
  cese: string;
  salienteAntes: PasoEscritorio[];
  salienteDespues: PasoEscritorio[];
  entranteAntes: PasoEscritorio[];
  entranteDespues: PasoEscritorio[];
}

export function estadoPlazo(fecha: string, hoy: string): EstadoPlazo {
  if (fecha < hoy) return "corrio";
  if (fecha === hoy) return "hoy";
  return "falta";
}

export function textoEstado(estado: PasoEscritorio["estado"]): string {
  if (estado === "hoy") return "Vence hoy";
  if (estado === "corrio") return "El plazo ya corrió";
  if (estado === "falta") return "Aún falta";
  return "Según el acta";
}

export function escritorioComun(hoy: string): Escritorio {
  const porId = new Map(plazosErm("2026-11-03").map((plazo) => [plazo.id, plazo]));
  const paso = (id: string, nota: string): PasoEscritorio => {
    const plazo = porId.get(id);
    const fecha = plazo?.fecha ?? null;
    return {
      id,
      titulo: plazo?.etapa ?? id,
      fecha,
      nota,
      estado: fecha ? estadoPlazo(fecha, hoy) : "segun-acta",
    };
  };
  const comision: PasoEscritorio = {
    id: "comision",
    titulo: "Instalar la comisión",
    fecha: null,
    nota: "Cinco días hábiles después del ETTE. El día sale del acta de quien entra.",
    estado: "segun-acta",
  };
  return {
    cese: CESE_ERM,
    salienteAntes: [
      paso("etts", "Cinco meses antes del cese."),
      paso("etts-registro", "Al día hábil siguiente de instalarlo."),
      paso("rct-inicial", "Quince días hábiles después del 30 de setiembre. Le toca a quien está a cargo."),
      paso("rct-publicacion", "Cinco días hábiles después de ese envío."),
      comision,
    ],
    salienteDespues: [
      paso("rct-final", "Tres días hábiles después del cese."),
      paso("tg-institucional", "El mismo plazo del informe final."),
      paso("tg-territorial", "Solo si hay empresas, organismos o entidades vinculadas."),
      paso("acta", "Cinco días hábiles después del cese. Firman los dos."),
    ],
    entranteAntes: [
      {
        id: "ette",
        titulo: "Conformar el ETTE",
        fecha: null,
        nota: "Tres días hábiles después de la fecha del acta.",
        estado: "segun-acta",
      },
      {
        ...comision,
        titulo: "Instalar la comisión con el saliente",
        nota: "Cinco días hábiles después de conformar el ETTE.",
      },
    ],
    entranteDespues: [
      paso("acta", "La firman los dos titulares y los dos responsables."),
      paso("publicacion", "Cinco días hábiles después de la firma. Le toca al entrante."),
    ],
  };
}
