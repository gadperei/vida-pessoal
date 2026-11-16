import { expect, it } from 'vitest';
import type { Conclusao, Excecao, Item } from '../regras/tipos.ts';
import { AGORA, banco, excecao, HOJE, item } from '../testes/fabrica.ts';
import { alternarFeito, desfazerDiaExtra, excluirLinha, marcarDiaExtra, moverItem } from './opsAgenda.ts';

it('marcar e desmarcar repetida usa conclusão', () => {
  const t = item({ id: 't', repeticao: 'folgas', data: '2026-11-13' });
  const m1 = alternarFeito({ item: t, dia: HOJE, feito: false }, banco({ itens: [t] }), AGORA);
  expect(m1).toMatchObject({ tabela: 'conclusoes', linha: { id: 't:2026-11-16', item_id: 't', data: HOJE, excluido_em: null } });
  const b2 = banco({ itens: [t], conclusoes: [m1.linha as Conclusao] });
  expect((alternarFeito({ item: t, dia: HOJE, feito: true }, b2, AGORA).linha as Conclusao).excluido_em).toBe(AGORA);
});
it('avulsa usa feito_em', () => {
  const a = item({ id: 'a' });
  expect((alternarFeito({ item: a, dia: HOJE, feito: false }, banco(), AGORA).linha as Item).feito_em).toBe(AGORA);
  expect((alternarFeito({ item: { ...a, feito_em: AGORA }, dia: HOJE, feito: true }, banco(), AGORA).linha as Item).feito_em).toBeNull();
});
it('dia extra é uma exceção T de um dia', () => {
  expect(marcarDiaExtra('2026-11-17', () => 'x', AGORA)).toMatchObject({ tabela: 'excecoes', linha: { id: 'x', inicio: '2026-11-17', fim: '2026-11-17', tipo_dia: 'T', sem_aula: false, excluido_em: null } });
  expect((desfazerDiaExtra(excecao({ tipo_dia: 'T' }), AGORA).linha as Excecao).excluido_em).toBe(AGORA);
});
it('mover e excluir atualizam o carimbo', () => {
  const later = '2026-11-16T13:00:00.000Z';
  expect(moverItem(item({ id: 'a' }), '2026-11-20', later)).toMatchObject({ tabela: 'itens', linha: { id: 'a', data: '2026-11-20', atualizado_em: later } });
  expect(excluirLinha('itens', item({ id: 'a' }), later).linha).toMatchObject({ excluido_em: later, atualizado_em: later });
});
