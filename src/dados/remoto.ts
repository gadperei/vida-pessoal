// Fala com o Supabase. Erro de rede (ou sessão vencida) = tentar depois; outro erro = recusado.
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import type { Linha } from '../regras/tipos.ts';
import type { Remoto } from './sincronizador.ts';

function ehTemporario(erro: PostgrestError): boolean {
  if (!erro.code) return true; // falha de rede não tem código do Postgres
  if (erro.code === 'PGRST301' || erro.code === 'PGRST303') return true; // JWT vencido ou inválido
  return /fetch|network|load failed|jwt/i.test(erro.message);
}

export function criarRemoto(cliente: SupabaseClient, userId: string): Remoto {
  return {
    async enviar(tabela, linha) {
      if (!navigator.onLine) return 'rede';
      const { sincronizado_em: _ignorado, ...resto } = linha;
      try {
        const { error } = await cliente.from(tabela).upsert({ ...resto, user_id: userId }, { onConflict: 'user_id,id' });
        if (!error) return 'ok';
        return ehTemporario(error) ? 'rede' : 'recusado';
      } catch {
        return 'rede';
      }
    },
    async buscar(tabela, desde) {
      if (!navigator.onLine) return 'rede';
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
