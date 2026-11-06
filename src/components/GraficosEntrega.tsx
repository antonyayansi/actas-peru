"use client";

interface DistritoBarra {
  lugarId: string;
  nombre: string;
  esCapitalProvincial: boolean;
  conActa?: boolean;
}

interface ProvinciaBarra {
  codigo: string;
  nombre: string;
  conActa?: boolean;
  distritos: DistritoBarra[];
}

function porcentaje(conActa: number, total: number): number {
  if (total <= 0) return 0;
  return (conActa / total) * 100;
}

function texto(valor: number): string {
  const rounded = Math.round(valor * 10) / 10;
  const cuerpo = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
  return `${cuerpo} %`;
}

function Barra({ etiqueta, detalle, valor, max = 100 }: { etiqueta: string; detalle: string; valor: number; max?: number }) {
  const ancho = Math.max(0, Math.min(100, max <= 0 ? 0 : (valor / max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-sm text-ink">{etiqueta}</p>
        <p className="shrink-0 font-condensed text-sm font-bold text-petrol">{detalle}</p>
      </div>
      <div
        className="mt-0.5 h-2 overflow-hidden bg-ice"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ancho)}
        aria-label={`${etiqueta}: ${detalle}`}
      >
        <div className="h-full bg-gold" style={{ width: `${ancho}%` }} />
      </div>
    </div>
  );
}

export function GraficosEntrega({
  nombre,
  provincias,
  porDistrito,
}: {
  nombre: string;
  provincias: ProvinciaBarra[];
  porDistrito: boolean;
}) {
  if (provincias.length === 0) return null;
  return (
    <div className="border border-line bg-white px-3 py-3">
      <h3 className="font-condensed text-lg font-bold uppercase tracking-wide text-petrol">
        {porDistrito ? `Distritos de ${nombre}` : `Actas distritales en ${nombre}`}
      </h3>
      <p className="mt-1 text-xs leading-4 text-muted">
        Cada barra es el porcentaje de actas distritales ya ubicadas. El distrito capital no tiene elección distrital aparte.
      </p>
      <div className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {porDistrito
          ? provincias.flatMap((provincia) =>
              provincia.distritos
                .filter((distrito) => !distrito.esCapitalProvincial)
                .map((distrito) => (
                  <Barra
                    key={distrito.lugarId}
                    etiqueta={distrito.nombre}
                    detalle={distrito.conActa ? "Con acta" : "Sin acta ubicada"}
                    valor={distrito.conActa ? 100 : 0}
                  />
                )),
            )
          : provincias.map((provincia) => {
              const elegibles = provincia.distritos.filter((distrito) => !distrito.esCapitalProvincial);
              const ubicadas = elegibles.filter((distrito) => distrito.conActa).length;
              const avance = porcentaje(ubicadas, elegibles.length);
              return (
                <Barra
                  key={provincia.codigo}
                  etiqueta={`${provincia.nombre}${provincia.conActa ? " · acta provincial" : ""}`}
                  detalle={elegibles.length === 0 ? "Sin distritos" : `${ubicadas} de ${elegibles.length} · ${texto(avance)}`}
                  valor={avance}
                />
              );
            })}
      </div>
    </div>
  );
}
