import { fechaCorta } from "./text";

/** Feriados nacionales de fecha fija y Semana Santa 2026-2027. No incluye días no laborables compensables ni feriados regionales. */
const FERIADOS = new Set([
  "2026-01-01",
  "2026-04-02",
  "2026-04-03",
  "2026-05-01",
  "2026-06-07",
  "2026-06-29",
  "2026-07-23",
  "2026-07-28",
  "2026-07-29",
  "2026-08-06",
  "2026-08-30",
  "2026-10-08",
  "2026-11-01",
  "2026-12-08",
  "2026-12-09",
  "2026-12-25",
  "2027-01-01",
  "2027-03-25",
  "2027-03-26",
  "2027-05-01",
  "2027-06-07",
  "2027-06-29",
  "2027-07-23",
  "2027-07-28",
  "2027-07-29",
  "2027-08-06",
  "2027-08-30",
  "2027-10-08",
  "2027-11-01",
  "2027-12-08",
  "2027-12-09",
  "2027-12-25",
]);

export const ANIO_ERM = 2026;
export const CESE_ERM = `${ANIO_ERM}-12-31`;
export const CORTE_INICIAL_ERM = `${ANIO_ERM}-09-30`;

export const NORMA_PLAZOS = {
  ficha: "https://www.gob.pe/institucion/contraloria/normas-legales/3468455-016-2022-cg-previ",
  directivaPdf: "https://cdn.www.gob.pe/uploads/document/file/3628784/Directiva%20016-2022-RCT-TG%20.pdf.pdf?v=1730406554",
  modificatoriaPdf: "https://cdn.www.gob.pe/uploads/document/file/10275223/3468455-resolucion-de-contraloria-n-344-2026-cg-modificatorias-de-la-directiva-n-016-2022-cg-previ.PDF?v=1783529591",
  modificatoriaFicha: "https://www.gob.pe/institucion/contraloria/normas-legales/8337223-344-2026-cg",
  glosarioPdf: "https://cdn.www.gob.pe/uploads/document/file/3747142/3468455-1-glosario-de-terminos.pdf?v=1730406554",
  formatos: [
    {
      nombre: "Formato de actas (Word)",
      url: "https://cdn.www.gob.pe/uploads/document/file/3747143/2.%20Formato%20de%20Actas.docx.docx?v=1730406555",
    },
    {
      nombre: "Anexo 7. Formato de actas (Word)",
      url: "https://cdn.www.gob.pe/uploads/document/file/7629910/6469904-anexo-n-7-formato-de-actas-directiva-n-016-2022-cg.docx?v=1739482432",
    },
    {
      nombre: "Anexo 6. Modelo de informe de rendición de cuentas, entidades (Word)",
      url: "https://cdn.www.gob.pe/uploads/document/file/7755722/3583709-modelo-de-informe-rct_entidades_anexo-n-06.docx?v=1779228333",
    },
    {
      nombre: "Anexo 3. Modelo de informe de transferencia, entidades (Word)",
      url: "https://cdn.www.gob.pe/uploads/document/file/7755724/3583709-modelo-de-informe-tg_entidades_anexo-n-03.docx?v=1776965806",
    },
    {
      nombre: "Anexo 2. Modelo de informe territorial o de agrupación (Word)",
      url: "https://cdn.www.gob.pe/uploads/document/file/9858726/3583709-modelo-de-informe-tg_sector_agrupacion_anexo-n-02.docx?v=1776965806",
    },
    {
      nombre: "Sección II. Indicadores de eficacia (Word)",
      url: "https://cdn.www.gob.pe/uploads/document/file/7622272/3583709-12-rct_seccion-ii_indicadores-de-eficacia-y-otros_entidades.docx?v=1776965806",
    },
    {
      nombre: "Sección III. Relación de servicios (Word)",
      url: "https://cdn.www.gob.pe/uploads/document/file/7622273/3583709-13-rct_seccion-iii_relacion-de-servicios_entidades.docx?v=1776965806",
    },
    {
      nombre: "Sección IV. Resultados de servicios (Word)",
      url: "https://cdn.www.gob.pe/uploads/document/file/7622274/3583709-14-rct_seccion-iv_resultados-de-servicios_entidades.docx?v=1776965806",
    },
  ],
  carpetaEntidades: "https://www.gob.pe/institucion/contraloria/informes-publicaciones/3583709-modelo-de-informes-y-anexos-de-la-directiva-n-0016-2022-cg-previ-entidades",
} as const;

export interface Plazo {
  id: string;
  etapa: string;
  fecha: string | null;
  detalle: string;
}

function utc(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function isoFromUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function esHabil(iso: string): boolean {
  const day = utc(iso).getUTCDay();
  if (day === 0 || day === 6) return false;
  return !FERIADOS.has(iso);
}

/** El día hábil número `cantidad` contado desde el día siguiente a `desde`. */
export function sumarHabiles(desde: string, cantidad: number): string {
  let cursor = utc(desde);
  let restantes = cantidad;
  while (restantes > 0) {
    cursor = new Date(cursor.getTime() + 86_400_000);
    const iso = isoFromUtc(cursor);
    if (esHabil(iso)) restantes -= 1;
    if (restantes === 0) return iso;
  }
  return desde;
}

export function restarMeses(iso: string, meses: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 - meses, day));
  return isoFromUtc(date);
}

export function etiquetaPlazo(iso: string | null): string {
  if (!iso) return "Falta la fecha de proclamación";
  return fechaCorta(iso) ?? iso;
}

export function plazosErm(fechaProclamacion: string | null): Plazo[] {
  const etts = restarMeses(CESE_ERM, 5);
  const envioInicial = sumarHabiles(CORTE_INICIAL_ERM, 15);
  const envioCierre = sumarHabiles(CESE_ERM, 3);
  const firmaActa = sumarHabiles(CESE_ERM, 5);
  const ettsRegistro = sumarHabiles(etts, 1);
  const proclamacion = fechaProclamacion && /^\d{4}-\d{2}-\d{2}$/.test(fechaProclamacion) ? fechaProclamacion : null;
  const ette = proclamacion ? sumarHabiles(proclamacion, 3) : null;
  const comision = ette ? sumarHabiles(ette, 5) : null;

  return [
    {
      id: "etts",
      etapa: "Instalar el ETTS",
      fecha: etts,
      detalle: "A más tardar cinco meses antes del cese. Directiva 016-2022, numeral 7.2.3, literal a, no modificado en 2026.",
    },
    {
      id: "etts-registro",
      etapa: "Registrar el ETTS",
      fecha: ettsRegistro,
      detalle: "Un día hábil después de instalarlo, si la instalación es el último día permitido.",
    },
    {
      id: "rct-inicial",
      etapa: "Enviar el informe inicial de rendición",
      fecha: envioInicial,
      detalle: "Corte al 30 de setiembre del año electoral. Quince días hábiles después. Resolución de Contraloría 344-2026-CG, numeral 7.1.3, literal b.",
    },
    {
      id: "rct-publicacion",
      etapa: "Publicar el informe inicial",
      fecha: sumarHabiles(envioInicial, 5),
      detalle: "Cinco días hábiles después del envío, si se envía el último día.",
    },
    {
      id: "ette",
      etapa: "Conformar el ETTE",
      fecha: ette,
      detalle: "Tres días hábiles después de la proclamación. Numeral 7.2.3, literal c.1.",
    },
    {
      id: "comision",
      etapa: "Instalar la comisión",
      fecha: comision,
      detalle: "Cinco días hábiles después de conformar el ETTE, si se conforma el último día.",
    },
    {
      id: "rct-final",
      etapa: "Enviar el informe final de rendición",
      fecha: envioCierre,
      detalle: "Corte al 31 de diciembre. Tres días hábiles después.",
    },
    {
      id: "tg-institucional",
      etapa: "Enviar la transferencia institucional",
      fecha: envioCierre,
      detalle: "Mismo corte y mismo plazo de tres días hábiles. Numeral 7.2.3, literal b.3.",
    },
    {
      id: "tg-territorial",
      etapa: "Enviar la transferencia territorial",
      fecha: envioCierre,
      detalle: "Solo si la entidad tiene empresas, organismos o entidades vinculadas. Tres días hábiles después del 31 de diciembre.",
    },
    {
      id: "acta",
      etapa: "Firmar el acta de transferencia",
      fecha: firmaActa,
      detalle: "Cinco días hábiles después del 31 de diciembre. Numeral 7.2.3, literal d.3.",
    },
    {
      id: "acta-envio",
      etapa: "Enviar el acta a la Contraloría",
      fecha: sumarHabiles(firmaActa, 2),
      detalle: "Dos días hábiles después de la firma, si se firma el último día.",
    },
    {
      id: "publicacion",
      etapa: "Publicar acta, informes y anexos",
      fecha: sumarHabiles(firmaActa, 5),
      detalle: "Cinco días hábiles después de la firma del acta.",
    },
  ];
}
