import { expect, it } from 'vitest';
import type { Livro, RegistroDia } from '../regras/tipos.ts';
import { AGORA, banco, dia, HOJE, ids, livro } from '../testes/fabrica.ts';
import { checkinPendente, novoLivro, salvarCheckin, terminarLivro, valoresIniciais } from './opsHabitos.ts';

it('sono vai para a manhã; hábitos vão para ontem, preservando o resto', () => {
  const b = banco({ dias: [dia('2026-11-15', { sono_min: 400 })] });
  const ms = salvarCheckin(HOJE, { sonoMin: 390, exercicioMin: 30, comida: 3, paginas: 12, livroId: 'l' }, b, AGORA);
  const porId = Object.fromEntries(ms.map((m) => [m.linha.id, m.linha as RegistroDia]));
  expect(porId['2026-11-16']).toMatchObject({ data: HOJE, sono_min: 390, habitos_em: null });
  expect(porId['2026-11-15']).toMatchObject({ sono_min: 400, exercicio_min: 30, comida: 3, paginas: 12, livro_id: 'l', habitos_em: AGORA });
});

it('pendente até registrar ontem', () => {
  expect(checkinPendente(HOJE, banco())).toBe(true);
  expect(checkinPendente(HOJE, banco({ dias: [dia('2026-11-15', { habitos_em: AGORA })] }))).toBe(false);
});

it('valores iniciais', () => {
  expect(valoresIniciais(HOJE, banco())).toEqual({ sonoMin: 420, exercicioMin: 0, comida: 2, paginas: 0, livroId: null });
  const b = banco({ dias: [dia('2026-11-13', { sono_min: 380, habitos_em: AGORA, exercicio_min: 45, comida: 3, paginas: 8, livro_id: 'l' }), dia('2026-11-14', { sono_min: 410 })] });
  expect(valoresIniciais(HOJE, b)).toEqual({ sonoMin: 410, exercicioMin: 45, comida: 3, paginas: 8, livroId: 'l' });
});

it('ao corrigir um dia já registrado, começa com o que foi salvo nele (não com o último registro)', () => {
  const b = banco({ dias: [
    dia('2026-11-13', { sono_min: 300 }),
    dia('2026-11-12', { habitos_em: AGORA, exercicio_min: 15, comida: 1, paginas: 2, livro_id: null }),
    dia('2026-11-15', { sono_min: 480, habitos_em: AGORA, exercicio_min: 60, comida: 3, paginas: 30, livro_id: 'x' }),
  ] });
  expect(valoresIniciais('2026-11-13', b)).toEqual({ sonoMin: 300, exercicioMin: 15, comida: 1, paginas: 2, livroId: null });
});

it('não sugere um livro que já foi terminado', () => {
  const b = banco({
    dias: [dia('2026-11-15', { habitos_em: AGORA, exercicio_min: 0, comida: 2, paginas: 20, livro_id: 'l' })],
    livros: [livro({ id: 'l', terminado_em: '2026-11-15' })],
  });
  expect(valoresIniciais('2026-11-17', b).livroId).toBeNull();
});

it('novo livro e terminar livro', () => {
  const m = novoLivro('Hábitos Atômicos', ids(), AGORA);
  expect(m).toEqual({ tabela: 'livros', linha: { id: 'n1', titulo: 'Hábitos Atômicos', terminado_em: null, atualizado_em: AGORA, excluido_em: null } });
  const t = terminarLivro(m.linha as Livro, '2026-11-15', AGORA);
  expect(t.tabela).toBe('livros');
  expect(t.linha).toMatchObject({ id: 'n1', terminado_em: '2026-11-15' });
});
