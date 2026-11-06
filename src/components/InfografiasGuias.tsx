const SECCIONES: { n: string; titulo: string; detalle: string; archivo?: string }[] = [
  { n: "I", titulo: "Sistemas administrativos", detalle: "Lo que cada sistema registra. Abajo está el detalle de los 11." },
  { n: "II", titulo: "Indicadores de eficacia", detalle: "Indicadores propios de la entidad: nombre, fórmula, fuente y sentido. Anexo 12.", archivo: "eegg/12-seccion-ii-indicadores.pdf" },
  { n: "III", titulo: "Relación de servicios", detalle: "Los servicios que brinda la entidad. Anexo 13.", archivo: "eegg/13-seccion-iii-iv.pdf" },
  { n: "IV", titulo: "Resultados de la gestión", detalle: "Eficiencia, eficacia, calidad y oportunidad de cada servicio. Anexo 14.", archivo: "eegg/13-seccion-iii-iv.pdf" },
  { n: "V", titulo: "Transferencia", detalle: "Medios digitales, convenios, servicios básicos y archivos. Solo entra en la transferencia.", archivo: "eegg/14-seccion-v.pdf" },
];

const SISTEMAS: {
  n: string;
  titulo: string;
  archivo: string;
  frase: string;
  anexos: { codigo: string; nombre: string }[];
}[] = [
  {
    n: "1",
    titulo: "Planeamiento estratégico",
    archivo: "eegg/01-planeamiento.pdf",
    frase: "El PEI, el resumen de objetivos y el cumplimiento de las metas.",
    anexos: [
      { codigo: "1.1", nombre: "Información general del PEI" },
      { codigo: "1.2", nombre: "Resumen de objetivos y acciones estratégicas" },
      { codigo: "Anexo", nombre: "Cumplimiento de metas de los indicadores" },
    ],
  },
  {
    n: "2",
    titulo: "Presupuesto público",
    archivo: "eegg/02-presupuesto.pdf",
    frase: "Ejecución de la unidad ejecutora e ingresos y gastos por fuente.",
    anexos: [
      { codigo: "2.1", nombre: "Toda fuente de financiamiento" },
      { codigo: "2.2", nombre: "Actividades, acciones de inversión y obras" },
      { codigo: "2.3", nombre: "Ingresos y gastos por fuente" },
    ],
  },
  {
    n: "3",
    titulo: "Inversión pública",
    archivo: "eegg/03-inversiones.pdf",
    frase: "Inversiones, obras públicas y obras paralizadas.",
    anexos: [
      { codigo: "3.1", nombre: "Inversiones públicas" },
      { codigo: "3.2", nombre: "Obras públicas" },
      { codigo: "3.3", nombre: "Obras públicas paralizadas" },
    ],
  },
  {
    n: "4",
    titulo: "Contabilidad pública",
    archivo: "eegg/04-contabilidad.pdf",
    frase: "Los cuatro estados financieros a la fecha de corte.",
    anexos: [
      { codigo: "4.1", nombre: "EF-1 Estado de situación financiera" },
      { codigo: "4.2", nombre: "EF-2 Estado de gestión" },
      { codigo: "4.3", nombre: "EF-3 Cambios en el patrimonio neto" },
      { codigo: "4.4", nombre: "EF-4 Flujos de efectivo" },
    ],
  },
  {
    n: "5",
    titulo: "Tesorería",
    archivo: "eegg/05-tesoreria.pdf",
    frase: "Garantías, valores, fideicomisos, saldos y firmas de las cuentas.",
    anexos: [
      { codigo: "5.1", nombre: "Cartas fianza en custodia" },
      { codigo: "5.2", nombre: "Documentos valorados en custodia" },
      { codigo: "5.3", nombre: "Fideicomisos" },
      { codigo: "5.4", nombre: "Saldos de cuentas" },
      { codigo: "5.5", nombre: "Titulares y suplentes de las cuentas" },
    ],
  },
  {
    n: "6",
    titulo: "Endeudamiento público",
    archivo: "eegg/06-endeudamiento.pdf",
    frase: "Operaciones de endeudamiento. La lámina trae el anexo de préstamos.",
    anexos: [{ codigo: "6.1", nombre: "Operaciones de endeudamiento: préstamos" }],
  },
  {
    n: "7",
    titulo: "Abastecimiento",
    archivo: "eegg/07-abastecimiento.pdf",
    frase: "Procedimientos, contratos, bienes y aplicativos a la fecha de corte.",
    anexos: [
      { codigo: "7.1", nombre: "Procedimientos" },
      { codigo: "7.2", nombre: "Contratos vigentes y pendientes de pago" },
      { codigo: "7.3", nombre: "Bienes inmuebles y predios" },
      { codigo: "7.4", nombre: "Inventario patrimonial de bienes muebles" },
      { codigo: "7.5", nombre: "Vehículos y maquinarias" },
      { codigo: "7.6", nombre: "Aplicativos informáticos" },
    ],
  },
  {
    n: "8",
    titulo: "Recursos humanos",
    archivo: "eegg/08-recursos-humanos.pdf",
    frase: "Costo de personal y pensiones, y los procedimientos disciplinarios en trámite.",
    anexos: [
      { codigo: "8.1", nombre: "Costo de personal y pensiones" },
      { codigo: "8.2", nombre: "Procedimientos disciplinarios" },
    ],
  },
  {
    n: "9",
    titulo: "Control",
    archivo: "eegg/09-control.pdf",
    frase: "Informes de control y cómo va el control interno.",
    anexos: [
      { codigo: "9.1", nombre: "Recomendaciones del control posterior" },
      { codigo: "9.2", nombre: "Funcionarios con presunta responsabilidad" },
      { codigo: "9.3", nombre: "Situaciones adversas del control simultáneo" },
      { codigo: "9.4", nombre: "Implementación del control interno" },
    ],
  },
  {
    n: "10",
    titulo: "Modernización",
    archivo: "eegg/10-modernizacion.pdf",
    frase: "Calidad de los servicios y gobierno abierto.",
    anexos: [{ codigo: "10.1", nombre: "Gestión de la calidad de los servicios y gobierno abierto" }],
  },
  {
    n: "11",
    titulo: "Defensa jurídica",
    archivo: "eegg/11-defensa-juridica.pdf",
    frase: "Cuántos procesos hay y cuáles son emblemáticos.",
    anexos: [
      { codigo: "11.1", nombre: "Cantidad total de procesos y otros similares" },
      { codigo: "11.2", nombre: "Casos emblemáticos, desde 50 UIT o con el titular" },
    ],
  },
];

export function InfografiasGuias() {
  return (
    <div className="space-y-3" id="infografias">
      <section className="border border-line border-t-4 border-t-gold bg-white p-4" aria-labelledby="info-titulo">
        <h2 id="info-titulo" className="font-condensed text-4xl font-bold uppercase tracking-wide text-petrol">Infografías</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink">
          Una ficha por cada sistema administrativo. El texto sale de las láminas de transferencia de gestión 2026 de la Contraloría. Planitec no las redactó.
        </p>
      </section>
      <section className="border border-line bg-white" aria-labelledby="info-informe">
        <header className="bg-petrol px-4 py-4 text-white">
          <h3 id="info-informe" className="font-condensed text-3xl font-bold uppercase tracking-wide">Cómo está armado el informe</h3>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-ice">
            La rendición usa las secciones I a IV. La transferencia añade la V. Cada ficha de abajo es un sistema de la sección I, con las láminas de 2026.
          </p>
        </header>
        <ol className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-5">
          {SECCIONES.map((seccion) => (
            <li key={seccion.n} className="border border-line border-t-4 border-t-gold bg-[#fff6d6] p-3">
              <span className="grid size-12 place-items-center bg-petrol font-condensed text-2xl font-bold leading-none text-white">{seccion.n}</span>
              <p className="mt-2 font-condensed text-xl font-bold uppercase leading-none text-petrol">{seccion.titulo}</p>
              <p className="mt-2 text-sm leading-5 text-ink">{seccion.detalle}</p>
              {seccion.archivo && (
                <a className="mt-2 inline-flex font-semibold text-petrol underline" href={`/informacion/${seccion.archivo}`} download>
                  Abrir las láminas
                </a>
              )}
            </li>
          ))}
        </ol>
      </section>
      <div className="grid items-start gap-3 lg:grid-cols-2">
        {SISTEMAS.map((sistema) => (
          <article key={sistema.n} className="overflow-hidden border border-line bg-white" aria-labelledby={`info-sistema-${sistema.n}`}>
            <header className="flex items-center gap-4 bg-petrol px-4 py-4 text-white">
              <span className="grid size-16 shrink-0 place-items-center bg-gold font-condensed text-4xl font-bold leading-none text-petrol" aria-hidden="true">{sistema.n}</span>
              <div className="min-w-0">
                <p className="font-condensed text-sm font-bold uppercase tracking-widest text-gold">Infografía</p>
                <h3 id={`info-sistema-${sistema.n}`} className="font-condensed text-3xl font-bold uppercase leading-none tracking-wide">{sistema.titulo}</h3>
              </div>
            </header>
            <p className="bg-[#fff6d6] px-4 py-2 text-sm font-semibold leading-5 text-ink">{sistema.frase}</p>
            <ul className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
              {sistema.anexos.map((anexo) => (
                <li key={`${anexo.codigo}-${anexo.nombre}`} className="border border-line border-t-4 border-t-petrol bg-ice p-2">
                  <span className="font-condensed text-2xl font-bold leading-none text-petrol">{anexo.codigo}</span>
                  <p className="mt-1 text-sm leading-4 text-ink">{anexo.nombre}</p>
                </li>
              ))}
            </ul>
            <p className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2 text-sm">
              <a className="font-semibold text-petrol underline" href={`/informacion/${sistema.archivo}`} download={sistema.archivo}>
                Abrir la guía
              </a>
              <span className="text-muted">Contraloría, 2026</span>
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
