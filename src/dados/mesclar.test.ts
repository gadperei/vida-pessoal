import { expect, it } from 'vitest';
import { AGORA, banco, item } from '../testes/fabrica.ts';
import { semExcluidos } from './banco.ts';
import { mesclar } from './mesclar.ts';

it('vence a última alteração, com formatos de data diferentes', () => {
  const local = banco({ itens: [item({ id: 'a', titulo: 'Local', atualizado_em: '2026-11-16T12:00:00.000Z' })] });
  const remotoNovo = item({ id: 'a', titulo: 'Remoto', atualizado_em: '2026-11-16T12:00:01+00:00' });
  const remotoVelho = item({ id: 'a', titulo: 'Velho', atualizado_em: '2026-11-16T11:59:59+00:00' });
  expect(mesclar(local, { itens: [remotoNovo] }, []).itens[0].titulo).toBe('Remoto');
  expect(mesclar(local, { itens: [remotoVelho] }, []).itens[0].titulo).toBe('Local');
});
it('pendente na fila vence remota mais antiga; excluída remota entra', () => {
  const pend = item({ id: 'a', titulo: 'Pendente', atualizado_em: '2026-11-16T13:00:00.000Z' });
  const local = banco({ itens: [pend] });
  const r = mesclar(local, { itens: [item({ id: 'a', titulo: 'R', atualizado_em: '2026-11-16T12:30:00+00:00' }), item({ id: 'z', excluido_em: AGORA })] }, [{ tabela: 'itens', linha: pend }]);
  expect(r.itens.map((i) => [i.id, i.titulo])).toEqual([['a', 'Pendente'], ['z', 'Tarefa']]);
  expect(semExcluidos(r).itens).toHaveLength(1);
});
