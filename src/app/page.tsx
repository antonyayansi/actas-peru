import { Searcher } from "@/components/Searcher";

export default function HomePage() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 border-b border-line pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-lagoon">Planitec Perú</p>
        <h1 className="mt-2 max-w-3xl font-serif text-4xl leading-tight sm:text-6xl">Actas abiertas</h1>
        <p className="mt-3 max-w-2xl text-lg leading-7">
          Buscador de actas de proclamación de las Elecciones Regionales y Municipales 2026.
          Hecho por Mg. Fiorela Aguilar Merma para consultar, no para reemplazar al Jurado Nacional de Elecciones.
        </p>
        <p className="mt-4 max-w-3xl rounded-2xl border-l-4 border-clay bg-card px-4 py-3 text-sm leading-6">
          Sitio independiente y no oficial. No usa el logo, los colores ni la identidad del JNE.
          Los PDF se abren en el portal público de origen. No se muestran números de DNI.
        </p>
      </header>
      <main id="contenido">
        <Searcher />
      </main>
      <footer className="mt-10 border-t border-line py-6 text-sm text-ink/70">
        Planitec Perú · índice local alimentado por el listado público y los PDF publicados.
        La actualización corre en el servidor, no depende de dejar esta pestaña abierta.
      </footer>
    </div>
  );
}
