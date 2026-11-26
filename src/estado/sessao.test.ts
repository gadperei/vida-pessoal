import { expect, it } from 'vitest';
import { decidirSessao } from './sessao.ts';

it('com sessão: dentro', () => {
  expect(decidirSessao({ userId: 'u', ultimo: null, online: true, erroDeRede: false })).toEqual({ estado: 'dentro', userId: 'u', offlineSemSessao: false });
});
it('sem sessão por falta de rede (modo avião OU Wi-Fi sem internet): abre com os dados do aparelho', () => {
  expect(decidirSessao({ userId: null, ultimo: 'u', online: false, erroDeRede: false })).toEqual({ estado: 'dentro', userId: 'u', offlineSemSessao: true });
  expect(decidirSessao({ userId: null, ultimo: 'u', online: true, erroDeRede: true })).toEqual({ estado: 'dentro', userId: 'u', offlineSemSessao: true });
});
it('sem sessão de verdade, ou sem usuário guardado: tela de entrar', () => {
  expect(decidirSessao({ userId: null, ultimo: 'u', online: true, erroDeRede: false }).estado).toBe('fora');
  expect(decidirSessao({ userId: null, ultimo: null, online: false, erroDeRede: true }).estado).toBe('fora');
});
