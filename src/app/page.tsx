import { Searcher } from "@/components/Searcher";

const WHATSAPP =
  "https://wa.me/51930804475?text=" +
  encodeURIComponent("Hola, Fiorela. Tengo una consulta sobre las actas proclamadas y la transferencia ERM 2026.");

function MarcaWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" className="size-7 shrink-0" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.5 3.5A11 11 0 0 0 2.1 17.2L1 23l6-1.6A11 11 0 0 0 12 23a11 11 0 0 0 8.5-19.5zM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.5.9.9-3.4-.2-.3A9 9 0 1 1 12 21zm5-6.8c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.9 1.1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.1 8.1 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.4.2-.4a.5.5 0 0 0 0-.5c-.1-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.5 4 12 12 0 0 0 1.6.6 3.6 3.6 0 0 0 1.6.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.3c-.1-.1-.3-.2-.6-.3z"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b-4 border-gold bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-3 py-4 sm:gap-5 sm:px-5 lg:px-6">
          <img src="/planitec-pro.png" alt="Planitec Pro" width={554} height={554} className="h-20 w-20 shrink-0 object-contain sm:h-28 sm:w-28" />
          <div className="min-w-0">
            <p className="font-condensed text-sm font-semibold uppercase tracking-[0.18em] text-petrol">Planitec Perú</p>
            <h1 className="mt-1 font-condensed text-4xl font-bold leading-none text-petrol sm:text-5xl">Actas proclamadas</h1>
            <p className="mt-2 max-w-3xl text-base leading-6 text-ink">
              Buscador de actas de proclamación de las Elecciones Regionales y Municipales 2026.
              Hecho por Mg. Fiorela Aguilar Merma para consultar, no para reemplazar al Jurado Nacional de Elecciones.
            </p>
          </div>
        </div>
      </header>
      <div className="border-b border-line bg-white">
        <p className="mx-auto w-full max-w-[1440px] border-l-4 border-gold px-3 py-2 text-sm leading-6 text-ink sm:px-5 lg:px-6">
          Sitio independiente y no oficial. No usa el logo ni la identidad del JNE.
          Los PDF se abren en el portal público de origen. No se muestran números de DNI.
          {" "}<a className="font-semibold text-petrol underline decoration-gold" href="/inversiones">Piloto de cartera de inversiones</a>.
        </p>
      </div>
      <section className="bg-petrol text-white" aria-labelledby="asesoria">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6">
          <div className="min-w-0 border-l-4 border-gold pl-3">
            <p className="font-condensed text-sm font-semibold uppercase tracking-[0.16em] text-gold">Asesoría</p>
            <h2 id="asesoria" className="font-condensed text-3xl font-bold uppercase leading-none sm:text-4xl">Consultas por WhatsApp</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ice">
              Una pregunta sobre su acta, el equipo de quien sale o el plazo de quien entra.
              Dale click al número y se abre el chat con Mg. Fiorela Aguilar Merma.
            </p>
          </div>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noreferrer"
            aria-label="Dale click al número 930 804 475 para abrir WhatsApp"
            className="inline-flex min-h-16 shrink-0 flex-col items-center justify-center gap-1 bg-gold px-5 py-2 text-petrol hover:bg-[#e6ab00]"
          >
            <span className="font-condensed text-sm font-bold uppercase tracking-[0.14em]">Dale click al número</span>
            <span className="inline-flex items-center gap-3 font-condensed text-3xl font-bold leading-none tracking-wide">
              <MarcaWhatsApp />
              930 804 475
            </span>
          </a>
        </div>
      </section>
      <main id="contenido" className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-5 lg:px-6">
        <Searcher />
      </main>
      <footer className="bg-ice">
        <p className="mx-auto w-full max-w-[1440px] px-3 py-5 text-sm leading-6 text-muted sm:px-5 lg:px-6">
          Planitec Perú. El índice se alimenta del listado público y de los PDF publicados.
          Las normas, los anexos y las guías son publicaciones públicas de la Contraloría General de la República. Este sitio no es su autor.
          El servidor copia el listado público cada 30 minutos mientras el proceso esté encendido. La hora de la última copia aparece arriba, junto a Actualizar.
          {" "}
          <a className="font-semibold text-petrol underline" href={WHATSAPP} target="_blank" rel="noreferrer">Consultas por WhatsApp al 930 804 475</a>.
        </p>
      </footer>
    </div>
  );
}
