import { useState, type ReactNode } from 'react';
import { agoraIso, novoId } from '../dados/ids.ts';
import { alternarFeito, desfazerDiaExtra, marcarDiaExtra } from '../dados/opsAgenda.ts';
import { useBanco } from '../estado/contexto.tsx';
import { linhaDoTempo, type DiaDaLinha, type Ocorrencia } from '../regras/agenda.ts';
import { rotuloDia } from '../regras/datas.ts';
import type { Dia } from '../regras/tipos.ts';
import { PainelInferior } from './PainelInferior.tsx';

interface Props {
  hoje: Dia;
  aoAbrirItem(o: Ocorrencia): void;
  /** Conteúdo extra no topo do dia de hoje (ex.: as pendências). */
  topoDeHoje?: ReactNode;
}

const ehAviso = (o: Ocorrencia) => o.item.tipo !== 'tarefa';

function Etiqueta({ d, aoTocar }: { d: DiaDaLinha; aoTocar(): void }) {
  const texto = d.extra ? 'Dia extra' : d.tipo === 'T' ? 'Trabalho' : 'Folga';
  return (
    <button type="button" className={`etiqueta ${d.tipo === 'T' ? 'etiqueta-t' : 'etiqueta-f'}`} onClick={aoTocar} aria-label={`${texto}. Toque para mudar`}>
      {texto}
    </button>
  );
}

export function LinhaDoTempo({ hoje, aoAbrirItem, topoDeHoje }: Props) {
  const { banco, salvar } = useBanco();
  const [quantos, setQuantos] = useState(7);
  const [diaMenu, setDiaMenu] = useState<DiaDaLinha | null>(null);
  const dias = linhaDoTempo(hoje, quantos, banco);

  function virarExtra(d: DiaDaLinha) {
    salvar(marcarDiaExtra(d.dia, novoId, agoraIso()));
    setDiaMenu(null);
  }
  function desfazerExtra(d: DiaDaLinha) {
    const agora = agoraIso();
    salvar(banco.excecoes
      .filter((ex) => ex.tipo_dia === 'T' && ex.inicio === d.dia && ex.fim === d.dia)
      .map((ex) => desfazerDiaExtra(ex, agora)));
    setDiaMenu(null);
  }

  return (
    <section className="linha-do-tempo" aria-label="Próximos dias">
      {dias.map((d) => {
        const ehHoje = d.dia === hoje;
        return (
          <article key={d.dia} className={`dia ${ehHoje ? 'dia-hoje' : ''}`}>
            <header className="dia-cabecalho">
              <h2>{ehHoje ? `${rotuloDia(d.dia)} · hoje` : rotuloDia(d.dia)}</h2>
              <Etiqueta d={d} aoTocar={() => setDiaMenu(d)} />
              {d.aula && <span className="aula">aula</span>}
            </header>
            {ehHoje && topoDeHoje}
            {d.ocorrencias.length === 0 && <p className="dia-vazio">Nada marcado.</p>}
            {ehHoje ? (
              <ul className="ocorrencias">
                {d.ocorrencias.map((o) => (
                  <li key={o.item.id} className={`ocorrencia ${ehAviso(o) ? 'ocorrencia-aviso' : ''} ${o.feito ? 'ocorrencia-feita' : ''}`}>
                    <input
                      type="checkbox"
                      checked={o.feito}
                      aria-label={`Marcar "${o.item.titulo}" como feito`}
                      onChange={() => salvar(alternarFeito(o, banco, agoraIso()))}
                    />
                    <button type="button" className="ocorrencia-titulo" onClick={() => aoAbrirItem(o)}>
                      {ehAviso(o) && <span aria-hidden="true">⚠ </span>}
                      {o.item.hora && <span className="num">{o.item.hora} </span>}
                      {o.item.titulo}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ocorrencias-resumo">
                {d.ocorrencias.map((o, i) => (
                  <span key={o.item.id}>
                    {i > 0 && ' · '}
                    <button type="button" className={`link-item ${ehAviso(o) ? 'texto-aviso' : ''} ${o.feito ? 'ocorrencia-feita' : ''}`} onClick={() => aoAbrirItem(o)}>
                      {ehAviso(o) && '⚠ '}{o.item.titulo}
                    </button>
                  </span>
                ))}
              </p>
            )}
          </article>
        );
      })}
      <button type="button" className="botao botao-secundario botao-largo" onClick={() => setQuantos((n) => n + 7)}>Ver mais 7 dias</button>

      <PainelInferior aberto={diaMenu !== null} titulo={diaMenu ? rotuloDia(diaMenu.dia) : ''} aoFechar={() => setDiaMenu(null)}>
        {diaMenu && diaMenu.extra && (
          <button type="button" className="botao botao-secundario botao-largo" onClick={() => desfazerExtra(diaMenu)}>Desfazer dia extra</button>
        )}
        {diaMenu && !diaMenu.extra && diaMenu.tipo === 'F' && (
          <button type="button" className="botao botao-primario botao-largo" onClick={() => virarExtra(diaMenu)}>Virou trabalho (dia extra)</button>
        )}
        {diaMenu && !diaMenu.extra && diaMenu.tipo === 'T' && (
          <p className="campo-dica">Dia de trabalho pela sua escala. Para trocar folgas ou marcar férias, use Ajustes → Exceções.</p>
        )}
      </PainelInferior>
    </section>
  );
}
