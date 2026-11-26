import { expect, it } from 'vitest';
import { dataPorExtenso, saudacao } from './saudacao.ts';

it('bom dia das 5h às 11h59, boa tarde das 12h às 17h59, boa noite no resto', () => {
  expect(saudacao(5)).toBe('Bom dia');
  expect(saudacao(11)).toBe('Bom dia');
  expect(saudacao(12)).toBe('Boa tarde');
  expect(saudacao(17)).toBe('Boa tarde');
  expect(saudacao(18)).toBe('Boa noite');
  expect(saudacao(2)).toBe('Boa noite');
});

it('data por extenso, com o dia da semana', () => {
  expect(dataPorExtenso('2026-11-26')).toBe('quinta, 26 de novembro');
  expect(dataPorExtenso('2026-11-01')).toBe('domingo, 1 de novembro');
  expect(dataPorExtenso('2026-12-05')).toBe('sábado, 5 de dezembro');
});
