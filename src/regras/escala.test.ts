import { expect, it } from 'vitest';
import { config, escala, excecao } from '../testes/fabrica.ts';
import { escalaVigente, inicioPelaPosicao, posicaoNoCiclo, PRESETS, temAula, tipoDoCiclo, tipoDoDia } from './escala.ts';

const E = [escala()];

it('presets da spec', () => {
  expect(PRESETS).toEqual([
    { nome: '6x1', ciclo: 'TTTTTTF' }, { nome: '5x2', ciclo: 'TTTTTFF' }, { nome: '4x3', ciclo: 'TTTTFFF' },
    { nome: '12x36', ciclo: 'TF' }, { nome: '3x2 alternado', ciclo: 'TTTFFFTTFF' },
  ]);
});
it('ciclo 3x2 alternado a partir de 13/11', () => {
  const dias = ['2026-11-13', '2026-11-15', '2026-11-16', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23'];
  expect(dias.map((d) => tipoDoDia(d, E, []))).toEqual(['T', 'T', 'F', 'F', 'T', 'T', 'F', 'F', 'T']);
});
it('dias antes do início voltam no ciclo', () => {
  expect(tipoDoDia('2026-11-12', E, [])).toBe('F');
  expect(tipoDoDia('2026-11-04', E, [])).toBe('T');
});
it('exceção vence o ciclo (dia extra e férias)', () => {
  expect(tipoDoDia('2026-11-16', E, [excecao({ tipo_dia: 'T' })])).toBe('T');
  const ferias = [excecao({ inicio: '2026-11-19', fim: '2026-11-20', tipo_dia: 'F' })];
  expect(tipoDoDia('2026-11-19', E, ferias)).toBe('F');
  expect(tipoDoDia('2026-11-23', E, ferias)).toBe('T');
  expect(tipoDoDia('2026-11-16', E, [excecao({ sem_aula: true })])).toBe('F');
  expect(tipoDoCiclo('2026-11-16', E)).toBe('F');
});
it('troca de escala vale só daquele dia em diante', () => {
  const duas = [...E, escala({ ciclo: 'TTTTTFF', inicio: '2026-11-23', vigente_desde: '2026-11-23' })];
  expect(tipoDoDia('2026-11-22', duas, [])).toBe('F');
  expect(tipoDoDia('2026-11-23', duas, [])).toBe('T');
  expect(tipoDoDia('2026-11-28', duas, [])).toBe('F');
});
it('duas escalas no mesmo dia: vale a última alterada', () => {
  const a = escala({ ciclo: 'TF', vigente_desde: '2026-11-16', inicio: '2026-11-16', atualizado_em: '2026-11-16T10:00:00.000Z' });
  const b = escala({ ciclo: 'FT', vigente_desde: '2026-11-16', inicio: '2026-11-16', atualizado_em: '2026-11-16T11:00:00+00:00' });
  expect(escalaVigente('2026-11-16', [b, a])?.ciclo).toBe('FT');
  expect(escalaVigente('2026-11-16', [a, b])?.ciclo).toBe('FT');
});
it('sem escala é folga', () => expect(tipoDoDia('2026-11-16', [], [])).toBe('F'));
it('posição e início', () => {
  expect(inicioPelaPosicao('2026-11-16', 3)).toBe('2026-11-13');
  expect(posicaoNoCiclo('2026-11-16', E[0])).toBe(3);
  expect(posicaoNoCiclo('2026-11-12', E[0])).toBe(9);
});
it('faculdade: dias da semana, sábados alternados, fim do semestre e sem aula', () => {
  const c = config({ sabado_referencia: '2026-11-21', semestre_fim: '2026-12-10' });
  expect(temAula('2026-11-16', c, [])).toBe(true);
  expect(temAula('2026-11-22', c, [])).toBe(false);
  expect(temAula('2026-11-21', c, [])).toBe(true);
  expect(temAula('2026-11-28', c, [])).toBe(false);
  expect(temAula('2026-12-05', c, [])).toBe(true);
  expect(temAula('2026-11-07', c, [])).toBe(true);
  expect(temAula('2026-12-11', c, [])).toBe(false);
  expect(temAula('2026-11-17', c, [excecao({ inicio: '2026-11-17', fim: '2026-11-18', sem_aula: true })])).toBe(false);
  expect(temAula('2026-11-21', config(), [])).toBe(false);
});
