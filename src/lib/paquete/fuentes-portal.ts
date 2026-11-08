export interface FuentePortal {
  id: string;
  nombre: string;
  url: string;
  estado: "importado" | "archivo_de_contraste" | "pendiente_descarga" | "no_en_esta_version";
  detalle: string;
}

export const PORTALES: FuentePortal[] = [
  {
    id: "repopmi",
    nombre: "Reporte de seguimiento OPMI",
    url: "https://ofi5.mef.gob.pe/inviertews/Repseguim/RepOpmi",
    estado: "importado",
    detalle: "Cartera de cuatro hojas usada en este piloto. La descarga es del 8 de noviembre de 2026 y no es el corte de hoy.",
  },
  {
    id: "ssi",
    nombre: "Sistema de seguimiento de inversiones",
    url: "https://ofi5.mef.gob.pe/ssi/ssi/Index",
    estado: "archivo_de_contraste",
    detalle: "Se revisó un export geográfico. Sus títulos dicen PIM 2023 y devengado 2023, pero en los códigos comunes los valores coinciden con 2026. No se renombra y no se carga como cartera.",
  },
  {
    id: "avanzada",
    nombre: "Consulta avanzada",
    url: "https://ofi5.mef.gob.pe/inviertePub/ConsultaPublica/ConsultaAvanzada",
    estado: "pendiente_descarga",
    detalle: "El export revisado repite filas por lugar. No se importa aquí para no duplicar montos.",
  },
  {
    id: "pmi",
    nombre: "Consulta del Programa Multianual de Inversiones",
    url: "https://ofi5.mef.gob.pe/invierte/pmi/consultapmi",
    estado: "archivo_de_contraste",
    detalle: "La programación multianual no es ejecución. En este piloto no se carga como cartera.",
  },
  {
    id: "consulta-inversiones",
    nombre: "Consulta de inversiones",
    url: "https://ofi5.mef.gob.pe/invierte/consultapublica/consultainversiones",
    estado: "pendiente_descarga",
    detalle: "Página pública enlazada. Este piloto no descargó ni integró ese listado.",
  },
  {
    id: "geoinvierte",
    nombre: "GeoInvierte",
    url: "https://ofi5.mef.gob.pe/geoinvierteportal/index.html",
    estado: "no_en_esta_version",
    detalle: "El mapa público se puede mirar. La descarga pidió una cuenta de ArcGIS y no se hizo. No hay marcadores.",
  },
  {
    id: "infobras",
    nombre: "INFOBRAS",
    url: "https://infobras.contraloria.gob.pe/infobrasweb",
    estado: "archivo_de_contraste",
    detalle: "No es la cartera. En esta versión el cruce solo aparece si ya se importó para la entidad elegida. Si un código no aparece, no significa que la obra no exista.",
  },
];
