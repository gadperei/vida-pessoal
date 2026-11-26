import type { ReactNode } from 'react';

export type Aba = 'inicio' | 'resumo' | 'metas' | 'ajustes';

// Ícones de traço (24×24), na cor do texto.
const svg = (corpo: ReactNode) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{corpo}</svg>
);
const ICONES: Record<Aba, ReactNode> = {
  inicio: svg(<><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" /></>),
  resumo: svg(<><path d="M5 20V11" /><path d="M10 20V5" /><path d="M15 20v-7" /><path d="M20 20V9" /></>),
  metas: svg(<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.6" fill="currentColor" /></>),
  ajustes: svg(<><path d="M4 7h10" /><path d="M18 7h2" /><circle cx="16" cy="7" r="2" /><path d="M4 17h2" /><path d="M10 17h10" /><circle cx="8" cy="17" r="2" /></>),
};

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'inicio', rotulo: 'Início' },
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'metas', rotulo: 'Metas' },
  { id: 'ajustes', rotulo: 'Ajustes' },
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
            {ICONES[a.id]}
            <span className="aba-rotulo">{a.rotulo}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
