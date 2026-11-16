export type Aba = 'inicio' | 'resumo' | 'metas' | 'ajustes';

const ABAS: { id: Aba; rotulo: string; icone: string }[] = [
  { id: 'inicio', rotulo: 'Início', icone: '🏠' },
  { id: 'resumo', rotulo: 'Resumo', icone: '📊' },
  { id: 'metas', rotulo: 'Metas', icone: '🎯' },
  { id: 'ajustes', rotulo: 'Ajustes', icone: '⚙️' },
];

interface Props {
  aba: Aba;
  aoTrocar(a: Aba): void;
  /** Sem esta função, o botão "+ anotar" não aparece. */
  aoAnotar?: () => void;
}

export function BarraAbas({ aba, aoTrocar, aoAnotar }: Props) {
  return (
    <>
      {aoAnotar && (
        <button type="button" className="botao-anotar" onClick={aoAnotar} aria-label="Anotar">
          <span aria-hidden="true">+</span> anotar
        </button>
      )}
      <nav className="barra-abas" aria-label="Seções">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`aba ${aba === a.id ? 'aba-ativa' : ''}`}
            aria-current={aba === a.id ? 'page' : undefined}
            onClick={() => aoTrocar(a.id)}
          >
            <span className="aba-icone" aria-hidden="true">{a.icone}</span>
            <span>{a.rotulo}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
