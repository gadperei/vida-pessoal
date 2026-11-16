import { expect, it } from 'vitest';
import { item } from '../testes/fabrica.ts';
import { enfileirar } from './fila.ts';

it('compacta mudanças da mesma linha', () => {
  const f = enfileirar(enfileirar([], { tabela: 'itens', linha: item({ id: 'a' }) }), { tabela: 'itens', linha: item({ id: 'b' }) });
  const g = enfileirar(f, { tabela: 'itens', linha: item({ id: 'a', titulo: 'X' }) });
  expect(g.map((m) => m.linha.id)).toEqual(['b', 'a']);
  expect(g[1].linha).toMatchObject({ titulo: 'X' });
});
it('mesmo id em tabelas diferentes não se misturam', () => {
  const f = enfileirar(enfileirar([], { tabela: 'itens', linha: item({ id: 'a' }) }), { tabela: 'metas', linha: item({ id: 'a' }) });
  expect(f).toHaveLength(2);
});
