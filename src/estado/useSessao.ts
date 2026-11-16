import { useEffect, useState } from 'react';
import { cliente } from '../supabase.ts';

export interface EstadoSessao { estado: 'carregando' | 'fora' | 'dentro'; userId: string | null; offlineSemSessao: boolean }

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
 * Sessão do Supabase. Sem sessão, mas sem internet e com um usuário guardado no aparelho,
 * abre "dentro" com os dados locais (a sessão pode ter vencido enquanto estava offline).
 */
export function useSessao(): EstadoSessao {
  const [s, setS] = useState<EstadoSessao>({ estado: 'carregando', userId: null, offlineSemSessao: false });

  useEffect(() => {
    let vivo = true;
    const decidir = (userId: string | null) => {
      if (!vivo) return;
      if (userId) {
        lembrarUsuario(userId);
        setS({ estado: 'dentro', userId, offlineSemSessao: false });
        return;
      }
      const ultimo = ultimoUsuario();
      if (!navigator.onLine && ultimo) setS({ estado: 'dentro', userId: ultimo, offlineSemSessao: true });
      else setS({ estado: 'fora', userId: null, offlineSemSessao: false });
    };
    const verificar = () => {
      cliente.auth.getSession()
        .then(({ data }) => decidir(data.session?.user.id ?? null))
        .catch(() => decidir(null));
    };
    verificar();
    const { data } = cliente.auth.onAuthStateChange((_evento, sessao) => decidir(sessao?.user.id ?? null));
    window.addEventListener('online', verificar);
    return () => {
      vivo = false;
      data.subscription.unsubscribe();
      window.removeEventListener('online', verificar);
    };
  }, []);

  return s;
}
