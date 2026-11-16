import { useState } from 'react';
import { ComoInstalar } from '../pwa/ComoInstalar.tsx';
import { ativarPush, situacaoPush, type SituacaoPush } from '../pwa/push.ts';
import { cliente } from '../supabase.ts';

/** Estado e botão das notificações neste aparelho (configuração inicial e Ajustes). */
export function AtivarNotificacoes({ aoAtivar }: { aoAtivar?(): void }) {
  const [situacao, setSituacao] = useState<SituacaoPush>(() => situacaoPush());
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  async function ativar() {
    setOcupado(true);
    setErro('');
    try {
      const r = await ativarPush(cliente);
      const nova: SituacaoPush = r === 'ok' ? 'ativo' : r === 'negado' ? 'negado' : 'sem-suporte';
      setSituacao(nova);
      if (nova === 'ativo') aoAtivar?.();
    } catch {
      setErro('Não deu para ativar agora. Confira a internet e tente de novo.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="ativar-notificacoes">
      {situacao === 'ativo' && <p className="aviso aviso-ok">✓ Notificações ativadas neste aparelho.</p>}
      {situacao === 'pode-pedir' && (
        <button type="button" className="botao botao-primario botao-largo" disabled={ocupado} onClick={ativar}>
          {ocupado ? 'Ativando…' : 'Ativar notificações'}
        </button>
      )}
      {situacao === 'negado' && (
        <p className="aviso aviso-alerta">As notificações estão bloqueadas para este site. Libere nas configurações do navegador e volte aqui.</p>
      )}
      {situacao === 'sem-suporte' && (
        <p className="aviso aviso-alerta">Este navegador não recebe notificações. No celular, use o Chrome (Android) ou o app instalado (iPhone).</p>
      )}
      {situacao === 'precisa-instalar' && (
        <>
          <p className="aviso aviso-info">No iPhone, os avisos só chegam com o app instalado na Tela de Início. Depois de instalar, abra pelo ícone e ative em Ajustes.</p>
          <ComoInstalar />
        </>
      )}
      {erro && <p className="aviso aviso-erro" role="alert">{erro}</p>}
    </div>
  );
}
