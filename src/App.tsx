import { useEffect, useState } from 'react';
import { AtivarNotificacoes } from './componentes/AtivarNotificacoes.tsx';
import { BarraAbas, type Aba } from './componentes/BarraAbas.tsx';
import { EditarItem } from './componentes/EditarItem.tsx';
import { IndicadorSync } from './componentes/IndicadorSync.tsx';
import { PainelAnotar } from './componentes/PainelAnotar.tsx';
import { PainelCheckin } from './componentes/PainelCheckin.tsx';
import { Toast } from './componentes/Toast.tsx';
import { BancoProvider, useBanco } from './estado/contexto.tsx';
import { useHoje } from './estado/useHoje.ts';
import { useSessao } from './estado/useSessao.ts';
import { ConfiguracaoInicial } from './telas/ConfiguracaoInicial.tsx';
import { Entrar } from './telas/Entrar.tsx';
import { Inicio } from './telas/Inicio.tsx';
import { Resumo } from './telas/Resumo.tsx';
import { Metas } from './telas/Metas.tsx';
import { DetalheMeta } from './telas/DetalheMeta.tsx';
import { FormMeta } from './telas/formularios/FormMeta.tsx';
import type { Dia, Meta } from './regras/tipos.ts';
import { AvisoAtualizacao } from './pwa/AvisoAtualizacao.tsx';
import { ativarPush, situacaoPush } from './pwa/push.ts';
import { lerPedidoDaUrl } from './estado/pedidoUrl.ts';
import { cliente } from './supabase.ts';
import type { Ocorrencia } from './regras/agenda.ts';

export default function App() {
  // O AvisoAtualizacao registra o service worker: fica fora de tudo para valer até na tela de login.
  return (
    <>
      <AvisoAtualizacao />
      <Conteudo />
    </>
  );
}

function Conteudo() {
  const sessao = useSessao();
  if (sessao.estado === 'carregando') return <div className="tela-neutra">Carregando…</div>;
  if (sessao.estado === 'fora' || !sessao.userId) return <Entrar />;
  return (
    <BancoProvider userId={sessao.userId}>
      <Principal />
    </BancoProvider>
  );
}

function Principal() {
  const { banco, pronto, aviso, limparAviso, status } = useBanco();
  // A notificação abre "/?aba=metas" ou "/?abrir=checkin".
  const [pedido] = useState(() => lerPedidoDaUrl(window.location.search));
  const [aba, setAba] = useState<Aba>(pedido.aba ?? 'inicio');
  const [checkinAberto, setCheckinAberto] = useState(pedido.abrirCheckin);
  const hoje = useHoje();
  const [anotando, setAnotando] = useState(false);
  const [itemAberto, setItemAberto] = useState<Ocorrencia | null>(null);
  const [metaAberta, setMetaAberta] = useState<string | null>(null);
  // Semana que o cartão "Sua semana passada" pediu para abrir no Resumo (vale só até trocar de aba).
  const [semanaResumo, setSemanaResumo] = useState<Dia | null>(null);
  const trocarAba = (a: Aba) => { setSemanaResumo(null); setAba(a); };
  const [formMeta, setFormMeta] = useState<{ aberto: boolean; meta: Meta | null }>({ aberto: false, meta: null });

  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  // Com a permissão já dada, confere e regrava a inscrição de push (o navegador pode trocá-la).
  useEffect(() => {
    if (!status.online || situacaoPush() !== 'ativo') return;
    ativarPush(cliente).catch(() => { /* tenta de novo na próxima vez */ });
  }, [status.online]);

  if (!pronto) return <div className="tela-neutra">Carregando…</div>;
  if (banco.config.length === 0) {
    return (
      <>
        <IndicadorSync />
        <ConfiguracaoInicial />
      </>
    );
  }
  return (
    <main className="app">
      <IndicadorSync />
      {aba === 'inicio' && (
        <Inicio hoje={hoje} aoAbrirItem={setItemAberto} aoAbrirCheckin={() => setCheckinAberto(true)} aoAbrirMeta={setMetaAberta} aoNovaMeta={() => setFormMeta({ aberto: true, meta: null })}
          aoVerSemana={(segunda) => { setSemanaResumo(segunda); setAba('resumo'); }} />
      )}
      {aba === 'ajustes' && (
        <div className="conteudo">
          {/* Os Ajustes completos entram na Task 22; as notificações já ficam aqui. */}
          <section className="card">
            <h2>Notificações</h2>
            <AtivarNotificacoes />
          </section>
        </div>
      )}
      {aba === 'resumo' && <Resumo key={semanaResumo ?? 'atual'} hoje={hoje} semanaInicial={semanaResumo} />}
      {aba === 'metas' && <Metas hoje={hoje} aoAbrir={setMetaAberta} aoNova={() => setFormMeta({ aberto: true, meta: null })} />}
      <BarraAbas aba={aba} aoTrocar={trocarAba} aoAnotar={aba === 'inicio' ? () => setAnotando(true) : undefined} />
      <PainelAnotar aberto={anotando} hoje={hoje} aoFechar={() => setAnotando(false)} />
      <EditarItem ocorrencia={itemAberto} hoje={hoje} aoFechar={() => setItemAberto(null)} />
      <PainelCheckin aberto={checkinAberto} hoje={hoje} aoFechar={() => setCheckinAberto(false)} />
      <DetalheMeta metaId={metaAberta} hoje={hoje} aoFechar={() => setMetaAberta(null)} aoEditar={(m) => { setMetaAberta(null); setFormMeta({ aberto: true, meta: m }); }} />
      <FormMeta aberto={formMeta.aberto} meta={formMeta.meta} hoje={hoje} aoFechar={() => setFormMeta({ aberto: false, meta: null })} />
      {aviso && <Toast mensagem={aviso} aoSumir={limparAviso} />}
    </main>
  );
}
