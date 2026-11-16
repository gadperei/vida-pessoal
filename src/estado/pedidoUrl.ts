import type { Aba } from '../componentes/BarraAbas.tsx';

const ABAS: Aba[] = ['inicio', 'resumo', 'metas', 'ajustes'];

/** O que a notificação pediu para abrir: "/?aba=metas" ou "/?abrir=checkin". */
export function lerPedidoDaUrl(search: string): { aba: Aba | null; abrirCheckin: boolean } {
  const p = new URLSearchParams(search);
  const aba = p.get('aba');
  return {
    aba: ABAS.includes(aba as Aba) ? (aba as Aba) : null,
    abrirCheckin: p.get('abrir') === 'checkin',
  };
}
