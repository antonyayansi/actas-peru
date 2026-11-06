import { Searcher } from "@/components/Searcher";

function FlatScene() {
  return (
    <svg viewBox="0 0 220 120" className="h-28 w-full max-w-[220px]" aria-hidden="true">
      <rect x="8" y="28" width="78" height="52" fill="#00628A" />
      <rect x="14" y="34" width="66" height="34" fill="#ffffff" />
      <rect x="18" y="72" width="58" height="6" fill="#FFBE00" />
      <circle cx="132" cy="46" r="14" fill="#FFBE00" />
      <rect x="116" y="64" width="32" height="28" fill="#00628A" />
      <rect x="162" y="22" width="46" height="58" fill="#E7F4F8" stroke="#00628A" strokeWidth="2" />
      <path d="M170 36h30M170 46h30M170 56h18" stroke="#00628A" strokeWidth="2" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b-4 border-gold bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-3 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5 lg:px-6">
          <div className="min-w-0">
            <p className="font-condensed text-sm font-semibold uppercase tracking-[0.18em] text-petrol">Planitec Perú</p>
            <h1 className="mt-1 font-condensed text-4xl font-bold leading-none text-petrol sm:text-5xl">Actas abiertas</h1>
            <p className="mt-2 max-w-3xl text-base leading-6 text-ink">
              Buscador de actas de proclamación de las Elecciones Regionales y Municipales 2026.
              Hecho por Mg. Fiorela Aguilar Merma para consultar, no para reemplazar al Jurado Nacional de Elecciones.
            </p>
          </div>
          <FlatScene />
        </div>
      </header>
      <div className="border-b border-line bg-white">
        <p className="mx-auto w-full max-w-[1440px] border-l-4 border-gold px-3 py-2 text-sm leading-6 text-ink sm:px-5 lg:px-6">
          Sitio independiente y no oficial. No usa el logo ni la identidad del JNE.
          Los PDF se abren en el portal público de origen. No se muestran números de DNI.
        </p>
      </div>
      <main id="contenido" className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-5 lg:px-6">
        <Searcher />
      </main>
      <footer className="bg-ice">
        <p className="mx-auto w-full max-w-[1440px] px-3 py-5 text-sm leading-6 text-muted sm:px-5 lg:px-6">
          Planitec Perú. El índice se alimenta del listado público y de los PDF publicados.
          Las normas, los anexos y las guías son publicaciones públicas de la Contraloría General de la República. Este sitio no es su autor.
          La actualización corre en el servidor mientras el proceso esté encendido. No depende de dejar esta pestaña abierta.
        </p>
      </footer>
    </div>
  );
}
