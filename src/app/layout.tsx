import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Barlow_Condensed, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const source = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
});

const condensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-condensed",
});

export const metadata: Metadata = {
  title: "Actas proclamadas ERM 2026 · Planitec Perú",
  description:
    "Buscador independiente de actas de proclamación de las Elecciones Regionales y Municipales 2026. No es un sitio del JNE.",
  icons: { icon: "/planitec-pro.png" },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${source.variable} ${condensed.variable} bg-white text-ink antialiased`}>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-petrol focus:px-4 focus:py-2 focus:text-white"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
