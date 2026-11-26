import { useState } from 'react';
import { GraficoSono } from '../componentes/GraficoSono.tsx';
import { useBanco } from '../estado/contexto.tsx';
import { adicionarMeses, duracao, mesDe, nomeMes } from '../regras/datas.ts';
import { resumoDoMes } from '../regras/habitos.ts';
import type { Dia } from '../regras/tipos.ts';

type Visao = 'semana' | 'mes';

const horas = (m: number | null) => (m === null ? '—' : duracao(m));
const titulo = (mes: string) => `${nomeMes(mes).charAt(0).toUpperCase()}${nomeMes(mes).slice(1)} de ${mes.slice(0, 4)}`;

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="resumo-linha">
      <dt>{rotulo}</dt>
      <dd className="num">{valor}</dd>
    </div>
  );
}

function ResumoMes({ hoje }: { hoje: Dia }) {
  const { banco } = useBanco();
  const mesAtual = mesDe(hoje);
  const [mes, setMes] = useState(mesAtual);
  const r = resumoDoMes(mes, banco, hoje);
  const { sono, exercicio, comida, leitura } = r;

  return (
    <>
      <div className="navegar-mes">
        <button type="button" className="botao botao-secundario" aria-label="Mês anterior" onClick={() => setMes((m) => adicionarMeses(m, -1))}>‹</button>
        <h1>{titulo(mes)}</h1>
        <button type="button" className="botao botao-secundario" aria-label="Próximo mês" disabled={mes >= mesAtual} onClick={() => setMes((m) => adicionarMeses(m, 1))}>›</button>
      </div>
      <p className="campo-dica resumo-sem-registro">
        {r.diasConsiderados === 0
          ? 'Ainda não há dias para contar neste mês.'
          : `${r.semRegistro} de ${r.diasConsiderados} ${r.diasConsiderados === 1 ? 'dia' : 'dias'} sem registro · as médias só contam os dias registrados`}
      </p>

      <section className="card">
        <h2>😴 Sono</h2>
        <dl className="resumo-linhas">
          <Linha rotulo="Média por noite" valor={`${horas(sono.mediaMin)} · meta ${duracao(sono.metaMin)}`} />
          <Linha rotulo="Antes de trabalho" valor={horas(sono.antesTrabalhoMin)} />
          <Linha rotulo="Antes de folga" valor={horas(sono.antesFolgaMin)} />
        </dl>
        <GraficoSono noites={sono.noites} metaMin={sono.metaMin} />
      </section>

      <section className="card">
        <h2>🏋️ Exercício</h2>
        <dl className="resumo-linhas">
          <Linha rotulo="Dias com treino" valor={`${exercicio.dias} de ${exercicio.metaDias}`} />
          <Linha rotulo="Tempo no mês" valor={exercicio.minutos > 0 ? duracao(exercicio.minutos) : '—'} />
          <Linha rotulo="Em dia de trabalho / folga" valor={`${exercicio.diasTrabalho} / ${exercicio.diasFolga}`} />
        </dl>
      </section>

      <section className="card">
        <h2>🍽️ Comida</h2>
        <dl className="resumo-linhas">
          <Linha rotulo="Dias 😀" valor={comida.pctBem === null ? '—' : `${Math.round(comida.pctBem * 100)}%`} />
          <Linha rotulo="Dias 😞" valor={String(comida.diasRuim)} />
        </dl>
      </section>

      <section className="card">
        <h2>📚 Leitura</h2>
        <dl className="resumo-linhas">
          <Linha rotulo="Páginas" valor={String(leitura.paginas)} />
          <Linha rotulo="Livros terminados" valor={`${leitura.livrosTerminados} de ${leitura.meta}`} />
        </dl>
      </section>
    </>
  );
}

export function Resumo({ hoje }: { hoje: Dia }) {
  const [visao, setVisao] = useState<Visao>('mes');
  return (
    <div className="conteudo">
      <div className="chips" role="group" aria-label="Período do resumo">
        <button type="button" className={`chip ${visao === 'semana' ? 'chip-ativo' : ''}`} aria-pressed={visao === 'semana'} onClick={() => setVisao('semana')}>Semana</button>
        <button type="button" className={`chip ${visao === 'mes' ? 'chip-ativo' : ''}`} aria-pressed={visao === 'mes'} onClick={() => setVisao('mes')}>Mês</button>
      </div>
      {visao === 'mes' ? <ResumoMes hoje={hoje} /> : <p className="espaco-reservado">O resumo da semana entra na próxima etapa.</p>}
    </div>
  );
}
