"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { consultar, type IndiceEstatico } from "@/lib/estatico";
import { ModeloInstalacion } from "@/components/GraficaTransferencia";
import { etiquetaPlazo, NORMA_PLAZOS, plazosErm, ROLES_PLAZO, type RolPlazo } from "@/lib/plazos";
import { fechaCorta } from "@/lib/text";

export type NivelEntidad = "regional" | "provincial" | "distrital";

export interface CatalogoCalculadora {
  departamentos: {
    codigo: string;
    nombre: string;
    conActa?: boolean;
    provincias: {
      codigo: string;
      nombre: string;
      conActa?: boolean;
      distritos: {
        lugarId: string;
        nombre: string;
        esCapitalProvincial: boolean;
        nota: string | null;
        conActa?: boolean;
      }[];
    }[];
  }[];
}

interface Props {
  id: string;
  fechaSugerida: string | null;
  lugar: string | null;
}

interface ActaEntidad {
  titulo: string;
  fechaActa: string | null;
  fechaListadoEsFutura: boolean;
  esCapitalProvincial: boolean;
  nota: string | null;
  autoridad: { cargo: string; nombre: string } | null;
  transmisionUrl?: string | null;
}

export function CalculadoraPlazos({ id, fechaSugerida, lugar }: Props) {
  const [fecha, setFecha] = useState(fechaSugerida ?? "");
  const [aplicada, setAplicada] = useState(fechaSugerida);
  const [norma, setNorma] = useState<string | null>(null);
  if (fechaSugerida !== aplicada) {
    setAplicada(fechaSugerida);
    setFecha(fechaSugerida ?? "");
  }
  const plazos = plazosErm(fecha || null);
  const plazoNorma = plazos.find((plazo) => plazo.id === norma);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3 border border-line border-t-4 border-t-gold bg-white px-4 py-3">
        <div className="min-w-0 max-w-xl">
          <h3 className="font-condensed text-2xl font-bold uppercase tracking-wide text-petrol">Plazos de esta entidad</h3>
          <p className="mt-1 text-sm leading-5 text-muted">
            Cada fecha es el último día permitido. Si el envío o la firma ocurren antes, el paso siguiente corre desde esa fecha real. La carita es quien tiene esa obligación en la Directiva 016-2022-CG/PREVI.
          </p>
        </div>
        <div className="min-w-[12rem]">
          <label className="mb-1 block text-sm font-semibold" htmlFor={`proclamacion-${id}`}>
            Fecha de proclamación
          </label>
          <input
            id={`proclamacion-${id}`}
            type="date"
            className="field bg-white"
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
          />
          {fechaSugerida && fecha !== fechaSugerida && (
            <Button type="button" variant="outline" className="mt-2" onClick={() => setFecha(fechaSugerida)}>
              Usar acta{lugar ? ` de ${lugar}` : ""}
            </Button>
          )}
          {fechaSugerida && fecha === fechaSugerida && lugar && (
            <p className="mt-1 text-sm leading-5 text-muted">Fecha del acta de {lugar}.</p>
          )}
        </div>
      </div>
      <div className="grid items-start gap-3 lg:grid-cols-2">
        {TRAMOS.map((tramo, indice) => {
          const pasos = tramo.ids
            .map((pasoId) => plazos.find((plazo) => plazo.id === pasoId))
            .filter((plazo) => plazo !== undefined);
          const grupos: { fecha: string | null; pasos: typeof pasos }[] = [];
          for (const plazo of pasos) {
            const ultimo = grupos.at(-1);
            if (ultimo && ultimo.fecha === plazo.fecha) ultimo.pasos.push(plazo);
            else grupos.push({ fecha: plazo.fecha, pasos: [plazo] });
          }
          return (
            <section key={tramo.id} className="border border-line bg-white" aria-labelledby={`tramo-${id}-${tramo.id}`}>
              <header className="flex gap-3 bg-petrol px-3 py-3 text-white">
                <span className="grid size-8 shrink-0 place-items-center bg-gold font-condensed text-xl font-bold leading-none text-petrol" aria-hidden="true">{indice + 1}</span>
                <div className="min-w-0">
                  <h4 id={`tramo-${id}-${tramo.id}`} className="font-condensed text-xl font-bold uppercase leading-none tracking-wide">
                    {tramo.titulo.replace(/^\d+\.\s*/, "")}
                  </h4>
                  <p className="mt-1 text-sm leading-5 text-ice">{tramo.nota}</p>
                </div>
              </header>
              <ol>
                {grupos.map((grupo) => (
                  <li key={`${tramo.id}-${grupo.fecha ?? "sin-fecha"}`} className="grid gap-2 border-t border-line px-3 py-3 first:border-t-0 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:items-start">
                    <time className={grupo.fecha ? "font-condensed text-lg font-bold leading-none text-petrol" : "text-sm font-semibold leading-5 text-muted"} dateTime={grupo.fecha ?? undefined}>
                      {grupo.fecha ? etiquetaPlazo(grupo.fecha) : "Sin fecha"}
                    </time>
                    <div className="space-y-2">
                      {grupo.pasos.map((plazo) => (
                        <div key={plazo.id}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold leading-5 text-ink">{plazo.etapa}</p>
                            <Hojita etapa={plazo.etapa} onClick={() => setNorma(plazo.id)} />
                          </div>
                          <Caritas roles={plazo.roles} />
                          <p className="text-sm leading-5 text-muted">{plazo.detalle}</p>
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
      {plazoNorma && <CapturaNorma etapa={plazoNorma.etapa} capturas={CAPTURAS[plazoNorma.id] ?? []} onClose={() => setNorma(null)} />}
    </div>
  );
}

export function Hojita({ etapa, onClick }: { etapa: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="grid size-8 shrink-0 place-items-center border border-petrol bg-[#fff6d6] text-petrol hover:bg-gold"
      aria-label={`Ver en la norma: ${etapa}`}
      title="Ver esa parte de la norma"
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path d="M6 2.5h8.2L19 7.2V21.5H6z" fill="#fff6d6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M14 2.8V7.2H18.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M8.2 11.2h7.6M8.2 14.4h7.6M8.2 17.6h4.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function CapturaNorma({ etapa, capturas, onClose }: { etapa: string; capturas: Captura[]; onClose: () => void }) {
  const primera = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const cerrar = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", cerrar);
    const ir = window.setTimeout(() => primera.current?.scrollIntoView({ block: "center" }), 40);
    return () => {
      window.removeEventListener("keydown", cerrar);
      window.clearTimeout(ir);
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 p-3 sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="captura-norma"
        className="mx-auto w-full max-w-3xl border border-line bg-white"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 bg-petrol px-4 py-3 text-white">
          <div>
            <p className="font-condensed text-sm font-bold uppercase tracking-widest text-gold">Norma</p>
            <h3 id="captura-norma" className="font-condensed text-2xl font-bold uppercase leading-none">{etapa}</h3>
          </div>
          <button type="button" className="min-h-11 shrink-0 bg-gold px-3 font-condensed text-lg font-bold uppercase text-petrol" onClick={onClose}>
            Cerrar
          </button>
        </header>
        <p className="border-b border-line px-4 py-2 text-sm leading-5 text-ink">
          Captura de la Directiva N.° 016-2022-CG/PREVI, versión integrada. Ese texto ya incluye lo modificado por la Resolución de Contraloría N.° 344-2026-CG.
        </p>
        <div className="space-y-4 p-3">
          {capturas.map((captura) => (
            <figure key={`${captura.pagina}-${captura.nota}`}>
              <figcaption className="mb-2 text-sm font-semibold leading-5 text-petrol">{captura.nota} Página {captura.impresa} de 41.</figcaption>
              <div className="relative border border-line">
                <img
                  src={`/informacion/capturas/directiva-p${String(captura.pagina).padStart(2, "0")}.png`}
                  alt={`${captura.nota} Página ${captura.impresa} de la directiva.`}
                  className="w-full"
                />
                {captura.marcas.map((marca, indice) => (
                  <span
                    key={`${marca.top}-${marca.left}`}
                    ref={captura === capturas[0] && indice === 0 ? primera : undefined}
                    className="pointer-events-none absolute border-[3px] border-[#a56b00]"
                    style={{ top: `${marca.top}%`, left: `${marca.left}%`, width: `${marca.width}%`, height: `${marca.height}%` }}
                  >
                    <span className="absolute inset-0 bg-[#ffe14a] mix-blend-multiply" />
                  </span>
                ))}
              </div>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Marca {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Captura {
  pagina: number;
  impresa: number;
  nota: string;
  marcas: Marca[];
}

const CAPTURAS: Record<string, Captura[]> = {
  etts: [{ pagina: 19, impresa: 18, nota: "Numeral 7.2.3, literal a. El titular saliente instala el ETTS cinco meses antes del cese.", marcas: [{ top: 71.5, left: 30.9, width: 55.5, height: 9.2 }] }],
  "etts-registro": [
    { pagina: 19, impresa: 18, nota: "El registro del acta de instalación es al día hábil siguiente.", marcas: [{ top: 81.3, left: 30.9, width: 55.4, height: 4.6 }] },
    { pagina: 8, impresa: 7, nota: "Numeral 6.4.3. El responsable del ETTS registra esa acta en el aplicativo.", marcas: [{ top: 30.4, left: 27.9, width: 58.4, height: 3.2 }] },
  ],
  "rct-inicial": [{ pagina: 13, impresa: 12, nota: "Numeral 7.1.3. Informe inicial de gobierno regional o local: corte al 30 de setiembre y quince días hábiles. Lo envía el titular.", marcas: [{ top: 85.4, left: 33.9, width: 52.5, height: 6.3 }] }],
  "rct-publicacion": [
    { pagina: 14, impresa: 13, nota: "La publicación del informe inicial es a los cinco días hábiles del envío.", marcas: [{ top: 45.4, left: 25.5, width: 60.8, height: 6.3 }] },
    { pagina: 6, impresa: 5, nota: "Numeral 6.3.1, literal f. Publicar el informe le toca al titular.", marcas: [{ top: 77.2, left: 27.9, width: 58.5, height: 1.9 }] },
  ],
  ette: [{ pagina: 21, impresa: 20, nota: "Numeral 7.2.3, literal c.1. El titular entrante conforma el ETTE a los tres días hábiles de la proclamación.", marcas: [{ top: 32.3, left: 35.1, width: 51.3, height: 3.4 }] }],
  comision: [
    { pagina: 21, impresa: 20, nota: "La comisión se instala a los cinco días hábiles de conformar el ETTE.", marcas: [{ top: 39.2, left: 35.1, width: 51.3, height: 3.4 }] },
    { pagina: 7, impresa: 6, nota: "Numerales 6.4.1 y 6.4.2. El acta de instalación la firman el titular saliente y el titular entrante.", marcas: [{ top: 61.8, left: 27.9, width: 56.3, height: 1.9 }, { top: 86.4, left: 27.9, width: 56.3, height: 1.9 }] },
  ],
  "rct-final": [{ pagina: 14, impresa: 13, nota: "Numeral 7.1.3. Informe final: corte al 31 de diciembre y tres días hábiles.", marcas: [{ top: 11.6, left: 33.9, width: 52.5, height: 6.3 }] }],
  "tg-institucional": [{ pagina: 20, impresa: 19, nota: "Numeral 7.2.3, literal b.3. El titular saliente envía la transferencia institucional a los tres días hábiles.", marcas: [{ top: 64.6, left: 37.4, width: 48.9, height: 9.2 }] }],
  "tg-territorial": [{ pagina: 20, impresa: 19, nota: "Numeral 7.2.3, literal b.3. La transferencia territorial, si hay entidades vinculadas, vence el mismo día.", marcas: [{ top: 74.9, left: 37.4, width: 49, height: 15 }] }],
  acta: [
    { pagina: 22, impresa: 21, nota: "Numeral 7.2.3, literal d.3. La firma es a los cinco días hábiles del 31 de diciembre.", marcas: [{ top: 16, left: 35.1, width: 51.3, height: 3.4 }] },
    { pagina: 19, impresa: 18, nota: "El acta la firman el titular entrante, el titular saliente y los responsables de ambos equipos.", marcas: [{ top: 35.9, left: 27.9, width: 58.5, height: 3.3 }] },
  ],
  "acta-envio": [
    { pagina: 22, impresa: 21, nota: "El envío a la Contraloría es a los dos días hábiles de la firma.", marcas: [{ top: 19.9, left: 31.5, width: 54.9, height: 4.8 }] },
    { pagina: 8, impresa: 7, nota: "Numeral 6.4.4. El responsable del ETTE registra el acta en el aplicativo.", marcas: [{ top: 74.1, left: 27.9, width: 58.5, height: 3.3 }] },
  ],
  publicacion: [
    { pagina: 22, impresa: 21, nota: "La publicación es a los cinco días hábiles de la firma del acta.", marcas: [{ top: 35.6, left: 31.5, width: 54.9, height: 6.3 }] },
    { pagina: 7, impresa: 6, nota: "Numeral 6.4.2, literal g. Publicar el acta le toca al titular entrante.", marcas: [{ top: 89.1, left: 27.9, width: 58.4, height: 1.9 }] },
  ],
};

const CARA: Record<RolPlazo, { fondo: string; tinta: string }> = {
  saliente: { fondo: "#00628A", tinta: "#FFBE00" },
  titular: { fondo: "#004A69", tinta: "#FFFFFF" },
  entrante: { fondo: "#FFBE00", tinta: "#004A69" },
  etts: { fondo: "#E7F4F8", tinta: "#004A69" },
  ette: { fondo: "#FFF6D6", tinta: "#8A5A00" },
};

function Caritas({ roles }: { roles: RolPlazo[] }) {
  return (
    <ul className="my-1 flex flex-wrap gap-x-3 gap-y-1">
      {roles.map((rol) => {
        const tono = CARA[rol];
        const info = ROLES_PLAZO[rol];
        return (
          <li key={rol} className="inline-flex items-center gap-1.5" title={info.obliga}>
            <svg viewBox="0 0 32 32" className="size-7 shrink-0" role="img" aria-label={info.nombre}>
              <circle cx="16" cy="16" r="14.2" fill={tono.fondo} stroke={tono.tinta} strokeWidth="1.6" />
              <circle cx="11.5" cy="13.5" r="1.7" fill={tono.tinta} />
              <circle cx="20.5" cy="13.5" r="1.7" fill={tono.tinta} />
              <path d="M11 19.5c1.6 2.2 8.4 2.2 10 0" fill="none" stroke={tono.tinta} strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-semibold leading-4 text-petrol">{info.nombre}</span>
          </li>
        );
      })}
    </ul>
  );
}

const TRAMOS: { id: string; titulo: string; nota: string; ids: string[] }[] = [
  {
    id: "transicion",
    titulo: "1. Equipo de transición",
    nota: "No depende de la proclamación. El cese es el 31 de diciembre de 2026.",
    ids: ["etts", "etts-registro"],
  },
  {
    id: "inicial",
    titulo: "2. Informe inicial",
    nota: "El corte es el 30 de setiembre de 2026. Los días se cuentan en hábiles.",
    ids: ["rct-inicial", "rct-publicacion"],
  },
  {
    id: "entrante",
    titulo: "3. Equipo entrante",
    nota: "Estas dos fechas salen de la proclamación de esta entidad.",
    ids: ["ette", "comision"],
  },
  {
    id: "cierre",
    titulo: "4. Cierre y transferencia",
    nota: "El corte es el 31 de diciembre. Tres envíos vencen el mismo día.",
    ids: ["rct-final", "tg-institucional", "tg-territorial", "acta", "acta-envio", "publicacion"],
  },
];

const NIVELES: { id: NivelEntidad; etiqueta: string; detalle: string }[] = [
  { id: "regional", etiqueta: "Gobierno regional", detalle: "Gobernador regional" },
  { id: "provincial", etiqueta: "Municipalidad provincial", detalle: "Alcalde provincial" },
  { id: "distrital", etiqueta: "Municipalidad distrital", detalle: "Alcalde distrital" },
];

function SelectorEntidad({ nivel, onNivel }: { nivel: NivelEntidad | null; onNivel: (nivel: NivelEntidad) => void }) {
  return (
    <div className="grid border-b border-line sm:grid-cols-3" role="group" aria-label="Tipo de entidad">
      {NIVELES.map((item) => {
        const activo = nivel === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={activo}
            className={`flex min-h-[4.5rem] items-center gap-3 border-b border-line px-4 py-3 text-left last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 ${activo ? "bg-petrol text-white" : "bg-white text-petrol hover:bg-ice"}`}
            onClick={() => onNivel(item.id)}
          >
            <span className={`grid size-10 shrink-0 place-items-center font-condensed text-lg font-bold leading-none ${activo ? "bg-gold text-petrol" : "bg-ice text-petrol"}`} aria-hidden="true">
              {item.id === "regional" ? "GR" : item.id === "provincial" ? "MP" : "MD"}
            </span>
            <span className="min-w-0">
              <span className="block font-condensed text-xl font-bold uppercase leading-none tracking-wide">{item.etiqueta}</span>
              <span className={`mt-1 block text-sm leading-4 ${activo ? "text-ice" : "text-muted"}`}>{item.detalle}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function VistaCalculadora({
  nivel,
  onNivel,
  catalogo,
  estatico,
  indice,
}: {
  nivel: NivelEntidad | null;
  onNivel: (nivel: NivelEntidad) => void;
  catalogo: CatalogoCalculadora | null;
  estatico: boolean;
  indice: IndiceEstatico | null;
}) {
  const [departamento, setDepartamento] = useState("");
  const [provincia, setProvincia] = useState("");
  const [distrito, setDistrito] = useState("");
  const [acta, setActa] = useState<ActaEntidad | null>(null);
  const [actaDe, setActaDe] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [avisoActa, setAvisoActa] = useState<string | null>(null);

  const provincias = useMemo(
    () => catalogo?.departamentos.find((item) => item.codigo === departamento)?.provincias ?? [],
    [catalogo, departamento],
  );
  const distritos = useMemo(
    () => provincias.find((item) => item.codigo === provincia)?.distritos ?? [],
    [provincias, provincia],
  );
  const depNombre = catalogo?.departamentos.find((item) => item.codigo === departamento)?.nombre ?? "";
  const provNombre = provincias.find((item) => item.codigo === provincia)?.nombre ?? "";
  const distSeleccionado = distritos.find((item) => item.lugarId === distrito) ?? null;

  const lista =
    nivel === "regional" ? Boolean(departamento)
    : nivel === "provincial" ? Boolean(departamento && provincia)
    : nivel === "distrital" ? Boolean(departamento && provincia && distrito)
    : false;
  const consulta = lista && nivel ? `${nivel}|${departamento}|${provincia}|${distrito}` : "";

  const nombreEntidad = !nivel
    ? "Elija su entidad"
    : nivel === "regional"
      ? depNombre ? `Gobierno regional de ${depNombre}` : "Elija el departamento"
      : nivel === "provincial"
        ? provNombre ? `Municipalidad provincial de ${provNombre}` : "Elija la provincia"
        : distSeleccionado
          ? `Municipalidad distrital de ${distSeleccionado.nombre}`
          : "Elija el distrito";

  useEffect(() => {
    if (!consulta || !nivel) {
      setActa(null);
      setActaDe("");
      setAvisoActa(null);
      setBuscando(false);
      return;
    }
    const filtro = {
      departamento,
      provincia: nivel === "regional" ? "" : provincia,
      distrito: nivel === "distrital" ? distrito : "",
      tipo: nivel,
      pagina: 1,
      paginaProvincial: 1,
    };
    let cancelado = false;
    const aplicar = (payload: { listo?: boolean; mensaje?: string; grupos?: { ambito: string; resultados: ActaEntidad[] }[] }) => {
      if (cancelado) return;
      setActaDe(consulta);
      if (payload.listo === false) {
        setActa(null);
        setAvisoActa(payload.mensaje || "El índice todavía no tiene esa entidad.");
        return;
      }
      const item = payload.grupos?.find((grupo) => grupo.ambito === nivel)?.resultados[0] ?? null;
      setActa(item);
      setAvisoActa(item ? null : "No hay una ficha de esa entidad en el índice.");
    };
    if (estatico) {
      if (!indice) return;
      aplicar(consultar(indice, filtro));
      return;
    }
    const params = new URLSearchParams();
    params.set("departamento", departamento);
    if (filtro.provincia) params.set("provincia", filtro.provincia);
    if (filtro.distrito) params.set("distrito", filtro.distrito);
    params.set("tipo", nivel);
    params.set("pagina", "1");
    const controller = new AbortController();
    setBuscando(true);
    fetch(`/api/buscar?${params.toString()}`, { signal: controller.signal })
      .then((response) => response.json())
      .then(aplicar)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        if (!cancelado) {
          setActa(null);
          setActaDe(consulta);
          setAvisoActa("No se pudo leer el acta de esta entidad.");
        }
      })
      .finally(() => {
        if (!cancelado) setBuscando(false);
      });
    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [consulta, lista, nivel, departamento, provincia, distrito, estatico, indice]);

  const actaVigente = consulta && actaDe === consulta ? acta : null;
  const fechaSugerida = actaVigente?.fechaActa && !actaVigente.fechaListadoEsFutura ? actaVigente.fechaActa.slice(0, 10) : null;

  return (
    <div className="space-y-4">
      <section className="border border-line bg-white" aria-labelledby="calculadora-entidad">
        <div className="border-b-4 border-gold bg-petrol px-4 py-3 text-white">
          <p className="font-condensed text-sm font-semibold uppercase tracking-[0.16em]">Calculadora de plazos</p>
          <h2 id="calculadora-entidad" className="font-condensed text-3xl font-bold uppercase leading-none tracking-wide">{nivel ? nombreEntidad : "Elija el tipo de entidad"}</h2>
        </div>
        <SelectorEntidad nivel={nivel} onNivel={onNivel} />
        <div className={nivel ? "grid gap-0 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]" : ""}>
          {nivel && (
          <div className="border-b border-line lg:border-b-0 lg:border-r">
          <form className="space-y-3 p-4" onSubmit={(event) => event.preventDefault()}>
              <div>
                <label htmlFor="calc-departamento" className="mb-1 block text-sm font-semibold">Departamento</label>
                <select
                  id="calc-departamento"
                  className="field"
                  value={departamento}
                  onChange={(event) => {
                    setDepartamento(event.target.value);
                    setProvincia("");
                    setDistrito("");
                  }}
                >
                  <option value="">Elegir</option>
                  {catalogo?.departamentos.map((item) => (
                    <option key={item.codigo} value={item.codigo} className={nivel === "regional" && item.conActa ? "con-acta" : undefined}>
                      {item.nombre}
                      {nivel === "regional" && item.conActa ? " · con acta" : ""}
                    </option>
                  ))}
                </select>
              </div>
            {nivel !== "regional" && (
              <div>
                <label htmlFor="calc-provincia" className="mb-1 block text-sm font-semibold">Provincia</label>
                <select
                  id="calc-provincia"
                  className="field"
                  value={provincia}
                  disabled={!departamento}
                  onChange={(event) => {
                    setProvincia(event.target.value);
                    setDistrito("");
                  }}
                >
                  <option value="">Elegir</option>
                  {provincias.map((item) => (
                    <option key={item.codigo} value={item.codigo} className={item.conActa ? "con-acta" : undefined}>
                      {item.nombre}
                      {item.conActa ? " · con acta" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {nivel === "distrital" && (
              <div>
                <label htmlFor="calc-distrito" className="mb-1 block text-sm font-semibold">Distrito</label>
                <select
                  id="calc-distrito"
                  className="field"
                  value={distrito}
                  disabled={!provincia}
                  onChange={(event) => setDistrito(event.target.value)}
                >
                  <option value="">Elegir</option>
                  {distritos.map((item) => (
                    <option key={item.lugarId} value={item.lugarId} className={item.conActa ? "con-acta" : undefined}>
                      {item.nombre}
                      {item.conActa ? " · con acta" : ""}
                      {item.esCapitalProvincial ? " · capital" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(buscando || (consulta && actaDe !== consulta)) && <p className="text-sm text-muted">Buscando el acta de esta entidad…</p>}
            {actaDe === consulta && avisoActa && <p className="text-sm leading-6 text-ink">{avisoActa}</p>}
            {actaVigente?.esCapitalProvincial && (
              <div className="border border-gold bg-white px-3 py-2 text-sm leading-6">
                <p>{actaVigente.nota || "Este distrito es capital de provincia. Su alcaldía se elige con la municipalidad provincial."}</p>
                <Button type="button" variant="outline" className="mt-2" onClick={() => onNivel("provincial")}>
                  Calcular la municipalidad provincial
                </Button>
              </div>
            )}
            {actaVigente && !actaVigente.esCapitalProvincial && (
              <p className="text-sm leading-6 text-ink">
                {fechaSugerida
                  ? `Acta publicada${actaVigente.titulo ? `: ${actaVigente.titulo}` : ""}, ${fechaCorta(actaVigente.fechaActa) || fechaSugerida}.`
                  : "Esta entidad todavía no tiene fecha de acta en el índice. Puede escribir la fecha de proclamación."}
                {actaVigente.autoridad ? ` ${actaVigente.autoridad.cargo}: ${actaVigente.autoridad.nombre}.` : ""}
              </p>
            )}
            {actaVigente?.transmisionUrl && (
              <Button asChild variant="outline">
                <a href={actaVigente.transmisionUrl} target="_blank" rel="noreferrer">
                  Ver transmisión en YouTube
                </a>
              </Button>
            )}
          </form>
            <section className="space-y-2 border-t border-line bg-white p-4" aria-labelledby="modelo-etts">
              <h3 id="modelo-etts" className="font-condensed text-2xl font-bold uppercase tracking-wide text-petrol">Cómo instalar el ETTS</h3>
              <p className="text-sm leading-6 text-ink">{nombreEntidad.startsWith("Elija") ? "Al elegir la entidad, su nombre queda en el documento." : `Modelo para ${nombreEntidad}.`}</p>
              <ModeloInstalacion lugar={nivel} entidad={nombreEntidad.startsWith("Elija") ? null : nombreEntidad} />
            </section>
          </div>
          )}
          <CalculadoraPlazos id="entidad" fechaSugerida={fechaSugerida} lugar={actaVigente?.titulo ?? null} />
        </div>
      </section>
      <NormasPlazos />
    </div>
  );
}

const MATERIAL_APOYO: { id: string; titulo: string; archivos: { nombre: string; archivo: string }[] }[] = [
  {
    id: "instructivos",
    titulo: "Instructivos y tutoriales",
    archivos: [
      { nombre: "Instructivo RCTG", archivo: "instructivo-rctg.pdf" },
      { nombre: "Instructivo de rendición de cuentas", archivo: "instructivo-rendicion.pdf" },
    ],
  },
];

function EnlaceGuia({ href, nombre, tipo, descarga }: { href: string; nombre: string; tipo: string; descarga?: string }) {
  return (
    <li>
      <a
        className="flex items-center justify-between gap-3 border border-line bg-white px-3 py-2 hover:bg-ice"
        href={href}
        download={descarga}
        target={descarga ? undefined : "_blank"}
        rel={descarga ? undefined : "noreferrer"}
      >
        <span className="font-semibold leading-5 text-petrol">{nombre}</span>
        <span className="shrink-0 font-condensed text-sm font-bold uppercase tracking-wide text-petrol">{tipo}</span>
      </a>
    </li>
  );
}

export function VistaGuias() {
  return (
    <div className="space-y-3">
      <section className="border border-line border-t-4 border-t-gold bg-white p-4" aria-labelledby="guias-titulo">
        <h2 id="guias-titulo" className="font-condensed text-3xl font-bold uppercase tracking-wide text-petrol">Anexos, normas y guías</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink">
          El cálculo de plazos usa la Directiva N.° 016-2022-CG/PREVI y la Resolución de Contraloría N.° 344-2026-CG.
        </p>
        <p className="mt-3 border-l-4 border-gold bg-ice px-3 py-2 text-sm leading-6 text-ink">
          Las normas, los anexos y los instructivos son de la Contraloría General de la República.
          Esa entidad los publicó de manera pública. Planitec Perú no los redactó: los reúne aquí para consultarlos.
          Los enlaces a gob.pe abren el archivo oficial. La versión integrada, la Resolución N.° 267-2022-CG y los instructivos son una copia de esa publicación pública, para poder descargarlos desde este sitio.
          Las láminas de cada sistema y de las secciones del informe están en Infografías.
        </p>
      </section>
      <div className="grid items-start gap-3 lg:grid-cols-2">
        <section className="border border-line bg-white" aria-labelledby="guias-normas">
          <h3 id="guias-normas" className="bg-petrol px-3 py-2 font-condensed text-xl font-bold uppercase tracking-wide text-white">Normas</h3>
          <ul className="space-y-2 p-3">
            <EnlaceGuia href={NORMA_PLAZOS.ficha} nombre="Ficha oficial en gob.pe" tipo="Ficha" />
            <EnlaceGuia href="/informacion/directiva-016-2022-version-integrada.pdf" nombre="Directiva N.° 016-2022-CG/PREVI, versión integrada" tipo="PDF" descarga="directiva-016-2022-version-integrada.pdf" />
            <EnlaceGuia href="/informacion/resolucion-267-2022-cg.pdf" nombre="Resolución de Contraloría N.° 267-2022-CG" tipo="PDF" descarga="resolucion-267-2022-cg.pdf" />
            <EnlaceGuia href={NORMA_PLAZOS.directivaPdf} nombre="Directiva N.° 016-2022-CG/PREVI en gob.pe" tipo="PDF" />
            <EnlaceGuia href={NORMA_PLAZOS.modificatoriaPdf} nombre="Resolución de Contraloría N.° 344-2026-CG" tipo="PDF" />
            <EnlaceGuia href={NORMA_PLAZOS.modificatoriaFicha} nombre="Ficha de la Resolución 344-2026-CG" tipo="Ficha" />
            <EnlaceGuia href={NORMA_PLAZOS.glosarioPdf} nombre="Glosario de términos" tipo="PDF" />
          </ul>
        </section>
        <section className="border border-line bg-white" aria-labelledby="guias-anexos">
          <h3 id="guias-anexos" className="bg-petrol px-3 py-2 font-condensed text-xl font-bold uppercase tracking-wide text-white">Anexos y formatos</h3>
          <ul className="space-y-2 p-3">
            {NORMA_PLAZOS.formatos.map((formato) => (
              <EnlaceGuia key={formato.url} href={formato.url} nombre={formato.nombre} tipo="Word" />
            ))}
            <EnlaceGuia href={NORMA_PLAZOS.carpetaEntidades} nombre="Carpeta completa de modelos y anexos, incluidos los Excel" tipo="Carpeta" />
          </ul>
        </section>
        {MATERIAL_APOYO.map((grupo) => (
          <section key={grupo.id} className="border border-line bg-white" aria-labelledby={`guias-${grupo.id}`}>
            <h3 id={`guias-${grupo.id}`} className="bg-petrol px-3 py-2 font-condensed text-xl font-bold uppercase tracking-wide text-white">{grupo.titulo}</h3>
            <ul className="space-y-2 p-3">
              {grupo.archivos.map((archivo) => (
                <EnlaceGuia
                  key={archivo.archivo}
                  href={`/informacion/${archivo.archivo}`}
                  nombre={archivo.nombre}
                  tipo="PDF"
                  descarga={archivo.archivo}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export function NormasPlazos() {
  return (
    <section className="space-y-2 border border-line bg-white p-4" aria-labelledby="normas-plazos">
      <h3 id="normas-plazos" className="font-condensed text-2xl font-bold uppercase tracking-wide text-petrol">Cómo se cuentan los días</h3>
      <p className="text-sm leading-6 text-ink">
        Gobiernos regionales, provinciales y distritales tienen la misma regla. Cambia la fecha de proclamación de cada titular.
        Los días hábiles excluyen sábados, domingos y feriados nacionales. No resta días no laborables compensables ni feriados de una región.
        Las normas, los anexos, los instructivos y las guías están en la pestaña Anexos y guías.
        Son publicaciones públicas de la Contraloría General de la República. Este sitio no es su autor.
      </p>
    </section>
  );
}
