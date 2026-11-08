import type { Metadata } from "next";
import { PortalInversiones } from "@/components/PortalInversiones";

export const metadata: Metadata = {
  title: "Cartera de inversiones · Planitec Perú",
  description: "Piloto de lectura de la cartera RepOpmi para la transferencia municipal. No es un reporte oficial.",
};

export default function PaginaInversiones() {
  return <PortalInversiones />;
}
