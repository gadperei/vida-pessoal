import { expect, it } from 'vitest';
import { centavosDeDigitos, formatarReais } from './dinheiro.ts';

it('formata reais', () => {
  expect(formatarReais(123456)).toBe('R$ 1.234,56');
  expect(formatarReais(0)).toBe('R$ 0,00');
});
it('centavos só dos dígitos, até 12', () => {
  expect(centavosDeDigitos('R$ 1.234,56')).toBe(123456);
  expect(centavosDeDigitos('')).toBe(0);
  expect(centavosDeDigitos('1234567890123')).toBe(123456789012);
});
