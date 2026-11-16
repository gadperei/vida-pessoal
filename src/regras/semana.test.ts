import { expect, it } from 'vitest';
import { AGORA, banco, conclusao, dia, item } from '../testes/fabrica.ts';
import { cartaoSemanaVisivel, resumoDaSemana } from './semana.ts';

const b = banco({
  itens: [
    item({ id: 't', titulo: 'Treino', data: '2026-11-13', repeticao: 'folgas' }),
    item({ id: 'pr', tipo: 'prova', area: 'academica', data: '2026-11-20', feito_em: AGORA }),
    item({ id: 'es', titulo: 'Estudar', area: 'academica', data: '2026-11-18' }),
    item({ id: 'co', tipo: 'compromisso', area: 'profissional', data: '2026-11-19' }),
  ],
  conclusoes: [conclusao('t', '2026-11-16'), conclusao('t', '2026-11-21')],
  dias: [
    dia('2026-11-16', { sono_min: 480, habitos_em: AGORA, exercicio_min: 30, comida: 3, paginas: 10 }),
    dia('2026-11-17', { sono_min: 450, habitos_em: AGORA, exercicio_min: 0, comida: 2, paginas: 0 }),
  ],
});

it('semana inteira', () => {
  const r = resumoDaSemana('2026-11-16', '2026-11-22', b);
  expect([r.total, r.feitos, r.domingo]).toEqual([8, 3, '2026-11-22']);
  expect(r.porArea).toEqual({ pessoal: { total: 5, feitos: 2 }, academica: { total: 2, feitos: 1 }, profissional: { total: 1, feitos: 0 } });
  expect(r.naoFeitos).toHaveLength(5);
  expect([r.sonoMediaMin, r.treinos, r.diasBem, r.paginas]).toEqual([465, 1, 1, 10]);
});
it('semana em andamento conta só até hoje', () => {
  const r = resumoDaSemana('2026-11-16', '2026-11-17', b);
  expect([r.total, r.feitos]).toEqual([2, 1]);
});
it('cartão da semana passada só na segunda e até dispensar', () => {
  expect(cartaoSemanaVisivel('2026-11-16', null)).toBe(true);
  expect(cartaoSemanaVisivel('2026-11-16', '2026-11-09')).toBe(false);
  expect(cartaoSemanaVisivel('2026-11-17', null)).toBe(false);
});
