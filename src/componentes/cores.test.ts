import { expect, it } from 'vitest';
import { CORES_META, contraste, degrade } from './cores.ts';

it('8 cores, a primeira é o roxo (mais fechado que o #7b5cff do plano, por contraste)', () => {
  expect(CORES_META).toHaveLength(8);
  expect(CORES_META[0]).toBe('#6c4cf0');
});

it('texto branco é legível em todas as cores (contraste ≥ 4,5:1)', () => {
  for (const c of CORES_META) expect(contraste(c, '#ffffff'), c).toBeGreaterThanOrEqual(4.5);
});

it('o degradê vai da cor para um tom mais escuro (o texto branco só fica mais legível)', () => {
  const d = degrade('#6c4cf0');
  expect(d.startsWith('linear-gradient(135deg, #6c4cf0')).toBe(true);
  const fim = d.match(/#[0-9a-f]{6}\)$/)?.[0].slice(0, 7) ?? '';
  expect(contraste(fim, '#ffffff')).toBeGreaterThan(contraste('#6c4cf0', '#ffffff'));
});
