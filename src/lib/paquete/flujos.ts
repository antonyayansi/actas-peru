import type { LibroRepOpmi } from "../inversiones/parse";

function svg(titulo: string, pasos: string[], entidad: string): string {
  const alto = 80 + pasos.length * 70;
  const cajas = pasos.map((paso, indice) => {
    const y = 70 + indice * 70;
    return `<rect x="40" y="${y}" width="640" height="48" rx="4" fill="${indice % 2 ? "#FFBE00" : "#00628A"}"/>
      <text x="60" y="${y + 30}" fill="${indice % 2 ? "#00628A" : "#FFFFFF"}" font-family="Calibri, sans-serif" font-size="16">${indice + 1}. ${paso}</text>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${alto}" viewBox="0 0 720 ${alto}">
  <rect width="720" height="${alto}" fill="#FFFFFF"/>
  <text x="40" y="36" fill="#00628A" font-family="Calibri, sans-serif" font-size="20" font-weight="700">${titulo}</text>
  ${cajas}
  <text x="40" y="${alto - 16}" fill="#5C6770" font-family="Calibri, sans-serif" font-size="12">${entidad} · CREADO POR: Mg. Fiorela Aguilar Merma · Modelo de trabajo</text>
</svg>`;
}

export function flujos(libro: LibroRepOpmi): { nombre: string; svg: string; mmd: string }[] {
  const entidad = libro.entidad;
  const pares: { nombre: string; titulo: string; pasos: string[] }[] = [
    { nombre: "01_pedir_y_contrastar", titulo: "Pedir, mostrar y contrastar", pasos: ["Pedir el listado del punto", "Mirar el sistema o el documento", "Contrastar una muestra con la cartera importada", "Anotar lo que no se exhibió", "Dejar pendiente y reserva"] },
    { nombre: "02_dinero_y_obra", titulo: "Dinero y obra por separado", pasos: ["Leer el devengado del año", "Leer el avance físico del periodo", "No usar uno para explicar el otro", "Revisar expediente técnico o documento equivalente", "Revisar ítems de contrato sin sumar montos repetidos"] },
    { nombre: "03_cierre_del_punto", titulo: "Cierre del punto", pasos: ["Completar evidencia", "Escribir pendiente", "Escribir reserva", "Firmar solo el alcance visto", "No anotar secretos"] },
  ];
  return pares.map(({ nombre, titulo, pasos }) => ({
    nombre,
    svg: svg(`${titulo} · ${entidad}`, pasos, entidad),
    mmd: `flowchart TD\n${pasos.map((paso, indice) => `  P${indice}["${paso.replace(/"/g, "'")}"]`).join("\n")}\n${pasos.slice(1).map((_, indice) => `  P${indice} --> P${indice + 1}`).join("\n")}\n`,
  }));
}
