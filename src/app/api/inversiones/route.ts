import { NextRequest, NextResponse } from "next/server";
import { cargarEntidad } from "@/lib/inversiones/catalogo";
import { readFileSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("entidad") || "cotabambas";
  try {
    const libro = cargarEntidad(id);
    const infobras = id === "cotabambas"
      ? JSON.parse(readFileSync(path.join(process.cwd(), "data/inversiones/infobras-cotabambas.json"), "utf8"))
      : null;
    return NextResponse.json({ libro, infobras });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo leer la cartera.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
