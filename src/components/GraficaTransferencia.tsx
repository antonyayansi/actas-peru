"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Hojita } from "@/components/Plazos";
import {
  CESE_REGIONAL_MUNICIPAL,
  ENLACES_MODELO,
  LUGAR_MODELO,
  etiquetaMes,
  hitosRegionales,
  mesesCubiertos,
  type CapturaNormaDato,
  type ClaseModelo,
  type HitoGrafica,
  type LugarModelo,
} from "@/lib/grafica";
import { etiquetaPlazo } from "@/lib/plazos";

export function ModeloInstalacion({ lugar, entidad }: { lugar: LugarModelo; entidad?: string | null }) {
  const info = LUGAR_MODELO[lugar];
  return (
    <div className="space-y-3">
      <Propuesta>
        <p className="font-semibold text-petrol">Documento de conformación del ETTS</p>
        <p>
          La directiva pide un documento firmado por el titular saliente y no publica la plantilla. El Anexo N.° 8 es solo del ETTE.
          Esta redacción usa el numeral 7.2.2, literal a, y los numerales 6 y 8 del glosario.
        </p>
        <p>Entidad: {entidad || "________________________________"}</p>
        <p>Fecha: ____________________</p>
        <p>
          Yo, ________________________________, titular saliente {info.en}, conformo el Equipo de Transferencia del Titular Saliente.
          Lo integran como mínimo tres servidores de la entidad. No se designa a ciudadanos ajenos a ella.
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Funcionario responsable: {info.responsable}. Dirige el equipo. Si esa persona es a la vez el titular, asume el funcionario inmediato inferior de gestión administrativa.
            Nombres, DNI y unidad orgánica: ____________________
          </li>
          <li>Integrante. Nombres, DNI y unidad orgánica: ____________________</li>
          <li>Integrante. Nombres, DNI y unidad orgánica: ____________________</li>
        </ol>
        <p>Firma del titular saliente.</p>
        <p className="text-xs leading-5">{info.plazoEtts}</p>
      </Propuesta>
      <Oficial
        titulo="Acta de instalación del ETTS"
        texto="El formato oficial es el Anexo N.° 7, literal A. Lo firman el titular saliente y el funcionario responsable. Consigna ciudad, fecha, hora, si la reunión es presencial o virtual, la lista del equipo, las tareas de cada integrante y, si los hay, acuerdos y observaciones."
        href={ENLACES_MODELO.acta}
        enlace="Abrir el formato de actas"
      />
    </div>
  );
}

function ModeloHito({ clase, lugar }: { clase: ClaseModelo; lugar: LugarModelo }) {
  if (clase === "etts") {
    return (
      <div className="space-y-3">
        <ModeloInstalacion lugar={lugar} />
        {lugar === "provincial" && <p className="text-sm leading-6 text-ink">En la municipalidad distrital el documento es el mismo y el responsable también es el gerente municipal.</p>}
      </div>
    );
  }
  if (clase === "accesos") {
    return (
      <div className="space-y-3">
        <Oficial
          titulo="No hay formulario de accesos"
          texto="El numeral 7.2.2, literal a, manda hacerlo en el aplicativo. El titular saliente pide su acceso, genera los del ETTS y los del personal que va a registrar. Si hay unidades ejecutoras, genera los accesos de sus titulares. El responsable registra después el documento de conformación y el acta."
          href={ENLACES_MODELO.directiva}
          enlace="Abrir la directiva"
        />
      </div>
    );
  }
  if (clase === "rct" || clase === "corte") {
    return <Oficial titulo="Informe de rendición de cuentas" texto="La estructura oficial es el Anexo N.° 6. El modelo en Word está en la carpeta de entidades de la Contraloría." href={ENLACES_MODELO.rct} enlace="Abrir el modelo de rendición" />;
  }
  if (clase === "tg-institucional") {
    return <Oficial titulo="Transferencia institucional" texto="Se elabora con la estructura del Anexo N.° 3, informe de un pliego." href={ENLACES_MODELO.institucional} enlace="Abrir el modelo institucional" />;
  }
  if (clase === "tg-territorial") {
    return <Oficial titulo="Transferencia territorial" texto="La estructura oficial es el Anexo N.° 2. Solo corresponde si la entidad tiene empresas, organismos o entidades vinculadas por su ámbito." href={ENLACES_MODELO.territorial} enlace="Abrir el modelo territorial" />;
  }
  if (clase === "ette") {
    return <Oficial titulo="Conformación del ETTE" texto="El formato oficial es el Anexo N.° 8, al final de la directiva integrada. En un gobierno regional o una municipalidad se consigna ETTE. Lo firma el titular entrante." href={ENLACES_MODELO.directiva} enlace="Abrir la directiva, Anexo 8" />;
  }
  if (clase === "comision") {
    return <Oficial titulo="Acta de instalación de la comisión" texto="El formato oficial es el Anexo N.° 7, literal B. Lo firman el titular saliente y el titular entrante. Pueden firmarlo también los responsables y los integrantes. Incluye el cronograma." href={ENLACES_MODELO.acta} enlace="Abrir el formato de actas" />;
  }
  if (clase === "acta") {
    return <Oficial titulo="Acta de transferencia de gestión" texto="El formato oficial es el Anexo N.° 7, literal C. Lo firman el titular entrante, el titular saliente, el responsable del ETTS y el responsable del ETTE." href={ENLACES_MODELO.acta} enlace="Abrir el formato de actas" />;
  }
  if (clase === "envio") {
    return <Oficial titulo="El envío no tiene formulario aparte" texto="Se hace por el aplicativo de la Contraloría. En el mismo plazo, el acta, el informe de transferencia y el informe de rendición firmados se archivan en la Oficina General de Administración o en la que haga sus veces." href={ENLACES_MODELO.directiva} enlace="Abrir la directiva" />;
  }
  return (
    <Propuesta>
      <p className="font-semibold text-petrol">Constancia de publicación</p>
      <p>
        La directiva no trae un formato. Ordena publicar, a los cinco días hábiles de la firma, el acta, el informe de transferencia, el informe de rendición por cese y sus anexos, en los canales institucionales. En el mismo plazo se registra en el aplicativo el documento que prueba esa publicación. Publicar le toca al titular entrante.
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Entidad y fecha de la firma del acta.</li>
        <li>Fecha en que se publicó y canal usado.</li>
        <li>Lista de documentos publicados y el enlace o la ubicación.</li>
        <li>Firma del titular entrante.</li>
      </ul>
    </Propuesta>
  );
}

function Propuesta({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-2 border border-[#a56b00] bg-[#fff6d6] p-3 text-sm leading-6 text-ink">
      <p className="font-condensed text-sm font-bold uppercase tracking-wide text-[#8a5a00]">Propuesta de Planitec. La Contraloría no publicó este formato.</p>
      {children}
    </div>
  );
}

function Oficial({ titulo, texto, href, enlace }: { titulo: string; texto: string; href: string; enlace: string }) {
  return (
    <div className="space-y-2 border border-line bg-ice p-3 text-sm leading-6 text-ink">
      <p className="font-condensed text-sm font-bold uppercase tracking-wide text-petrol">Formato de la Contraloría</p>
      <p className="font-semibold text-petrol">{titulo}</p>
      <p>{texto}</p>
      <a className="inline-flex min-h-11 items-center font-semibold text-petrol underline" href={href} target="_blank" rel="noreferrer">
        {enlace}
      </a>
    </div>
  );
}

export function GraficaTransferencia() {
  const [ambito, setAmbito] = useState<"regional" | "municipal">("regional");
  const [cese, setCese] = useState(CESE_REGIONAL_MUNICIPAL);
  const [proclamacion, setProclamacion] = useState("");
  const [abierto, setAbierto] = useState<HitoGrafica | null>(null);
  const [norma, setNorma] = useState<HitoGrafica | null>(null);
  const lugar: LugarModelo = ambito === "regional" ? "regional" : "provincial";
  const hitos = useMemo(() => hitosRegionales(cese, proclamacion), [cese, proclamacion]);
  const meses = mesesCubiertos(hitos.map((hito) => hito.fecha));
  const sinFecha = hitos.filter((hito) => !hito.fecha);

  return (
    <section className="space-y-3" aria-labelledby="grafica-titulo">
      <div className="border border-line border-t-4 border-t-gold bg-white p-4">
        <h2 id="grafica-titulo" className="font-condensed text-3xl font-bold uppercase tracking-wide text-petrol">Transferencia regional y municipal</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink">
          Cronograma de un gobierno regional o una municipalidad. Las fechas salen de la Directiva N.° 016-2022-CG/PREVI, versión integrada con la Resolución de Contraloría N.° 344-2026-CG.
          El cese ordinario es el 31 de diciembre. Planitec no redactó esa norma.
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Tipo de entidad">
          <button type="button" aria-pressed={ambito === "regional"} className={`min-h-11 px-3 font-condensed text-lg font-bold uppercase ${ambito === "regional" ? "bg-petrol text-white" : "bg-ice text-petrol"}`} onClick={() => setAmbito("regional")}>Gobierno regional</button>
          <button type="button" aria-pressed={ambito === "municipal"} className={`min-h-11 px-3 font-condensed text-lg font-bold uppercase ${ambito === "municipal" ? "bg-petrol text-white" : "bg-ice text-petrol"}`} onClick={() => setAmbito("municipal")}>Municipalidad</button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-semibold text-petrol">
            Cese, último día de gestión
            <input className="field mt-1" type="date" value={cese} onChange={(event) => setCese(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-petrol">
            Proclamación
            <input className="field mt-1" type="date" value={proclamacion} onChange={(event) => setProclamacion(event.target.value)} />
          </label>
        </div>
        <p className="mt-2 text-sm leading-6 text-ink">
          El cese mueve el ETTS, el cierre, los informes y el acta. El corte inicial queda el 30 de setiembre de ese año. La proclamación mueve el ETTE y la comisión. Los días son hábiles: sin sábados, domingos ni feriados nacionales. Los plazos de una municipalidad provincial y una distrital son los mismos.
        </p>
      </div>
      <div className="overflow-x-auto border border-line bg-white">
        <div className="flex min-w-[980px] items-stretch">
          {meses.map((mes) => (
            <div key={mes} className="flex min-w-44 flex-1 flex-col border-r border-line last:border-r-0">
              <h3 className="bg-petrol px-2 py-2 text-center font-condensed text-lg font-bold uppercase tracking-wide text-white">{etiquetaMes(mes)}</h3>
              <div className="flex flex-1 flex-col gap-2 border-t-4 border-t-gold bg-ice p-2">
                {hitos.filter((hito) => hito.fecha?.startsWith(mes)).map((hito) => (
                  <TarjetaHito key={hito.id} hito={hito} onModelo={() => setAbierto(hito)} onNorma={() => setNorma(hito)} />
                ))}
              </div>
            </div>
          ))}
          {sinFecha.length > 0 && (
            <div className="flex min-w-44 flex-1 flex-col">
              <h3 className="bg-petrol px-2 py-2 text-center font-condensed text-lg font-bold uppercase tracking-wide text-white">Sin fecha</h3>
              <div className="flex flex-1 flex-col gap-2 border-t-4 border-t-gold bg-ice p-2">
                {sinFecha.map((hito) => (
                  <TarjetaHito key={hito.id} hito={hito} sinFecha onModelo={() => setAbierto(hito)} onNorma={() => setNorma(hito)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {abierto && <DetalleHito hito={abierto} lugar={lugar} onClose={() => setAbierto(null)} onNorma={() => setNorma(abierto)} />}
      {norma && <NormaHito hito={norma} onClose={() => setNorma(null)} />}
    </section>
  );
}

function TarjetaHito({ hito, sinFecha, onModelo, onNorma }: { hito: HitoGrafica; sinFecha?: boolean; onModelo: () => void; onNorma: () => void }) {
  return (
    <div className={`border bg-white p-2 ${sinFecha ? "border-line" : "border-[#c98900] border-t-4 border-t-gold"}`}>
      <div className="flex items-start justify-between gap-1">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onModelo}>
          {!sinFecha && <span className="block font-condensed text-sm font-bold uppercase tracking-wide text-[#8a5a00]">{etiquetaPlazo(hito.fecha)}</span>}
          <span className="mt-1 block font-semibold leading-5 text-petrol">{hito.titulo}</span>
        </button>
        <Hojita etapa={hito.titulo} onClick={onNorma} />
      </div>
      <p className="mt-1 text-xs leading-4 text-ink">{sinFecha ? "Falta la fecha de proclamación." : hito.quien}</p>
    </div>
  );
}

function NormaHito({ hito, onClose }: { hito: HitoGrafica; onClose: () => void }) {
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
      <div role="dialog" aria-modal="true" aria-labelledby="norma-hito" className="mx-auto w-full max-w-3xl border border-line bg-white" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-3 bg-petrol px-4 py-3 text-white">
          <div>
            <p className="font-condensed text-sm font-bold uppercase tracking-widest text-gold">Norma</p>
            <h3 id="norma-hito" className="font-condensed text-2xl font-bold uppercase leading-none">{hito.titulo}</h3>
          </div>
          <button type="button" className="min-h-11 shrink-0 bg-gold px-3 font-condensed text-lg font-bold uppercase text-petrol" onClick={onClose}>Cerrar</button>
        </header>
        <p className="border-b border-line px-4 py-2 text-sm leading-5 text-ink">
          Captura de la Directiva N.° 016-2022-CG/PREVI, versión integrada. Ese texto ya incluye lo modificado por la Resolución de Contraloría N.° 344-2026-CG.
        </p>
        <div className="space-y-4 p-3">
          {hito.capturas.map((captura, indiceCaptura) => (
            <Captura key={`${captura.pagina}-${captura.nota}`} captura={captura} primera={indiceCaptura === 0 ? primera : undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DetalleHito({ hito, lugar, onClose, onNorma }: { hito: HitoGrafica; lugar: LugarModelo; onClose: () => void; onNorma: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/55 p-3 sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="detalle-hito" className="mx-auto w-full max-w-3xl border border-line bg-white" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-3 bg-petrol px-4 py-3 text-white">
          <div>
            <p className="font-condensed text-sm font-bold uppercase tracking-widest text-gold">{etiquetaPlazo(hito.fecha)}</p>
            <h3 id="detalle-hito" className="font-condensed text-2xl font-bold uppercase leading-none">{hito.titulo}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Hojita etapa={hito.titulo} onClick={onNorma} />
            <button type="button" className="min-h-11 bg-gold px-3 font-condensed text-lg font-bold uppercase text-petrol" onClick={onClose}>Cerrar</button>
          </div>
        </header>
        <div className="space-y-3 p-3">
          <p className="text-sm leading-6 text-ink">{hito.detalle} Le toca a: {hito.quien}.</p>
          <ModeloHito clase={hito.modelo} lugar={lugar} />
        </div>
      </div>
    </div>
  );
}

function Captura({ captura, primera }: { captura: CapturaNormaDato; primera?: React.RefObject<HTMLSpanElement | null> }) {
  return (
    <figure>
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
            ref={primera && indice === 0 ? primera : undefined}
            className="pointer-events-none absolute border-[3px] border-[#a56b00]"
            style={{ top: `${marca.top}%`, left: `${marca.left}%`, width: `${marca.width}%`, height: `${marca.height}%` }}
          >
            <span className="absolute inset-0 bg-[#ffe14a] mix-blend-multiply" />
          </span>
        ))}
      </div>
    </figure>
  );
}
