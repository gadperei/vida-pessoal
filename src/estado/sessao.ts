export interface EstadoSessao { estado: 'carregando' | 'fora' | 'dentro'; userId: string | null; offlineSemSessao: boolean }

/**
 * Sem sessão, mas sem rede (modo avião, ou Wi-Fi que "conecta" sem internet de verdade) e com um
 * usuário guardado no aparelho: abre "dentro" com os dados locais. A sessão volta quando a rede voltar.
 */
export function decidirSessao(p: { userId: string | null; ultimo: string | null; online: boolean; erroDeRede: boolean }): EstadoSessao {
  if (p.userId) return { estado: 'dentro', userId: p.userId, offlineSemSessao: false };
  if (p.ultimo && (!p.online || p.erroDeRede)) return { estado: 'dentro', userId: p.ultimo, offlineSemSessao: true };
  return { estado: 'fora', userId: null, offlineSemSessao: false };
}
