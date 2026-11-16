// Resumo do mês dos hábitos: sono, exercício, comida e leitura.
import { adicionarDias, diasDoMes, diasEntre, mesDe } from './datas.ts';
import { tipoDoDia } from './escala.ts';
import type { Banco, Dia, TipoDia } from './tipos.ts';

export interface ResumoMes {
  diasConsiderados: number;
  semRegistro: number;
  sono: {
    mediaMin: number | null; antesTrabalhoMin: number | null; antesFolgaMin: number | null; metaMin: number;
    noites: { dia: Dia; minutos: number; tipo: TipoDia }[];
  };
  exercicio: { dias: number; metaDias: number; minutos: number; diasTrabalho: number; diasFolga: number };
  comida: { pctBem: number | null; diasRuim: number };
  leitura: { paginas: number; livrosTerminados: number; meta: number };
}

const media = (xs: number[]) => (xs.length === 0 ? null : Math.round(xs.reduce((a, b) => a + b, 0) / xs.length));
const menor = (a: Dia, b: Dia) => (a < b ? a : b);

export function resumoDoMes(mes: string, banco: Banco, hoje: Dia): ResumoMes {
  const config = banco.config[0];
  const metaSono = config?.meta_sono_min ?? 420;
  const metaTreinos = config?.meta_treinos_semana ?? 3;
  const metaLivros = config?.meta_livros_mes ?? 1;
  const tamanho = diasDoMes(mes);
  const primeiro = `${mes}-01`;
  const ultimo = `${mes}-${String(tamanho).padStart(2, '0')}`;
  const tipo = (d: Dia) => tipoDoDia(d, banco.escalas, banco.excecoes);

  // Hábitos: até ontem (o registro de hoje só é feito amanhã de manhã).
  const limiteHabitos = menor(ultimo, adicionarDias(hoje, -1));
  const diasConsiderados = limiteHabitos < primeiro ? 0 : diasEntre(primeiro, limiteHabitos) + 1;
  const registros = banco.dias.filter((d) => d.habitos_em !== null && d.data >= primeiro && d.data <= limiteHabitos);

  // Sono: noites cuja manhã é até hoje.
  const limiteSono = menor(ultimo, hoje);
  const noites = banco.dias
    .filter((d) => d.sono_min !== null && d.data >= primeiro && d.data <= limiteSono)
    .sort((a, b) => (a.data < b.data ? -1 : 1))
    .map((d) => ({ dia: d.data, minutos: d.sono_min as number, tipo: tipo(d.data) }));

  const treinos = registros.filter((d) => (d.exercicio_min ?? 0) > 0);
  const comComida = registros.filter((d) => d.comida !== null);

  return {
    diasConsiderados,
    semRegistro: diasConsiderados - registros.length,
    sono: {
      mediaMin: media(noites.map((n) => n.minutos)),
      antesTrabalhoMin: media(noites.filter((n) => n.tipo === 'T').map((n) => n.minutos)),
      antesFolgaMin: media(noites.filter((n) => n.tipo === 'F').map((n) => n.minutos)),
      metaMin: metaSono,
      noites,
    },
    exercicio: {
      dias: treinos.length,
      metaDias: Math.round((metaTreinos * tamanho) / 7),
      minutos: treinos.reduce((s, d) => s + (d.exercicio_min ?? 0), 0),
      diasTrabalho: treinos.filter((d) => tipo(d.data) === 'T').length,
      diasFolga: treinos.filter((d) => tipo(d.data) === 'F').length,
    },
    comida: {
      pctBem: comComida.length === 0 ? null : comComida.filter((d) => d.comida === 3).length / comComida.length,
      diasRuim: comComida.filter((d) => d.comida === 1).length,
    },
    leitura: {
      paginas: registros.reduce((s, d) => s + (d.paginas ?? 0), 0),
      livrosTerminados: banco.livros.filter((l) => l.terminado_em !== null && mesDe(l.terminado_em) === mes).length,
      meta: metaLivros,
    },
  };
}
