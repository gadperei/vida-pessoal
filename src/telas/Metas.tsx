import { corDaMeta } from '../componentes/cores.ts';
import { useBanco } from '../estado/contexto.tsx';
import { agruparMetas, diasAtePrazo, progresso, textoPrazo } from '../regras/metas.ts';
import type { Dia, Meta } from '../regras/tipos.ts';

interface Props { hoje: Dia; aoAbrir(id: string): void; aoNova(): void }

function LinhaMeta({ meta, hoje, aoAbrir }: { meta: Meta; hoje: Dia; aoAbrir(id: string): void }) {
  const { banco } = useBanco();
  const pct = Math.round(progresso(meta, banco.etapas) * 100);
  const cor = corDaMeta(meta.cor);
  const prazo = meta.concluida_em
    ? { texto: `concluída em ${meta.concluida_em.slice(8, 10)}/${meta.concluida_em.slice(5, 7)}`, atrasada: false }
    : (() => { const t = textoPrazo(diasAtePrazo(meta, hoje), meta.prazo); return { texto: t.atrasada ? t.texto : `${t.numero} ${t.texto}`, atrasada: t.atrasada }; })();
  return (
    <li>
      <button type="button" className="linha-meta" onClick={() => aoAbrir(meta.id)}>
        <span className="linha-meta-icone" style={{ background: cor }} aria-hidden="true">{meta.icone}</span>
        <span className="linha-meta-texto">
          <strong>{meta.nome}</strong>
          <span className={prazo.atrasada ? 'texto-atrasada' : 'campo-dica'}>{prazo.texto}</span>
          <span className="barra-meta" aria-hidden="true"><i style={{ width: `${pct}%`, background: cor }} /></span>
        </span>
        <span className="num linha-meta-pct">{pct}%</span>
      </button>
    </li>
  );
}

/** Aba Metas: agrupadas por prioridade, concluídas recolhidas no fim (§4.7). */
export function Metas({ hoje, aoAbrir, aoNova }: Props) {
  const { banco } = useBanco();
  const g = agruparMetas(banco.metas);
  const grupos: { titulo: string; metas: Meta[]; dica?: string }[] = [
    { titulo: 'Prioridade alta', metas: g.alta, dica: 'aparecem no Início' },
    { titulo: 'Prioridade média', metas: g.media },
    { titulo: 'Prioridade baixa', metas: g.baixa },
  ];

  return (
    <div className="conteudo">
      <button type="button" className="botao botao-primario botao-largo" onClick={aoNova}>+ nova meta</button>
      {banco.metas.length === 0 && <p className="espaco-reservado">Nenhuma meta ainda. Ex.: vender um projeto, começar a reserva de emergência, comprar um notebook.</p>}
      {grupos.filter((x) => x.metas.length > 0).map((x) => (
        <section key={x.titulo} className="grupo-metas">
          <h2>{x.titulo}{x.dica && <span className="campo-dica"> · {x.dica}</span>}</h2>
          <ul className="lista-metas">{x.metas.map((m) => <LinhaMeta key={m.id} meta={m} hoje={hoje} aoAbrir={aoAbrir} />)}</ul>
        </section>
      ))}
      {g.concluidas.length > 0 && (
        <details className="grupo-metas">
          <summary>Concluídas ({g.concluidas.length})</summary>
          <ul className="lista-metas">{g.concluidas.map((m) => <LinhaMeta key={m.id} meta={m} hoje={hoje} aoAbrir={aoAbrir} />)}</ul>
        </details>
      )}
    </div>
  );
}
