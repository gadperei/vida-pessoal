import { useState } from 'react';
import { AtivarNotificacoes } from '../componentes/AtivarNotificacoes.tsx';
import { compartilharOuBaixar } from '../componentes/arquivos.ts';
import { Contador } from '../componentes/Contador.tsx';
import { EditorCiclo } from '../componentes/EditorCiclo.tsx';
import { agoraIso, novoId } from '../dados/ids.ts';
import { encerrarRepeticao, excluirLinha } from '../dados/opsAgenda.ts';
import {
  criarExcecao, desligarTreino, editarConfig, editarFaculdade, ligarTreino, trocarEscala, type TipoExcecao,
} from '../dados/opsConfig.ts';
import { apagarLocal } from '../dados/persistencia.ts';
import { useBanco } from '../estado/contexto.tsx';
import { esquecerUsuario } from '../estado/useSessao.ts';
import { chaveConclusao, type Ocorrencia } from '../regras/agenda.ts';
import { adicionarDias, diaDaSemana, duracao } from '../regras/datas.ts';
import { escalaVigente, posicaoNoCiclo, temAula } from '../regras/escala.ts';
import { NOME_APP, type Config, type Dia, type Repeticao } from '../regras/tipos.ts';
import { cliente } from '../supabase.ts';

interface Props { hoje: Dia; aoEditarItem(o: Ocorrencia): void }

const DIAS_UTEIS = [{ n: 1, r: 'Seg' }, { n: 2, r: 'Ter' }, { n: 3, r: 'Qua' }, { n: 4, r: 'Qui' }, { n: 5, r: 'Sex' }];
const REPETICAO: Record<Repeticao, string> = { nenhuma: '', todo_dia: 'todo dia', folgas: 'nas folgas', trabalho: 'nos dias de trabalho' };
const TIPOS_EXCECAO: { v: TipoExcecao; r: string }[] = [{ v: 'folga', r: 'Folga (férias)' }, { v: 'trabalho', r: 'Trabalho' }, { v: 'sem_aula', r: 'Sem aula' }];
const dataCurta = (d: Dia) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

function SecaoEscala({ hoje }: { hoje: Dia }) {
  const { banco, salvar, avisar } = useBanco();
  const atual = escalaVigente(hoje, banco.escalas);
  const [ciclo, setCiclo] = useState(atual?.ciclo ?? 'TTTFFFTTFF');
  const [posicao, setPosicao] = useState<number | null>(atual ? posicaoNoCiclo(hoje, atual) : null);
  const mudou = !atual || ciclo !== atual.ciclo || posicao !== posicaoNoCiclo(hoje, atual);

  function guardar() {
    if (posicao === null) return;
    salvar({ tabela: 'escalas', linha: trocarEscala(banco.escalas, ciclo, posicao, hoje, novoId, agoraIso()) });
    avisar('Escala salva. Vale de hoje em diante.');
  }

  return (
    <section className="card">
      <h2>Escala de trabalho</h2>
      <EditorCiclo ciclo={ciclo} posicao={posicao} aoMudar={(c, p) => { setCiclo(c); setPosicao(p); }} />
      <p className="campo-dica">
        {posicao === null ? 'Toque em qual dia do ciclo é hoje para salvar.' : 'Vale de hoje em diante. Os dias que já passaram continuam como eram.'}
      </p>
      <button type="button" className="botao botao-primario botao-largo" disabled={!mudou || posicao === null} onClick={guardar}>Salvar escala</button>
    </section>
  );
}

function SecaoFaculdade({ hoje, config }: { hoje: Dia; config: Config }) {
  const { salvar, avisar } = useBanco();
  const proximoSabado = adicionarDias(hoje, (6 - diaDaSemana(hoje) + 7) % 7);
  const [tem, setTem] = useState(config.aula_dias_semana.length > 0 || config.sabado_referencia !== null);
  const [dias, setDias] = useState<number[]>(config.aula_dias_semana.length > 0 ? config.aula_dias_semana : [1, 2, 3, 4, 5]);
  const [alternados, setAlternados] = useState(config.sabado_referencia !== null);
  const [proximoTem, setProximoTem] = useState(config.sabado_referencia !== null ? temAula(proximoSabado, config, []) : true);
  const [fim, setFim] = useState(config.semestre_fim ?? '');
  const alternar = (n: number) => setDias((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n].sort()));

  function guardar() {
    salvar(editarFaculdade(config, tem ? { dias, sabadosAlternados: alternados, sabadoComAula: proximoTem, semestreFim: fim || null } : null, hoje, agoraIso()));
    avisar('Faculdade salva');
  }

  return (
    <section className="card">
      <h2>Faculdade</h2>
      <label className="linha-opcao">
        <input type="checkbox" checked={tem} onChange={(e) => setTem(e.target.checked)} />
        Tenho aulas para acompanhar
      </label>
      {tem && (
        <>
          <p className="rotulo">Dias com aula</p>
          <div className="chips">
            {DIAS_UTEIS.map((d) => (
              <button key={d.n} type="button" className={`chip ${dias.includes(d.n) ? 'chip-ativo' : ''}`} aria-pressed={dias.includes(d.n)} onClick={() => alternar(d.n)}>{d.r}</button>
            ))}
          </div>
          <label className="linha-opcao">
            <input type="checkbox" checked={alternados} onChange={(e) => setAlternados(e.target.checked)} />
            Tenho aula em sábados alternados
          </label>
          {alternados && (
            <div className="chips" role="group" aria-label="O próximo sábado tem aula?">
              <span className="rotulo">O próximo sábado ({dataCurta(proximoSabado)}) tem aula?</span>
              <button type="button" className={`chip ${proximoTem ? 'chip-ativo' : ''}`} aria-pressed={proximoTem} onClick={() => setProximoTem(true)}>Sim</button>
              <button type="button" className={`chip ${!proximoTem ? 'chip-ativo' : ''}`} aria-pressed={!proximoTem} onClick={() => setProximoTem(false)}>Não</button>
            </div>
          )}
          <div className="campo">
            <label htmlFor="ajustes-fim-semestre">Fim do semestre (opcional)</label>
            <input id="ajustes-fim-semestre" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
        </>
      )}
      <button type="button" className="botao botao-primario botao-largo" onClick={guardar}>Salvar faculdade</button>
    </section>
  );
}

function SecaoExcecoes({ hoje }: { hoje: Dia }) {
  const { banco, salvar, avisar } = useBanco();
  const [inicio, setInicio] = useState(hoje);
  const [fim, setFim] = useState(hoje);
  const [tipo, setTipo] = useState<TipoExcecao>('folga');
  const lista = banco.excecoes.filter((e) => e.fim >= hoje).sort((a, b) => (a.inicio < b.inicio ? -1 : 1));
  const nome = (t: 'F' | 'T' | null, semAula: boolean) => (t === 'F' ? 'Folga' : t === 'T' ? 'Trabalho' : '') + (semAula ? `${t ? ' · ' : ''}sem aula` : '');

  function adicionar() {
    if (!inicio || !fim) return;
    salvar(criarExcecao({ inicio, fim, tipo }, novoId, agoraIso()));
    avisar('Período adicionado');
  }

  return (
    <section className="card">
      <h2>Exceções de dia</h2>
      <p className="campo-dica">Férias, troca de folga, semana sem aula… Muda só esses dias.</p>
      {lista.length > 0 && (
        <ul className="lista-ajustes">
          {lista.map((e) => (
            <li key={e.id}>
              <span>{e.inicio === e.fim ? dataCurta(e.inicio) : `${dataCurta(e.inicio)} a ${dataCurta(e.fim)}`} · {nome(e.tipo_dia, e.sem_aula)}</span>
              <button type="button" className="botao-texto chip-perigo-texto" onClick={() => salvar(excluirLinha('excecoes', e, agoraIso()))}>Excluir</button>
            </li>
          ))}
        </ul>
      )}
      <div className="campos-lado">
        <div className="campo">
          <label htmlFor="excecao-inicio">De</label>
          <input id="excecao-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="excecao-fim">Até</label>
          <input id="excecao-fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
      </div>
      <div className="chips" role="group" aria-label="Tipo do período">
        {TIPOS_EXCECAO.map((t) => (
          <button key={t.v} type="button" className={`chip ${tipo === t.v ? 'chip-ativo' : ''}`} aria-pressed={tipo === t.v} onClick={() => setTipo(t.v)}>{t.r}</button>
        ))}
      </div>
      <button type="button" className="botao botao-secundario botao-largo" disabled={!inicio || !fim} onClick={adicionar}>+ Adicionar período</button>
    </section>
  );
}

function SecaoRepetidas({ hoje, config, aoEditarItem }: { hoje: Dia; config: Config; aoEditarItem(o: Ocorrencia): void }) {
  const { banco, salvar, avisar } = useBanco();
  const lista = banco.itens.filter((i) => i.repeticao !== 'nenhuma' && (i.repete_ate === null || i.repete_ate >= hoje) && i.id !== config.treino_item_id);
  return (
    <section className="card">
      <h2>Tarefas repetidas</h2>
      {lista.length === 0 ? (
        <p className="campo-dica">Nenhuma. Para criar, use “+ anotar”, escolha Tarefa e depois “Repetir”.</p>
      ) : (
        <ul className="lista-ajustes">
          {lista.map((i) => (
            <li key={i.id}>
              <span>{i.titulo} <span className="campo-dica">· {REPETICAO[i.repeticao]}</span></span>
              <span className="lista-ajustes-acoes">
                <button type="button" className="botao-texto" onClick={() => aoEditarItem({ item: i, dia: hoje, feito: banco.conclusoes.some((c) => c.id === chaveConclusao(i.id, hoje)) })}>Editar</button>
                <button type="button" className="botao-texto chip-perigo-texto" onClick={() => { salvar(encerrarRepeticao(i, hoje, agoraIso())); avisar(`“${i.titulo}” não repete mais`); }}>Encerrar</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SecaoTreino({ hoje, config }: { hoje: Dia; config: Config }) {
  const { banco, salvar } = useBanco();
  const treino = banco.itens.find((i) => i.id === config.treino_item_id) ?? null;
  function alternar(ligar: boolean) {
    const agora = agoraIso();
    if (ligar) salvar(ligarTreino(config, hoje, novoId, agora));
    else if (treino) salvar(desligarTreino(config, treino, hoje, agora));
    else salvar(editarConfig(config, { treino_item_id: null }, agora));
  }
  return (
    <section className="card">
      <h2>Treino nas folgas</h2>
      <label className="linha-opcao">
        <input type="checkbox" checked={treino !== null} onChange={(e) => alternar(e.target.checked)} />
        Colocar “Treino” em todas as folgas
      </label>
    </section>
  );
}

function SecaoHabitos({ config }: { config: Config }) {
  const { salvar } = useBanco();
  const mudar = (campos: Partial<Config>) => salvar(editarConfig(config, campos, agoraIso()));
  return (
    <section className="card">
      <h2>Metas dos hábitos</h2>
      <Contador rotulo="Dormir por noite" valor={config.meta_sono_min} texto={duracao(config.meta_sono_min)} passo={30} min={240} max={720} aoMudar={(v) => mudar({ meta_sono_min: v })} />
      <Contador rotulo="Treinos por semana" valor={config.meta_treinos_semana} texto={String(config.meta_treinos_semana)} passo={1} min={0} max={14} aoMudar={(v) => mudar({ meta_treinos_semana: v })} />
      <Contador rotulo="Livros por mês" valor={config.meta_livros_mes} texto={String(config.meta_livros_mes)} passo={1} min={0} max={10} aoMudar={(v) => mudar({ meta_livros_mes: v })} />
    </section>
  );
}

function SecaoNotificacoes({ config }: { config: Config }) {
  const { salvar } = useBanco();
  return (
    <section className="card">
      <h2>Notificações</h2>
      <label className="linha-opcao">
        <input type="checkbox" checked={config.notificacoes_ligadas} onChange={(e) => salvar(editarConfig(config, { notificacoes_ligadas: e.target.checked }, agoraIso()))} />
        Receber avisos de provas, entregas, compromissos e metas
      </label>
      <div className="campo">
        <label htmlFor="ajustes-horario">Horário dos avisos</label>
        <input id="ajustes-horario" type="time" value={config.horario_avisos}
          onChange={(e) => /^\d{2}:\d{2}$/.test(e.target.value) && salvar(editarConfig(config, { horario_avisos: e.target.value }, agoraIso()))} />
      </div>
      <p className="rotulo">Neste aparelho</p>
      <AtivarNotificacoes />
    </section>
  );
}

function SecaoConta() {
  const { banco, status, userId } = useBanco();
  const [confirmar, setConfirmar] = useState(false);
  const [saindo, setSaindo] = useState(false);

  async function exportar() {
    const conteudo = JSON.stringify({ app: NOME_APP, exportado_em: agoraIso(), dados: banco }, null, 2);
    await compartilharOuBaixar(`vida-pessoal-${agoraIso().slice(0, 10)}.json`, conteudo);
  }

  async function sair() {
    setSaindo(true);
    await cliente.auth.signOut({ scope: 'local' }).catch(() => { /* sem internet: a sessão local some mesmo assim */ });
    await apagarLocal(userId);
    esquecerUsuario();
    window.location.replace('/');
  }

  return (
    <>
      <section className="card">
        <h2>Exportar dados</h2>
        <p className="campo-dica">Um arquivo com tudo o que está no app. O plano grátis do Supabase não faz cópia automática: guarde uma de vez em quando.</p>
        <button type="button" className="botao botao-secundario botao-largo" onClick={exportar}>Exportar meus dados</button>
      </section>
      <section className="card">
        <h2>Conta</h2>
        {!confirmar ? (
          <button type="button" className="botao botao-secundario botao-largo" disabled={saindo} onClick={() => (status.pendentes > 0 ? setConfirmar(true) : sair())}>Sair</button>
        ) : (
          <div className="confirmar">
            <p>{status.pendentes === 1 ? '1 alteração ainda não foi enviada' : `${status.pendentes} alterações ainda não foram enviadas`}. Sair mesmo assim? Elas serão perdidas.</p>
            <div className="botoes">
              <button type="button" className="botao botao-secundario" onClick={() => setConfirmar(false)}>Cancelar</button>
              <button type="button" className="botao botao-perigo" disabled={saindo} onClick={sair}>Sair mesmo assim</button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

/** Aba Ajustes (§4.8). Mudanças de ajuste só com internet; exportar e sair funcionam sempre (§6). */
export function Ajustes({ hoje, aoEditarItem }: Props) {
  const { banco, status } = useBanco();
  const config = banco.config[0];
  if (!config) return null;
  return (
    <div className="conteudo ajustes">
      {!status.online && <p className="aviso aviso-alerta">Conecte-se para mudar os ajustes. Exportar e sair continuam funcionando.</p>}
      <fieldset className="ajustes-online" disabled={!status.online}>
        <SecaoEscala hoje={hoje} />
        <SecaoFaculdade hoje={hoje} config={config} />
        <SecaoExcecoes hoje={hoje} />
        <SecaoRepetidas hoje={hoje} config={config} aoEditarItem={aoEditarItem} />
        <SecaoTreino hoje={hoje} config={config} />
        <SecaoHabitos config={config} />
        <SecaoNotificacoes config={config} />
      </fieldset>
      <SecaoConta />
    </div>
  );
}
