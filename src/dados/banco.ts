// O banco local: as mesmas tabelas do Supabase, em memória.
import { TABELAS, type Banco, type Linha, type Tabela } from '../regras/tipos.ts';

/** Uma alteração a enviar: sempre a linha inteira (upsert). */
export type Mudanca = { tabela: Tabela; linha: Linha };

/** O banco sem as linhas excluídas: é o que as regras e as telas enxergam. */
export function semExcluidos(b: Banco): Banco {
  const r = { ...b };
  for (const t of TABELAS) (r as Record<Tabela, Linha[]>)[t] = (b[t] as Linha[]).filter((l) => l.excluido_em === null);
  return r;
}

/** Troca a linha pelo id, ou acrescenta. Não altera o banco recebido. */
export function aplicar(b: Banco, m: Mudanca): Banco {
  const lista = b[m.tabela] as Linha[];
  const i = lista.findIndex((l) => l.id === m.linha.id);
  const nova = i === -1 ? [...lista, m.linha] : lista.map((l, k) => (k === i ? m.linha : l));
  return { ...b, [m.tabela]: nova };
}
