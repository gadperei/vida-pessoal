// Resumo da semana (segunda a domingo): planejado × feito e hábitos.
import { ocorrenciasDoDia, type Ocorrencia } from './agenda.ts';
import { adicionarDias, diaDaSemana } from './datas.ts';
import type { Area, Banco, Dia } from './tipos.ts';

export interface ResumoSemana {
  segunda: Dia;
  domingo: Dia;
  total: number;
  feitos: number;
  porArea: Record<Area, { total: number; feitos: number }>;
  naoFeitos: Ocorrencia[];
  sonoMediaMin: number | null;
  treinos: number;
  diasBem: number;
  paginas: number;
}

/** Considera os dias de `segunda` até o menor entre `ate` e o domingo. */
export function resumoDaSemana(segunda: Dia, ate: Dia, banco: Banco): ResumoSemana {
  const domingo = adicionarDias(segunda, 6);
  const fim = ate < domingo ? ate : domingo;
  const ocorrencias: Ocorrencia[] = [];
  for (let d = segunda; d <= fim; d = adicionarDias(d, 1)) ocorrencias.push(...ocorrenciasDoDia(d, banco));

  const porArea: ResumoSemana['porArea'] = {
    pessoal: { total: 0, feitos: 0 }, profissional: { total: 0, feitos: 0 }, academica: { total: 0, feitos: 0 },
  };
  for (const o of ocorrencias) {
    porArea[o.item.area].total += 1;
    if (o.feito) porArea[o.item.area].feitos += 1;
  }

  const dias = banco.dias.filter((r) => r.data >= segunda && r.data <= fim);
  const sonos = dias.filter((r) => r.sono_min !== null).map((r) => r.sono_min as number);
  const habitos = dias.filter((r) => r.habitos_em !== null);
  return {
    segunda,
    domingo,
    total: ocorrencias.length,
    feitos: ocorrencias.filter((o) => o.feito).length,
    porArea,
    naoFeitos: ocorrencias.filter((o) => !o.feito),
    sonoMediaMin: sonos.length === 0 ? null : Math.round(sonos.reduce((a, b) => a + b, 0) / sonos.length),
    treinos: habitos.filter((r) => (r.exercicio_min ?? 0) > 0).length,
    diasBem: habitos.filter((r) => r.comida === 3).length,
    paginas: habitos.reduce((s, r) => s + (r.paginas ?? 0), 0),
  };
}

/** O cartão "Sua semana passada" aparece na segunda, até ser aberto ou dispensado. */
export function cartaoSemanaVisivel(hoje: Dia, dispensadaPara: Dia | null): boolean {
  return diaDaSemana(hoje) === 1 && dispensadaPara !== adicionarDias(hoje, -7);
}
