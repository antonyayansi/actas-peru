"use client";

import { useState } from "react";
import { DEPARTAMENTOS_MAPA, FUENTE_MAPA, MAPA_VIEWBOX } from "@/lib/mapa";
import type { MetricaDepartamento } from "@/lib/mapa-metricas";
import { miles } from "@/lib/text";

function etiqueta(metrica: MetricaDepartamento | undefined, nombre: string): string {
  if (!metrica) return nombre;
  const linea = (titulo: string, tipo: MetricaDepartamento["distrital"]) =>
    tipo.ubicadas === null || tipo.esperadas === null
      ? `${titulo}: total pendiente`
      : `${titulo}: ${tipo.ubicadas} de ${tipo.esperadas}`;
  return `${metrica.nombre}. ${linea("Distritales", metrica.distrital)}. ${linea("Provinciales", metrica.provincial)}. ${linea("Regional", metrica.regional)}. ${metrica.frase}`;
}

interface Props {
  seleccionado: string;
  metricas: MetricaDepartamento[];
  revisionSinTerritorio: number;
  onSeleccionar: (codigo: string) => void;
}

function cifra(tipo: MetricaDepartamento["distrital"]): string {
  if (tipo.ubicadas === null || tipo.esperadas === null) return "—";
  return `${miles(tipo.ubicadas)} de ${miles(tipo.esperadas)}`;
}

export function MapaPeru({ seleccionado, metricas, revisionSinTerritorio, onSeleccionar }: Props) {
  const [activo, setActivo] = useState<string | null>(null);
  const codigoVisible = activo || seleccionado || null;
  const metrica = metricas.find((item) => item.codigo === codigoVisible);
  const porCodigo = new Map(metricas.map((item) => [item.codigo, item]));

  return (
    <div className="panel bg-white p-3 sm:p-4">
      <div className="mb-2 flex items-end justify-between gap-3">
        <h2 id="mapa" className="font-condensed text-3xl font-bold uppercase tracking-wide text-petrol">
          Departamentos
        </h2>
        <p className="text-right text-xs text-muted">25 contornos. Lima y Callao van separados.</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem]">
        <svg
          viewBox={MAPA_VIEWBOX}
          role="group"
          aria-labelledby="mapa"
          className="h-auto w-full bg-white"
        >
          {DEPARTAMENTOS_MAPA.map((dep) => {
            const nombre = porCodigo.get(dep.codigo)?.nombre ?? dep.nombreFuente;
            const elegido = seleccionado === dep.codigo;
            const encima = activo === dep.codigo;
            const fill = elegido ? "#00628A" : encima ? "#D6EAF2" : "#F4F8FA";
            const stroke = elegido || encima ? "#FFBE00" : "#00628A";
            return (
              <g key={dep.codigo}>
                <path
                  d={dep.d}
                  fill="transparent"
                  stroke="transparent"
                  strokeWidth={10}
                  vectorEffect="non-scaling-stroke"
                  className="cursor-pointer outline-none"
                  tabIndex={0}
                  role="button"
                  aria-pressed={elegido}
                  aria-label={etiqueta(porCodigo.get(dep.codigo), nombre)}
                  onClick={() => onSeleccionar(dep.codigo)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSeleccionar(dep.codigo);
                    }
                  }}
                  onMouseEnter={() => setActivo(dep.codigo)}
                  onMouseLeave={() => setActivo(null)}
                  onFocus={() => setActivo(dep.codigo)}
                  onBlur={() => setActivo(null)}
                />
                <path d={dep.d} fill={fill} stroke={stroke} strokeWidth={elegido || encima ? 2.4 : 1} pointerEvents="none" />
              </g>
            );
          })}
        </svg>
        <div className="border border-line bg-ice p-3 text-sm" aria-live="polite">
          <p className="font-condensed text-2xl font-bold uppercase leading-none text-petrol">
            {metrica?.nombre ?? "Ninguno"}
          </p>
          {metrica ? (
            <dl className="mt-2 space-y-1">
              <div>
                <dt className="text-muted">Distritales ubicadas</dt>
                <dd className="font-semibold text-ink">{cifra(metrica.distrital)}</dd>
              </div>
              <div>
                <dt className="text-muted">Provinciales ubicadas</dt>
                <dd className="font-semibold text-ink">{cifra(metrica.provincial)}</dd>
              </div>
              <div>
                <dt className="text-muted">Gobierno regional</dt>
                <dd className="font-semibold text-ink">{cifra(metrica.regional)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-muted">Toque un departamento o use la lista. En el teléfono el recuadro muestra las cifras.</p>
          )}
          <p className="mt-2 text-xs leading-5 text-muted">{metrica?.frase}</p>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-1"><span className="inline-block h-3 w-3 border border-petrol bg-[#F4F8FA]" aria-hidden /> Sin elegir</li>
        <li className="flex items-center gap-1"><span className="inline-block h-3 w-3 border border-gold bg-petrol" aria-hidden /> Elegido</li>
        <li>El color no mide cobertura.</li>
      </ul>
      <p className="mt-2 text-xs leading-5 text-muted">
        {revisionSinTerritorio > 0
          ? `${miles(revisionSinTerritorio)} PDF siguen en revisión o sin territorio. No se pintan como ausencia ni entran en el departamento.`
          : "No hay PDF en revisión sin territorio."}
        {" "}Los contornos son departamentos de {FUENTE_MAPA.anioRepresentado}, no municipalidades. Callao no es parte de Lima.
        Fuente: {FUENTE_MAPA.proyecto}. Capa {FUENTE_MAPA.licenciaCapa} Origen declarado: {FUENTE_MAPA.fuenteOriginal}, {FUENTE_MAPA.licenciaOriginal}. {FUENTE_MAPA.ajuste}
      </p>
    </div>
  );
}
