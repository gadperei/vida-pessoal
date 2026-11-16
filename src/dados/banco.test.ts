import { expect, it } from 'vitest';
import { AGORA, banco, item } from '../testes/fabrica.ts';
import { aplicar, semExcluidos } from './banco.ts';

it('semExcluidos esconde as excluídas; aplicar troca pelo id', () => {
  const b = banco({ itens: [item({ id: 'a' }), item({ id: 'b', excluido_em: AGORA })] });
  expect(semExcluidos(b).itens.map((i) => i.id)).toEqual(['a']);
  const novo = aplicar(b, { tabela: 'itens', linha: item({ id: 'a', titulo: 'Novo' }) });
  expect(novo.itens.find((i) => i.id === 'a')?.titulo).toBe('Novo');
  expect(novo.itens).toHaveLength(2);
  expect(b.itens.find((i) => i.id === 'a')?.titulo).toBe('Tarefa');
});
it('aplicar acrescenta linha nova', () => {
  expect(aplicar(banco(), { tabela: 'itens', linha: item({ id: 'z' }) }).itens.map((i) => i.id)).toEqual(['z']);
});
