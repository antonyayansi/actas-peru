"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { etiquetaPlazo, NORMA_PLAZOS, plazosErm } from "@/lib/plazos";

interface Props {
  id: string;
  fechaSugerida: string | null;
  lugar: string | null;
}

export function CalculadoraPlazos({ id, fechaSugerida, lugar }: Props) {
  const [fecha, setFecha] = useState("");
  const plazos = plazosErm(fecha || null);
  return (
    <div className="border-b border-line bg-ice px-3 py-3 text-ink">
      <p className="font-condensed text-sm font-bold uppercase tracking-wide text-petrol">Calculadora de plazos</p>
      <label className="mt-2 block text-xs text-muted" htmlFor={`proclamacion-${id}`}>
        Fecha de proclamación
      </label>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <input
          id={`proclamacion-${id}`}
          type="date"
          className="field max-w-[11rem] bg-white"
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
        />
        {fechaSugerida && (
          <Button type="button" variant="outline" className="min-h-9 px-2 text-xs" onClick={() => setFecha(fechaSugerida)}>
            Usar acta{lugar ? ` de ${lugar}` : ""}
          </Button>
        )}
      </div>
      <dl className="mt-2 space-y-1.5">
        {plazos.map((plazo) => (
          <div key={plazo.id} className="grid grid-cols-[1fr_auto] gap-2 border-b border-white/80 pb-1">
            <dt className="text-xs leading-4 text-ink">{plazo.etapa}</dt>
            <dd className="text-right font-condensed text-base font-bold leading-4 text-petrol">{etiquetaPlazo(plazo.fecha)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function NormasPlazos() {
  return (
    <section className="space-y-3 border border-line bg-white p-4" aria-labelledby="normas-plazos">
      <h3 id="normas-plazos" className="font-condensed text-2xl font-bold uppercase tracking-wide text-petrol">Norma y anexos</h3>
      <p className="text-sm leading-6 text-ink">
        El cálculo usa la Directiva N.° 016-2022-CG/PREVI y su modificatoria, la Resolución de Contraloría N.° 344-2026-CG.
        Gobiernos regionales, provinciales y distritales tienen la misma regla. Cambia la fecha de proclamación de cada titular.
        Los días hábiles excluyen sábados, domingos y feriados nacionales. No resta días no laborables compensables ni feriados de una región.
        Si el informe se envía o el acta se firma antes del último día, la publicación corre desde esa fecha real.
      </p>
      <ul className="space-y-1 text-sm">
        <li><a className="font-semibold text-petrol underline decoration-gold underline-offset-2" href={NORMA_PLAZOS.ficha}>Ficha oficial en gob.pe</a></li>
        <li><a className="font-semibold text-petrol underline decoration-gold underline-offset-2" href={NORMA_PLAZOS.directivaPdf}>Directiva N.° 016-2022-CG/PREVI (PDF)</a></li>
        <li><a className="font-semibold text-petrol underline decoration-gold underline-offset-2" href={NORMA_PLAZOS.modificatoriaPdf}>Resolución de Contraloría N.° 344-2026-CG (PDF)</a></li>
        <li><a className="font-semibold text-petrol underline decoration-gold underline-offset-2" href={NORMA_PLAZOS.glosarioPdf}>Glosario de términos (PDF)</a></li>
        {NORMA_PLAZOS.formatos.map((formato) => (
          <li key={formato.url}><a className="font-semibold text-petrol underline decoration-gold underline-offset-2" href={formato.url}>{formato.nombre}</a></li>
        ))}
        <li><a className="font-semibold text-petrol underline decoration-gold underline-offset-2" href={NORMA_PLAZOS.carpetaEntidades}>Carpeta completa de modelos y anexos de entidades, incluidos los Excel</a></li>
      </ul>
    </section>
  );
}
