import { expect, it } from 'vitest';
import { bancoVazio, TABELAS } from './tipos.ts';

it('bancoVazio tem todas as tabelas, vazias', () => {
  const b = bancoVazio();
  expect(Object.keys(b).sort()).toEqual([...TABELAS].sort());
  expect(Object.values(b).every((l) => Array.isArray(l) && l.length === 0)).toBe(true);
});
