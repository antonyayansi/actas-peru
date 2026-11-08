export type ClasePunto = "unidad" | "funcion" | "area" | "oci";
export type EstadoVerificacion = "provisional" | "no_verificado" | "confirmado_por_usuario";

export interface PuntoRevision {
  codigo: string;
  nombre: string;
  clase: ClasePunto;
  verificacion: EstadoVerificacion;
  nota: string;
}

export interface RutaOficinas {
  entidadId: string;
  titulo: string;
  fuente: string;
  fechaNorma: string;
  modificatoria: string;
  confirmacion: "no_confirmada" | "confirmada_por_usuario";
  puntos: PuntoRevision[];
}

const NOTA_PARURO =
  "Punto provisional. Proviene del ROF aprobado por Ordenanza Municipal 05-2024-CM-MPP/C y de la Ordenanza Municipal 001-2025-CM-MPP/C, que incorpora la Unidad de Gestión Municipal y dos áreas. Este sistema no confirma que esa estructura esté consolidada ni vigente en la práctica. No se afirma de quién depende la Unidad de Gestión Municipal.";

function punto(codigo: string, nombre: string, clase: ClasePunto, nota = NOTA_PARURO): PuntoRevision {
  return { codigo, nombre, clase, verificacion: "provisional", nota };
}

export const RUTA_PARURO: RutaOficinas = {
  entidadId: "paruro",
  titulo: "42 puntos provisionales de revisión, no 42 oficinas",
  fuente: "ROF 2024, Ordenanza Municipal 05-2024-CM-MPP/C",
  fechaNorma: "25/03/2024",
  modificatoria: "Ordenanza Municipal 001-2025-CM-MPP/C, 14/01/2025, publicada 15/05/2025. Consolidación e implementación no confirmadas en este sistema.",
  confirmacion: "no_confirmada",
  puntos: [
    punto("01", "Gerencia municipal", "unidad"),
    punto("02", "Secretaría general", "unidad"),
    punto("03", "Relaciones públicas e imagen", "unidad"),
    punto("04", "Mesa de partes", "unidad"),
    punto("05", "Archivo central", "unidad"),
    punto("06", "Registro civil", "unidad"),
    punto("07", "Planeamiento y presupuesto", "unidad"),
    punto("08", "Unidad de planeamiento", "unidad"),
    punto("09", "Unidad formuladora", "unidad"),
    punto("10", "Oficina de Programación Multianual de Inversiones", "unidad"),
    punto("11", "Administración y finanzas", "unidad"),
    punto("12", "Recursos humanos", "unidad"),
    punto("13", "Contabilidad", "unidad"),
    punto("14", "Tesorería", "unidad"),
    punto("15", "Recaudación y fiscalización", "unidad"),
    punto("16", "Abastecimientos", "unidad"),
    punto("16A", "Función de almacén", "funcion", NOTA_PARURO + " Es una función, no una oficina adicional."),
    punto("16B", "Función de control patrimonial", "funcion", NOTA_PARURO + " Es una función, no una oficina adicional."),
    punto("17", "Tecnologías de la información", "unidad"),
    punto("18", "Infraestructura y desarrollo urbano", "unidad"),
    punto("19", "Obras públicas, mantenimiento y equipo", "unidad"),
    punto("20", "Desarrollo urbano, rural y catastro", "unidad"),
    punto("21", "Tránsito y vialidad", "unidad"),
    punto("22", "Supervisión y liquidación", "unidad"),
    punto("23", "Desarrollo económico", "unidad"),
    punto("24", "Promoción agropecuaria y turística", "unidad"),
    punto("25", "Gestión ambiental", "unidad"),
    punto("26", "Residuos sólidos", "unidad"),
    punto("27", "Área Técnica Municipal de agua y saneamiento", "unidad", NOTA_PARURO + " El Área Técnica Municipal se mantiene: no se encontró, en este sistema, una norma que la suprima."),
    punto("28", "Desarrollo humano y servicios", "unidad"),
    punto("29", "Programas sociales", "unidad"),
    punto("30", "Defensoría Municipal del Niño y del Adolescente", "unidad"),
    punto("31", "Oficina Municipal de Atención a las Personas con Discapacidad", "unidad"),
    punto("32", "Mujer, juventudes y poblaciones", "unidad"),
    punto("33", "Servicios municipales", "unidad"),
    punto("34", "Gestión del riesgo de desastres", "unidad"),
    punto("35", "Asesoría jurídica", "unidad"),
    punto("36", "Procuraduría pública", "unidad"),
    punto("37", "Órgano de Control Institucional", "oci"),
    punto("F-UGM", "Unidad de Gestión Municipal", "unidad", NOTA_PARURO),
    punto("F-OM", "Área de operación y mantenimiento", "area", NOTA_PARURO),
    punto("F-COM", "Área comercial", "area", NOTA_PARURO),
  ],
};

const NOTA_COTA =
  "Punto genérico de trabajo. El Reglamento de Organización y Funciones de Cotabambas no está verificado en este sistema. No se copió la estructura de Paruro. Hay que cargar el ROF y sus modificatorias y confirmar cada punto.";

export const RUTA_COTABAMBAS: RutaOficinas = {
  entidadId: "cotabambas",
  titulo: "Ruta genérica no verificada",
  fuente: "No hay ROF de Cotabambas verificado en este sistema.",
  fechaNorma: "",
  modificatoria: "",
  confirmacion: "no_confirmada",
  puntos: [
    { codigo: "G-01", nombre: "Gerencia municipal", clase: "unidad", verificacion: "no_verificado", nota: NOTA_COTA },
    { codigo: "G-02", nombre: "Presupuesto y planeamiento", clase: "unidad", verificacion: "no_verificado", nota: NOTA_COTA },
    { codigo: "G-03", nombre: "Oficina de Programación Multianual de Inversiones", clase: "unidad", verificacion: "no_verificado", nota: NOTA_COTA },
    { codigo: "G-04", nombre: "Unidad formuladora de inversiones", clase: "unidad", verificacion: "no_verificado", nota: NOTA_COTA },
    { codigo: "G-05", nombre: "Unidad ejecutora de inversiones", clase: "unidad", verificacion: "no_verificado", nota: NOTA_COTA },
    { codigo: "G-06", nombre: "Obras e infraestructura", clase: "unidad", verificacion: "no_verificado", nota: NOTA_COTA },
    { codigo: "G-07", nombre: "Contabilidad y tesorería", clase: "unidad", verificacion: "no_verificado", nota: NOTA_COTA },
    { codigo: "G-08", nombre: "Órgano de Control Institucional", clase: "oci", verificacion: "no_verificado", nota: NOTA_COTA },
  ],
};

export function rutaInicial(entidadId: string): RutaOficinas {
  if (entidadId === "paruro") return structuredClone(RUTA_PARURO);
  if (entidadId === "cotabambas") return structuredClone(RUTA_COTABAMBAS);
  return {
    entidadId,
    titulo: "Ruta aún no cargada",
    fuente: "No hay Reglamento de Organización y Funciones verificado para esta entidad.",
    fechaNorma: "",
    modificatoria: "",
    confirmacion: "no_confirmada",
    puntos: [
      { codigo: "N-01", nombre: "Punto por confirmar con el ROF", clase: "unidad", verificacion: "no_verificado", nota: NOTA_COTA },
    ],
  };
}

export function resumenRuta(ruta: RutaOficinas): string {
  const sinConfirmar = ruta.puntos.filter((punto) => punto.verificacion !== "confirmado_por_usuario").length;
  return `${ruta.puntos.length} puntos. ${sinConfirmar} sin confirmación de vigencia. ${ruta.fuente}${ruta.fechaNorma ? `, fecha ${ruta.fechaNorma}` : ", sin fecha de norma"}.`;
}
