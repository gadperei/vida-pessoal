// Alterações da agenda: marcar feito, mover, excluir e dia extra.
import { chaveConclusao, type Ocorrencia } from '../regras/agenda.ts';
import type { Previa } from '../regras/anotar.ts';
import { adicionarDias } from '../regras/datas.ts';
import type { Banco, Conclusao, Dia, Excecao, Item, Linha, Repeticao, Tabela } from '../regras/tipos.ts';
import type { Mudanca } from './banco.ts';

/** Avulsa: liga/desliga feito_em. Repetida: cria a conclusão do dia, ou marca como excluída ao desmarcar. */
export function alternarFeito(o: Ocorrencia, banco: Banco, agora: string): Mudanca {
  if (o.item.repeticao === 'nenhuma') {
    return { tabela: 'itens', linha: { ...o.item, feito_em: o.feito ? null : agora, atualizado_em: agora } };
  }
  const id = chaveConclusao(o.item.id, o.dia);
  const existente = banco.conclusoes.find((c) => c.id === id);
  const linha: Conclusao = o.feito
    ? { ...(existente ?? { id, item_id: o.item.id, data: o.dia, excluido_em: null, atualizado_em: agora }), excluido_em: agora, atualizado_em: agora }
    : { id, item_id: o.item.id, data: o.dia, excluido_em: null, atualizado_em: agora };
  return { tabela: 'conclusoes', linha };
}

export function moverItem(item: Item, data: Dia, agora: string): Mudanca {
  return { tabela: 'itens', linha: { ...item, data, atualizado_em: agora } };
}

export function excluirLinha(tabela: Tabela, linha: Linha, agora: string): Mudanca {
  return { tabela, linha: { ...linha, excluido_em: agora, atualizado_em: agora } };
}

export function marcarDiaExtra(dia: Dia, novoId: () => string, agora: string): Mudanca {
  const linha: Excecao = { id: novoId(), atualizado_em: agora, excluido_em: null, inicio: dia, fim: dia, tipo_dia: 'T', sem_aula: false };
  return { tabela: 'excecoes', linha };
}

export function desfazerDiaExtra(ex: Excecao, agora: string): Mudanca {
  return excluirLinha('excecoes', ex, agora);
}

/** Item novo a partir da prévia do "+ anotar". Só tarefa pode repetir. */
export function criarItem(p: Previa, repeticao: Repeticao, novoId: () => string, agora: string): Mudanca {
  const linha: Item = {
    id: novoId(), atualizado_em: agora, excluido_em: null,
    tipo: p.tipo, titulo: p.titulo.trim(), data: p.data, hora: p.hora, area: p.area,
    feito_em: null, repeticao: p.tipo === 'tarefa' ? repeticao : 'nenhuma', repete_ate: null,
  };
  return { tabela: 'itens', linha };
}

export function editarItem(
  item: Item, campos: Partial<Pick<Item, 'titulo' | 'tipo' | 'data' | 'hora' | 'area'>>, agora: string,
): Mudanca {
  const novo: Item = { ...item, ...campos, atualizado_em: agora };
  if (novo.tipo !== 'tarefa') novo.repeticao = 'nenhuma';
  return { tabela: 'itens', linha: novo };
}

/**
 * Muda a regra de repetição. Se o item já vinha repetindo antes de hoje, encerra o antigo ontem
 * e cria uma cópia a partir de hoje, para não reescrever as semanas passadas.
 */
export function editarRepeticao(item: Item, nova: Repeticao, hoje: Dia, novoId: () => string, agora: string): Mudanca[] {
  if (item.data >= hoje) return [{ tabela: 'itens', linha: { ...item, repeticao: nova, atualizado_em: agora } }];
  const copia: Item = { ...item, id: novoId(), data: hoje, repeticao: nova, repete_ate: null, feito_em: null, atualizado_em: agora, excluido_em: null };
  return [
    { tabela: 'itens', linha: { ...item, repete_ate: adicionarDias(hoje, -1), atualizado_em: agora } },
    { tabela: 'itens', linha: copia },
  ];
}
