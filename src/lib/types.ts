export const PROCESO = "ERM-2026";
export const ZONA = "America/Lima";

export type Ambito = "distrital" | "provincial" | "regional";
export type AmbitoDocumento = Ambito | "regional_parcial";

export type ClaseDocumento =
  | "autoridades_distritales"
  | "autoridades_provinciales"
  | "autoridades_regionales"
  | "computo_regional_descentralizado"
  | "desconocido";

export type EstadoDocumento =
  | "acta_publicada"
  | "programada_sin_acta"
  | "sin_acta_en_fila"
  | "pendiente_extraccion"
  | "pendiente_revision"
  | "error_fuente";

export type ListingStatus = "ok" | "error_con_datos_previos" | "sin_datos" | "parcial";

export interface RawDistrito {
  ubigeo: string | null;
  departamento: string;
  provincia: string;
  distrito: string;
  esCapitalProvincial: boolean;
  suplemento?: boolean;
  nota?: string;
}

export interface Departamento {
  codigo: string;
  nombre: string;
  nombreMostrar: string;
}

export interface Provincia {
  codigo: string;
  departamentoCodigo: string;
  nombre: string;
  nombreMostrar: string;
}

export interface Distrito {
  ubigeo: string | null;
  lugarId: string;
  departamentoCodigo: string;
  provinciaCodigo: string;
  departamento: string;
  provincia: string;
  nombre: string;
  nombreMostrar: string;
  esCapitalProvincial: boolean;
  suplemento: boolean;
  nota: string | null;
}

export interface Catalog {
  departamentos: Departamento[];
  provincias: Provincia[];
  distritos: Distrito[];
  advertencias: string[];
}

export interface ListingRow {
  idProclamacion: number;
  txJEE: string;
  tipoEleccion: string;
  fechaHora: string;
  transmision: string;
  actaProclamacion: string;
}

export interface Autoridad {
  cargo: string;
  nombre: string;
  organizacion: string | null;
}

export interface ParsedActa {
  clase: ClaseDocumento;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  departamentoCodigo: string | null;
  provinciaCodigo: string | null;
  ubigeo: string | null;
  lugarId: string | null;
  ambito: AmbitoDocumento | null;
  provinciasParciales: string[];
  fechaActa: string | null;
  autoridad: Autoridad | null;
  confianza: "alta" | "baja";
}

export interface PdfEntry {
  status: "ok" | "error" | "pending";
  error: string | null;
  parsed: ParsedActa | null;
}

export interface Documento {
  idProclamacion: number;
  jee: string;
  tipoListado: string;
  fechaListado: string | null;
  fechaListadoTexto: string;
  futura: boolean;
  transmisionUrl: string | null;
  pdfPath: string | null;
  pdfUrl: string | null;
  estado: EstadoDocumento;
  clase: ClaseDocumento | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  departamentoCodigo: string | null;
  provinciaCodigo: string | null;
  ubigeo: string | null;
  lugarId: string | null;
  ambito: AmbitoDocumento | null;
  provinciasParciales: string[];
  fechaActa: string | null;
  autoridad: Autoridad | null;
  error: string | null;
  dedupeKey: string | null;
}

export interface FuentePublicacion {
  idProclamacion: number;
  pdfUrl: string | null;
  fechaListado: string | null;
  fechaActa: string | null;
  jee: string;
  transmisionUrl: string | null;
}

export interface AmbitoIndexado {
  key: string;
  lugarId: string;
  ambito: Ambito;
  ubigeo: string | null;
  departamento: string;
  provincia: string | null;
  distrito: string | null;
  departamentoCodigo: string;
  provinciaCodigo: string | null;
  fechaActa: string | null;
  fechaListado: string | null;
  autoridad: Autoridad | null;
  jee: string;
  pdfUrl: string | null;
  transmisionUrl: string | null;
  fuentes: FuentePublicacion[];
}

export interface Corpus {
  generatedAt: string;
  listingSyncedAt: string | null;
  listingStatus: ListingStatus;
  listingError: string | null;
  declaredTotal: number | null;
  partial: boolean;
  challengeStopped: boolean;
  challengeDetail: string | null;
  trabajando: boolean;
  ultimoAvanceEn: string | null;
  intervalMinutes: number;
  pdfConRuta: number;
  pdfOk: number;
  pdfRevision: number;
  pdfError: number;
  pdfSinDescargar: number;
  pdfPendiente: number;
  documents: Documento[];
  scopes: AmbitoIndexado[];
  datosValidos: boolean;
}

export interface Filtro {
  q?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  tipo?: "todos" | Ambito;
  estado?: "todos" | "con_acta" | "sin_acta" | "pendiente";
}

export interface ResumenTipo {
  ambito: Ambito;
  etiqueta: string;
  esperados: number | null;
  conActa: number | null;
  sinPublicacionEncontrada: number | null;
  porcentaje: number | null;
}

export interface Resumen {
  filtroActivo: boolean;
  cierre: boolean;
  motivoSinCierre: string | null;
  catalogoAlineado: boolean;
  datosValidos: boolean;
  tipos: ResumenTipo[];
  documentosSinTerritorio: number;
  actasParcialesRegionales: number;
  textos: string[];
}

export interface Resultado {
  id: string;
  tipoTarjeta: "ambito" | "documento" | "evento";
  ambito: AmbitoDocumento | null;
  estado: string;
  estadoEtiqueta: string;
  titulo: string;
  lugar: string;
  jee: string | null;
  fechaActa: string | null;
  fechaListado: string | null;
  fechaListadoEsFutura: boolean;
  autoridad: Autoridad | null;
  pdfUrl: string | null;
  transmisionUrl: string | null;
  nota: string | null;
  fuentes: FuentePublicacion[];
  esCapitalProvincial: boolean;
}
