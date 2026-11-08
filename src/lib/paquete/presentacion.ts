import PptxGenJS from "pptxgenjs";
import type { LibroRepOpmi } from "../inversiones/parse";
import { soles, type CifrasPaquete } from "./cifras";
import { pedidoDe } from "./documentos";
import { PORTALES } from "./fuentes-portal";
import type { RutaOficinas } from "./oficinas";

const PETROL = "00628A";
const GOLD = "FFBE00";
const INK = "243038";
const ICE = "E7F4F8";

function pie(slide: PptxGenJS.Slide, libro: LibroRepOpmi) {
  slide.addText("CREADO POR: Mg. Fiorela Aguilar Merma  ·  Planitec Perú  ·  Modelo de trabajo, no es un documento oficial", {
    x: 0.4, y: 7.05, w: 12.4, h: 0.28, fontSize: 10, color: "5C6770",
  });
  slide.addText(libro.exportadoEn || "Sin fecha de exportación", {
    x: 0.4, y: 0.18, w: 8, h: 0.24, fontSize: 11, color: PETROL,
  });
}

export async function presentar(libro: LibroRepOpmi, ruta: RutaOficinas, cifras: CifrasPaquete, logo?: string | null): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "WIDE";
  pptx.author = "Mg. Fiorela Aguilar Merma";
  pptx.title = `Transferencia e inversiones · ${libro.entidad}`;
  pptx.subject = "Modelo de trabajo. No sustituye los anexos oficiales 7-A, 7-B, 7-C ni 8.";

  const portada = pptx.addSlide();
  portada.background = { color: PETROL };
  portada.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.28, h: 7.5, fill: { color: GOLD } });
  portada.addText("PLANITEC PERÚ", { x: 0.7, y: 0.7, w: 10, h: 0.3, fontSize: 14, color: GOLD, fontFace: "Calibri" });
  portada.addText(libro.entidad, { x: 0.7, y: 1.5, w: 11.5, h: 1.4, fontSize: 36, bold: true, color: "FFFFFF", fontFace: "Calibri" });
  portada.addText("Paquete de trabajo para rendición de cuentas y transferencia de gestión", {
    x: 0.7, y: 3.2, w: 11, h: 0.8, fontSize: 20, color: "FFFFFF",
  });
  portada.addText(`Oficina de Programación Multianual de Inversiones ${libro.opmi || "no informada"} · ${ruta.titulo}`, {
    x: 0.7, y: 4.2, w: 11, h: 0.6, fontSize: 16, color: GOLD,
  });
  portada.addText("CREADO POR: Mg. Fiorela Aguilar Merma", { x: 0.7, y: 6.4, w: 9, h: 0.4, fontSize: 18, color: "FFFFFF" });
  if (logo?.startsWith("data:image/")) {
    portada.addImage({ data: logo, x: 11.3, y: 0.45, w: 1.5, h: 1.5 });
  }

  const alcance = pptx.addSlide();
  alcance.background = { color: "FFFFFF" };
  pie(alcance, libro);
  alcance.addText("Qué es este paquete y qué no es", { x: 0.4, y: 0.5, w: 12, h: 0.5, fontSize: 28, bold: true, color: PETROL });
  alcance.addText([
    { text: "Sirve para preparar la visita y dejar constancia de lo pedido, lo visto y lo pendiente.\n", options: { breakLine: false } },
    { text: "No es la recepción oficial. No reemplaza los anexos 7-A, 7-B, 7-C ni 8 de la Contraloría.\n", options: {} },
    { text: "Firmar un modelo registra el alcance y las reservas. No significa conformidad.\n", options: {} },
    { text: "La rendición de cuentas informa el uso de recursos y resultados. La transferencia entrega el estado de la gestión para que continúen los servicios.\n", options: {} },
    { text: "Este archivo no actualiza normas ni plazos. La calculadora de actas queda aparte.", options: {} },
  ], { x: 0.5, y: 1.3, w: 12, h: 4.5, fontSize: 18, color: INK, valign: "top" });

  const cifrasSlide = pptx.addSlide();
  cifrasSlide.background = { color: "FFFFFF" };
  pie(cifrasSlide, libro);
  cifrasSlide.addText("Cartera importada, no el presupuesto completo", { x: 0.4, y: 0.5, w: 12, h: 0.45, fontSize: 26, bold: true, color: PETROL });
  const tarjetas = [
    ["Registros", String(cifras.registros)],
    ["Con código único", String(cifras.conCui)],
    ["De otros pliegos", String(cifras.registrosOtros)],
    ["PIM 2026", `S/ ${soles(cifras.pim)}`],
    ["Devengado 2026", `S/ ${soles(cifras.devengado)}`],
    ["Ítems de contrato", String(cifras.contratos)],
  ];
  tarjetas.forEach((tarjeta, indice) => {
    const x = 0.4 + (indice % 3) * 4.2;
    const y = 1.3 + Math.floor(indice / 3) * 2.2;
    cifrasSlide.addShape(pptx.ShapeType.rect, { x, y, w: 3.9, h: 1.9, fill: { color: ICE } });
    cifrasSlide.addShape(pptx.ShapeType.rect, { x, y, w: 3.9, h: 0.12, fill: { color: GOLD } });
    cifrasSlide.addText(tarjeta[0], { x: x + 0.2, y: y + 0.3, w: 3.5, h: 0.4, fontSize: 14, color: PETROL });
    cifrasSlide.addText(tarjeta[1], { x: x + 0.2, y: y + 0.8, w: 3.5, h: 0.7, fontSize: 22, bold: true, color: PETROL });
  });
  cifrasSlide.addText(`Pliego más frecuente «${cifras.pliegoPropio || "sin dato"}»: PIM S/ ${soles(cifras.pimPropio)} · devengado S/ ${soles(cifras.devengadoPropio)}. El total de arriba incluye otros pliegos.`, {
    x: 0.4, y: 5.85, w: 12.4, h: 0.7, fontSize: 14, color: INK,
  });

  const dinero = pptx.addSlide();
  dinero.background = { color: "FFFFFF" };
  pie(dinero, libro);
  dinero.addText("Dinero del año: devengado por mes", { x: 0.4, y: 0.45, w: 12, h: 0.4, fontSize: 26, bold: true, color: PETROL });
  dinero.addText("Suma solo las celdas con número. Un vacío no se volvió cero. Diciembre en cero es un cero publicado, no un vacío.", {
    x: 0.4, y: 0.95, w: 12, h: 0.4, fontSize: 13, color: INK,
  });
  dinero.addText(`Fuente: ${libro.fuenteUrl}`, { x: 0.4, y: 6.55, w: 12, h: 0.28, fontSize: 11, color: "5C6770" });
  dinero.addChart(pptx.ChartType.bar, [
    { name: "Devengado 2026", labels: cifras.meses.map((mes) => mes.mes), values: cifras.meses.map((mes) => mes.suma) },
  ], {
    x: 0.4, y: 1.35, w: 12.4, h: 4.9, barGrouping: "clustered", showValue: false,
    chartColors: [PETROL], showLegend: false,
    showTitle: false,
    catAxisLabelFontSize: 11,
    valAxisLabelFontSize: 11,
    valAxisLabelFormatCode: "#,##0",
  });

  const fisico = pptx.addSlide();
  fisico.background = { color: "FFFFFF" };
  pie(fisico, libro);
  fisico.addText("El dinero no mide la obra", { x: 0.4, y: 0.5, w: 12, h: 0.45, fontSize: 28, bold: true, color: PETROL });
  fisico.addText("Tres lecturas distintas, que no se promedian ni se suman:", { x: 0.5, y: 1.2, w: 12, h: 0.4, fontSize: 16, color: INK });
  const lecturas = [
    ["Avance financiero acumulado", "Cuánto se devengó respecto del costo. No es el avance de la obra."],
    ["Avance de ejecución declarado", "Otra cifra del reporte. Su fórmula no está en el archivo. No se explica como si fuera financiera."],
    ["Avance físico", "Lo declarado de la obra o la línea de seguimiento, con su propio periodo."],
  ];
  lecturas.forEach((lectura, indice) => {
    const y = 1.8 + indice * 1.5;
    fisico.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 0.18, h: 1.2, fill: { color: indice === 2 ? GOLD : PETROL } });
    fisico.addText(lectura[0], { x: 0.9, y, w: 11, h: 0.4, fontSize: 20, bold: true, color: PETROL });
    fisico.addText(lectura[1], { x: 0.9, y: y + 0.45, w: 11, h: 0.6, fontSize: 16, color: INK });
  });

  const alertas = pptx.addSlide();
  alertas.background = { color: "FFFFFF" };
  pie(alertas, libro);
  alertas.addText("Alertas de calidad de esta cartera", { x: 0.4, y: 0.5, w: 12, h: 0.45, fontSize: 26, bold: true, color: PETROL });
  const legado = cifras.legados.length ? `Hay ${cifras.legados.length} registro sin código único (SNIP ${cifras.legados.join(", ")}).` : "Todos los registros de esta selección tienen código único.";
  alertas.addText([
    { text: `${cifras.registrosOtros} registros pertenecen a otros pliegos. No son ejecución exclusiva de la municipalidad.\n`, options: {} },
    { text: `${legado}\n`, options: {} },
    { text: `Hay ${cifras.etDe} filas de expediente técnico o documento equivalente y ${cifras.avances} filas de avance físico. Son listas, no un solo porcentaje.\n`, options: {} },
    { text: `Hay ${cifras.contratos} ítems de contrato. El monto total puede repetirse en cada ítem: no se suma.\n`, options: {} },
    { text: "Un código sin obra en INFOBRAS no prueba que la obra no exista.", options: {} },
  ], { x: 0.5, y: 1.3, w: 12, h: 5, fontSize: 18, color: INK });

  const fuentes = pptx.addSlide();
  fuentes.background = { color: "FFFFFF" };
  pie(fuentes, libro);
  fuentes.addText("De dónde puede salir el dato", { x: 0.4, y: 0.45, w: 12, h: 0.4, fontSize: 26, bold: true, color: PETROL });
  const filasTabla: PptxGenJS.TableRow[] = [
    [
      { text: "Fuente", options: { fill: { color: PETROL }, color: "FFFFFF", bold: true } },
      { text: "Estado en este piloto", options: { fill: { color: PETROL }, color: "FFFFFF", bold: true } },
    ],
    ...PORTALES.map((portal) => [
      { text: portal.nombre },
      { text: portal.estado.replaceAll("_", " ") },
    ] as PptxGenJS.TableRow),
  ];
  fuentes.addTable(filasTabla, { x: 0.4, y: 1.1, w: 12.4, h: 5.4, fontSize: 13, color: INK, border: [{ pt: 0.5, color: "D5DEE4" }, { pt: 0.5, color: "D5DEE4" }, { pt: 0.5, color: "D5DEE4" }, { pt: 0.5, color: "D5DEE4" }] });

  const oficinas = pptx.addSlide();
  oficinas.background = { color: "FFFFFF" };
  pie(oficinas, libro);
  oficinas.addText(ruta.titulo, { x: 0.4, y: 0.45, w: 12, h: 0.45, fontSize: 24, bold: true, color: PETROL });
  oficinas.addText(`${ruta.fuente} ${ruta.fechaNorma ? `· fecha ${ruta.fechaNorma}` : "· sin fecha"} · ${ruta.modificatoria || "sin modificatoria anotada"}`, {
    x: 0.4, y: 1.0, w: 12, h: 0.55, fontSize: 13, color: INK,
  });
  oficinas.addText(`${ruta.puntos.length} puntos. Cada uno tiene su lámina. Un punto sin confirmar no se presenta como oficina vigente.`, {
    x: 0.4, y: 1.55, w: 12, h: 0.35, fontSize: 14, color: PETROL,
  });
  oficinas.addText(ruta.puntos.map((punto) => `${punto.codigo} ${punto.nombre}`).join("   ·   "), {
    x: 0.4, y: 2.05, w: 12.4, h: 4.6, fontSize: 12, color: INK,
  });

  for (const punto of ruta.puntos) {
    const lamina = pptx.addSlide();
    lamina.background = { color: "FFFFFF" };
    pie(lamina, libro);
    const marca = punto.verificacion === "confirmado_por_usuario" ? "Confirmado por quien usa el sistema" : punto.verificacion === "provisional" ? "Provisional, no confirmado" : "No verificado";
    lamina.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: GOLD } });
    lamina.addText(`${punto.codigo}  ·  ${punto.clase}`, { x: 0.45, y: 0.48, w: 8, h: 0.3, fontSize: 14, color: GOLD, bold: true });
    lamina.addText(punto.nombre, { x: 0.45, y: 0.85, w: 12, h: 0.55, fontSize: 26, bold: true, color: PETROL });
    lamina.addText(marca, { x: 9.2, y: 0.45, w: 3.6, h: 0.35, fontSize: 12, align: "right", color: PETROL });
    lamina.addText(punto.nota, { x: 0.45, y: 1.5, w: 12.3, h: 1.05, fontSize: 13, color: INK });
    lamina.addText(pedidoDe(punto, cifras), { x: 0.45, y: 2.55, w: 12.3, h: 0.45, fontSize: 14, bold: true, color: PETROL });
    const pasos = ["Pedir el listado", "Contrastar con la cartera", "Anotar evidencia", "Dejar pendiente", "Escribir reserva", "Firmar solo el alcance"];
    pasos.forEach((paso, indice) => {
      const columna = indice % 3;
      const fila = Math.floor(indice / 3);
      const x = 0.45 + columna * 4.2;
      const y = 3.15 + fila * 1.35;
      lamina.addShape(pptx.ShapeType.roundRect, { x, y, w: 3.95, h: 1.15, fill: { color: indice % 2 ? ICE : "FFFFFF" }, line: { color: PETROL, pt: 1.25 } });
      lamina.addText(`${indice + 1}. ${paso}`, { x: x + 0.15, y: y + 0.28, w: 3.65, h: 0.6, fontSize: 16, bold: true, color: PETROL });
    });
  }

  const visita = pptx.addSlide();
  visita.background = { color: "FFFFFF" };
  pie(visita, libro);
  visita.addText("Cómo se recorre un punto", { x: 0.4, y: 0.45, w: 12, h: 0.4, fontSize: 26, bold: true, color: PETROL });
  ["Pedir", "Mostrar", "Contrastar", "Anotar evidencia", "Dejar pendiente", "Reservar", "Firmar alcance"].forEach((paso, indice) => {
    const x = 0.4 + indice * 1.82;
    visita.addShape(pptx.ShapeType.chevron, { x, y: 2.4, w: 1.7, h: 1.3, fill: { color: indice % 2 ? GOLD : PETROL } });
    visita.addText(paso, { x, y: 2.7, w: 1.55, h: 0.7, fontSize: 12, bold: true, color: indice % 2 ? PETROL : "FFFFFF", align: "center" });
  });
  visita.addText("No anote contraseñas, claves ni números de documento de identidad.", { x: 0.4, y: 4.3, w: 12, h: 0.4, fontSize: 16, color: INK });

  return Buffer.from(await pptx.write({ outputType: "nodebuffer" }) as ArrayBuffer);
}
