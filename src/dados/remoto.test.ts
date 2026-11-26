import { expect, it } from 'vitest';
import { classificarErro } from './remoto.ts';

it('só erro de dado (400/409 com 22xxx/23xxx) é recusado de vez', () => {
  expect(classificarErro(400, '23514', 'violates check constraint')).toBe('recusado');
  expect(classificarErro(400, '22P02', 'invalid input syntax for type date')).toBe('recusado');
  expect(classificarErro(409, '23505', 'duplicate key')).toBe('recusado');
});
it('sessão vencida, sem permissão, servidor acordando ou fora do ar: tenta de novo depois', () => {
  expect(classificarErro(403, '42501', 'permission denied for table itens')).toBe('rede');
  expect(classificarErro(401, 'PGRST301', 'JWT expired')).toBe('rede');
  expect(classificarErro(503, 'PGRST002', 'Could not query the database for the schema cache')).toBe('rede');
  expect(classificarErro(500, '57014', 'canceling statement due to statement timeout')).toBe('rede');
  expect(classificarErro(0, undefined, 'TypeError: Failed to fetch')).toBe('rede');
  expect(classificarErro(400, 'PGRST204', "Could not find the 'x' column")).toBe('rede');
});
