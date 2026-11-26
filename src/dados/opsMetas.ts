// Alterações das metas e das etapas.
import type { Dia, Etapa, Meta } from '../regras/tipos.ts';
import type { Mudanca } from './banco.ts';

export type CamposMeta = Pick<Meta, 'nome' | 'icone' | 'cor' | 'tipo' | 'prazo' | 'prioridade' | 'alvo_centavos' | 'observacao'>;

export function criarMeta(campos: CamposMeta, etapas: string[], novoId: () => string, agora: string): Mudanca[] {
  const meta: Meta = {
    ...campos,
    id: novoId(),
    atual_centavos: campos.tipo === 'conquista' ? null : 0,
    concluida_em: null,
    atualizado_em: agora,
    excluido_em: null,
  };
  const linhas: Etapa[] = etapas.map((texto, ordem) => ({
    id: novoId(), meta_id: meta.id, texto, ordem, feita: false, atualizado_em: agora, excluido_em: null,
  }));
  return [{ tabela: 'metas', linha: meta }, ...linhas.map((e) => ({ tabela: 'etapas' as const, linha: e }))];
}

export function editarMeta(meta: Meta, campos: Partial<CamposMeta>, agora: string): Mudanca {
  return { tabela: 'metas', linha: { ...meta, ...campos, atualizado_em: agora } };
}

/** Soma (ou subtrai, com valor negativo) do que já tem, sem ficar abaixo de zero. */
export function adicionarValor(meta: Meta, centavos: number, agora: string): Mudanca {
  return { tabela: 'metas', linha: { ...meta, atual_centavos: Math.max(0, (meta.atual_centavos ?? 0) + centavos), atualizado_em: agora } };
}

export function alternarEtapa(e: Etapa, agora: string): Mudanca {
  return { tabela: 'etapas', linha: { ...e, feita: !e.feita, atualizado_em: agora } };
}

/** Nova etapa no fim da lista. */
export function adicionarEtapa(meta: Meta, texto: string, etapas: Etapa[], novoId: () => string, agora: string): Mudanca {
  const ordem = etapas.filter((e) => e.meta_id === meta.id).reduce((maior, e) => Math.max(maior, e.ordem + 1), 0);
  const linha: Etapa = { id: novoId(), meta_id: meta.id, texto, ordem, feita: false, atualizado_em: agora, excluido_em: null };
  return { tabela: 'etapas', linha };
}

/** Reescreve a ordem pela posição na lista recebida. */
export function reordenarEtapas(etapas: Etapa[], agora: string): Mudanca[] {
  return etapas.map((e, ordem) => ({ tabela: 'etapas', linha: { ...e, ordem, atualizado_em: agora } }));
}

export function concluirMeta(meta: Meta, hoje: Dia, agora: string): Mudanca {
  return { tabela: 'metas', linha: { ...meta, concluida_em: hoje, atualizado_em: agora } };
}

export function reabrirMeta(meta: Meta, agora: string): Mudanca {
  return { tabela: 'metas', linha: { ...meta, concluida_em: null, atualizado_em: agora } };
}

/** A meta e as etapas dela viram "excluídas" (para sincronizar). */
export function excluirMeta(meta: Meta, etapas: Etapa[], agora: string): Mudanca[] {
  return [
    { tabela: 'metas', linha: { ...meta, excluido_em: agora, atualizado_em: agora } },
    ...etapas.filter((e) => e.meta_id === meta.id).map((e) => ({ tabela: 'etapas' as const, linha: { ...e, excluido_em: agora, atualizado_em: agora } })),
  ];
}
