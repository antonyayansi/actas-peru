import { NextRequest, NextResponse } from "next/server";
import { ErrorImportacion, leerRepOpmi } from "@/lib/inversiones/parse";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const archivo = form.get("archivo");
  const opmi = String(form.get("opmi") || "").trim();
  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo Excel del RepOpmi." }, { status: 400 });
  }
  if (!/^\d{4,6}$/.test(opmi)) {
    return NextResponse.json({ error: "Indique el código OPMI de la URL de descarga, de 4 a 6 dígitos. No se inventa." }, { status: 400 });
  }
  if (archivo.size > 12_000_000) {
    return NextResponse.json({ error: "El archivo supera 12 MB." }, { status: 400 });
  }
  try {
    const buffer = Buffer.from(await archivo.arrayBuffer());
    const libro = await leerRepOpmi(
      buffer,
      archivo.name,
      opmi,
      `https://ofi5.mef.gob.pe/inviertews/Repseguim/RepOpmi?opmi=${opmi}`,
    );
    return NextResponse.json({ libro, infobras: null });
  } catch (error) {
    const message = error instanceof ErrorImportacion || error instanceof Error
      ? error.message
      : "No se pudo leer el Excel.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
