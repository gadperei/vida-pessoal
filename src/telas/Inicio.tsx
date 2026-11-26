import { useState } from 'react';
import { LinhaDoTempo } from '../componentes/LinhaDoTempo.tsx';
import { PainelInferior } from '../componentes/PainelInferior.tsx';
import { agoraIso } from '../dados/ids.ts';
import { alternarFeito, excluirLinha, moverItem } from '../dados/opsAgenda.ts';
import { useBanco } from '../estado/contexto.tsx';
import { AvisoInstalacao } from '../pwa/AvisoInstalacao.tsx';
import { CartaoCheckin } from '../componentes/CartaoCheckin.tsx';
import { pendentes, proximaFolga, type Ocorrencia } from '../regras/agenda.ts';
import { adicionarDias, rotuloDia } from '../regras/datas.ts';
import type { Dia, Item } from '../regras/tipos.ts';

interface Props {
  hoje: Dia;
  aoAbrirItem(o: Ocorrencia): void;
  aoAbrirCheckin(): void;
}

function Pendente({ item, hoje }: { item: Item; hoje: Dia }) {
  const { banco, salvar } = useBanco();
  const [escolhendo, setEscolhendo] = useState(false);
  const mover = (data: Dia) => salvar(moverItem(item, data, agoraIso()));
  return (
    <li className="pendente">
      <p><strong>{item.titulo}</strong> <span className="campo-dica">· era {rotuloDia(item.data)}</span></p>
      <div className="chips">
        <button type="button" className="chip" onClick={() => salvar(alternarFeito({ item, dia: item.data, feito: false }, banco, agoraIso()))}>Feito</button>
        <button type="button" className="chip" onClick={() => mover(adicionarDias(hoje, 1))}>Amanhã</button>
        <button type="button" className="chip" onClick={() => mover(proximaFolga(hoje, banco))}>Próxima folga</button>
        <button type="button" className="chip" onClick={() => setEscolhendo((v) => !v)}>Escolher data</button>
        <button type="button" className="chip chip-perigo" onClick={() => salvar(excluirLinha('itens', item, agoraIso()))}>Excluir</button>
      </div>
      {escolhendo && (
        <input type="date" aria-label={`Nova data para ${item.titulo}`} min={hoje} onChange={(e) => e.target.value && mover(e.target.value)} />
      )}
    </li>
  );
}

export function Inicio({ hoje, aoAbrirItem, aoAbrirCheckin }: Props) {
  const { banco } = useBanco();
  const [verPendentes, setVerPendentes] = useState(false);
  const lista = pendentes(hoje, banco.itens);

  const topoDeHoje = lista.length > 0 && (
    <button type="button" className="botao-pendentes" onClick={() => setVerPendentes(true)}>
      {lista.length === 1 ? '1 pendente' : `${lista.length} pendentes`} de dias anteriores
    </button>
  );

  return (
    <div className="conteudo">
      <AvisoInstalacao />
      {/* Metas em destaque (Task 20) entram aqui. */}
      <CartaoCheckin hoje={hoje} aoAbrir={aoAbrirCheckin} />
      <LinhaDoTempo hoje={hoje} aoAbrirItem={aoAbrirItem} topoDeHoje={topoDeHoje} />
      <PainelInferior aberto={verPendentes && lista.length > 0} titulo="Pendentes" aoFechar={() => setVerPendentes(false)}>
        <ul className="lista-pendentes">
          {lista.map((i) => <Pendente key={i.id} item={i} hoje={hoje} />)}
        </ul>
      </PainelInferior>
    </div>
  );
}
