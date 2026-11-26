import { useEffect, useState, type FormEvent } from 'react';
import { CampoValor } from '../../componentes/CampoValor.tsx';
import { CORES_META } from '../../componentes/cores.ts';
import { PainelInferior } from '../../componentes/PainelInferior.tsx';
import { agoraIso, novoId } from '../../dados/ids.ts';
import { criarMeta, editarMeta, type CamposMeta } from '../../dados/opsMetas.ts';
import { useBanco } from '../../estado/contexto.tsx';
import type { Dia, Meta, Prioridade, TipoMeta } from '../../regras/tipos.ts';

interface Props { aberto: boolean; meta: Meta | null; hoje: Dia; aoFechar(): void }

const EMOJIS = ['🎯', '🚀', '🏦', '💻', '🎓', '💰', '🏋️', '📚', '✈️', '🏠'];
const TIPOS: { v: TipoMeta; r: string; d: string }[] = [
  { v: 'conquista', r: 'Conquista', d: 'Algo para fazer, com etapas opcionais.' },
  { v: 'valor', r: 'Valor', d: 'Juntar uma quantia (ex.: reserva).' },
  { v: 'compra', r: 'Compra', d: 'Juntar o preço de algo.' },
];
const PRIORIDADES: { v: Prioridade; r: string }[] = [{ v: 'alta', r: 'Alta' }, { v: 'media', r: 'Média' }, { v: 'baixa', r: 'Baixa' }];

/** Criar ou editar uma meta (§4.7). As etapas são criadas aqui; depois, ajustadas no detalhe da meta. */
export function FormMeta({ aberto, meta, hoje, aoFechar }: Props) {
  const { salvar, avisar } = useBanco();
  const [nome, setNome] = useState('');
  const [icone, setIcone] = useState('🎯');
  const [cor, setCor] = useState<string>(CORES_META[0]);
  const [tipo, setTipo] = useState<TipoMeta>('conquista');
  const [prazo, setPrazo] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('alta');
  const [alvo, setAlvo] = useState(0);
  const [etapas, setEtapas] = useState<string[]>([]);
  const [novaEtapa, setNovaEtapa] = useState('');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (!aberto) return;
    setNome(meta?.nome ?? '');
    setIcone(meta?.icone ?? '🎯');
    setCor(meta?.cor ?? CORES_META[0]);
    setTipo(meta?.tipo ?? 'conquista');
    setPrazo(meta?.prazo ?? `${hoje.slice(0, 4)}-12-31`);
    setPrioridade(meta?.prioridade ?? 'alta');
    setAlvo(meta?.alvo_centavos ?? 0);
    setEtapas([]);
    setNovaEtapa('');
    setObservacao(meta?.observacao ?? '');
  }, [aberto, meta, hoje]);

  const precisaAlvo = tipo !== 'conquista';
  const falta = !nome.trim() ? 'Dê um nome para a meta.' : !prazo ? 'Escolha o prazo.' : precisaAlvo && alvo <= 0 ? `Informe ${tipo === 'compra' ? 'o preço' : 'o alvo'}.` : null;

  function incluirEtapa() {
    const t = novaEtapa.trim();
    if (!t) return;
    setEtapas((es) => [...es, t]);
    setNovaEtapa('');
  }

  function enviar(ev: FormEvent) {
    ev.preventDefault();
    if (falta) return;
    const campos: CamposMeta = {
      nome: nome.trim(), icone: icone.trim() || '🎯', cor, tipo, prazo, prioridade,
      alvo_centavos: precisaAlvo ? alvo : null, observacao: observacao.trim() || null,
    };
    const agora = agoraIso();
    if (meta) {
      salvar(editarMeta(meta, campos, agora));
      avisar('Meta salva');
    } else {
      const pendente = novaEtapa.trim();
      salvar(criarMeta(campos, tipo === 'conquista' ? [...etapas, ...(pendente ? [pendente] : [])] : [], novoId, agora));
      avisar(`Meta criada: ${campos.nome}`);
    }
    aoFechar();
  }

  return (
    <PainelInferior aberto={aberto} titulo={meta ? 'Editar meta' : 'Nova meta'} aoFechar={aoFechar}>
      <form onSubmit={enviar}>
        <div className="campo">
          <label htmlFor="meta-nome">Nome</label>
          <input id="meta-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex.: Vender um projeto" autoComplete="off" />
        </div>

        <div role="group" aria-label="Ícone">
          <p className="rotulo">Ícone</p>
          <div className="chips chips-emoji">
            {EMOJIS.map((e) => (
              <button key={e} type="button" className={`chip ${icone === e ? 'chip-ativo' : ''}`} aria-pressed={icone === e} onClick={() => setIcone(e)}>{e}</button>
            ))}
            <input className="chip-emoji-livre" aria-label="Outro emoji" maxLength={8} value={EMOJIS.includes(icone) ? '' : icone} placeholder="outro" onChange={(e) => setIcone(e.target.value)} />
          </div>
        </div>

        <div role="radiogroup" aria-label="Cor">
          <p className="rotulo">Cor</p>
          <div className="chips">
            {CORES_META.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={cor === c} aria-label={`Cor ${c}`} className={`chip-cor ${cor === c ? 'chip-cor-ativa' : ''}`} style={{ background: c }} onClick={() => setCor(c)} />
            ))}
          </div>
        </div>

        <div role="group" aria-label="Tipo">
          <p className="rotulo">Tipo</p>
          <div className="chips">
            {TIPOS.map((t) => (
              <button key={t.v} type="button" className={`chip ${tipo === t.v ? 'chip-ativo' : ''}`} aria-pressed={tipo === t.v} onClick={() => setTipo(t.v)}>{t.r}</button>
            ))}
          </div>
          <p className="campo-dica">{TIPOS.find((t) => t.v === tipo)?.d}</p>
        </div>

        <div className="campos-lado">
          <div className="campo">
            <label htmlFor="meta-prazo">Prazo</label>
            <input id="meta-prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
          </div>
          {precisaAlvo && <CampoValor rotulo={tipo === 'compra' ? 'Preço' : 'Alvo'} valor={alvo} aoMudar={setAlvo} />}
        </div>

        <div role="group" aria-label="Prioridade">
          <p className="rotulo">Prioridade</p>
          <div className="chips">
            {PRIORIDADES.map((p) => (
              <button key={p.v} type="button" className={`chip ${prioridade === p.v ? 'chip-ativo' : ''}`} aria-pressed={prioridade === p.v} onClick={() => setPrioridade(p.v)}>{p.r}</button>
            ))}
          </div>
          <p className="campo-dica">Alta aparece no Início. Média e baixa ficam só aqui em Metas.</p>
        </div>

        {tipo === 'conquista' && !meta && (
          <div className="campo">
            <label htmlFor="meta-etapa">Etapas (opcional)</label>
            {etapas.length > 0 && (
              <ol className="lista-etapas-nova">
                {etapas.map((e, i) => (
                  <li key={`${e}-${i}`}>
                    {e}
                    <button type="button" className="botao-texto" aria-label={`Tirar etapa ${e}`} onClick={() => setEtapas((es) => es.filter((_, k) => k !== i))}>×</button>
                  </li>
                ))}
              </ol>
            )}
            <div className="linha-acao">
              <input id="meta-etapa" value={novaEtapa} placeholder="ex.: Montar portfólio" onChange={(e) => setNovaEtapa(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); incluirEtapa(); } }} />
              <button type="button" className="botao botao-secundario" disabled={!novaEtapa.trim()} onClick={incluirEtapa}>Adicionar</button>
            </div>
          </div>
        )}

        <div className="campo">
          <label htmlFor="meta-obs">Observação (opcional)</label>
          <input id="meta-obs" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </div>

        {falta && <p className="campo-dica">{falta}</p>}
        <button type="submit" className="botao botao-primario botao-largo" disabled={falta !== null}>{meta ? 'Salvar' : 'Criar meta'}</button>
      </form>
    </PainelInferior>
  );
}
