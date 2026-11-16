// Roda a cada 15 minutos (pg_cron). Calcula os avisos de cada pessoa no fuso de São Paulo,
// manda UMA notificação agrupada por aparelho e anota o que já foi enviado para não repetir.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { agoraEmSaoPaulo } from '../_shared/regras/datas.ts';
import { avisosDevidos, montarNotificacao } from '../_shared/regras/notificacoes.ts';
import { TABELAS, bancoVazio, type Banco } from '../_shared/regras/tipos.ts';

interface Inscricao { id: string; user_id: string; endpoint: string; p256dh: string; auth: string }

const DIA_MS = 24 * 60 * 60 * 1000;
const PAGINA = 1000;

function env(nome: string): string {
  const v = Deno.env.get(nome);
  if (!v) throw new Error(`segredo ${nome} não configurado`);
  return v;
}

// A service role ignora o RLS: TODA consulta filtra por user_id.
async function linhasDe(supa: SupabaseClient, tabela: string, userId: string): Promise<unknown[]> {
  const linhas: unknown[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await supa.from(tabela).select('*')
      .eq('user_id', userId).is('excluido_em', null).order('id').range(de, de + PAGINA - 1);
    if (error) throw new Error(`${tabela}: ${error.message}`);
    linhas.push(...data);
    if (data.length < PAGINA) return linhas;
  }
}

async function carregarBanco(supa: SupabaseClient, userId: string): Promise<Banco> {
  const banco = bancoVazio();
  for (const t of TABELAS) (banco as Record<string, unknown[]>)[t] = await linhasDe(supa, t, userId);
  return banco;
}

let vapidPronto = false;
function configurarVapid() {
  if (vapidPronto) return;
  webpush.setVapidDetails(env('VAPID_CONTATO'), env('VAPID_PUBLICA'), env('VAPID_PRIVADA'));
  vapidPronto = true;
}

/** 'ok' | 'morta' (404/410: apagar) | 'falhou' (tentar de novo no próximo ciclo). */
async function enviar(ins: Inscricao, carga: string): Promise<'ok' | 'morta' | 'falhou'> {
  try {
    await webpush.sendNotification({ endpoint: ins.endpoint, keys: { p256dh: ins.p256dh, auth: ins.auth } }, carga, { TTL: 6 * 60 * 60 });
    return 'ok';
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return 'morta';
    console.error('push falhou', status, (e as Error).message);
    return 'falhou';
  }
}

Deno.serve(async (req) => {
  const segredo = Deno.env.get('CRON_SEGREDO');
  if (!segredo || req.headers.get('x-cron-segredo') !== segredo) {
    return new Response('não autorizado', { status: 401 });
  }

  try {
    const supa = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
    const agora = agoraEmSaoPaulo(new Date());

    const { data: inscricoes, error } = await supa.from('push_inscricoes').select('id, user_id, endpoint, p256dh, auth');
    if (error) throw new Error(`push_inscricoes: ${error.message}`);
    const porUsuario = new Map<string, Inscricao[]>();
    for (const ins of inscricoes as Inscricao[]) porUsuario.set(ins.user_id, [...(porUsuario.get(ins.user_id) ?? []), ins]);

    let enviadas = 0;
    for (const [userId, lista] of porUsuario) {
      try {
        const banco = await carregarBanco(supa, userId);
        const { data: jaEnviadas, error: e2 } = await supa.from('notificacoes_enviadas').select('chave')
          .eq('user_id', userId).gte('enviada_em', new Date(Date.now() - 2 * DIA_MS).toISOString());
        if (e2) throw new Error(`notificacoes_enviadas: ${e2.message}`);

        const avisos = avisosDevidos(agora, banco, new Set(jaEnviadas.map((r) => r.chave as string)));
        const notificacao = montarNotificacao(avisos);
        if (!notificacao) continue;

        configurarVapid();
        const carga = JSON.stringify(notificacao);
        let entregou = false;
        for (const ins of lista) {
          const r = await enviar(ins, carga);
          if (r === 'ok') { entregou = true; enviadas++; }
          if (r === 'morta') await supa.from('push_inscricoes').delete().eq('id', ins.id).eq('user_id', userId);
        }
        // Só marca como enviado se chegou em pelo menos um aparelho; senão tenta no próximo ciclo.
        if (entregou) {
          const { error: e3 } = await supa.from('notificacoes_enviadas').upsert(
            avisos.map((a) => ({ user_id: userId, chave: a.chave })),
            { onConflict: 'user_id,chave', ignoreDuplicates: true },
          );
          if (e3) console.error('não gravou as chaves enviadas', e3.message);
        }
      } catch (e) {
        console.error('usuário com erro', userId, (e as Error).message);
      }
    }

    await supa.from('notificacoes_enviadas').delete().lt('enviada_em', new Date(Date.now() - 60 * DIA_MS).toISOString());
    return Response.json({ usuarios: porUsuario.size, enviadas });
  } catch (e) {
    console.error(e);
    return Response.json({ erro: (e as Error).message }, { status: 500 });
  }
});
