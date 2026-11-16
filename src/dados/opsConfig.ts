// Alterações de configuração: configuração inicial, troca de escala e treino nas folgas.
import { adicionarDias, diaDaSemana } from '../regras/datas.ts';
import { inicioPelaPosicao } from '../regras/escala.ts';
import type { Config, Dia, Escala, Item } from '../regras/tipos.ts';
import type { Mudanca } from './banco.ts';

export interface RespostasConfig {
  ciclo: string;
  posicaoHoje: number;
  faculdade: { dias: number[]; sabadoComAula: boolean; semestreFim: Dia | null } | null;
  treinoNasFolgas: boolean;
  metaSonoMin: number;
  metaTreinosSemana: number;
  metaLivrosMes: number;
  horarioAvisos: string;
}

const proximoSabado = (hoje: Dia) => adicionarDias(hoje, (6 - diaDaSemana(hoje) + 7) % 7);

function novoTreino(hoje: Dia, id: string, agora: string): Item {
  return {
    id, atualizado_em: agora, excluido_em: null, tipo: 'tarefa', titulo: 'Treino', data: hoje, hora: null,
    area: 'pessoal', feito_em: null, repeticao: 'folgas', repete_ate: null,
  };
}

/** Na ordem: config, escala e, se ligado, o treino. */
export function configuracaoInicial(r: RespostasConfig, hoje: Dia, novoId: () => string, agora: string): Mudanca[] {
  const escala: Escala = {
    id: novoId(), atualizado_em: agora, excluido_em: null,
    ciclo: r.ciclo, inicio: inicioPelaPosicao(hoje, r.posicaoHoje), vigente_desde: hoje,
  };
  const treino = r.treinoNasFolgas ? novoTreino(hoje, novoId(), agora) : null;
  const sabado = proximoSabado(hoje);
  const config: Config = {
    id: 'config', atualizado_em: agora, excluido_em: null,
    aula_dias_semana: r.faculdade ? [...r.faculdade.dias] : [],
    sabado_referencia: r.faculdade ? (r.faculdade.sabadoComAula ? sabado : adicionarDias(sabado, 7)) : null,
    semestre_fim: r.faculdade?.semestreFim ?? null,
    horario_avisos: r.horarioAvisos,
    notificacoes_ligadas: true,
    meta_sono_min: r.metaSonoMin,
    meta_treinos_semana: r.metaTreinosSemana,
    meta_livros_mes: r.metaLivrosMes,
    treino_item_id: treino?.id ?? null,
    configurado_em: agora,
  };
  const ms: Mudanca[] = [{ tabela: 'config', linha: config }, { tabela: 'escalas', linha: escala }];
  if (treino) ms.push({ tabela: 'itens', linha: treino });
  return ms;
}

/** Nova escala valendo de hoje em diante. Se já houver uma começando hoje, atualiza essa. */
export function trocarEscala(
  escalas: Escala[], ciclo: string, posicaoHoje: number, hoje: Dia, novoId: () => string, agora: string,
): Escala {
  const deHoje = escalas.find((e) => e.vigente_desde === hoje);
  return {
    id: deHoje?.id ?? novoId(), atualizado_em: agora, excluido_em: null,
    ciclo, inicio: inicioPelaPosicao(hoje, posicaoHoje), vigente_desde: hoje,
  };
}

export function ligarTreino(config: Config, hoje: Dia, novoId: () => string, agora: string): Mudanca[] {
  const treino = novoTreino(hoje, novoId(), agora);
  return [
    { tabela: 'itens', linha: treino },
    { tabela: 'config', linha: { ...config, treino_item_id: treino.id, atualizado_em: agora } },
  ];
}

/** Encerra o treino ontem (preserva o histórico) ou exclui, se ele começou hoje ou depois. */
export function desligarTreino(config: Config, treino: Item, hoje: Dia, agora: string): Mudanca[] {
  const item: Item = treino.data >= hoje
    ? { ...treino, excluido_em: agora, atualizado_em: agora }
    : { ...treino, repete_ate: adicionarDias(hoje, -1), atualizado_em: agora };
  return [
    { tabela: 'itens', linha: item },
    { tabela: 'config', linha: { ...config, treino_item_id: null, atualizado_em: agora } },
  ];
}
