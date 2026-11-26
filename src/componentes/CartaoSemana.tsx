import { useState } from 'react';
import { useBanco } from '../estado/contexto.tsx';
import { adicionarDias } from '../regras/datas.ts';
import { cartaoSemanaVisivel, resumoDaSemana } from '../regras/semana.ts';
import type { Dia } from '../regras/tipos.ts';

const CHAVE = 'vida-pessoal:semana-dispensada';

function lerDispensada(): Dia | null {
  try { return localStorage.getItem(CHAVE); } catch { return null; }
}

/** Na segunda-feira: "Sua semana passada", até ser aberto ou dispensado (§4.6). */
export function CartaoSemana({ hoje, aoVer }: { hoje: Dia; aoVer(segunda: Dia): void }) {
  const { banco } = useBanco();
  const [dispensada, setDispensada] = useState(lerDispensada);
  if (!cartaoSemanaVisivel(hoje, dispensada)) return null;

  const segunda = adicionarDias(hoje, -7);
  const r = resumoDaSemana(segunda, adicionarDias(segunda, 6), banco);
  function guardar() {
    setDispensada(segunda);
    try { localStorage.setItem(CHAVE, segunda); } catch { /* sem armazenamento: some só nesta sessão */ }
  }

  return (
    <div className="cartao-semana">
      <div>
        <strong>Sua semana passada</strong>
        <p className="campo-dica">
          {r.total === 0 ? 'Nada planejado' : `${r.feitos} de ${r.total} feitos`} · {r.treinos} {r.treinos === 1 ? 'treino' : 'treinos'}
        </p>
      </div>
      <div className="cartao-semana-acoes">
        <button type="button" className="botao botao-primario" onClick={() => { guardar(); aoVer(segunda); }}>Ver</button>
        <button type="button" className="botao-icone" aria-label="Dispensar" onClick={guardar}>×</button>
      </div>
    </div>
  );
}
