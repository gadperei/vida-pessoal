import { expect, it } from 'vitest';
import { etapa, HOJE, meta } from '../testes/fabrica.ts';
import { agruparMetas, diasAtePrazo, metasDoInicio, progresso, sugerirConcluir } from './metas.ts';

it('progresso por tipo', () => {
  const m = meta({ id: 'm' });
  expect(progresso(m, [])).toBe(0);
  expect(progresso({ ...m, concluida_em: HOJE }, [])).toBe(1);
  expect(progresso(m, [etapa('m', { feita: true }), etapa('m'), etapa('m'), etapa('outra', { feita: true })])).toBeCloseTo(1 / 3);
  expect(progresso(meta({ tipo: 'valor', alvo_centavos: 600000, atual_centavos: 120000 }), [])).toBe(0.2);
  expect(progresso(meta({ tipo: 'compra', alvo_centavos: 100, atual_centavos: 150 }), [])).toBe(1);
  expect(progresso(meta({ tipo: 'valor', alvo_centavos: 0, atual_centavos: 50 }), [])).toBe(0);
});
it('prazo', () => {
  expect(diasAtePrazo(meta({ prazo: '2026-12-31' }), HOJE)).toBe(45);
  expect(diasAtePrazo(meta({ prazo: '2026-11-10' }), HOJE)).toBe(-6);
});
it('início: destaque é a alta mais urgente; empate pelo nome', () => {
  const v = meta({ nome: 'Vender um projeto', prazo: '2026-12-31' });
  const r = meta({ nome: 'Reserva', prazo: '2026-12-31', tipo: 'valor' });
  const n = meta({ nome: 'Notebook', prazo: '2027-03-01', tipo: 'compra' });
  const media = meta({ prioridade: 'media', prazo: '2026-11-20' });
  const feita = meta({ prazo: '2026-11-17', concluida_em: HOJE });
  const r1 = metasDoInicio([n, media, v, feita, r], HOJE);
  expect(r1.destaque?.nome).toBe('Reserva');
  expect(r1.cartoes.map((x) => x.nome)).toEqual(['Vender um projeto', 'Notebook']);
  expect(metasDoInicio([media], HOJE)).toEqual({ destaque: null, cartoes: [] });
});
it('sugere concluir só quando faz sentido', () => {
  expect(sugerirConcluir(meta({ tipo: 'valor', alvo_centavos: 10, atual_centavos: 10 }), [])).toBe(true);
  expect(sugerirConcluir(meta({ id: 'c' }), [etapa('c', { feita: true })])).toBe(true);
  expect(sugerirConcluir(meta(), [])).toBe(false);
  expect(sugerirConcluir(meta({ tipo: 'valor', alvo_centavos: 10, atual_centavos: 10, concluida_em: HOJE }), [])).toBe(false);
});
it('agrupa por prioridade; concluídas pela mais recente', () => {
  const a2 = meta({ nome: 'a2', prazo: '2027-01-01' });
  const a1 = meta({ nome: 'a1', prazo: '2026-12-01' });
  const m1 = meta({ nome: 'm1', prioridade: 'media' });
  const b1 = meta({ nome: 'b1', prioridade: 'baixa' });
  const c1 = meta({ nome: 'c1', concluida_em: '2026-10-01' });
  const c2 = meta({ nome: 'c2', prioridade: 'baixa', concluida_em: '2026-11-01' });
  const g = agruparMetas([a2, c1, m1, a1, b1, c2]);
  expect([g.alta, g.media, g.baixa, g.concluidas].map((l) => l.map((x) => x.nome))).toEqual([['a1', 'a2'], ['m1'], ['b1'], ['c2', 'c1']]);
});
