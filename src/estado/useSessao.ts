import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { cliente } from '../supabase.ts';
import { decidirSessao, type EstadoSessao } from './sessao.ts';

export type { EstadoSessao };

const CHAVE_ULTIMO = 'vida-pessoal:ultimo-usuario';

export function lembrarUsuario(userId: string): void {
  try { localStorage.setItem(CHAVE_ULTIMO, userId); } catch { /* sem armazenamento */ }
}
export function esquecerUsuario(): void {
  try { localStorage.removeItem(CHAVE_ULTIMO); } catch { /* sem armazenamento */ }
}
function ultimoUsuario(): string | null {
  try { return localStorage.getItem(CHAVE_ULTIMO); } catch { return null; }
}

/**
 * Sessão do Supabase. Sem sessão, mas sem rede de verdade e com um usuário guardado no aparelho,
 * abre "dentro" com os dados locais (a sessão pode ter vencido enquanto estava offline).
 */
export function useSessao(): EstadoSessao {
  const [s, setS] = useState<EstadoSessao>({ estado: 'carregando', userId: null, offlineSemSessao: false });

  useEffect(() => {
    let vivo = true;
    const decidir = (userId: string | null, erroDeRede: boolean) => {
      if (!vivo) return;
      if (userId) lembrarUsuario(userId);
      setS(decidirSessao({ userId, ultimo: ultimoUsuario(), online: navigator.onLine, erroDeRede }));
    };
    const verificar = () => {
      let respondeu = false;
      // Renovar o login sem rede pode levar ~30 s em tentativas; depois de 4 s, abre com os dados do aparelho.
      const limite = window.setTimeout(() => { if (!respondeu) decidir(null, true); }, 4000);
      cliente.auth.getSession()
        .then(({ data, error }) => decidir(data.session?.user.id ?? null, isAuthRetryableFetchError(error)))
        .catch(() => decidir(null, true))
        .finally(() => { respondeu = true; window.clearTimeout(limite); });
    };
    verificar();
    // Só "entrou" e "saiu" mudam a decisão aqui; a sessão inicial vem do verificar() (que sabe se foi falta de rede).
    const { data } = cliente.auth.onAuthStateChange((evento, sessao) => {
      if (sessao) decidir(sessao.user.id, false);
      else if (evento === 'SIGNED_OUT') decidir(null, false);
    });
    window.addEventListener('online', verificar);
    return () => {
      vivo = false;
      data.subscription.unsubscribe();
      window.removeEventListener('online', verificar);
    };
  }, []);

  return s;
}
