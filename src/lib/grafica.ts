import { CESE_ERM, NORMA_PLAZOS, restarMeses, sumarHabiles } from "./plazos";

export const CESE_REGIONAL_MUNICIPAL = CESE_ERM;

export type LugarModelo = "ministerio" | "regional" | "provincial" | "distrital";

export const LUGAR_MODELO: Record<LugarModelo, { nombre: string; en: string; responsable: string; plazoEtts: string }> = {
  ministerio: {
    nombre: "Ministerio",
    en: "del ministerio",
    responsable: "Secretario General",
    plazoEtts: "Como mínimo tres meses antes del último día de gestión. Numeral 7.2.3, literal a, periodo definido.",
  },
  regional: {
    nombre: "Gobierno regional",
    en: "del gobierno regional",
    responsable: "Gerente General Regional",
    plazoEtts: "Como mínimo cinco meses antes del cese, cuando el cese es por elecciones regionales. Numeral 7.2.3, literal a.",
  },
  provincial: {
    nombre: "Municipalidad provincial",
    en: "de la municipalidad provincial",
    responsable: "Gerente Municipal",
    plazoEtts: "Como mínimo cinco meses antes del cese, cuando el cese es por elecciones municipales. Numeral 7.2.3, literal a.",
  },
  distrital: {
    nombre: "Municipalidad distrital",
    en: "de la municipalidad distrital",
    responsable: "Gerente Municipal",
    plazoEtts: "Como mínimo cinco meses antes del cese, cuando el cese es por elecciones municipales. Numeral 7.2.3, literal a.",
  },
};

export interface MarcaNorma {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface CapturaNormaDato {
  pagina: number;
  impresa: number;
  nota: string;
  marcas: MarcaNorma[];
}

export type ClaseModelo = "etts" | "accesos" | "rct" | "tg-institucional" | "tg-territorial" | "ette" | "comision" | "acta" | "envio" | "publicacion" | "corte";

export interface HitoGrafica {
  id: string;
  titulo: string;
  fecha: string | null;
  detalle: string;
  quien: string;
  modelo: ClaseModelo;
  capturas: CapturaNormaDato[];
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function etiquetaMes(clave: string): string {
  const [year, month] = clave.split("-");
  return `${MESES[Number(month) - 1] ?? clave} ${year}`;
}

export function mesesCubiertos(fechas: Array<string | null>): string[] {
  const validas = fechas.filter((fecha): fecha is string => Boolean(fecha)).sort();
  if (!validas.length) return [];
  const [inicio] = validas;
  const fin = validas[validas.length - 1];
  let [year, month] = inicio.split("-").map(Number);
  const [yearFin, monthFin] = fin.split("-").map(Number);
  const claves: string[] = [];
  while (year < yearFin || (year === yearFin && month <= monthFin)) {
    claves.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
  }
  return claves;
}

function isoValida(iso: string | null): iso is string {
  return Boolean(iso && /^\d{4}-\d{2}-\d{2}$/.test(iso));
}

export function hitosRegionales(cese: string | null, proclamacion: string | null): HitoGrafica[] {
  const fin = isoValida(cese) ? cese : null;
  const corte = fin ? `${fin.slice(0, 4)}-09-30` : null;
  const etts = fin ? restarMeses(fin, 5) : null;
  const envioInicial = corte ? sumarHabiles(corte, 15) : null;
  const envioFinal = fin ? sumarHabiles(fin, 3) : null;
  const firma = fin ? sumarHabiles(fin, 5) : null;
  const resultado = isoValida(proclamacion) ? proclamacion : null;
  const ette = resultado ? sumarHabiles(resultado, 3) : null;

  return [
    {
      id: "etts",
      titulo: "Instalar el ETTS",
      fecha: etts,
      detalle: "El titular saliente lo conforma e instala como mínimo cinco meses antes del cese.",
      quien: "Titular saliente",
      modelo: "etts",
      capturas: [{ pagina: 19, impresa: 18, nota: "Numeral 7.2.3, literal a. En elecciones regionales y municipales el ETTS se instala cinco meses antes del cese.", marcas: [{ top: 71.5, left: 30.9, width: 55.5, height: 9.2 }] }],
    },
    {
      id: "etts-registro",
      titulo: "Registrar el ETTS y los accesos",
      fecha: etts ? sumarHabiles(etts, 1) : null,
      detalle: "Al día hábil siguiente de la firma se registran el documento de conformación y el acta. Los accesos se piden en el aplicativo.",
      quien: "Titular saliente y responsable del ETTS",
      modelo: "accesos",
      capturas: [{ pagina: 19, impresa: 18, nota: "El registro del acta de instalación es al día hábil siguiente.", marcas: [{ top: 81, left: 30.5, width: 56, height: 5.2 }] }],
    },
    {
      id: "corte-inicial",
      titulo: "Corte del informe inicial",
      fecha: corte,
      detalle: "En elecciones regionales y municipales el corte del informe inicial es el 30 de setiembre del año electoral.",
      quien: "Titular",
      modelo: "corte",
      capturas: [{ pagina: 13, impresa: 12, nota: "Gobierno regional o local: el informe inicial corta el 30 de setiembre.", marcas: [{ top: 85.4, left: 33.9, width: 52.5, height: 6.3 }] }],
    },
    {
      id: "rct-inicial",
      titulo: "Enviar el informe inicial",
      fecha: envioInicial,
      detalle: "Quince días hábiles después del 30 de setiembre.",
      quien: "Titular",
      modelo: "rct",
      capturas: [{ pagina: 13, impresa: 12, nota: "El informe inicial de gobierno regional o local se envía a los quince días hábiles del 30 de setiembre.", marcas: [{ top: 85.4, left: 33.9, width: 52.5, height: 6.3 }] }],
    },
    {
      id: "rct-publicacion",
      titulo: "Publicar el informe inicial",
      fecha: envioInicial ? sumarHabiles(envioInicial, 5) : null,
      detalle: "Cinco días hábiles después del envío. En el mismo plazo se registra en el aplicativo la constancia.",
      quien: "Titular",
      modelo: "publicacion",
      capturas: [{ pagina: 14, impresa: 13, nota: "La publicación del informe inicial es a los cinco días hábiles del envío.", marcas: [{ top: 45.4, left: 25.5, width: 60.8, height: 6.3 }] }],
    },
    {
      id: "ette",
      titulo: "Conformar el ETTE",
      fecha: ette,
      detalle: "El titular entrante lo conforma a los tres días hábiles de la proclamación.",
      quien: "Titular entrante",
      modelo: "ette",
      capturas: [{ pagina: 21, impresa: 20, nota: "Numeral 7.2.3, literal c.1. El ETTE se conforma a los tres días hábiles de la proclamación.", marcas: [{ top: 32.3, left: 35.1, width: 51.3, height: 3.4 }] }],
    },
    {
      id: "comision",
      titulo: "Instalar la comisión",
      fecha: ette ? sumarHabiles(ette, 5) : null,
      detalle: "Cinco días hábiles después de conformar el ETTE.",
      quien: "Titular saliente y titular entrante",
      modelo: "comision",
      capturas: [{ pagina: 21, impresa: 20, nota: "La comisión se instala a los cinco días hábiles de conformar el ETTE.", marcas: [{ top: 39.2, left: 35.1, width: 51.3, height: 3.4 }] }],
    },
    {
      id: "corte-final",
      titulo: "Corte del informe final",
      fecha: fin,
      detalle: "En elecciones regionales y municipales el corte es el último día de gestión. El cese ordinario es el 31 de diciembre.",
      quien: "Titular",
      modelo: "corte",
      capturas: [{ pagina: 14, impresa: 13, nota: "El informe final de gobierno regional o local corta el 31 de diciembre y se envía a los tres días hábiles.", marcas: [{ top: 11.6, left: 33.9, width: 52.5, height: 6.3 }] }],
    },
    {
      id: "rct-final",
      titulo: "Enviar el informe final",
      fecha: envioFinal,
      detalle: "Tres días hábiles después del cese.",
      quien: "Titular",
      modelo: "rct",
      capturas: [{ pagina: 14, impresa: 13, nota: "Informe final: corte al 31 de diciembre y tres días hábiles.", marcas: [{ top: 11.6, left: 33.9, width: 52.5, height: 6.3 }] }],
    },
    {
      id: "tg-institucional",
      titulo: "Enviar la transferencia institucional",
      fecha: envioFinal,
      detalle: "Mismo corte y tres días hábiles después del cese.",
      quien: "Titular saliente",
      modelo: "tg-institucional",
      capturas: [{ pagina: 20, impresa: 19, nota: "Numeral 7.2.3, literal b.3. La transferencia institucional vence a los tres días hábiles del 31 de diciembre.", marcas: [{ top: 64.6, left: 37.4, width: 48.9, height: 9.2 }] }],
    },
    {
      id: "tg-territorial",
      titulo: "Enviar la transferencia territorial",
      fecha: envioFinal,
      detalle: "Solo si hay empresas, organismos o entidades vinculadas. Tres días hábiles después del cese.",
      quien: "Titular saliente",
      modelo: "tg-territorial",
      capturas: [{ pagina: 20, impresa: 19, nota: "La transferencia territorial, si hay entidades vinculadas, vence el mismo día.", marcas: [{ top: 74.9, left: 37.4, width: 49, height: 15 }] }],
    },
    {
      id: "acta",
      titulo: "Firmar el acta de transferencia",
      fecha: firma,
      detalle: "Cinco días hábiles después del cese.",
      quien: "Titular entrante, titular saliente y los dos responsables",
      modelo: "acta",
      capturas: [{ pagina: 22, impresa: 21, nota: "Numeral 7.2.3, literal d.3. La firma es a los cinco días hábiles del 31 de diciembre.", marcas: [{ top: 16, left: 35.1, width: 51.3, height: 3.4 }] }],
    },
    {
      id: "acta-envio",
      titulo: "Enviar el acta a la Contraloría",
      fecha: firma ? sumarHabiles(firma, 2) : null,
      detalle: "Dos días hábiles después de la firma. En el mismo plazo se archiva en la Oficina General de Administración.",
      quien: "Responsable del ETTE",
      modelo: "envio",
      capturas: [{ pagina: 22, impresa: 21, nota: "El envío a la Contraloría es a los dos días hábiles de la firma.", marcas: [{ top: 19.6, left: 31.5, width: 54.9, height: 5.2 }] }],
    },
    {
      id: "publicacion",
      titulo: "Publicar acta e informes",
      fecha: firma ? sumarHabiles(firma, 5) : null,
      detalle: "Cinco días hábiles después de la firma del acta.",
      quien: "Titular entrante",
      modelo: "publicacion",
      capturas: [{ pagina: 22, impresa: 21, nota: "La publicación es a los cinco días hábiles de la firma del acta.", marcas: [{ top: 32.4, left: 31.5, width: 54.9, height: 8.6 }] }],
    },
  ];
}

export const ENLACES_MODELO = {
  acta: NORMA_PLAZOS.formatos.find((item) => item.nombre.startsWith("Anexo 7"))?.url ?? NORMA_PLAZOS.carpetaEntidades,
  rct: NORMA_PLAZOS.formatos.find((item) => item.nombre.startsWith("Anexo 6"))?.url ?? NORMA_PLAZOS.carpetaEntidades,
  institucional: NORMA_PLAZOS.formatos.find((item) => item.nombre.startsWith("Anexo 3"))?.url ?? NORMA_PLAZOS.carpetaEntidades,
  territorial: NORMA_PLAZOS.formatos.find((item) => item.nombre.startsWith("Anexo 2"))?.url ?? NORMA_PLAZOS.carpetaEntidades,
  carpeta: NORMA_PLAZOS.carpetaEntidades,
  directiva: "/informacion/directiva-016-2022-version-integrada.pdf",
} as const;
