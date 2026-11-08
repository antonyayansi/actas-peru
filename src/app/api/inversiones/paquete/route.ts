import { NextRequest, NextResponse } from "next/server";
import { armarPaquete } from "@/lib/paquete/armar";
import { cargarEntidad } from "@/lib/inversiones/catalogo";
import type { LibroRepOpmi } from "@/lib/inversiones/parse";
import type { RutaOficinas } from "@/lib/paquete/oficinas";
import { piezasActivas, type PiezasPaquete } from "@/lib/paquete/pedido";
import JSZip from "jszip";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const cuerpo = await request.json() as {
    entidad?: string | null;
    libro?: LibroRepOpmi;
    ruta?: RutaOficinas;
    piezas?: PiezasPaquete;
    logo?: string | null;
    solo?: string | null;
  };
  const libro = cuerpo.libro ?? (cuerpo.entidad ? cargarEntidad(cuerpo.entidad) : null);
  if (!libro || !cuerpo.ruta?.puntos?.length) {
    return NextResponse.json({ error: "Falta la cartera o la ruta de puntos." }, { status: 400 });
  }
  if (cuerpo.piezas && !piezasActivas(cuerpo.piezas)) {
    return NextResponse.json({ error: "Elija al menos una pieza del paquete." }, { status: 400 });
  }
  const logo = typeof cuerpo.logo === "string" && cuerpo.logo.startsWith("data:image/") && cuerpo.logo.length < 1_500_000
    ? cuerpo.logo
    : null;
  const zip = await armarPaquete({ libro, ruta: cuerpo.ruta, piezas: cuerpo.piezas, logo });
  if (cuerpo.solo) {
    const archivo = (await JSZip.loadAsync(zip)).file(cuerpo.solo);
    if (!archivo) return NextResponse.json({ error: "Esa pieza no está en el paquete." }, { status: 404 });
    const bytes = await archivo.async("uint8array");
    const nombre = cuerpo.solo.split("/").pop() || "archivo";
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${nombre}"`,
      },
    });
  }
  const nombre = `paquete-${libro.opmi || "entidad"}.zip`;
  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${nombre}"`,
    },
  });
}
