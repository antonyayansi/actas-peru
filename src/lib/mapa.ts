import mapa from "../../data/mapa-departamentos.json";
import type { Filtro } from "./types";

export interface DepartamentoMapa {
  codigo: string;
  nombreFuente: string;
  d: string;
  partes: number;
}

export const MAPA_VIEWBOX = mapa.viewBox;
export const FUENTE_MAPA = mapa.fuente;
export const DEPARTAMENTOS_MAPA = mapa.departamentos as DepartamentoMapa[];

export function aplicarDepartamento(filtro: Filtro, codigo: string | null): Filtro {
  return {
    ...filtro,
    departamento: codigo || undefined,
    provincia: undefined,
    distrito: undefined,
  };
}

export function codigosMapa(): string[] {
  return DEPARTAMENTOS_MAPA.map((item) => item.codigo);
}
