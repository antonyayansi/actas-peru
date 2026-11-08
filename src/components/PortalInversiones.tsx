"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cuiDe, esLegacy, numero, sumarPresentes, type Celda, type Fila, type LibroRepOpmi } from "@/lib/inversiones/parse";

interface Infobra {
  cui: string;
  codigoInfobras: string | null;
  nombre: string | null;
  estado: string | null;
  anioAvance: string | null;
  mesAvance: string | null;
  fechaRegistro: string | null;
  fisicoRealTexto: string | null;
}

interface Carga {
  libro: LibroRepOpmi;
  infobras: { aviso: string; cui: number; filas: number; obras: Infobra[] } | null;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];

function soles(valor: Celda): string {
  const n = numero(valor);
  if (n == null) return "Sin dato";
  return new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function porcentaje(valor: Celda): string {
  const n = numero(valor);
  if (n == null) return "Sin dato";
  return `${n.toFixed(2).replace(".", ",")} %`;
}

function texto(valor: Celda): string {
  if (valor == null || valor === "") return "Sin dato";
  return String(valor);
}

export function PortalInversiones() {
  const [entidad, setEntidad] = useState("cotabambas");
  const [carga, setCarga] = useState<Carga | null>(null);
  const [subida, setSubida] = useState<Carga | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opmi, setOpmi] = useState("");
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("todos");
  const [soloPropio, setSoloPropio] = useState(true);
  const [cui, setCui] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [vista, setVista] = useState<"cartera" | "ficha" | "acta">("cartera");

  useEffect(() => {
    const guardado = localStorage.getItem("logo-entidad-piloto");
    if (guardado) setLogo(guardado);
  }, []);

  useEffect(() => {
    if (entidad === "cargada") return;
    const control = new AbortController();
    setError(null);
    fetch(`/api/inversiones?entidad=${entidad}`, { signal: control.signal })
      .then(async (respuesta) => {
        const cuerpo = await respuesta.json();
        if (!respuesta.ok) throw new Error(cuerpo.error || "No se pudo abrir la cartera.");
        setCarga(cuerpo);
        setCui(null);
        setVista("cartera");
      })
      .catch((causa: unknown) => {
        if (causa instanceof DOMException && causa.name === "AbortError") return;
        setError(causa instanceof Error ? causa.message : "No se pudo abrir la cartera.");
      });
    return () => control.abort();
  }, [entidad]);

  const libro = entidad === "cargada" ? subida?.libro ?? null : carga?.libro ?? null;
  const infobras = entidad === "cargada" ? subida?.infobras ?? null : carga?.infobras ?? null;

  const filas = useMemo(() => {
    if (!libro) return [];
    return libro.inversiones.filter((fila) => {
      if (soloPropio && libro.pliegoPropio && fila.celdas.pliego_entidad_uei_uf !== libro.pliegoPropio) return false;
      if (estado !== "todos" && fila.celdas.estado !== estado) return false;
      if (!q.trim()) return true;
      const pila = `${cuiDe(fila) || ""} ${fila.celdas.codigo_snip || ""} ${fila.celdas.nombre_de_la_inversion || ""}`.toLowerCase();
      return pila.includes(q.trim().toLowerCase());
    });
  }, [libro, q, estado, soloPropio]);

  const elegida = libro?.inversiones.find((fila) => (cuiDe(fila) || `snip-${fila.celdas.codigo_snip}`) === cui) ?? null;

  const estados = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const fila of filas) {
      const nombre = texto(fila.celdas.estado);
      mapa.set(nombre, (mapa.get(nombre) || 0) + 1);
    }
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  }, [filas]);

  const meses = useMemo(() => {
    return MESES.map((mes) => {
      const clave = `devengado_2026_${mes}`;
      return { mes, ...sumarPresentes(filas, clave) };
    });
  }, [filas]);
  const maxMes = Math.max(...meses.map((mes) => mes.suma), 1);

  async function importar(archivo: File) {
    setError(null);
    const cuerpo = new FormData();
    cuerpo.set("archivo", archivo);
    cuerpo.set("opmi", opmi);
    const respuesta = await fetch("/api/inversiones/importar", { method: "POST", body: cuerpo });
    const data = await respuesta.json();
    if (!respuesta.ok) {
      setError(data.error || "El archivo no pasó la validación.");
      return;
    }
    setSubida(data);
    setEntidad("cargada");
    setCui(null);
  }

  function cargarLogo(archivo: File) {
    const lector = new FileReader();
    lector.onload = () => {
      const url = String(lector.result || "");
      setLogo(url);
      localStorage.setItem("logo-entidad-piloto", url);
    };
    lector.readAsDataURL(archivo);
  }

  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="no-imprimir border-b-4 border-gold">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-3 py-4 sm:flex-row sm:items-center sm:px-5">
          <img src="/planitec-pro.png" alt="Planitec Pro" className="h-16 w-16 object-contain" />
          <div className="min-w-0 flex-1">
            <p className="font-condensed text-sm font-semibold uppercase tracking-wide text-petrol">Planitec Perú · Mg. Fiorela Aguilar Merma</p>
            <h1 className="font-condensed text-3xl font-bold uppercase text-petrol sm:text-4xl">Cartera de inversiones para la transferencia</h1>
            <p className="text-sm text-muted">Piloto de trabajo. No es un reporte del MEF ni de la Contraloría, ni reemplaza el buscador de actas.</p>
          </div>
          {logo && <img src={logo} alt="Logo cargado por el usuario para la entidad" className="h-16 w-16 object-contain" />}
          <Link href="/" className="text-sm font-semibold text-petrol underline decoration-gold">Volver a actas</Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] space-y-4 px-3 py-4 sm:px-5">
        <section className="no-imprimir grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="panel p-4">
            <h2 className="font-condensed text-2xl font-bold uppercase text-petrol">Entidad</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant={entidad === "cotabambas" ? "default" : "outline"} onClick={() => setEntidad("cotabambas")}>Cotabambas · OPMI 23407</Button>
              <Button type="button" variant={entidad === "paruro" ? "default" : "outline"} onClick={() => setEntidad("paruro")}>Paruro · OPMI 21572</Button>
              {subida && <Button type="button" variant={entidad === "cargada" ? "default" : "outline"} onClick={() => setEntidad("cargada")}>Excel cargado</Button>}
            </div>
            <p className="mt-3 text-sm leading-6">
              {libro ? `${libro.entidad}. ${libro.exportadoEn || "Sin fecha de exportación"}.` : "Cargando cartera…"}
              {" "}El código OPMI sale de la URL pública del reporte, no de una columna del Excel. El RUC no viene en este archivo.
            </p>
            {libro && <a className="text-sm font-semibold text-petrol underline decoration-gold" href={libro.fuenteUrl}>Abrir el RepOpmi público de esta OPMI</a>}
          </div>
          <form className="panel space-y-2 p-4" onSubmit={(evento) => evento.preventDefault()}>
            <h2 className="font-condensed text-2xl font-bold uppercase text-petrol">Probar otro Excel oficial</h2>
            <label className="block text-sm" htmlFor="opmi">Código OPMI de la descarga</label>
            <input id="opmi" className="field" inputMode="numeric" value={opmi} onChange={(evento) => setOpmi(evento.target.value)} placeholder="Ej. 23407" />
            <input className="block w-full text-sm" type="file" accept=".xlsx" onChange={(evento) => {
              const archivo = evento.target.files?.[0];
              if (archivo) void importar(archivo);
            }} />
            <label className="block text-sm" htmlFor="logo">Logo de la entidad, solo para esta pantalla</label>
            <input id="logo" className="block w-full text-sm" type="file" accept="image/*" onChange={(evento) => {
              const archivo = evento.target.files?.[0];
              if (archivo) cargarLogo(archivo);
            }} />
            <p className="text-xs leading-5 text-muted">El logo que cargue no es un sello ni una firma. No acredita conformidad del MEF, la Contraloría ni la municipalidad.</p>
          </form>
        </section>

        {error && <p role="alert" className="border border-[#e7b2a8] bg-white px-4 py-3 text-sm">{error}</p>}

        {libro && (
          <>
            <section className="no-imprimir grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Dato titulo="Registros" valor={String(filas.length)} nota={soloPropio ? "Pliego propio del filtro" : "Todos los pliegos del archivo"} />
              <Dato titulo="PIM 2026" valor={soles(sumarPresentes(filas, "pim_2026").suma)} nota={`${sumarPresentes(filas, "pim_2026").presentes} con dato`} />
              <Dato titulo="Devengado 2026" valor={soles(sumarPresentes(filas, "devengado_2026").suma)} nota="No es el avance físico" />
              <Dato titulo="Sin PIA 2026" valor={String(filas.filter((fila) => fila.celdas.pia_2026 == null).length)} nota="Vacío, no cero" />
            </section>

            <section className="no-imprimir grid gap-3 lg:grid-cols-2">
              <article className="panel p-4">
                <h2 className="font-condensed text-xl font-bold uppercase text-petrol">Devengado mensual 2026</h2>
                <ul className="mt-3 space-y-1">
                  {meses.map((mes) => (
                    <li key={mes.mes}>
                      <div className="flex justify-between text-xs"><span className="capitalize">{mes.mes}</span><span>{mes.presentes ? soles(mes.suma) : "Sin dato"}</span></div>
                      <div className="h-2 bg-ice"><div className="h-full bg-gold" style={{ width: `${mes.presentes ? (mes.suma / maxMes) * 100 : 0}%` }} /></div>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="panel p-4">
                <h2 className="font-condensed text-xl font-bold uppercase text-petrol">Estado en el Banco de Inversiones</h2>
                <p className="text-sm text-muted">No es el estado físico de la obra.</p>
                <ul className="mt-3 space-y-2">
                  {estados.map(([nombre, cantidad]) => (
                    <li key={nombre}>
                      <div className="flex justify-between text-sm"><span>{nombre}</span><span>{cantidad}</span></div>
                      <div className="h-2 bg-ice"><div className="h-full bg-petrol" style={{ width: `${(cantidad / Math.max(filas.length, 1)) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
              </article>
            </section>

            <section className="no-imprimir panel p-4">
              <div className="flex flex-wrap gap-2">
                <input className="field max-w-xs" value={q} onChange={(evento) => setQ(evento.target.value)} placeholder="CUI, SNIP o nombre" aria-label="Buscar inversión" />
                <select className="field max-w-[12rem]" value={estado} onChange={(evento) => setEstado(evento.target.value)} aria-label="Estado">
                  <option value="todos">Todos los estados</option>
                  <option value="ACTIVO">Activo</option>
                  <option value="CERRADO">Cerrado</option>
                  <option value="DESACTIVADO TEMPORAL">Desactivado temporal</option>
                </select>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={soloPropio} onChange={(evento) => setSoloPropio(evento.target.checked)} /> Solo el pliego más frecuente del archivo</label>
              </div>
              <div className="mt-3 max-h-[28rem] overflow-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="sticky top-0 bg-white text-petrol">
                    <tr>
                      <th className="px-2 py-2">Código</th><th className="px-2">Inversión</th><th className="px-2">Estado</th><th className="px-2">PIM 2026</th><th className="px-2">Devengado 2026</th><th className="px-2">Financiero</th><th className="px-2">Físico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((fila) => {
                      const id = cuiDe(fila) || `snip-${fila.celdas.codigo_snip}`;
                      return (
                        <tr key={id} className="cursor-pointer border-t border-line" onClick={() => { setCui(id); setVista("ficha"); }}>
                          <td className="whitespace-nowrap px-2 py-2 font-semibold">{cuiDe(fila) || `SNIP ${fila.celdas.codigo_snip}`}</td>
                          <td className="px-2">{texto(fila.celdas.nombre_de_la_inversion)}</td>
                          <td className="whitespace-nowrap px-2">{texto(fila.celdas.estado)}</td>
                          <td className="whitespace-nowrap px-2">{soles(fila.celdas.pim_2026)}</td>
                          <td className="whitespace-nowrap px-2">{soles(fila.celdas.devengado_2026)}</td>
                          <td className="whitespace-nowrap px-2">{porcentaje(fila.celdas.avance_financiero_acumulado)}</td>
                          <td className="whitespace-nowrap px-2">{porcentaje(fila.celdas.avance_fisico_de_la_inversion)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {elegida && (
              <Ficha
                libro={libro}
                fila={elegida}
                infobras={infobras?.obras.filter((obra) => obra.cui === cuiDe(elegida)) || []}
                avisoInfobras={infobras?.aviso || "No hay cruce INFOBRAS cargado para esta entidad. La ausencia de cruce no prueba que no exista obra."}
                logo={logo}
                vista={vista}
                onVista={setVista}
              />
            )}

            <section className="no-imprimir border border-line bg-ice p-4 text-sm leading-6">
              <h2 className="font-condensed text-xl font-bold uppercase text-petrol">Fuente, fecha y calidad</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {libro.calidad.map((nota) => <li key={nota}>{nota}</li>)}
                <li>Descarga del 8 de noviembre de 2026. No es la situación de hoy.</li>
                <li>Cotabambas en el archivo completo: 403 registros del pliego municipal y 12 de otros pliegos. PIM total S/ 146 089 453; devengado S/ 75 777 679,51. Del pliego municipal: PIM S/ 132 214 684; devengado S/ 68 123 352,91.</li>
                <li>El export SSI revisado rotula PIM 2023 y DEVENGADO 2023, pero en los CUI comunes los valores coinciden con 2026. No se renombra en silencio. Ese archivo no se mezcla aquí.</li>
                <li>Consulta Avanzada trae filas repetidas por lugar. No se suma dinero sobre esas filas. Los 57 desactivados temporales aparecen en RepOpmi y no en esa consulta geográfica.</li>
                <li>INFOBRAS, archivo público: {infobras ? `${infobras.cui} CUI y ${infobras.filas} obras` : "sin cruce para esta entidad"}. Un CUI sin match no está acreditado como inexistente.</li>
                <li>No hay marcadores de mapa: las coordenadas observadas no fueron verificadas y la descarga de GeoInvierte pide cuenta de ArcGIS.</li>
              </ul>
              <p className="mt-2">
                <a className="font-semibold text-petrol underline decoration-gold" href="https://ofi5.mef.gob.pe/ssi/ssi/Index">SSI</a>
                {" · "}
                <a className="font-semibold text-petrol underline decoration-gold" href="https://ofi5.mef.gob.pe/inviertePub/ConsultaPublica/ConsultaAvanzada">Consulta avanzada</a>
                {" · "}
                <a className="font-semibold text-petrol underline decoration-gold" href="https://ofi5.mef.gob.pe/invierte/pmi/consultapmi">Consulta PMI</a>
                {" · "}
                <a className="font-semibold text-petrol underline decoration-gold" href="https://infobras.contraloria.gob.pe/infobrasweb">INFOBRAS</a>
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Dato({ titulo, valor, nota }: { titulo: string; valor: string; nota: string }) {
  return (
    <article className="border border-line border-t-4 border-t-gold bg-white p-3">
      <p className="text-xs uppercase text-muted">{titulo}</p>
      <p className="font-condensed text-2xl font-bold text-petrol">{valor}</p>
      <p className="text-xs text-muted">{nota}</p>
    </article>
  );
}

function Ficha({
  libro,
  fila,
  infobras,
  avisoInfobras,
  logo,
  vista,
  onVista,
}: {
  libro: LibroRepOpmi;
  fila: Fila;
  infobras: Infobra[];
  avisoInfobras: string;
  logo: string | null;
  vista: "cartera" | "ficha" | "acta";
  onVista: (vista: "cartera" | "ficha" | "acta") => void;
}) {
  const id = cuiDe(fila);
  const et = libro.etDe.filter((item) => cuiDe(item) === id);
  const fisico = libro.avanceFisico.filter((item) => cuiDe(item) === id);
  const contratos = libro.contratos.filter((item) => cuiDe(item) === id);
  const codigo = id || `SNIP ${fila.celdas.codigo_snip} sin CUI`;
  return (
    <section id="ficha-impresion" className="border border-line bg-white p-4">
      <div className="no-imprimir mb-3 flex flex-wrap gap-2">
        <Button type="button" variant={vista === "ficha" ? "default" : "outline"} onClick={() => onVista("ficha")}>Ficha de verificación</Button>
        <Button type="button" variant={vista === "acta" ? "default" : "outline"} onClick={() => onVista("acta")}>Borrador de acta</Button>
        <Button type="button" variant="outline" onClick={() => window.print()}>Imprimir o guardar PDF</Button>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-petrol">Modelo de trabajo · no es cargo oficial ni conformidad</p>
          <h2 className="font-condensed text-3xl font-bold text-petrol">{vista === "acta" ? "Borrador de acta de verificación" : "Ficha de verificación"}</h2>
          <p className="text-sm">{codigo} · {texto(fila.celdas.nombre_de_la_inversion)}</p>
        </div>
        <img src={logo || "/planitec-pro.png"} alt={logo ? "Logo de la entidad cargado por el usuario" : "Planitec Pro"} className="h-16 w-16 object-contain" />
      </div>
      <p className="mt-2 text-sm">Elaborado como apoyo por Mg. Fiorela Aguilar Merma, Planitec Perú. Los datos son los del archivo RepOpmi citado. Este papel no sustituye la firma de los titulares ni el sello de la entidad.</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div><dt className="text-muted">Pliego del archivo</dt><dd>{texto(fila.celdas.pliego_entidad_uei_uf)}</dd></div>
        <div><dt className="text-muted">OPMI de la descarga</dt><dd>{libro.opmi || "No informado"}</dd></div>
        <div><dt className="text-muted">Unidad ejecutora de inversiones</dt><dd>{texto(fila.celdas.unidad_ejecutora_de_inversiones)}</dd></div>
        <div><dt className="text-muted">Unidad formuladora</dt><dd>{texto(fila.celdas.unidad_formuladora_de_inversiones)}</dd></div>
        <div><dt className="text-muted">RUC</dt><dd>No viene en este Excel. No se completa por inferencia.</dd></div>
        <div><dt className="text-muted">Exportación</dt><dd>{libro.exportadoEn || "Sin dato"}</dd></div>
        <div><dt className="text-muted">Costo actualizado</dt><dd>{soles(fila.celdas.costo_actualizado)}</dd></div>
        <div><dt className="text-muted">Monto viable</dt><dd>{soles(fila.celdas.monto_viable)}</dd></div>
        <div><dt className="text-muted">Avance financiero acumulado</dt><dd>{porcentaje(fila.celdas.avance_financiero_acumulado)}</dd></div>
        <div><dt className="text-muted">Avance de ejecución declarado</dt><dd>{porcentaje(fila.celdas.avance_de_ejecucion_de_la_inversion)} · fórmula no documentada en el archivo</dd></div>
        <div><dt className="text-muted">Avance físico de la inversión</dt><dd>{porcentaje(fila.celdas.avance_fisico_de_la_inversion)}</dd></div>
        <div><dt className="text-muted">Estado del banco</dt><dd>{texto(fila.celdas.estado)} · {texto(fila.celdas.situacion)}</dd></div>
      </dl>
      {esLegacy(fila) && <p className="mt-2 text-sm">Registro legado: código SNIP {texto(fila.celdas.codigo_snip)} sin CUI. Se conserva así.</p>}
      <h3 className="mt-4 font-condensed text-xl font-bold uppercase text-petrol">ET / DE</h3>
      {et.length === 0 ? <p className="text-sm">Sin filas ET/DE en este export.</p> : (
        <ul className="space-y-1 text-sm">{et.map((item) => <li key={item.fila}>{texto(item.celdas.descripcion_de_et_de)} · {texto(item.celdas.etapa_del_et_de)} · hito {texto(item.celdas.fecha_del_ultimo_hito_del_et_de)}</li>)}</ul>
      )}
      <h3 className="mt-4 font-condensed text-xl font-bold uppercase text-petrol">Historial físico</h3>
      {fisico.length === 0 ? <p className="text-sm">Sin historial físico en este export.</p> : (
        <ul className="space-y-1 text-sm">{fisico.map((item) => <li key={item.fila}>Periodo {texto(item.celdas.ultimo_periodo_registrado)} · línea {texto(item.celdas.linea_de_seguimiento)} · programado {porcentaje(item.celdas.programado_acumulado)} · real {porcentaje(item.celdas.real_acumulado)}</li>)}</ul>
      )}
      <h3 className="mt-4 font-condensed text-xl font-bold uppercase text-petrol">Ítems de contrato</h3>
      <p className="text-xs text-muted">Cada fila es un ítem. El monto contratado total puede repetirse. No se suma.</p>
      {contratos.length === 0 ? <p className="text-sm">Sin ítems de contrato en este export. Eso no acredita que no exista contrato.</p> : (
        <ul className="space-y-1 text-sm">{contratos.map((item) => <li key={item.fila}>{texto(item.celdas.descripcion_de_item)} · {texto(item.celdas.nombre_de_contratista)} · contrato {texto(item.celdas.n_contrato)} · total informado {soles(item.celdas.monto_contratado_total)}</li>)}</ul>
      )}
      <h3 className="mt-4 font-condensed text-xl font-bold uppercase text-petrol">INFOBRAS</h3>
      <p className="text-sm">{avisoInfobras}</p>
      {infobras.map((obra) => (
        <p key={obra.codigoInfobras || obra.nombre} className="text-sm">Obra {obra.codigoInfobras || "sin código"} · {obra.estado || "sin estado"} · avance textual «{obra.fisicoRealTexto || "sin dato"}» · mes {obra.mesAvance || "sin dato"} de {obra.anioAvance || "sin año"} · registro {obra.fechaRegistro || "sin fecha"}. No se equipara con el físico del MEF.</p>
      ))}
      {vista === "acta" && (
        <div className="mt-4 space-y-3 text-sm">
          <p className="bg-[#fff6d6] p-2 font-semibold">Espacio de trabajo. No es acta firmada, cargo, recepción ni conformidad.</p>
          <p>Evidencia mirada en este archivo: ☐ RepOpmi ☐ ET/DE ☐ avance físico ☐ ítems de contrato ☐ INFOBRAS. Otra: ____________________</p>
          <p>Pendiente: ________________________________________________________________</p>
          <p>Reservas: ________________________________________________________________</p>
          <p>La verificación por oficinas según el ROF vigente queda para una etapa posterior. Este borrador no declara la transferencia completa.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <p>Titular saliente<br />Nombre: ________<br />Firma: ________</p>
            <p>Titular entrante<br />Nombre: ________<br />Firma: ________</p>
            <p>Funcionario responsable<br />Nombre: ________<br />Firma: ________</p>
          </div>
        </div>
      )}
      {vista === "ficha" && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
          <li>Revisar que el pliego, la UEI y la UF correspondan a la entidad que transfiere.</li>
          <li>No usar el porcentaje financiero como si fuera el físico.</li>
          <li>Anotar evidencia, pendiente y reserva antes de cualquier firma.</li>
        </ul>
      )}
    </section>
  );
}
