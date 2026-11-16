import { expect, it } from 'vitest';
import { AGORA, banco, dia, livro } from '../testes/fabrica.ts';
import { resumoDoMes } from './habitos.ts';

const b = banco({
  dias: [
    dia('2026-11-16', { sono_min: 480, habitos_em: AGORA, exercicio_min: 30, comida: 3, paginas: 10 }),
    dia('2026-11-17', { sono_min: 450, habitos_em: AGORA, exercicio_min: 0, comida: 2, paginas: 0 }),
    dia('2026-11-19', { sono_min: 360, habitos_em: AGORA, exercicio_min: 45, comida: 3, paginas: 20 }),
    dia('2026-11-20', { sono_min: 330 }),
  ],
  livros: [livro({ terminado_em: '2026-11-18' }), livro({ terminado_em: '2026-10-30' })],
});

it('novembro até 20/11', () => {
  const r = resumoDoMes('2026-11', b, '2026-11-20');
  expect(r.diasConsiderados).toBe(19);
  expect(r.semRegistro).toBe(16);
  expect(r.sono).toMatchObject({ mediaMin: 405, antesTrabalhoMin: 345, antesFolgaMin: 465, metaMin: 420 });
  expect(r.sono.noites.map((n) => n.tipo)).toEqual(['F', 'F', 'T', 'T']);
  expect(r.exercicio).toEqual({ dias: 2, metaDias: 13, minutos: 75, diasTrabalho: 1, diasFolga: 1 });
  expect(r.comida.pctBem).toBeCloseTo(2 / 3);
  expect(r.comida.diasRuim).toBe(0);
  expect(r.leitura).toEqual({ paginas: 30, livrosTerminados: 1, meta: 1 });
});
it('mês passado conta o mês inteiro; mês sem dados não quebra', () => {
  const r = resumoDoMes('2026-10', b, '2026-11-20');
  expect(r.diasConsiderados).toBe(31);
  expect(r.semRegistro).toBe(31);
  expect(r.sono.mediaMin).toBeNull();
  expect(r.comida.pctBem).toBeNull();
  expect(r.leitura.livrosTerminados).toBe(1);
});
it('primeiro dia do mês atual: nada considerado ainda', () => {
  const r = resumoDoMes('2026-12', b, '2026-12-01');
  expect([r.diasConsiderados, r.semRegistro]).toEqual([0, 0]);
});
