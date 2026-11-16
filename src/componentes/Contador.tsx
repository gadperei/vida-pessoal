/** Valor com botões − e +. */
export function Contador({ rotulo, valor, texto, passo, min, max, aoMudar }: {
  rotulo: string; valor: number; texto: string; passo: number; min: number; max: number; aoMudar(v: number): void;
}) {
  return (
    <div className="campo">
      <span className="rotulo">{rotulo}</span>
      <div className="contador">
        <button type="button" className="botao botao-secundario" aria-label={`Menos: ${rotulo}`} disabled={valor <= min} onClick={() => aoMudar(Math.max(min, valor - passo))}>−</button>
        <span className="num contador-valor">{texto}</span>
        <button type="button" className="botao botao-secundario" aria-label={`Mais: ${rotulo}`} disabled={valor >= max} onClick={() => aoMudar(Math.min(max, valor + passo))}>+</button>
      </div>
    </div>
  );
}
