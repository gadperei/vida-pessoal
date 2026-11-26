import { formatarReais } from '../regras/dinheiro.ts';
import { diasAtePrazo, progresso, textoPrazo } from '../regras/metas.ts';
import type { Dia, Etapa, Meta } from '../regras/tipos.ts';
import { degrade } from './cores.ts';

interface Props { meta: Meta | null; etapas: Etapa[]; hoje: Dia; aoAbrir(id: string): void; aoCriar(): void }

/** A meta de prioridade alta mais urgente, grande, com contagem regressiva (§4.3 item 1). */
export function MetaDestaque({ meta, etapas, hoje, aoAbrir, aoCriar }: Props) {
  if (!meta) {
    return (
      <button type="button" className="meta-criar" onClick={aoCriar}>
        <span>🎯 Criar uma meta</span>
        <span className="campo-dica">As de prioridade alta aparecem aqui</span>
      </button>
    );
  }
  const prazo = textoPrazo(diasAtePrazo(meta, hoje), meta.prazo);
  const minhas = etapas.filter((e) => e.meta_id === meta.id).sort((a, b) => a.ordem - b.ordem);
  const pct = Math.round(progresso(meta, etapas) * 100);

  return (
    <button type="button" className="meta-destaque" style={{ background: degrade(meta.cor) }} onClick={() => aoAbrir(meta.id)}>
      <span className="meta-k">Meta mais urgente</span>
      <span className="meta-nome">{meta.icone} {meta.nome}</span>
      {prazo.atrasada ? (
        <span className="meta-atrasada">{prazo.texto}</span>
      ) : (
        <span className="meta-contagem"><b>{prazo.numero}</b> {prazo.texto}</span>
      )}
      {meta.tipo === 'conquista' ? (
        minhas.length > 0 && (
          <span className="meta-etapas" aria-label={`${minhas.filter((e) => e.feita).length} de ${minhas.length} etapas feitas`}>
            {minhas.map((e) => <i key={e.id} className={e.feita ? 'feita' : ''} />)}
          </span>
        )
      ) : (
        <>
          <span className="meta-barra" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
          <span className="meta-valor">{pct}% · {formatarReais(meta.atual_centavos ?? 0)} de {formatarReais(meta.alvo_centavos ?? 0)}</span>
        </>
      )}
    </button>
  );
}
