import type { RutaOficinas } from "./oficinas";

export interface PiezasPaquete {
  presentacion: boolean;
  pdf: boolean;
  guia: boolean;
  actas: boolean;
  flujos: boolean;
  graficos: boolean;
  datos: boolean;
}

export const PIEZAS_COMPLETAS: PiezasPaquete = {
  presentacion: true,
  pdf: true,
  guia: true,
  actas: true,
  flujos: true,
  graficos: true,
  datos: true,
};

export function piezasActivas(piezas: PiezasPaquete): boolean {
  return Object.values(piezas).some(Boolean);
}

export function nombrePunto(codigo: string, nombre: string): string {
  return `${codigo}_${nombre.replace(/[^\p{L}\p{N}]+/gu, "_")}`;
}

export function archivosDe(opmi: string, ruta: RutaOficinas, piezas: PiezasPaquete): string[] {
  const raiz = `${opmi || "entidad"}_paquete`;
  const lista = [`${raiz}/00_LEEME.txt`];
  if (piezas.presentacion) lista.push(`${raiz}/01_PRESENTACION/presentacion.pptx`);
  if (piezas.pdf) lista.push(`${raiz}/01_PRESENTACION/empezar.pdf`);
  if (piezas.guia) {
    lista.push(`${raiz}/02_GUIA/guia_de_campo.docx`);
    lista.push(`${raiz}/02_GUIA/fuentes_y_limites.docx`);
  }
  if (piezas.actas) {
    lista.push(`${raiz}/02_GUIA/anexo_obras_e_inversiones.docx`);
    for (const punto of ruta.puntos) {
      lista.push(`${raiz}/02_GUIA/puntos/${nombrePunto(punto.codigo, punto.nombre)}.docx`);
    }
  }
  if (piezas.flujos) {
    for (const nombre of ["01_pedir_y_contrastar", "02_dinero_y_obra", "03_cierre_del_punto"]) {
      lista.push(`${raiz}/03_FLUJOS/${nombre}.svg`, `${raiz}/03_FLUJOS/${nombre}.mmd`);
    }
  }
  if (piezas.graficos) {
    lista.push(`${raiz}/04_GRAFICOS/devengado_mensual.svg`, `${raiz}/04_GRAFICOS/estados.svg`);
  }
  if (piezas.datos) {
    lista.push(`${raiz}/05_DATOS/cartera.json`, `${raiz}/05_DATOS/fuentes.json`, `${raiz}/05_DATOS/ruta.json`);
  }
  return lista;
}

export function huecos(ruta: RutaOficinas, hayCartera: boolean, hayLogo: boolean): string[] {
  const faltas: string[] = [];
  if (!hayCartera) faltas.push("No hay cartera importada.");
  if (!ruta.fuente.trim() || !ruta.fechaNorma.trim()) faltas.push("Falta la norma del ROF o su fecha. La ruta sigue sin verificar.");
  if (!ruta.modificatoria.trim()) faltas.push("No hay modificatoria anotada. Si no existe, escríbalo; no se asume.");
  const abiertos = ruta.puntos.filter((punto) => punto.verificacion !== "confirmado_por_usuario");
  if (abiertos.length) faltas.push(`${abiertos.length} puntos siguen sin confirmación de vigencia.`);
  if (ruta.confirmacion === "confirmada_por_usuario" && abiertos.length) {
    faltas.push("Marcar la ruta como revisada no confirma cada punto.");
  }
  if (!hayLogo) faltas.push("No hay logo de la entidad. La portada usará solo el crédito de Planitec.");
  faltas.push("Las fuentes públicas no se descargan solas. Revise el estado de cada portal.");
  return faltas;
}
