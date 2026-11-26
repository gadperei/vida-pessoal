import { reaisCurto } from '../regras/dinheiro.ts';
import { diasAtePrazo, progresso, textoPrazo } from '../regras/metas.ts';
import type { Dia, Etapa, Meta } from '../regras/tipos.ts';
import { degrade } from './cores.ts';

interface Props { metas: Meta[]; etapas: Etapa[]; hoje: Dia; aoAbrir(id: string): void }

/** As outras metas de prioridade alta: dois cartões por vez, com rolagem para o lado (§4.3 item 2). */
export function CartoesMetas({ metas, etapas, hoje, aoAbrir }: Props) {
  if (metas.length === 0) return null;
  return (
    <div className="metas-cartoes" role="list" aria-label="Outras metas de prioridade alta">
      {metas.map((m) => {
        const pct = Math.round(progresso(m, etapas) * 100);
        const prazo = textoPrazo(diasAtePrazo(m, hoje), m.prazo);
        const minhas = etapas.filter((e) => e.meta_id === m.id);
        const detalhe = m.tipo === 'conquista'
          ? (minhas.length > 0 ? `${minhas.filter((e) => e.feita).length} de ${minhas.length} etapas` : 'sem etapas')
          : `${reaisCurto(m.atual_centavos ?? 0)} / ${reaisCurto(m.alvo_centavos ?? 0).replace('R$ ', '')}`;
        return (
          <button key={m.id} type="button" role="listitem" className="meta-cartao" style={{ background: degrade(m.cor) }} onClick={() => aoAbrir(m.id)}>
            <span className="meta-icone" aria-hidden="true">{m.icone}</span>
            <span className="meta-nome">{m.nome}</span>
            <span className="meta-pct">{pct}%</span>
            <span className="meta-barra" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
            <span className="meta-valor">{detalhe} · <span className={prazo.atrasada ? 'meta-atrasada-curto' : ''}>{prazo.curto}</span></span>
          </button>
        );
      })}
    </div>
  );
}
