// O que acontece em cada dia: itens avulsos e repetidos, linha do tempo e pendências.
import { adicionarDias } from './datas.ts';
import { temAula, tipoDoCiclo, tipoDoDia } from './escala.ts';
import type { Banco, Dia, Item, TipoDia } from './tipos.ts';

export interface Ocorrencia { item: Item; dia: Dia; feito: boolean }
export interface DiaDaLinha { dia: Dia; tipo: TipoDia; extra: boolean; aula: boolean; ocorrencias: Ocorrencia[] }

export function chaveConclusao(itemId: string, dia: Dia): string {
  return `${itemId}:${dia}`;
}

export function ocorreEm(item: Item, dia: Dia, tipoDia: TipoDia): boolean {
  if (item.repeticao === 'nenhuma') return item.data === dia;
  if (dia < item.data) return false;
  if (item.repete_ate !== null && dia > item.repete_ate) return false;
  if (item.repeticao === 'todo_dia') return true;
  return item.repeticao === 'folgas' ? tipoDia === 'F' : tipoDia === 'T';
}

function comparar(a: Ocorrencia, b: Ocorrencia): number {
  const ta = a.item.tipo === 'tarefa' ? 1 : 0;
  const tb = b.item.tipo === 'tarefa' ? 1 : 0;
  if (ta !== tb) return ta - tb;
  const ha = a.item.hora ?? '99:99';
  const hb = b.item.hora ?? '99:99';
  if (ha !== hb) return ha < hb ? -1 : 1;
  return a.item.titulo.localeCompare(b.item.titulo, 'pt-BR');
}

export function ocorrenciasDoDia(dia: Dia, banco: Banco): Ocorrencia[] {
  const tipo = tipoDoDia(dia, banco.escalas, banco.excecoes);
  const concluidas = new Set(banco.conclusoes.map((c) => c.id));
  return banco.itens
    .filter((i) => ocorreEm(i, dia, tipo))
    .map((item) => ({
      item,
      dia,
      feito: item.repeticao === 'nenhuma' ? item.feito_em !== null : concluidas.has(chaveConclusao(item.id, dia)),
    }))
    .sort(comparar);
}

export function linhaDoTempo(hoje: Dia, quantos: number, banco: Banco): DiaDaLinha[] {
  const config = banco.config[0];
  return Array.from({ length: quantos }, (_, i) => {
    const dia = adicionarDias(hoje, i);
    const tipo = tipoDoDia(dia, banco.escalas, banco.excecoes);
    return {
      dia,
      tipo,
      extra: tipo === 'T' && tipoDoCiclo(dia, banco.escalas) === 'F',
      aula: config ? temAula(dia, config, banco.excecoes) : false,
      ocorrencias: ocorrenciasDoDia(dia, banco),
    };
  });
}

/** Tarefas avulsas de dias anteriores que não foram feitas, da mais antiga para a mais nova. */
export function pendentes(hoje: Dia, itens: Item[]): Item[] {
  return itens
    .filter((i) => i.tipo === 'tarefa' && i.repeticao === 'nenhuma' && i.data < hoje && i.feito_em === null)
    .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}

/** Primeira folga depois de `depoisDe` (procura até 60 dias; se não achar, o dia seguinte). */
export function proximaFolga(depoisDe: Dia, banco: Banco): Dia {
  for (let i = 1; i <= 60; i++) {
    const d = adicionarDias(depoisDe, i);
    if (tipoDoDia(d, banco.escalas, banco.excecoes) === 'F') return d;
  }
  return adicionarDias(depoisDe, 1);
}
