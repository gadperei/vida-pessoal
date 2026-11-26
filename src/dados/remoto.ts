// Fala com o Supabase. Só um erro do PRÓPRIO DADO é "recusado" (sai da fila); todo o resto é
// "rede" (fica na fila e tenta depois): sem sessão, sem permissão, servidor acordando, fora do ar…
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Linha } from '../regras/tipos.ts';
import type { Remoto } from './sincronizador.ts';

/** 400/409 com código 22xxx (dado inválido) ou 23xxx (regra do banco) = recusado; o resto = tentar depois. */
export function classificarErro(status: number, code: string | undefined, _mensagem: string): 'rede' | 'recusado' {
  const erroDeDado = !!code && (code.startsWith('22') || code.startsWith('23'));
  return (status === 400 || status === 409) && erroDeDado ? 'recusado' : 'rede';
}

/** Sem sessão válida, o cliente mandaria a alteração como anônimo: melhor esperar o login voltar. */
async function temSessao(cliente: SupabaseClient): Promise<boolean> {
  try {
    const { data } = await cliente.auth.getSession();
    return data.session !== null;
  } catch {
    return false;
  }
}

export function criarRemoto(cliente: SupabaseClient, userId: string): Remoto {
  return {
    async enviar(tabela, linha) {
      if (!navigator.onLine || !(await temSessao(cliente))) return 'rede';
      const { sincronizado_em: _ignorado, ...resto } = linha;
      try {
        const { error, status } = await cliente.from(tabela).upsert({ ...resto, user_id: userId }, { onConflict: 'user_id,id' });
        if (!error) return 'ok';
        return classificarErro(status, error.code, error.message);
      } catch {
        return 'rede';
      }
    },
    async buscar(tabela, desde) {
      if (!navigator.onLine || !(await temSessao(cliente))) return 'rede';
      try {
        let q = cliente.from(tabela).select('*').order('sincronizado_em', { ascending: true });
        if (desde) q = q.gte('sincronizado_em', desde);
        const { data, error } = await q;
        if (error) return 'rede';
        return (data as (Linha & { user_id?: string })[]).map(({ user_id: _u, ...l }) => l as Linha);
      } catch {
        return 'rede';
      }
    },
  };
}
