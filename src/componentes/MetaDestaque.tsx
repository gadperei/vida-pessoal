import { formatarReais } from '../regras/dinheiro.ts';
import { diasAtePrazo, progresso, textoPrazo } from '../regras/metas.ts';
import type { Dia, Etapa, Meta } from '../regras/tipos.ts';
import { corDaMeta } from './cores.ts';
import { Onda } from './Onda.tsx';

interface Props { meta: Meta | null; etapas: Etapa[]; hoje: Dia; aoAbrir(id: string): void; aoCriar(): void }

/** A meta de prioridade alta mais urgente, grande, com contagem regressiva (§4.3 item 1). */
export function MetaDestaque({ meta, etapas, hoje, aoAbrir, aoCriar }: Props) {
  if (!meta) {
    return (
      <button type="button" className="meta-criar" onClick={aoCriar}>
        <span>Criar uma meta</span>
        <span className="campo-dica">As de prioridade alta aparecem aqui</span>
      </button>
    );
  }
  const prazo = textoPrazo(diasAtePrazo(meta, hoje), meta.prazo);
  const minhas = etapas.filter((e) => e.meta_id === meta.id).sort((a, b) => a.ordem - b.ordem);
  const pct = Math.round(progresso(meta, etapas) * 100);
  const cor = corDaMeta(meta.cor);

  return (
    <button type="button" className="meta-destaque" style={{ background: cor }} onClick={() => aoAbrir(meta.id)}>
      <Onda cor={cor} pct={pct} />
      <span className="meta-k">Meta mais urgente · {pct}% feito</span>
      <span className="meta-nome"><span aria-hidden="true">{meta.icone}</span> {meta.nome}</span>
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
        <span className="meta-valor">{formatarReais(meta.atual_centavos ?? 0)} de {formatarReais(meta.alvo_centavos ?? 0)}</span>
      )}
    </button>
  );
}
