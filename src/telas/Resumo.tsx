import { useState } from 'react';
import { GraficoSono } from '../componentes/GraficoSono.tsx';
import { useBanco } from '../estado/contexto.tsx';
import { adicionarDias, adicionarMeses, duracao, inicioDaSemana, mesDe, nomeMes, rotuloDia } from '../regras/datas.ts';
import { resumoDoMes } from '../regras/habitos.ts';
import { resumoDaSemana } from '../regras/semana.ts';
import type { Area, Dia } from '../regras/tipos.ts';

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

const AREAS: { v: Area; r: string }[] = [{ v: 'pessoal', r: 'Pessoal' }, { v: 'profissional', r: 'Profissional' }, { v: 'academica', r: 'Acadêmica' }];
const diaMes = (d: Dia) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

function ResumoSemana({ hoje, segundaInicial }: { hoje: Dia; segundaInicial: Dia }) {
  const { banco } = useBanco();
  const atual = inicioDaSemana(hoje);
  const [segunda, setSegunda] = useState(segundaInicial);
  const r = resumoDaSemana(segunda, hoje, banco);
  const pct = r.total === 0 ? 0 : Math.round((r.feitos / r.total) * 100);

  return (
    <>
      <div className="navegar-mes">
        <button type="button" className="botao botao-secundario" aria-label="Semana anterior" onClick={() => setSegunda((s) => adicionarDias(s, -7))}>‹</button>
        <h1>{segunda === atual ? 'Esta semana' : `${diaMes(r.segunda)} a ${diaMes(r.domingo)}`}</h1>
        <button type="button" className="botao botao-secundario" aria-label="Próxima semana" disabled={segunda >= atual} onClick={() => setSegunda((s) => adicionarDias(s, 7))}>›</button>
      </div>
      {segunda === atual && <p className="campo-dica resumo-sem-registro">De segunda até hoje.</p>}

      <section className="card">
        <h2>✅ Planejado × feito</h2>
        {r.total === 0 ? (
          <p className="campo-dica">Nada planejado nesta semana.</p>
        ) : (
          <>
            <p className="semana-placar"><span className="num">{r.feitos}</span> de {r.total} feitos <span className="campo-dica">· {pct}%</span></p>
            <span className="barra-meta" aria-hidden="true"><i style={{ width: `${pct}%`, background: 'var(--primaria)' }} /></span>
            <dl className="resumo-linhas semana-areas">
              {AREAS.filter((a) => r.porArea[a.v].total > 0).map((a) => (
                <Linha key={a.v} rotulo={a.r} valor={`${r.porArea[a.v].feitos} de ${r.porArea[a.v].total}`} />
              ))}
            </dl>
          </>
        )}
      </section>

      {r.total > 0 && (
        <section className="card">
          <h2>⏳ Não feito</h2>
          {r.naoFeitos.length === 0 ? (
            <p className="campo-dica">Tudo feito! 🎉</p>
          ) : (
            <ul className="lista-nao-feitos">
              {r.naoFeitos.map((o) => (
                <li key={`${o.item.id}:${o.dia}`}><span className="campo-dica">{rotuloDia(o.dia)}{o.dia === hoje ? ' (hoje)' : ''}</span> {o.item.titulo}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="card">
        <h2>🌙 Hábitos da semana</h2>
        <dl className="resumo-linhas">
          <Linha rotulo="Sono médio" valor={horas(r.sonoMediaMin)} />
          <Linha rotulo="Treinos" valor={String(r.treinos)} />
          <Linha rotulo="Dias 😀" valor={String(r.diasBem)} />
          <Linha rotulo="Páginas" valor={String(r.paginas)} />
        </dl>
      </section>
    </>
  );
}

/** Aba Resumo. `semanaInicial` vem do cartão "Sua semana passada" do Início. */
export function Resumo({ hoje, semanaInicial }: { hoje: Dia; semanaInicial?: Dia | null }) {
  const [visao, setVisao] = useState<Visao>('semana');
  return (
    <div className="conteudo">
      <div className="chips" role="group" aria-label="Período do resumo">
        <button type="button" className={`chip ${visao === 'semana' ? 'chip-ativo' : ''}`} aria-pressed={visao === 'semana'} onClick={() => setVisao('semana')}>Semana</button>
        <button type="button" className={`chip ${visao === 'mes' ? 'chip-ativo' : ''}`} aria-pressed={visao === 'mes'} onClick={() => setVisao('mes')}>Mês</button>
      </div>
      {visao === 'mes' ? <ResumoMes hoje={hoje} /> : <ResumoSemana hoje={hoje} segundaInicial={semanaInicial ?? inicioDaSemana(hoje)} />}
    </div>
  );
}
