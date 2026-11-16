import { describe, expect, it } from 'vitest';
import { lerPedidoDaUrl } from './pedidoUrl.ts';

describe('pedido da URL (vindo da notificação)', () => {
  it('abre o check-in', () => {
    expect(lerPedidoDaUrl('?abrir=checkin')).toEqual({ aba: null, abrirCheckin: true });
  });
  it('abre a aba Metas', () => {
    expect(lerPedidoDaUrl('?aba=metas')).toEqual({ aba: 'metas', abrirCheckin: false });
  });
  it('ignora valores desconhecidos e URL vazia', () => {
    expect(lerPedidoDaUrl('?aba=xyz&abrir=outra')).toEqual({ aba: null, abrirCheckin: false });
    expect(lerPedidoDaUrl('')).toEqual({ aba: null, abrirCheckin: false });
  });
});
