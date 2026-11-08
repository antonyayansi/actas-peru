import JSZip from "jszip";
import type { LibroRepOpmi } from "../inversiones/parse";
import { cifrasDe } from "./cifras";
import { actaPunto, fuentesDoc, guia, pdfInicio } from "./documentos";
import { flujos } from "./flujos";
import { PORTALES } from "./fuentes-portal";
import { graficos } from "./graficos";
import { resumenRuta, type RutaOficinas } from "./oficinas";
import { archivosDe, nombrePunto, PIEZAS_COMPLETAS, type PiezasPaquete } from "./pedido";
import { presentar } from "./presentacion";

export interface PedidoPaquete {
  libro: LibroRepOpmi;
  ruta: RutaOficinas;
  piezas?: PiezasPaquete;
  logo?: string | null;
}

export async function armarPaquete(pedido: PedidoPaquete): Promise<Buffer> {
  const piezas = pedido.piezas ?? PIEZAS_COMPLETAS;
  const cifras = cifrasDe(pedido.libro, false);
  const zip = new JSZip();
  const raiz = `${pedido.libro.opmi || "entidad"}_paquete`;
  const carpeta = zip.folder(raiz)!;
  carpeta.file("00_LEEME.txt", leeme(pedido, cifras.registros, cifras.conCui, piezas));
  if (piezas.presentacion) carpeta.file("01_PRESENTACION/presentacion.pptx", await presentar(pedido.libro, pedido.ruta, cifras, pedido.logo));
  if (piezas.pdf) carpeta.file("01_PRESENTACION/empezar.pdf", await pdfInicio(pedido.libro, pedido.ruta, cifras));
  if (piezas.guia) {
    carpeta.file("02_GUIA/guia_de_campo.docx", await guia(pedido.libro, pedido.ruta, cifras));
    carpeta.file("02_GUIA/fuentes_y_limites.docx", await fuentesDoc(pedido.libro));
  }
  if (piezas.actas) {
    carpeta.file("02_GUIA/anexo_obras_e_inversiones.docx", await actaPunto(pedido.libro, {
      codigo: "ANX-OBR",
      nombre: "Obras e inversiones",
      clase: "unidad",
      verificacion: "no_verificado",
      nota: "Anexo de trabajo. No es el anexo oficial 7-A, 7-B, 7-C ni 8.",
    }, cifras));
    for (const punto of pedido.ruta.puntos) {
      carpeta.file(`02_GUIA/puntos/${nombrePunto(punto.codigo, punto.nombre)}.docx`, await actaPunto(pedido.libro, punto, cifras));
    }
  }
  if (piezas.flujos) {
    for (const flujo of flujos(pedido.libro)) {
      carpeta.file(`03_FLUJOS/${flujo.nombre}.svg`, flujo.svg);
      carpeta.file(`03_FLUJOS/${flujo.nombre}.mmd`, flujo.mmd);
    }
  }
  if (piezas.graficos) {
    for (const grafico of graficos(pedido.libro, cifras)) {
      carpeta.file(`04_GRAFICOS/${grafico.nombre}.svg`, grafico.svg);
    }
  }
  if (piezas.datos) {
    carpeta.file("05_DATOS/cartera.json", JSON.stringify({
      entidad: pedido.libro.entidad,
      opmi: pedido.libro.opmi,
      exportadoEn: pedido.libro.exportadoEn,
      fuenteUrl: pedido.libro.fuenteUrl,
      cifras,
      calidad: pedido.libro.calidad,
    }, null, 2));
    carpeta.file("05_DATOS/fuentes.json", JSON.stringify(PORTALES, null, 2));
    carpeta.file("05_DATOS/ruta.json", JSON.stringify(pedido.ruta, null, 2));
  }
  const esperados = new Set(archivosDe(pedido.libro.opmi || "entidad", pedido.ruta, piezas));
  const reales = Object.keys(zip.files).filter((nombre) => !nombre.endsWith("/"));
  if (reales.length !== esperados.size || reales.some((nombre) => !esperados.has(nombre))) {
    throw new Error("El índice del paquete no coincide con los archivos generados.");
  }
  return zip.generateAsync({ type: "nodebuffer" });
}

function leeme(pedido: PedidoPaquete, registros: number, conCui: number, piezas: PiezasPaquete): string {
  return [
    pedido.libro.entidad,
    "CREADO POR: Mg. Fiorela Aguilar Merma",
    "Planitec Perú",
    "",
    "Este paquete lo generó el sistema con la cartera importada y la ruta de puntos indicada.",
    "Es un modelo de trabajo. No es recepción oficial ni conformidad.",
    "No reemplaza los anexos 7-A, 7-B, 7-C ni 8 de la Contraloría.",
    "",
    pedido.libro.exportadoEn || "Sin fecha de exportación.",
    pedido.libro.fuenteUrl,
    `Registros: ${registros}. Códigos únicos: ${conCui}.`,
    resumenRuta(pedido.ruta),
    pedido.ruta.fechaNorma ? `Fecha de la norma anotada: ${pedido.ruta.fechaNorma}` : "Sin fecha de norma.",
    pedido.ruta.modificatoria || "Sin modificatoria anotada.",
    "",
    `Piezas incluidas: ${Object.entries(piezas).filter(([, activa]) => activa).map(([nombre]) => nombre).join(", ") || "ninguna"}.`,
    "No anote contraseñas ni documentos de identidad.",
    "El sistema no descargó solo las fuentes públicas. El estado de cada una está en 05_DATOS/fuentes.json cuando esa pieza está incluida.",
  ].join("\n");
}
