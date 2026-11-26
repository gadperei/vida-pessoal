import { diaDaSemana, nomeMes } from './datas.ts';
import type { Dia } from './tipos.ts';

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Saudação do topo do Início pela hora local (0–23). */
export function saudacao(hora: number): string {
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** '2026-11-26' → 'quinta, 26 de novembro'. */
export function dataPorExtenso(d: Dia): string {
  return `${DIAS[diaDaSemana(d)]}, ${Number(d.slice(8, 10))} de ${nomeMes(d.slice(0, 7))}`;
}
