"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  actasParaCalendario,
  conteoPorDia,
  hoyLima,
  rejillaMes,
  type ActaCalendario,
  type FuenteCalendario,
} from "@/lib/calendario";
import { miles } from "@/lib/text";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const CABECERA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const ETIQUETA = { regional: "Regional", provincial: "Provincial", distrital: "Distrital" } as const;

function partir(iso: string): { anio: number; mes: number; dia: number; semana: string } {
  const [anio, mes, dia] = iso.split("-").map(Number);
  const semana = SEMANA[new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()];
  return { anio, mes, dia, semana };
}

function etiquetaDia(iso: string): string {
  const { dia, mes, anio, semana } = partir(iso);
  const nombre = `${semana} ${dia} de ${MESES[mes - 1].toLowerCase()} de ${anio}`;
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

function adjetivoAmbito(tipo: "todos" | keyof typeof ETIQUETA, cantidad: number): string {
  if (tipo === "todos") return "";
  const plural = cantidad !== 1;
  if (tipo === "regional") return plural ? " regionales" : " regional";
  if (tipo === "provincial") return plural ? " provinciales" : " provincial";
  return plural ? " distritales" : " distrital";
}

function fraseCuenta(cantidad: number, tipo: "todos" | keyof typeof ETIQUETA): string {
  return `${miles(cantidad)} ${cantidad === 1 ? "acta" : "actas"}${adjetivoAmbito(tipo, cantidad)}`;
}

export function CalendarioActas({ scopes }: { scopes?: FuenteCalendario[] | null }) {
  const [actas, setActas] = useState<ActaCalendario[] | null>(scopes ? actasParaCalendario(scopes) : null);
  const [error, setError] = useState<string | null>(null);
  const hoy = hoyLima();
  const [mes, setMes] = useState(() => partir(hoy));
  const [dia, setDia] = useState(hoy);
  const [tipo, setTipo] = useState<"todos" | ActaCalendario["ambito"]>("todos");

  useEffect(() => {
    if (scopes) {
      setActas(actasParaCalendario(scopes));
      return;
    }
    if (scopes === null) return;
    const controller = new AbortController();
    fetch("/api/calendario", { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: { actas?: ActaCalendario[]; listo?: boolean }) => {
        if (payload.listo === false) {
          setError("El índice todavía no tiene una copia para armar el calendario.");
          setActas([]);
          return;
        }
        setActas(payload.actas ?? []);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError("No se pudo armar el calendario.");
      });
    return () => controller.abort();
  }, [scopes]);

  const conteo = useMemo(() => conteoPorDia(actas ?? []), [actas]);
  const conteoVisible = useMemo(
    () => conteoPorDia(actas ?? [], tipo === "todos" ? undefined : tipo),
    [actas, tipo],
  );
  const semanas = rejillaMes(mes.anio, mes.mes);
  const delDia = (actas ?? []).filter((acta) => acta.fecha === dia && (tipo === "todos" || acta.ambito === tipo));
  const totalDia = conteoVisible.get(dia) ?? 0;
  const totalHoy = conteoVisible.get(hoy) ?? 0;
  const mesesConDatos = useMemo(() => {
    const claves = [...conteo.keys()];
    if (claves.length === 0) return [`${partir(hoy).anio}-${partir(hoy).mes}`];
    return [...new Set(claves.map((fecha) => fecha.slice(0, 7)))].sort();
  }, [conteo, hoy]);
  const claveMes = `${mes.anio}-${String(mes.mes).padStart(2, "0")}`;
  const indiceMes = mesesConDatos.indexOf(claveMes);

  function ir(fecha: string) {
    const partes = partir(fecha);
    setMes({ anio: partes.anio, mes: partes.mes, dia: partes.dia, semana: partes.semana });
    setDia(fecha);
  }

  function moverMes(direccion: -1 | 1) {
    const destino = mesesConDatos[indiceMes + direccion];
    if (!destino) return;
    const [anio, mesNumero] = destino.split("-").map(Number);
    setMes({ anio, mes: mesNumero, dia: 1, semana: "" });
  }

  return (
    <section className="space-y-3" aria-labelledby="calendario-titulo">
      <div className="border border-line border-t-4 border-t-gold bg-white">
        <div className="flex flex-wrap items-end justify-between gap-3 bg-petrol px-4 py-4 text-white">
          <div>
            <p className="font-condensed text-sm font-semibold uppercase tracking-[0.16em] text-gold">Por fecha del acta</p>
            <h2 id="calendario-titulo" className="font-condensed text-4xl font-bold uppercase leading-none">Calendario</h2>
          </div>
          <button type="button" className="min-h-11 bg-gold px-4 text-left text-petrol" onClick={() => ir(hoy)}>
            <span className="block font-condensed text-sm font-bold uppercase tracking-wide">Hoy</span>
            <span className="block font-condensed text-2xl font-bold leading-none">{actas === null ? "…" : fraseCuenta(totalHoy, tipo)}</span>
          </button>
        </div>
        <p className="border-b border-line px-4 py-2 text-sm leading-5 text-ink">
          Cada número es un acta ya ubicada con esa fecha. Una casilla en blanco no afirma que ese día no hubo proclamación.
        </p>
      </div>

      {error && <p className="border border-line border-l-4 border-l-[#7a2e22] bg-white px-4 py-3 text-sm">{error}</p>}

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(20rem,28rem)_minmax(0,1fr)]">
        <div className="border border-line bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
            <button type="button" className="min-h-11 px-3 font-condensed text-lg font-bold uppercase text-petrol hover:bg-ice disabled:text-muted" disabled={indiceMes <= 0} onClick={() => moverMes(-1)}>
              Anterior
            </button>
            <p className="font-condensed text-2xl font-bold uppercase tracking-wide text-petrol">{MESES[mes.mes - 1]} {mes.anio}</p>
            <button type="button" className="min-h-11 px-3 font-condensed text-lg font-bold uppercase text-petrol hover:bg-ice disabled:text-muted" disabled={indiceMes < 0 || indiceMes >= mesesConDatos.length - 1} onClick={() => moverMes(1)}>
              Siguiente
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-line bg-ice">
            {CABECERA.map((nombre) => (
              <p key={nombre} className="py-2 text-center font-condensed text-sm font-bold uppercase tracking-wide text-petrol">{nombre}</p>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {semanas.flat().map((fecha, indice) => {
              if (!fecha) return <div key={`vacio-${indice}`} className="min-h-16 border border-white bg-[#f7fafb]" />;
              const cuenta = conteoVisible.get(fecha) ?? 0;
              const elegido = fecha === dia;
              const esHoy = fecha === hoy;
              return (
                <button
                  key={fecha}
                  type="button"
                  aria-pressed={elegido}
                  aria-current={esHoy ? "date" : undefined}
                  className={`flex min-h-16 flex-col items-start justify-between border p-1.5 text-left ${
                    elegido
                      ? "border-petrol bg-petrol text-white"
                      : esHoy
                        ? "border-gold border-2 bg-[#fff6d6] text-petrol"
                        : cuenta > 0
                          ? "border-line bg-white text-petrol hover:bg-ice"
                          : "border-[#eef3f5] bg-[#f7fafb] text-muted"
                  }`}
                  onClick={() => setDia(fecha)}
                >
                  <span className="font-condensed text-lg font-bold leading-none">{partir(fecha).dia}</span>
                  {cuenta > 0 && (
                    <span className={`px-1 font-condensed text-sm font-bold leading-5 ${elegido ? "bg-gold text-petrol" : "bg-petrol text-white"}`}>
                      {miles(cuenta)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border border-line bg-white">
          <header className="border-b-4 border-gold bg-white px-4 py-3">
            <h3 className="font-condensed text-3xl font-bold uppercase leading-none text-petrol">{etiquetaDia(dia)}</h3>
            <p className="mt-1 text-sm text-muted">
              {actas === null ? "Leyendo el índice…" : `${fraseCuenta(totalDia, tipo)} ${totalDia === 1 ? "ubicada" : "ubicadas"}`}
              {dia === hoy ? " · este es el día de hoy" : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["todos", "regional", "provincial", "distrital"] as const).map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  aria-pressed={tipo === opcion}
                  className={`min-h-11 px-3 font-condensed text-base font-bold uppercase tracking-wide ${tipo === opcion ? "bg-petrol text-white" : "border border-line text-petrol hover:bg-ice"}`}
                  onClick={() => setTipo(opcion)}
                >
                  {opcion === "todos" ? "Todas" : ETIQUETA[opcion]}
                </button>
              ))}
            </div>
          </header>
          {actas !== null && delDia.length === 0 ? (
            <p className="px-4 py-6 text-sm leading-6 text-ink">
              {tipo === "todos"
                ? "Este día no tiene actas ubicadas con esa fecha."
                : `Este día no tiene actas ${adjetivoAmbito(tipo, 2).trim()} ubicadas.`}
            </p>
          ) : (
            <ol className="max-h-[70vh] divide-y divide-line overflow-y-auto">
              {delDia.map((acta) => (
                <li key={acta.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-condensed text-xs font-bold uppercase tracking-wide text-petrol">{ETIQUETA[acta.ambito]}</p>
                    <p className="font-condensed text-2xl font-bold leading-none text-ink">{acta.titulo}</p>
                    <p className="mt-1 text-sm text-muted">{acta.lugar}</p>
                    {acta.autoridad && (
                      <p className="mt-1 text-sm text-ink">
                        <span className="text-muted">{acta.autoridad.cargo}: </span>
                        <span className="font-semibold">{acta.autoridad.nombre}</span>
                        {acta.autoridad.organizacion ? ` · ${acta.autoridad.organizacion}` : ""}
                      </p>
                    )}
                    {acta.jee && <p className="text-sm text-muted">{acta.jee}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {acta.pdfUrl && (
                      <Button asChild>
                        <a href={acta.pdfUrl} target="_blank" rel="noreferrer">
                          <FileText className="size-4" aria-hidden />
                          PDF
                        </a>
                      </Button>
                    )}
                    {acta.transmisionUrl && (
                      <Button asChild variant="outline">
                        <a href={acta.transmisionUrl} target="_blank" rel="noreferrer">
                          <Video className="size-4" aria-hidden />
                          Video
                        </a>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
