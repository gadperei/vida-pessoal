// Tipos das linhas do banco. Os campos usam snake_case, iguais às colunas do Supabase.
// Este arquivo é copiado para a Edge Function: nada de imports externos.

export const NOME_APP = 'Vida Pessoal';

/** Dia no formato 'AAAA-MM-DD'. */
export type Dia = string;
export type TipoDia = 'T' | 'F';
export type TipoItem = 'prova' | 'entrega' | 'compromisso' | 'tarefa';
export type Area = 'pessoal' | 'profissional' | 'academica';
export type Repeticao = 'nenhuma' | 'todo_dia' | 'folgas' | 'trabalho';
export type Prioridade = 'alta' | 'media' | 'baixa';
export type TipoMeta = 'conquista' | 'valor' | 'compra';

export interface Base { id: string; atualizado_em: string; excluido_em: string | null; sincronizado_em?: string }

/** Uma por usuário; id sempre 'config'. */
export interface Config extends Base {
  /** 0 = domingo … 6 = sábado. */
  aula_dias_semana: number[];
  /** Um sábado com aula; os sábados com aula se repetem a cada 14 dias. */
  sabado_referencia: Dia | null;
  semestre_fim: Dia | null;
  /** 'HH:MM' */
  horario_avisos: string;
  notificacoes_ligadas: boolean;
  meta_sono_min: number;
  meta_treinos_semana: number;
  meta_livros_mes: number;
  treino_item_id: string | null;
  configurado_em: string | null;
}

/** ciclo: sequência de T/F, ex.: 'TTTFFFTTFF'. inicio: o dia 1 do ciclo. */
export interface Escala extends Base { ciclo: string; inicio: Dia; vigente_desde: Dia }
export interface Excecao extends Base { inicio: Dia; fim: Dia; tipo_dia: TipoDia | null; sem_aula: boolean }

export interface Item extends Base {
  tipo: TipoItem;
  titulo: string;
  data: Dia;
  hora: string | null;
  area: Area;
  feito_em: string | null;
  repeticao: Repeticao;
  repete_ate: Dia | null;
}

/** Conclusão de uma ocorrência de item repetido. id = `${item_id}:${data}`. */
export interface Conclusao extends Base { item_id: string; data: Dia }

/** id = data. */
export interface RegistroDia extends Base {
  data: Dia;
  /** Sono da noite que terminou na manhã de `data`. */
  sono_min: number | null;
  /** Hábitos vividos em `data`. */
  habitos_em: string | null;
  exercicio_min: number | null;
  /** 1 = 😞, 2 = 😐, 3 = 😀 */
  comida: 1 | 2 | 3 | null;
  paginas: number | null;
  livro_id: string | null;
}

export interface Livro extends Base { titulo: string; terminado_em: Dia | null }

export interface Meta extends Base {
  nome: string;
  icone: string;
  cor: string;
  tipo: TipoMeta;
  prazo: Dia;
  prioridade: Prioridade;
  alvo_centavos: number | null;
  atual_centavos: number | null;
  concluida_em: Dia | null;
  observacao: string | null;
}

export interface Etapa extends Base { meta_id: string; texto: string; ordem: number; feita: boolean }

export const TABELAS = ['config', 'escalas', 'excecoes', 'itens', 'conclusoes', 'dias', 'livros', 'metas', 'etapas'] as const;
export type Tabela = typeof TABELAS[number];

export interface Banco {
  config: Config[];
  escalas: Escala[];
  excecoes: Excecao[];
  itens: Item[];
  conclusoes: Conclusao[];
  dias: RegistroDia[];
  livros: Livro[];
  metas: Meta[];
  etapas: Etapa[];
}
export type Linha = Banco[Tabela][number];

export function bancoVazio(): Banco {
  return { config: [], escalas: [], excecoes: [], itens: [], conclusoes: [], dias: [], livros: [], metas: [], etapas: [] };
}
