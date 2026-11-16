import { useState } from 'react';
import { BarraAbas, type Aba } from './componentes/BarraAbas.tsx';
import { EditarItem } from './componentes/EditarItem.tsx';
import { IndicadorSync } from './componentes/IndicadorSync.tsx';
import { PainelAnotar } from './componentes/PainelAnotar.tsx';
import { Toast } from './componentes/Toast.tsx';
import { BancoProvider, useBanco } from './estado/contexto.tsx';
import { useHoje } from './estado/useHoje.ts';
import { useSessao } from './estado/useSessao.ts';
import { ConfiguracaoInicial } from './telas/ConfiguracaoInicial.tsx';
import { Entrar } from './telas/Entrar.tsx';
import { Inicio } from './telas/Inicio.tsx';
import type { Ocorrencia } from './regras/agenda.ts';

export default function App() {
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
  const { banco, pronto, aviso, limparAviso } = useBanco();
  const [aba, setAba] = useState<Aba>('inicio');
  const hoje = useHoje();
  const [anotando, setAnotando] = useState(false);
  const [itemAberto, setItemAberto] = useState<Ocorrencia | null>(null);

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
      {aba === 'inicio' && <Inicio hoje={hoje} aoAbrirItem={setItemAberto} />}
      {aba !== 'inicio' && (
        <div className="conteudo">
          <p className="espaco-reservado">Aba: {aba}</p>
        </div>
      )}
      <BarraAbas aba={aba} aoTrocar={setAba} aoAnotar={aba === 'inicio' ? () => setAnotando(true) : undefined} />
      <PainelAnotar aberto={anotando} hoje={hoje} aoFechar={() => setAnotando(false)} />
      <EditarItem ocorrencia={itemAberto} hoje={hoje} aoFechar={() => setItemAberto(null)} />
      {aviso && <Toast mensagem={aviso} aoSumir={limparAviso} />}
    </main>
  );
}
