import type { LibroRepOpmi } from "../inversiones/parse";
import { soles, type CifrasPaquete } from "./cifras";

function escapar(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function graficos(libro: LibroRepOpmi, cifras: CifrasPaquete): { nombre: string; svg: string }[] {
  const maximo = Math.max(...cifras.meses.map((mes) => mes.suma), 1);
  const barras = cifras.meses.map((mes, indice) => {
    const alto = Math.round((mes.suma / maximo) * 280);
    const x = 70 + indice * 78;
    const y = 360 - alto;
    return `<rect x="${x}" y="${y}" width="52" height="${alto}" fill="#00628A"/>
      <text x="${x + 26}" y="378" text-anchor="middle" fill="#243038" font-size="11" font-family="Calibri, sans-serif">${escapar(mes.mes.slice(0, 3))}</text>
      <text x="${x + 26}" y="${y - 6}" text-anchor="middle" fill="#00628A" font-size="9" font-family="Calibri, sans-serif">${mes.presentes ? escapar(soles(mes.suma)) : "s/d"}</text>`;
  }).join("\n");
  const dinero = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="460" viewBox="0 0 1100 460">
  <rect width="1100" height="460" fill="#FFFFFF"/>
  <rect x="0" y="0" width="1100" height="8" fill="#FFBE00"/>
  <text x="36" y="42" fill="#00628A" font-size="22" font-family="Calibri, sans-serif" font-weight="700">Devengado 2026 por mes · ${escapar(libro.entidad)}</text>
  <text x="36" y="68" fill="#243038" font-size="13" font-family="Calibri, sans-serif">Suma solo celdas con número. Un vacío no es cero. No es avance físico.</text>
  ${barras}
  <text x="36" y="420" fill="#5C6770" font-size="12" font-family="Calibri, sans-serif">${escapar(libro.exportadoEn || "Sin fecha de exportación")} · ${escapar(libro.fuenteUrl)}</text>
  <text x="36" y="442" fill="#5C6770" font-size="12" font-family="Calibri, sans-serif">CREADO POR: Mg. Fiorela Aguilar Merma · Planitec Perú · Modelo de trabajo</text>
</svg>`;

  const maxEstado = Math.max(...cifras.estados.map((estado) => estado.cantidad), 1);
  const filas = cifras.estados.slice(0, 8).map((estado, indice) => {
    const y = 90 + indice * 36;
    const ancho = Math.round((estado.cantidad / maxEstado) * 620);
    return `<text x="36" y="${y + 16}" fill="#243038" font-size="13" font-family="Calibri, sans-serif">${escapar(estado.nombre)}</text>
      <rect x="280" y="${y}" width="${ancho}" height="22" fill="${indice % 2 ? "#FFBE00" : "#00628A"}"/>
      <text x="${290 + ancho}" y="${y + 16}" fill="#243038" font-size="13" font-family="Calibri, sans-serif">${estado.cantidad}</text>`;
  }).join("\n");
  const estados = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="${140 + cifras.estados.slice(0, 8).length * 36}" viewBox="0 0 1100 ${140 + cifras.estados.slice(0, 8).length * 36}">
  <rect width="1100" height="100%" fill="#FFFFFF"/>
  <rect x="0" y="0" width="1100" height="8" fill="#FFBE00"/>
  <text x="36" y="42" fill="#00628A" font-size="22" font-family="Calibri, sans-serif" font-weight="700">Estado en el Banco de Inversiones · ${escapar(libro.entidad)}</text>
  <text x="36" y="68" fill="#243038" font-size="13" font-family="Calibri, sans-serif">No es el estado físico de la obra. ${cifras.registros} registros del archivo, no solo el pliego propio.</text>
  ${filas}
  <text x="36" y="${120 + cifras.estados.slice(0, 8).length * 36}" fill="#5C6770" font-size="12" font-family="Calibri, sans-serif">CREADO POR: Mg. Fiorela Aguilar Merma · ${escapar(libro.fuenteUrl)}</text>
</svg>`;
  return [
    { nombre: "devengado_mensual", svg: dinero },
    { nombre: "estados", svg: estados },
  ];
}
