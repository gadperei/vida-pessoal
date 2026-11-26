// Progresso, prazo e ordem das metas.
import { diasEntre } from './datas.ts';
import type { Dia, Etapa, Meta } from './tipos.ts';

/** De 0 a 1. */
export function progresso(meta: Meta, etapas: Etapa[]): number {
  if (meta.tipo === 'conquista') {
    const minhas = etapas.filter((e) => e.meta_id === meta.id);
    if (minhas.length === 0) return meta.concluida_em !== null ? 1 : 0;
    return minhas.filter((e) => e.feita).length / minhas.length;
  }
  if (!meta.alvo_centavos) return 0;
  return Math.min(1, (meta.atual_centavos ?? 0) / meta.alvo_centavos);
}

/** Dias até o prazo (negativo = atrasada). */
export function diasAtePrazo(meta: Meta, hoje: Dia): number {
  return diasEntre(hoje, meta.prazo);
}

const porPrazo = (a: Meta, b: Meta) =>
  a.prazo === b.prazo ? a.nome.localeCompare(b.nome, 'pt-BR') : a.prazo < b.prazo ? -1 : 1;

/** Metas de prioridade alta não concluídas: a mais urgente vira destaque, as outras viram cartões. */
export function metasDoInicio(metas: Meta[], _hoje: Dia): { destaque: Meta | null; cartoes: Meta[] } {
  const altas = metas.filter((m) => m.prioridade === 'alta' && m.concluida_em === null).sort(porPrazo);
  return { destaque: altas[0] ?? null, cartoes: altas.slice(1) };
}

export function sugerirConcluir(meta: Meta, etapas: Etapa[]): boolean {
  if (meta.concluida_em !== null) return false;
  if (meta.tipo === 'conquista' && !etapas.some((e) => e.meta_id === meta.id)) return false;
  return progresso(meta, etapas) === 1;
}

export function agruparMetas(metas: Meta[]): { alta: Meta[]; media: Meta[]; baixa: Meta[]; concluidas: Meta[] } {
  const abertas = metas.filter((m) => m.concluida_em === null).sort(porPrazo);
  return {
    alta: abertas.filter((m) => m.prioridade === 'alta'),
    media: abertas.filter((m) => m.prioridade === 'media'),
    baixa: abertas.filter((m) => m.prioridade === 'baixa'),
    concluidas: metas
      .filter((m) => m.concluida_em !== null)
      .sort((a, b) => ((a.concluida_em as string) < (b.concluida_em as string) ? 1 : -1)),
  };
}

/** "45 dias até 31/12", "Hoje é o prazo" ou "atrasada há 3 dias"; `curto` vai nos cartões pequenos. */
export function textoPrazo(dias: number, prazo: Dia): { numero: string; texto: string; curto: string; atrasada: boolean } {
  const data = `${prazo.slice(8, 10)}/${prazo.slice(5, 7)}`;
  if (dias < 0) {
    const n = -dias;
    return { numero: '', texto: `atrasada há ${n} ${n === 1 ? 'dia' : 'dias'}`, curto: 'atrasada', atrasada: true };
  }
  if (dias === 0) return { numero: 'Hoje', texto: 'é o prazo', curto: 'hoje', atrasada: false };
  return { numero: String(dias), texto: `${dias === 1 ? 'dia' : 'dias'} até ${data}`, curto: `${dias} d`, atrasada: false };
}
