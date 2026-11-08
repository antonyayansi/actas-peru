import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import PDFDocument from "pdfkit";
// pdfkit no trae tipos en esta instalación.
import type { LibroRepOpmi } from "../inversiones/parse";
import { soles, type CifrasPaquete } from "./cifras";
import { PORTALES } from "./fuentes-portal";
import type { PuntoRevision, RutaOficinas } from "./oficinas";

const AUTOR = "CREADO POR: Mg. Fiorela Aguilar Merma";

function p(texto: string, bold = false): Paragraph {
  return new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: texto, bold, font: "Calibri", size: 22 })] });
}

function titulo(texto: string, nivel: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1): Paragraph {
  return new Paragraph({ heading: nivel, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: texto, bold: true, font: "Calibri", color: "00628A" })] });
}

function firma(): Table {
  const celda = (cargo: string) => new TableCell({
    width: { size: 33, type: WidthType.PERCENTAGE },
    margins: { top: 80, bottom: 80, left: 80, right: 80 },
    children: [
      p(cargo, true),
      p("Nombre: ____________________"),
      p("Fecha: ____________________"),
      p("Firma: ____________________"),
      p("La firma registra el alcance de esta reunión. No es conformidad ni recepción oficial."),
    ],
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ cantSplit: true, children: [celda("Titular saliente"), celda("Titular entrante"), celda("Responsable del punto")] })],
  });
}

async function aDocx(children: Paragraph[] | (Paragraph | Table)[]): Promise<Buffer> {
  const doc = new Document({
    creator: "Mg. Fiorela Aguilar Merma",
    description: "Modelo de trabajo. No sustituye los anexos oficiales 7-A, 7-B, 7-C ni 8.",
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}

export function guia(libro: LibroRepOpmi, ruta: RutaOficinas, cifras: CifrasPaquete): Promise<Buffer> {
  const bloques: (Paragraph | Table)[] = [
    titulo(`${libro.entidad}`),
    p(AUTOR, true),
    p("Modelo de trabajo para preparar la transferencia. No es una auditoría ni un cargo oficial."),
    titulo("Rendición y transferencia", HeadingLevel.HEADING_2),
    p("La rendición de cuentas informa decisiones, recursos y resultados del periodo. La transferencia deja el estado de la gestión para que los servicios continúen. Este texto no cambia los plazos de la calculadora de actas."),
    titulo("Cartera importada", HeadingLevel.HEADING_2),
    p(`${libro.exportadoEn || "Sin fecha de exportación"}. Fuente: ${libro.fuenteUrl}`),
    p(`Registros en el archivo: ${cifras.registros}. Con código único de inversiones: ${cifras.conCui}. De otros pliegos: ${cifras.registrosOtros}.`),
    p(`Presupuesto institucional modificado 2026: S/ ${soles(cifras.pim)}. Devengado 2026: S/ ${soles(cifras.devengado)}. El devengado no es avance físico ni caja ni deuda.`),
    p(cifras.legados.length ? `Sin código único: SNIP ${cifras.legados.join(", ")}.` : "No hay registro legado sin código único en esta selección."),
    titulo("Ruta de puntos", HeadingLevel.HEADING_2),
    p(`${ruta.fuente} ${ruta.fechaNorma ? `Fecha anotada: ${ruta.fechaNorma}.` : "Sin fecha de norma."} ${ruta.modificatoria || "Sin modificatoria anotada."}`),
    ...ruta.puntos.map((punto) => p(`${punto.codigo}. ${punto.nombre} (${punto.clase}). ${punto.verificacion === "confirmado_por_usuario" ? "Marcado como confirmado por quien usa el sistema." : "Sin confirmación de vigencia."} ${punto.nota}`)),
    titulo("Qué no hace este paquete", HeadingLevel.HEADING_2),
    p("No reemplaza los anexos oficiales 7-A, 7-B, 7-C ni 8. No declara la transferencia completa. No incluye contraseñas ni documentos de identidad."),
  ];
  return aDocx(bloques);
}

export function pedidoDe(punto: PuntoRevision, cifras: CifrasPaquete): string {
  const deInversiones = /invers|obra|formulad|ejecutor/i.test(punto.nombre);
  if (punto.clase === "oci") return "Pida el estado de recomendaciones de control, sin copiar claves ni expedientes reservados.";
  if (deInversiones) return `En esta cartera hay ${cifras.conCui} códigos únicos y ${cifras.contratos} ítems de contrato. Pida el expediente y el avance físico del periodo, y no los reemplace por el devengado.`;
  return "Pida el listado que esa unidad usa, contraste una muestra y deje constancia de lo que no se exhibió.";
}

export function actaPunto(libro: LibroRepOpmi, punto: PuntoRevision, cifras: CifrasPaquete): Promise<Buffer> {
  const pedido = pedidoDe(punto, cifras);
  return aDocx([
    titulo(`Lista de verificación ${punto.codigo}`),
    p(punto.nombre, true),
    p(AUTOR, true),
    p(`${libro.entidad}. ${punto.nota}`),
    p(pedido),
    p("Evidencia vista: ☐ listado ☐ sistema ☐ documento físico ☐ no se exhibió"),
    p("Pendiente: ________________________________"),
    p("Reserva: ________________________________"),
    p("Responsable del dato y fecha: ________________________________"),
    firma(),
  ]);
}

export function fuentesDoc(libro: LibroRepOpmi): Promise<Buffer> {
  return aDocx([
    titulo("Fuentes y límites"),
    p(AUTOR, true),
    p(`Entidad de trabajo: ${libro.entidad}. ${libro.exportadoEn || "Sin fecha de exportación"}.`),
    p("El sistema no descargó solo estas fuentes. Muestra lo importado y lo pendiente."),
    ...PORTALES.flatMap((portal) => [p(`${portal.nombre}: ${portal.estado.replaceAll("_", " ")}`, true), p(`${portal.detalle} ${portal.url}`)]),
    p("Los anexos 7-A, 7-B, 7-C y 8 de la Contraloría no están reemplazados por estos modelos."),
  ]);
}

export function pdfInicio(libro: LibroRepOpmi, ruta: RutaOficinas, cifras: CifrasPaquete): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const trozos: Buffer[] = [];
    doc.on("data", (trozo) => trozos.push(trozo as Buffer));
    doc.on("end", () => resolve(Buffer.concat(trozos)));
    doc.on("error", reject);
    doc.fillColor("#00628A").fontSize(20).text(libro.entidad);
    doc.moveDown(0.4);
    doc.fillColor("#243038").fontSize(12).text(AUTOR);
    doc.moveDown();
    doc.fontSize(11).text("Modelo de trabajo. No es recepción oficial ni reemplaza los anexos 7-A, 7-B, 7-C y 8.");
    doc.moveDown();
    doc.text(`Oficina de Programación Multianual de Inversiones: ${libro.opmi || "no informada"}.`);
    doc.text(libro.exportadoEn || "Sin fecha de exportación.");
    doc.text(`Registros: ${cifras.registros}. Con código único: ${cifras.conCui}. Otros pliegos: ${cifras.registrosOtros}.`);
    doc.text(`Presupuesto institucional modificado 2026: S/ ${soles(cifras.pim)}.`);
    doc.text(`Devengado 2026: S/ ${soles(cifras.devengado)}. No es avance físico.`);
    doc.moveDown();
    doc.fillColor("#00628A").text(ruta.titulo);
    doc.fillColor("#243038").text(ruta.fuente);
    doc.moveDown();
    doc.text("La firma de un modelo deja constancia del alcance y de las reservas. No es conformidad.");
    doc.end();
  });
}
