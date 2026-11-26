import { expect, it } from 'vitest';
import { telaInicial } from './telaInicial.ts';

it('com config: o app', () => {
  expect(telaInicial({ temConfig: true, baixouDoServidor: false })).toBe('app');
});
it('sem config, depois de baixar do servidor: configuração inicial (pessoa nova)', () => {
  expect(telaInicial({ temConfig: false, baixouDoServidor: true })).toBe('configurar');
});
it('sem config e sem conseguir baixar: espera, nunca oferece configurar por cima dos dados de quem já usa', () => {
  expect(telaInicial({ temConfig: false, baixouDoServidor: false })).toBe('aguardar');
});
