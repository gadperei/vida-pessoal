import { useState } from 'react';
import { BarraAbas, type Aba } from './componentes/BarraAbas.tsx';
import { IndicadorSync } from './componentes/IndicadorSync.tsx';
import { Toast } from './componentes/Toast.tsx';
import { BancoProvider, useBanco } from './estado/contexto.tsx';
import { useSessao } from './estado/useSessao.ts';
import { Entrar } from './telas/Entrar.tsx';

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

  if (!pronto) return <div className="tela-neutra">Carregando…</div>;
  if (banco.config.length === 0) {
    return (
      <main className="app">
        <IndicadorSync />
        <p className="espaco-reservado">Configuração inicial (Task 13)</p>
      </main>
    );
  }
  return (
    <main className="app">
      <IndicadorSync />
      <div className="conteudo">
        <p className="espaco-reservado">Aba: {aba}</p>
      </div>
      <BarraAbas aba={aba} aoTrocar={setAba} />
      {aviso && <Toast mensagem={aviso} aoSumir={limparAviso} />}
    </main>
  );
}
