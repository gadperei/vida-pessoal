// Escala de trabalho (ciclo de T/F que se repete) e calendário da faculdade.
import { adicionarDias, diaDaSemana, diasEntre } from './datas.ts';
import type { Config, Dia, Escala, Excecao, TipoDia } from './tipos.ts';

export const PRESETS: { nome: string; ciclo: string }[] = [
  { nome: '6x1', ciclo: 'TTTTTTF' },
  { nome: '5x2', ciclo: 'TTTTTFF' },
  { nome: '4x3', ciclo: 'TTTTFFF' },
  { nome: '12x36', ciclo: 'TF' },
  { nome: '3x2 alternado', ciclo: 'TTTFFFTTFF' },
];

const modulo = (n: number, m: number) => ((n % m) + m) % m;
const instante = (iso: string) => Date.parse(iso);

/** Data do dia 1 do ciclo, sabendo que hoje é a posição `posicao` (começando em 0). */
export function inicioPelaPosicao(hoje: Dia, posicao: number): Dia {
  return adicionarDias(hoje, -posicao);
}

export function posicaoNoCiclo(dia: Dia, escala: Escala): number {
  return modulo(diasEntre(escala.inicio, dia), escala.ciclo.length);
}

/** A escala que vale no dia: a de maior vigente_desde ≤ dia (empate: a última alterada). Antes de todas: a mais antiga. */
export function escalaVigente(dia: Dia, escalas: Escala[]): Escala | null {
  if (escalas.length === 0) return null;
  const ordenadas = [...escalas].sort((a, b) =>
    a.vigente_desde === b.vigente_desde
      ? instante(a.atualizado_em) - instante(b.atualizado_em)
      : a.vigente_desde < b.vigente_desde ? -1 : 1);
  const validas = ordenadas.filter((e) => e.vigente_desde <= dia);
  return validas.length > 0 ? validas[validas.length - 1] : ordenadas[0];
}

/** Tipo do dia pelo ciclo, ignorando exceções. Sem escala: folga. */
export function tipoDoCiclo(dia: Dia, escalas: Escala[]): TipoDia {
  const e = escalaVigente(dia, escalas);
  if (!e) return 'F';
  return e.ciclo[posicaoNoCiclo(dia, e)] === 'T' ? 'T' : 'F';
}

const cobre = (ex: Excecao, dia: Dia) => ex.inicio <= dia && dia <= ex.fim;

/** Tipo do dia: uma exceção com tipo_dia vence (a última alterada); senão vale o ciclo. */
export function tipoDoDia(dia: Dia, escalas: Escala[], excecoes: Excecao[]): TipoDia {
  const aplicaveis = excecoes.filter((ex) => ex.tipo_dia !== null && cobre(ex, dia));
  if (aplicaveis.length > 0) {
    const ultima = aplicaveis.reduce((a, b) => (instante(b.atualizado_em) >= instante(a.atualizado_em) ? b : a));
    return ultima.tipo_dia as TipoDia;
  }
  return tipoDoCiclo(dia, escalas);
}

export function temAula(dia: Dia, config: Config, excecoes: Excecao[]): boolean {
  if (excecoes.some((ex) => ex.sem_aula && cobre(ex, dia))) return false;
  if (config.semestre_fim !== null && dia > config.semestre_fim) return false;
  if (diaDaSemana(dia) === 6) {
    return config.sabado_referencia !== null && modulo(diasEntre(config.sabado_referencia, dia), 14) === 0;
  }
  return config.aula_dias_semana.includes(diaDaSemana(dia));
}
