"use client";

import { useMemo } from "react";
import { hoyLima } from "@/lib/calendario";
import { escritorioComun, textoEstado, type PasoEscritorio } from "@/lib/ruta";
import { fechaCorta } from "@/lib/text";

function Chip({ estado }: { estado: PasoEscritorio["estado"] }) {
  const clase =
    estado === "hoy"
      ? "bg-gold text-petrol"
      : estado === "falta"
        ? "bg-petrol text-white"
        : estado === "corrio"
          ? "bg-ice text-muted"
          : "border border-gold bg-[#fff6d6] text-petrol";
  return <span className={`px-1.5 py-0.5 font-condensed text-sm font-bold uppercase leading-5 ${clase}`}>{textoEstado(estado)}</span>;
}

function Paso({ paso }: { paso: PasoEscritorio }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-3 py-2 last:border-b-0">
      <time className="w-[5.5rem] shrink-0 font-condensed text-lg font-bold leading-none text-petrol" dateTime={paso.fecha ?? undefined}>
        {paso.fecha ? fechaCorta(paso.fecha) : "Su acta"}
      </time>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-5 text-ink">{paso.titulo}</span>
        <span className="block text-sm leading-5 text-muted">{paso.nota}</span>
      </span>
      <Chip estado={paso.estado} />
    </li>
  );
}

function Cese({ fecha }: { fecha: string }) {
  return (
    <p className="bg-[#fff6d6] px-3 py-2 font-condensed text-lg font-bold uppercase leading-none text-petrol">
      Cese · {fechaCorta(fecha)} · hasta ese día el saliente sigue a cargo
    </p>
  );
}

export function RutaAutoridades() {
  const hoy = hoyLima();
  const escritorio = useMemo(() => escritorioComun(hoy), [hoy]);

  return (
    <section className="space-y-3" aria-labelledby="ruta-titulo">
      <div className="border border-line border-t-4 border-t-gold bg-white">
        <div className="bg-petrol px-4 py-4 text-white">
          <p className="font-condensed text-sm font-semibold uppercase tracking-[0.16em] text-gold">Dos escritorios, una misma acta</p>
          <h2 id="ruta-titulo" className="font-condensed text-4xl font-bold uppercase leading-none">Saliente y entrante</h2>
        </div>
        <p className="px-4 py-3 text-sm leading-6 text-ink">
          El saliente sigue a cargo hasta el cese, el {fechaCorta(escritorio.cese)}. Quien entra es la autoridad proclamada en el acta, y conforma su ETTE desde esa fecha, sin esperar a enero.
          Una fecha en la que el plazo ya corrió cuenta el calendario: no dice si el equipo se instaló. Los días son hábiles, sin sábados, domingos ni feriados nacionales. No se restan feriados regionales.
        </p>
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-2">
        <article className="border border-line bg-white">
          <header className="bg-petrol px-4 py-3 text-white">
            <p className="font-condensed text-sm font-semibold uppercase tracking-[0.14em] text-gold">Escritorio</p>
            <h3 className="font-condensed text-3xl font-bold uppercase leading-none">Saliente</h3>
            <p className="mt-1 text-sm text-white/80">Quien deja el cargo. Su nombre no viene en el acta.</p>
          </header>
          <ul>
            {escritorio.salienteAntes.map((paso) => <Paso key={paso.id} paso={paso} />)}
          </ul>
          <Cese fecha={escritorio.cese} />
          <ul>
            {escritorio.salienteDespues.map((paso) => <Paso key={paso.id} paso={paso} />)}
          </ul>
        </article>
        <article className="border border-line border-t-4 border-t-gold bg-white">
          <header className="bg-gold px-4 py-3 text-petrol">
            <p className="font-condensed text-sm font-semibold uppercase tracking-[0.14em]">Escritorio</p>
            <h3 className="font-condensed text-3xl font-bold uppercase leading-none">Entrante</h3>
            <p className="mt-1 text-sm">Quien figura en el acta de proclamación.</p>
          </header>
          <ul>
            {escritorio.entranteAntes.map((paso) => <Paso key={paso.id} paso={paso} />)}
          </ul>
          <Cese fecha={escritorio.cese} />
          <ul>
            {escritorio.entranteDespues.map((paso) => <Paso key={paso.id} paso={paso} />)}
          </ul>
          <p className="border-t border-line px-3 py-2 text-sm leading-5 text-muted">
            El responsable del ETTE envía el acta a la Contraloría a los dos días hábiles de la firma.
          </p>
        </article>
      </div>
      <p className="border border-line bg-white px-4 py-2 text-sm leading-5 text-muted">
        Plazos de la Directiva 016-2022-CG y de la Resolución de Contraloría 344-2026-CG. La Orientación N.° 001-2026-CG aplica el mismo camino.{" "}
        <a className="font-semibold text-petrol underline" href="/informacion/orientacion-001-2026-cg-rct-tg.pdf">Abrir la orientación</a>.
      </p>
    </section>
  );
}
