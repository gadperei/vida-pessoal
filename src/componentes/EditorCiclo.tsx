import { PRESETS } from '../regras/escala.ts';

interface Props {
  ciclo: string;
  /** Posição de hoje no ciclo (começa em 0), ou null se ainda não escolheu. */
  posicao: number | null;
  aoMudar(ciclo: string, posicao: number | null): void;
}

const MAX = 28;

/** Escolhe a escala (modelo pronto ou ciclo montado à mão) e qual dia do ciclo é hoje. */
export function EditorCiclo({ ciclo, posicao, aoMudar }: Props) {
  const preset = PRESETS.find((p) => p.ciclo === ciclo);
  const alternar = (i: number) =>
    aoMudar(ciclo.slice(0, i) + (ciclo[i] === 'T' ? 'F' : 'T') + ciclo.slice(i + 1), posicao);
  const mudarTamanho = (delta: number) => {
    const n = Math.min(MAX, Math.max(1, ciclo.length + delta));
    const novo = n > ciclo.length ? ciclo + 'F'.repeat(n - ciclo.length) : ciclo.slice(0, n);
    aoMudar(novo, posicao !== null && posicao < n ? posicao : null);
  };

  return (
    <div className="editor-ciclo">
      <div className="chips" role="group" aria-label="Modelos de escala">
        {PRESETS.map((p) => (
          <button
            key={p.nome}
            type="button"
            className={`chip ${preset?.nome === p.nome ? 'chip-ativo' : ''}`}
            onClick={() => aoMudar(p.ciclo, null)}
          >
            {p.nome}
          </button>
        ))}
        <span className={`chip ${preset ? '' : 'chip-ativo'}`} aria-hidden={!!preset}>Meu ciclo</span>
      </div>

      <p className="rotulo">Seu ciclo (toque para trocar trabalho ↔ folga)</p>
      <div className="ciclo">
        {[...ciclo].map((c, i) => (
          <button
            key={i}
            type="button"
            className={`casa ${c === 'T' ? 'casa-t' : 'casa-f'}`}
            aria-label={`Dia ${i + 1}: ${c === 'T' ? 'trabalho' : 'folga'}`}
            onClick={() => alternar(i)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="botoes">
        <button type="button" className="botao botao-secundario" onClick={() => mudarTamanho(-1)} disabled={ciclo.length <= 1}>− dia</button>
        <button type="button" className="botao botao-secundario" onClick={() => mudarTamanho(1)} disabled={ciclo.length >= MAX}>+ dia</button>
      </div>

      <p className="rotulo">Qual destes é hoje?</p>
      <div className="ciclo">
        {[...ciclo].map((c, i) => (
          <button
            key={i}
            type="button"
            className={`casa ${c === 'T' ? 'casa-t' : 'casa-f'} ${posicao === i ? 'casa-hoje' : ''}`}
            aria-pressed={posicao === i}
            aria-label={`Hoje é o dia ${i + 1} do ciclo (${c === 'T' ? 'trabalho' : 'folga'})`}
            onClick={() => aoMudar(ciclo, i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <p className="campo-dica">T = trabalho · F = folga. O ciclo se repete sozinho.</p>
    </div>
  );
}
