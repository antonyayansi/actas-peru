"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fechaCorta, miles, porcentajeTexto } from "@/lib/text";
import type { Autoridad, FuentePublicacion, ResumenTipo } from "@/lib/types";

interface DistritoOpt {
  lugarId: string;
  nombre: string;
  esCapitalProvincial: boolean;
  suplemento: boolean;
  nota: string | null;
}
interface ProvinciaOpt {
  codigo: string;
  nombre: string;
  distritos: DistritoOpt[];
}
interface DepartamentoOpt {
  codigo: string;
  nombre: string;
  provincias: ProvinciaOpt[];
}
interface Catalogo {
  departamentos: DepartamentoOpt[];
  denominador: { fuentes: { nombre: string; detalle: string; url: string }[] };
}
interface Resultado {
  id: string;
  ambito: string | null;
  estado: string;
  estadoEtiqueta: string;
  titulo: string;
  lugar: string;
  jee: string | null;
  fechaActa: string | null;
  fechaListado: string | null;
  fechaListadoEsFutura: boolean;
  autoridad: Autoridad | null;
  pdfUrl: string | null;
  transmisionUrl: string | null;
  nota: string | null;
  fuentes: FuentePublicacion[];
  esCapitalProvincial: boolean;
}
interface Ingestion {
  listingStatus: string;
  listingError: string | null;
  declaredTotal: number | null;
  filas: number;
  pdfConRuta: number;
  pdfOk: number;
  pdfRevision: number;
  pdfError: number;
  pdfSinDescargar: number;
  trabajando: boolean;
  listingSyncedLabel: string | null;
  ultimoAvanceLabel: string | null;
  intervalMinutes: number;
  datosValidos: boolean;
}
interface Payload {
  listo: boolean;
  mensaje?: string;
  resultados?: Resultado[];
  total?: number;
  pagina?: number;
  paginas?: number;
  resumen?: {
    cierre: boolean;
    motivoSinCierre: string | null;
    catalogoAlineado: boolean;
    datosValidos: boolean;
    tipos: ResumenTipo[];
    textos: string[];
    documentosSinTerritorio: number;
    actasParcialesRegionales: number;
  };
  ingestion?: Ingestion;
  aviso?: string | null;
  ubigeo?: { archivo: string; nota: string };
}

const AMBITO: Record<string, string> = {
  distrital: "Municipal distrital",
  provincial: "Municipal provincial",
  regional: "Regional",
  regional_parcial: "Cómputo regional parcial",
};

function toneFor(estado: string): "ok" | "wait" | "miss" | "info" {
  if (estado === "acta_publicada") return "ok";
  if (estado === "sin_publicacion_encontrada" || estado === "error_fuente") return "miss";
  if (estado === "capital") return "info";
  return "wait";
}

export function Searcher() {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [provincia, setProvincia] = useState("");
  const [distrito, setDistrito] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [estado, setEstado] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/catalogo")
      .then((response) => response.json())
      .then(setCatalogo)
      .catch(() => setError("No se pudo cargar el catálogo territorial."));
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => setQ(draft), 280);
    return () => clearTimeout(handle);
  }, [draft]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (departamento) params.set("departamento", departamento);
    if (provincia) params.set("provincia", provincia);
    if (distrito) params.set("distrito", distrito);
    if (tipo !== "todos") params.set("tipo", tipo);
    if (estado !== "todos") params.set("estado", estado);
    params.set("pagina", String(pagina));
    const controller = new AbortController();
    setCargando(true);
    fetch(`/api/buscar?${params.toString()}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: Payload) => {
        setData(payload);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError("No se pudo consultar el índice. Si había datos, no se reemplazaron por ceros.");
      })
      .finally(() => setCargando(false));
    return () => controller.abort();
  }, [q, departamento, provincia, distrito, tipo, estado, pagina, revision]);

  useEffect(() => {
    const ingestion = data?.ingestion;
    if (!ingestion) return;
    if (!ingestion.trabajando && ingestion.pdfSinDescargar <= 0) return;
    const timer = setInterval(() => setRevision((current) => current + 1), 15000);
    return () => clearInterval(timer);
  }, [data?.ingestion]);

  const provincias = useMemo(
    () => catalogo?.departamentos.find((item) => item.codigo === departamento)?.provincias ?? [],
    [catalogo, departamento],
  );
  const distritos = useMemo(
    () => provincias.find((item) => item.codigo === provincia)?.distritos ?? [],
    [provincias, provincia],
  );

  const resumen = data?.resumen;
  const ingestion = data?.ingestion;
  const pdfMax = Math.max(ingestion?.pdfConRuta || 0, 1);
  const pdfHechos = (ingestion?.pdfOk || 0) + (ingestion?.pdfRevision || 0) + (ingestion?.pdfError || 0);

  return (
    <div className="space-y-6">
      <form
        className="rounded-3xl border border-line bg-card p-4 shadow-[0_12px_40px_rgba(28,40,36,0.05)] sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setQ(draft);
          setPagina(1);
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="q" className="mb-1 block text-sm font-semibold">
              Buscar lugar, alcalde u organización
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-lagoon" aria-hidden />
              <input
                id="q"
                className="field pl-10"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setPagina(1);
                }}
                placeholder="Ej. Challabamba, Sullana, Acción Popular"
                autoComplete="off"
              />
            </div>
            <p className="mt-1 text-sm text-ink/70">Puede escribir con o sin tildes. Quispicanchi no es lo mismo que Paucartambo.</p>
          </div>
          <div>
            <label htmlFor="departamento" className="mb-1 block text-sm font-semibold">Departamento</label>
            <select
              id="departamento"
              className="field"
              value={departamento}
              onChange={(event) => {
                setDepartamento(event.target.value);
                setProvincia("");
                setDistrito("");
                setPagina(1);
              }}
            >
              <option value="">Todos</option>
              {catalogo?.departamentos.map((item) => (
                <option key={item.codigo} value={item.codigo}>{item.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="provincia" className="mb-1 block text-sm font-semibold">Provincia</label>
            <select
              id="provincia"
              className="field"
              value={provincia}
              disabled={!departamento}
              onChange={(event) => {
                setProvincia(event.target.value);
                setDistrito("");
                setPagina(1);
              }}
            >
              <option value="">Todas</option>
              {provincias.map((item) => (
                <option key={item.codigo} value={item.codigo}>{item.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="distrito" className="mb-1 block text-sm font-semibold">Distrito</label>
            <select
              id="distrito"
              className="field"
              value={distrito}
              disabled={!provincia}
              onChange={(event) => {
                setDistrito(event.target.value);
                setPagina(1);
              }}
            >
              <option value="">Todos</option>
              {distritos.map((item) => (
                <option key={item.lugarId} value={item.lugarId}>
                  {item.nombre}
                  {item.esCapitalProvincial ? " · capital" : ""}
                  {item.suplemento ? " · nuevo" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tipo" className="mb-1 block text-sm font-semibold">Tipo</label>
              <select id="tipo" className="field" value={tipo} onChange={(event) => { setTipo(event.target.value); setPagina(1); }}>
                <option value="todos">Todos</option>
                <option value="distrital">Distrital</option>
                <option value="provincial">Provincial</option>
                <option value="regional">Regional</option>
              </select>
            </div>
            <div>
              <label htmlFor="estado" className="mb-1 block text-sm font-semibold">Estado</label>
              <select id="estado" className="field" value={estado} onChange={(event) => { setEstado(event.target.value); setPagina(1); }}>
                <option value="todos">Todos</option>
                <option value="con_acta">Con acta ubicada</option>
                <option value="sin_acta">Sin acta en el índice</option>
                <option value="pendiente">Pendientes de lectura</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit">Buscar</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft("");
              setQ("");
              setDepartamento("");
              setProvincia("");
              setDistrito("");
              setTipo("todos");
              setEstado("todos");
              setPagina(1);
            }}
          >
            Limpiar
          </Button>
        </div>
      </form>

      {error && (
        <p role="alert" className="rounded-2xl border border-clay/30 bg-[#f8ece7] px-4 py-3 text-sm">
          <AlertTriangle className="mr-2 inline size-4" aria-hidden />
          {error}
        </p>
      )}
      {data?.aviso && (
        <p role="status" className="rounded-2xl border border-[#e2c98a] bg-[#fbf6ea] px-4 py-3 text-sm">
          {data.aviso}
        </p>
      )}
      {data && !data.listo && (
        <p role="status" className="rounded-2xl bg-card px-4 py-3 text-sm">{data.mensaje}</p>
      )}

      <section aria-live="polite" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-serif text-2xl">Del total, cuánto ya se ubicó</h2>
          {cargando && <span className="text-sm text-ink/60">Actualizando…</span>}
        </div>
        {!resumen?.datosValidos && data?.listo === false ? null : (
          <div className="grid gap-3 sm:grid-cols-3">
            {(resumen?.tipos || []).filter((tipo) => tipo.esperados !== 0).map((tipo) => (
              <article key={tipo.ambito} className="rounded-3xl border border-line bg-card p-4">
                <p className="text-sm capitalize text-ink/70">{tipo.etiqueta}</p>
                <p className="mt-2 font-serif text-3xl">
                  {tipo.conActa === null ? "—" : miles(tipo.conActa)}
                  <span className="text-lg text-ink/50"> / {tipo.esperados === null ? "pendiente" : miles(tipo.esperados)}</span>
                </p>
                <p className="mt-2 text-sm">
                  {tipo.porcentaje === null
                    ? "Porcentaje no calculado"
                    : porcentajeTexto(tipo.porcentaje)}
                </p>
                <p className="mt-1 text-sm text-ink/70">
                  {tipo.sinPublicacionEncontrada === null
                    ? "Sin publicación encontrada: aún no cerrada"
                    : `Sin publicación encontrada: ${miles(tipo.sinPublicacionEncontrada)}`}
                </p>
              </article>
            ))}
          </div>
        )}
        <div className="space-y-2 text-sm leading-6 text-ink/80">
          {resumen?.textos.map((linea) => (
            <p key={linea}>{linea}</p>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-card p-4 sm:p-5">
        <h2 className="font-serif text-xl">Salud de la ingestión</h2>
        <p className="mt-1 text-sm text-ink/70">
          Esto mide la lectura del listado y de los PDF. No es el porcentaje de proclamaciones del país.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>PDFs procesados</span>
              <span>{ingestion ? `${miles(pdfHechos)} / ${miles(ingestion.pdfConRuta)}` : "—"}</span>
            </div>
            <progress value={ingestion ? pdfHechos : 0} max={pdfMax} aria-label="Avance de lectura de PDF" />
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div><dt className="text-ink/60">Filas del listado</dt><dd className="font-semibold">{ingestion ? miles(ingestion.filas) : "—"}</dd></div>
            <div><dt className="text-ink/60">Declaradas por la fuente</dt><dd className="font-semibold">{ingestion?.declaredTotal ? miles(ingestion.declaredTotal) : "—"}</dd></div>
            <div><dt className="text-ink/60">Con territorio</dt><dd className="font-semibold">{ingestion ? miles(ingestion.pdfOk) : "—"}</dd></div>
            <div><dt className="text-ink/60">En revisión</dt><dd className="font-semibold">{ingestion ? miles(ingestion.pdfRevision) : "—"}</dd></div>
            <div><dt className="text-ink/60">Error de PDF</dt><dd className="font-semibold">{ingestion ? miles(ingestion.pdfError) : "—"}</dd></div>
            <div><dt className="text-ink/60">Sin descargar</dt><dd className="font-semibold">{ingestion ? miles(ingestion.pdfSinDescargar) : "—"}</dd></div>
          </dl>
        </div>
        <p className="mt-3 text-sm">
          Última sincronización exitosa: {ingestion?.listingSyncedLabel || "todavía no"}.
          {" "}Revisión prevista cada {ingestion?.intervalMinutes || 30} minutos en el servidor, hora de Lima (UTC−5).
          {ingestion?.trabajando ? " La lectura sigue en este momento." : ""}
          {ingestion?.ultimoAvanceLabel ? ` Último avance: ${ingestion.ultimoAvanceLabel}.` : ""}
        </p>
        {ingestion?.listingError && <p className="mt-2 text-sm text-clay">{ingestion.listingError}</p>}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl">Resultados</h2>
          <p className="text-sm text-ink/70">{data?.total === undefined ? "" : `${miles(data.total)} coincidencias`}</p>
        </div>
        {data?.listo && data.total === 0 && (
          <p className="rounded-2xl bg-card px-4 py-5 text-sm leading-6">
            Ningún ámbito coincide con esa búsqueda.
            {ingestion && ingestion.pdfSinDescargar > 0
              ? " Si el lugar ya tiene acta, puede aparecer cuando termine de leerse su PDF. Mientras tanto puede buscar por el nombre del jurado."
              : ""}
          </p>
        )}
        <ol className="space-y-3">
          {(data?.resultados || []).map((item) => (
            <li key={item.id} className="rounded-3xl border border-line bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-lagoon">
                    {item.ambito ? AMBITO[item.ambito] || item.ambito : "Evento del listado"}
                  </p>
                  <h3 className="font-serif text-2xl">{item.titulo}</h3>
                  <p className="text-sm text-ink/75">{item.lugar}</p>
                </div>
                <Badge tone={toneFor(item.estado)}>{item.estadoEtiqueta}</Badge>
              </div>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {item.autoridad && (
                  <div>
                    <dt className="text-ink/60">{item.autoridad.cargo}</dt>
                    <dd className="font-semibold">{item.autoridad.nombre}</dd>
                    {item.autoridad.organizacion && <dd>{item.autoridad.organizacion}</dd>}
                  </div>
                )}
                <div>
                  <dt className="text-ink/60">Fecha del acta</dt>
                  <dd>{fechaCorta(item.fechaActa) || "No leída"}</dd>
                </div>
                {item.jee && (
                  <div>
                    <dt className="text-ink/60">Jurado que publica</dt>
                    <dd>{item.jee}</dd>
                  </div>
                )}
                {item.fechaListadoEsFutura && (
                  <div>
                    <dt className="text-ink/60">Fecha en el listado</dt>
                    <dd>Posterior a hoy. No confirma la proclamación.</dd>
                  </div>
                )}
              </dl>
              {item.nota && <p className="mt-3 text-sm leading-6 text-ink/80">{item.nota}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {item.pdfUrl && (
                  <Button asChild>
                    <a href={item.pdfUrl} target="_blank" rel="noreferrer">
                      <FileText className="size-4" aria-hidden />
                      PDF en el portal del JNE
                    </a>
                  </Button>
                )}
                {item.transmisionUrl && (
                  <Button asChild variant="outline">
                    <a href={item.transmisionUrl} target="_blank" rel="noreferrer">Transmisión anunciada</a>
                  </Button>
                )}
              </div>
              {item.fuentes.length > 0 && (
                <p className="mt-3 text-xs text-ink/55">
                  Fuente: listado público de proclamación ERM 2026, fila {item.fuentes.map((fuente) => fuente.idProclamacion).join(", ")}.
                </p>
              )}
            </li>
          ))}
        </ol>
        {data && (data.paginas || 1) > 1 && (
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" disabled={pagina <= 1} onClick={() => setPagina((current) => Math.max(1, current - 1))}>
              Anterior
            </Button>
            <p className="text-sm">Página {data.pagina} de {data.paginas}</p>
            <Button type="button" variant="outline" disabled={pagina >= (data.paginas || 1)} onClick={() => setPagina((current) => current + 1)}>
              Siguiente
            </Button>
          </div>
        )}
      </section>

      <section id="fuentes" className="space-y-3 text-sm leading-6">
        <h2 className="font-serif text-2xl">Fuentes y reglas</h2>
        <p>
          El listado sale del cuadro público de proclamación ERM 2026. Cada fila es un evento de un jurado electoral especial, no una municipalidad. El territorio se lee del PDF. Por eso Challabamba, Caicay, Colquepata y Huancarani, en la provincia de Paucartambo, Cusco, pueden figurar bajo el JEE Quispicanchi.
        </p>
        <p>
          Una fila con fecha futura y sin PDF no se cuenta como proclamación pendiente. Un acta regional descentralizada informa el cómputo de algunas provincias y no proclama al gobernador. El distrito capital de cada provincia no tiene municipalidad distrital aparte: la elige la municipalidad provincial. Las municipalidades de centros poblados no entran en este proceso.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          {catalogo?.denominador.fuentes.map((fuente) => (
            <li key={fuente.nombre}>
              <a className="font-semibold text-lagoon underline-offset-2 hover:underline" href={fuente.url}>{fuente.nombre}</a>
              {". "}{fuente.detalle}
            </li>
          ))}
          <li>
            Ubigeos INEI en la Plataforma Nacional de Datos Abiertos. {data?.ubigeo?.archivo} {data?.ubigeo?.nota}
          </li>
        </ul>
      </section>
    </div>
  );
}
