// Construtores de dados para os testes. Só os testes importam este arquivo.
import {
  bancoVazio, type Banco, type Conclusao, type Config, type Dia, type Escala, type Etapa, type Excecao,
  type Item, type Livro, type Meta, type RegistroDia,
} from '../regras/tipos.ts';

export const HOJE = '2026-11-16'; // uma segunda-feira
export const AGORA = '2026-11-16T12:00:00.000Z';

let contador = 0;
const base = () => ({ id: `id-${++contador}`, atualizado_em: AGORA, excluido_em: null });

/** Gerador de ids previsíveis: 'n1', 'n2'… */
export function ids(): () => string {
  let n = 0;
  return () => `n${++n}`;
}

export const config = (p: Partial<Config> = {}): Config => ({
  ...base(), id: 'config', aula_dias_semana: [1, 2, 3, 4, 5], sabado_referencia: null, semestre_fim: null,
  horario_avisos: '08:00', notificacoes_ligadas: true, meta_sono_min: 420, meta_treinos_semana: 3,
  meta_livros_mes: 1, treino_item_id: null, configurado_em: AGORA, ...p,
});

export const escala = (p: Partial<Escala> = {}): Escala => ({
  ...base(), ciclo: 'TTTFFFTTFF', inicio: '2026-11-13', vigente_desde: '2026-11-13', ...p,
});

export const excecao = (p: Partial<Excecao> = {}): Excecao => ({
  ...base(), inicio: HOJE, fim: HOJE, tipo_dia: null, sem_aula: false, ...p,
});

export const item = (p: Partial<Item> = {}): Item => ({
  ...base(), tipo: 'tarefa', titulo: 'Tarefa', data: HOJE, hora: null, area: 'pessoal',
  feito_em: null, repeticao: 'nenhuma', repete_ate: null, ...p,
});

export const conclusao = (itemId: string, data: Dia, p: Partial<Conclusao> = {}): Conclusao => ({
  ...base(), id: `${itemId}:${data}`, item_id: itemId, data, ...p,
});

export const dia = (data: Dia, p: Partial<RegistroDia> = {}): RegistroDia => ({
  ...base(), id: data, data, sono_min: null, habitos_em: null, exercicio_min: null, comida: null,
  paginas: null, livro_id: null, ...p,
});

export const livro = (p: Partial<Livro> = {}): Livro => ({ ...base(), titulo: 'Livro', terminado_em: null, ...p });

export const meta = (p: Partial<Meta> = {}): Meta => ({
  ...base(), nome: 'Meta', icone: '🎯', cor: '#7b5cff', tipo: 'conquista', prazo: '2026-12-31',
  prioridade: 'alta', alvo_centavos: null, atual_centavos: null, concluida_em: null, observacao: null, ...p,
});

export const etapa = (metaId: string, p: Partial<Etapa> = {}): Etapa => ({
  ...base(), meta_id: metaId, texto: 'Etapa', ordem: 0, feita: false, ...p,
});

export const banco = (p: Partial<Banco> = {}): Banco => ({
  ...bancoVazio(), config: [config()], escalas: [escala()], ...p,
});
