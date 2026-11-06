import { NextResponse } from "next/server";
import { actasParaCalendario, hoyLima } from "@/lib/calendario";
import { readSnapshot } from "@/indexer/state";

export const dynamic = "force-dynamic";

export function GET() {
  const snapshot = readSnapshot();
  const actas = snapshot ? actasParaCalendario(snapshot.corpus.scopes) : [];
  return NextResponse.json({ listo: Boolean(snapshot), hoy: hoyLima(), actas });
}
