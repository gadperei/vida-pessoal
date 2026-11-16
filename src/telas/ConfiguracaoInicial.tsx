import { useState } from 'react';
import { AtivarNotificacoes } from '../componentes/AtivarNotificacoes.tsx';
import { Contador } from '../componentes/Contador.tsx';
import { EditorCiclo } from '../componentes/EditorCiclo.tsx';
import { configuracaoInicial } from '../dados/opsConfig.ts';
import { agoraIso, novoId } from '../dados/ids.ts';
import { useBanco } from '../estado/contexto.tsx';
import { useHoje } from '../estado/useHoje.ts';
import { adicionarDias, diaDaSemana, duracao } from '../regras/datas.ts';
import { NOME_APP } from '../regras/tipos.ts';

type Passo = 'escala' | 'faculdade' | 'treino' | 'habitos' | 'horario' | 'notificacoes';
const PASSOS: Passo[] = ['escala', 'faculdade', 'treino', 'habitos', 'horario', 'notificacoes'];
const DIAS_UTEIS = [
  { n: 1, r: 'Seg' }, { n: 2, r: 'Ter' }, { n: 3, r: 'Qua' }, { n: 4, r: 'Qui' }, { n: 5, r: 'Sex' },
];

export function ConfiguracaoInicial() {
  const { salvar, status } = useBanco();
  const hoje = useHoje();
  const [passo, setPasso] = useState<Passo>('escala');
  const [ciclo, setCiclo] = useState('TTTFFFTTFF');
  const [posicao, setPosicao] = useState<number | null>(null);
  const [temFaculdade, setTemFaculdade] = useState(true);
  const [dias, setDias] = useState<number[]>([1, 2, 3, 4, 5]);
  const [sabadosAlternados, setSabadosAlternados] = useState(false);
  const [proximoSabadoTemAula, setProximoSabadoTemAula] = useState(true);
  const [semestreFim, setSemestreFim] = useState('');
  const [treino, setTreino] = useState(true);
  const [sono, setSono] = useState(420);
  const [treinos, setTreinos] = useState(3);
  const [livros, setLivros] = useState(1);
  const [horario, setHorario] = useState('08:00');
  const [pushAtivo, setPushAtivo] = useState(false);

  const i = PASSOS.indexOf(passo);
  const proximoSabado = adicionarDias(hoje, (6 - diaDaSemana(hoje) + 7) % 7);
  const podeAvancar = passo !== 'escala' || posicao !== null;

  function concluir() {
    salvar(configuracaoInicial({
      ciclo,
      posicaoHoje: posicao ?? 0,
      faculdade: temFaculdade
        ? { dias, sabadoComAula: sabadosAlternados ? proximoSabadoTemAula : false, semestreFim: semestreFim || null }
        : null,
      treinoNasFolgas: treino,
      metaSonoMin: sono,
      metaTreinosSemana: treinos,
      metaLivrosMes: livros,
      horarioAvisos: horario,
    }, hoje, novoId, agoraIso()));
  }

  const alternar = (n: number) => setDias((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n].sort()));

  return (
    <main className="app">
      <div className="conteudo">
        <p className="campo-dica">{NOME_APP} · passo {i + 1} de {PASSOS.length}</p>

        {passo === 'escala' && (
          <section className="card">
            <h1>Sua escala de trabalho</h1>
            <p className="campo-dica">Você configura uma vez só. O app calcula sozinho seus dias de trabalho e de folga.</p>
            <EditorCiclo ciclo={ciclo} posicao={posicao} aoMudar={(c, p) => { setCiclo(c); setPosicao(p); }} />
          </section>
        )}

        {passo === 'faculdade' && (
          <section className="card">
            <h1>Faculdade</h1>
            <label className="linha-opcao">
              <input type="checkbox" checked={temFaculdade} onChange={(e) => setTemFaculdade(e.target.checked)} />
              Tenho aulas para acompanhar
            </label>
            {temFaculdade && (
              <>
                <p className="rotulo">Dias com aula</p>
                <div className="chips">
                  {DIAS_UTEIS.map((d) => (
                    <button key={d.n} type="button" className={`chip ${dias.includes(d.n) ? 'chip-ativo' : ''}`} aria-pressed={dias.includes(d.n)} onClick={() => alternar(d.n)}>{d.r}</button>
                  ))}
                </div>
                <label className="linha-opcao">
                  <input type="checkbox" checked={sabadosAlternados} onChange={(e) => setSabadosAlternados(e.target.checked)} />
                  Tenho aula em sábados alternados
                </label>
                {sabadosAlternados && (
                  <div className="chips" role="group" aria-label="O próximo sábado tem aula?">
                    <span className="rotulo">O próximo sábado ({proximoSabado.slice(8, 10)}/{proximoSabado.slice(5, 7)}) tem aula?</span>
                    <button type="button" className={`chip ${proximoSabadoTemAula ? 'chip-ativo' : ''}`} onClick={() => setProximoSabadoTemAula(true)}>Sim</button>
                    <button type="button" className={`chip ${!proximoSabadoTemAula ? 'chip-ativo' : ''}`} onClick={() => setProximoSabadoTemAula(false)}>Não</button>
                  </div>
                )}
                <div className="campo">
                  <label htmlFor="fim-semestre">Fim do semestre (opcional)</label>
                  <input id="fim-semestre" type="date" value={semestreFim} onChange={(e) => setSemestreFim(e.target.value)} />
                </div>
              </>
            )}
          </section>
        )}

        {passo === 'treino' && (
          <section className="card">
            <h1>Treino nas folgas</h1>
            <p className="campo-dica">Ligado, o app coloca "Treino" sozinho em todas as suas folgas.</p>
            <label className="linha-opcao">
              <input type="checkbox" checked={treino} onChange={(e) => setTreino(e.target.checked)} />
              Colocar treino nas folgas
            </label>
          </section>
        )}

        {passo === 'habitos' && (
          <section className="card">
            <h1>Metas dos hábitos</h1>
            <p className="campo-dica">Dá para mudar depois em Ajustes.</p>
            <Contador rotulo="Dormir por noite" valor={sono} texto={duracao(sono)} passo={30} min={240} max={720} aoMudar={setSono} />
            <Contador rotulo="Treinos por semana" valor={treinos} texto={String(treinos)} passo={1} min={0} max={14} aoMudar={setTreinos} />
            <Contador rotulo="Livros por mês" valor={livros} texto={String(livros)} passo={1} min={0} max={10} aoMudar={setLivros} />
          </section>
        )}

        {passo === 'horario' && (
          <section className="card">
            <h1>Horário dos avisos</h1>
            <p className="campo-dica">É a hora em que o app te lembra das provas, entregas e do registro do dia.</p>
            <div className="campo">
              <label htmlFor="horario">Horário</label>
              <input id="horario" type="time" value={horario} onChange={(e) => setHorario(e.target.value || '08:00')} />
            </div>
          </section>
        )}

        {passo === 'notificacoes' && (
          <section className="card">
            <h1>Avisos no celular</h1>
            <p className="campo-dica">Para nenhuma prova ou entrega te pegar de surpresa: o app avisa às {horario}, e uma hora antes dos compromissos com horário.</p>
            <AtivarNotificacoes aoAtivar={() => setPushAtivo(true)} />
          </section>
        )}

        <div className="botoes">
          {i > 0 && <button type="button" className="botao botao-secundario" onClick={() => setPasso(PASSOS[i - 1])}>Voltar</button>}
          {i < PASSOS.length - 1 ? (
            <button type="button" className="botao botao-primario" disabled={!podeAvancar} onClick={() => setPasso(PASSOS[i + 1])}>
              {passo === 'faculdade' && !temFaculdade ? 'Pular' : 'Próximo'}
            </button>
          ) : (
            <button type="button" className="botao botao-primario" disabled={!status.online} onClick={concluir}>
              {!status.online ? 'Conecte-se para concluir' : pushAtivo ? 'Concluir' : 'Agora não'}
            </button>
          )}
        </div>
        {passo === 'escala' && posicao === null && <p className="campo-dica">Toque em qual dia do ciclo é hoje para continuar.</p>}
      </div>
    </main>
  );
}
