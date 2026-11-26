import { useEffect, useState } from 'react';
import { CampoValor } from '../componentes/CampoValor.tsx';
import { PainelInferior } from '../componentes/PainelInferior.tsx';
import { agoraIso, novoId } from '../dados/ids.ts';
import {
  adicionarEtapa, adicionarValor, alternarEtapa, concluirMeta, excluirMeta, reabrirMeta, reordenarEtapas,
} from '../dados/opsMetas.ts';
import { useBanco } from '../estado/contexto.tsx';
import { formatarReais } from '../regras/dinheiro.ts';
import { diasAtePrazo, progresso, sugerirConcluir, textoPrazo } from '../regras/metas.ts';
import type { Dia, Meta } from '../regras/tipos.ts';

interface Props { metaId: string | null; hoje: Dia; aoFechar(): void; aoEditar(m: Meta): void }

const TIPO = { conquista: 'Conquista', valor: 'Valor', compra: 'Compra' } as const;
const PRIORIDADE = { alta: 'alta', media: 'média', baixa: 'baixa' } as const;
const dataBr = (d: Dia) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

/** Ver e atualizar uma meta: etapas, valores, concluir, reabrir e excluir (§4.7). */
export function DetalheMeta({ metaId, hoje, aoFechar, aoEditar }: Props) {
  const { banco, salvar, avisar } = useBanco();
  const meta = banco.metas.find((m) => m.id === metaId) ?? null;
  const etapas = banco.etapas.filter((e) => e.meta_id === metaId).sort((a, b) => a.ordem - b.ordem);
  const [valor, setValor] = useState(0);
  const [novaEtapa, setNovaEtapa] = useState('');
  const [dispensouSugestao, setDispensouSugestao] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  useEffect(() => {
    setValor(0);
    setNovaEtapa('');
    setDispensouSugestao(false);
    setConfirmarExclusao(false);
  }, [metaId]);

  if (!meta) return <PainelInferior aberto={false} titulo="" aoFechar={aoFechar}>{null}</PainelInferior>;

  const pct = Math.round(progresso(meta, banco.etapas) * 100);
  const prazo = textoPrazo(diasAtePrazo(meta, hoje), meta.prazo);
  const concluida = meta.concluida_em !== null;
  const agora = () => agoraIso();

  function mover(i: number, delta: -1 | 1) {
    const j = i + delta;
    if (j < 0 || j >= etapas.length) return;
    const nova = [...etapas];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    salvar(reordenarEtapas(nova, agora()));
  }

  function incluirEtapa() {
    const t = novaEtapa.trim();
    if (!meta || !t) return;
    salvar(adicionarEtapa(meta, t, banco.etapas, novoId, agora()));
    setNovaEtapa('');
  }

  function somar(sinal: 1 | -1) {
    if (!meta || valor <= 0) return;
    salvar(adicionarValor(meta, sinal * valor, agora()));
    setValor(0);
  }

  function corrigirTotal() {
    if (!meta) return;
    salvar(adicionarValor(meta, valor - (meta.atual_centavos ?? 0), agora()));
    setValor(0);
  }

  function concluir() {
    if (!meta) return;
    salvar(concluirMeta(meta, hoje, agora()));
    avisar(`Meta concluída: ${meta.nome} 🎉`);
    aoFechar();
  }

  function excluir() {
    if (!meta) return;
    salvar(excluirMeta(meta, banco.etapas, agora()));
    avisar('Meta excluída');
    aoFechar();
  }

  return (
    <PainelInferior aberto titulo={`${meta.icone} ${meta.nome}`} aoFechar={aoFechar}>
      <p className="campo-dica">
        {TIPO[meta.tipo]} · prioridade {PRIORIDADE[meta.prioridade]} · prazo {dataBr(meta.prazo)}
        {concluida ? ` · concluída em ${dataBr(meta.concluida_em as string)}` : ''}
      </p>
      {!concluida && <p className={prazo.atrasada ? 'texto-atrasada' : 'detalhe-prazo'}>{prazo.atrasada ? prazo.texto : `${prazo.numero} ${prazo.texto}`}</p>}

      <div className="detalhe-progresso">
        <span className="barra-meta" aria-hidden="true"><i style={{ width: `${pct}%`, background: meta.cor }} /></span>
        <span className="num">{pct}%</span>
      </div>

      {meta.tipo === 'conquista' ? (
        <>
          {etapas.length === 0 && <p className="campo-dica">Sem etapas: é só feito ou não feito. Dá para quebrar em etapas abaixo.</p>}
          <ul className="lista-etapas">
            {etapas.map((e, i) => (
              <li key={e.id} className={e.feita ? 'etapa-feita' : ''}>
                <label className="linha-opcao">
                  <input type="checkbox" checked={e.feita} onChange={() => salvar(alternarEtapa(e, agora()))} />
                  {e.texto}
                </label>
                <span className="etapa-mover">
                  <button type="button" className="botao-texto" aria-label={`Subir ${e.texto}`} disabled={i === 0} onClick={() => mover(i, -1)}>↑</button>
                  <button type="button" className="botao-texto" aria-label={`Descer ${e.texto}`} disabled={i === etapas.length - 1} onClick={() => mover(i, 1)}>↓</button>
                </span>
              </li>
            ))}
          </ul>
          <div className="campo">
            <label htmlFor="detalhe-etapa">Nova etapa</label>
            <div className="linha-acao">
              <input id="detalhe-etapa" value={novaEtapa} onChange={(e) => setNovaEtapa(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); incluirEtapa(); } }} />
              <button type="button" className="botao botao-secundario" disabled={!novaEtapa.trim()} onClick={incluirEtapa}>Adicionar</button>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="detalhe-valor"><span className="num">{formatarReais(meta.atual_centavos ?? 0)}</span> de {formatarReais(meta.alvo_centavos ?? 0)}</p>
          <CampoValor rotulo="Valor" valor={valor} aoMudar={setValor} />
          <div className="botoes">
            <button type="button" className="botao botao-primario" disabled={valor <= 0} onClick={() => somar(1)}>+ Adicionar</button>
            <button type="button" className="botao botao-secundario" disabled={valor <= 0} onClick={() => somar(-1)}>− Retirar</button>
          </div>
          <button type="button" className="botao botao-texto botao-largo" onClick={corrigirTotal}>Usar como total ({formatarReais(valor)})</button>
        </>
      )}

      {!dispensouSugestao && sugerirConcluir(meta, banco.etapas) && (
        <div className="sugestao">
          <p>Chegou a 100%! Concluir esta meta?</p>
          <div className="botoes">
            <button type="button" className="botao botao-secundario" onClick={() => setDispensouSugestao(true)}>Agora não</button>
            <button type="button" className="botao botao-primario" onClick={concluir}>Concluir</button>
          </div>
        </div>
      )}

      {meta.observacao && <p className="detalhe-obs">{meta.observacao}</p>}

      <div className="botoes">
        <button type="button" className="botao botao-secundario" onClick={() => aoEditar(meta)}>Editar</button>
        {concluida
          ? <button type="button" className="botao botao-secundario" onClick={() => salvar(reabrirMeta(meta, agora()))}>Reabrir</button>
          : <button type="button" className="botao botao-secundario" onClick={concluir}>Concluir</button>}
      </div>
      {!confirmarExclusao ? (
        <button type="button" className="botao botao-texto botao-largo" onClick={() => setConfirmarExclusao(true)}>Excluir meta</button>
      ) : (
        <div className="confirmar">
          <p>Excluir “{meta.nome}”{etapas.length > 0 ? ' e as etapas dela' : ''}?</p>
          <div className="botoes">
            <button type="button" className="botao botao-secundario" onClick={() => setConfirmarExclusao(false)}>Cancelar</button>
            <button type="button" className="botao botao-perigo" onClick={excluir}>Excluir</button>
          </div>
        </div>
      )}
    </PainelInferior>
  );
}
