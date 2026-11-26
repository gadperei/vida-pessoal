// Registro diário: sono pela manhã em que acordou, hábitos pelo dia em que foram vividos (ontem).
import { adicionarDias } from '../regras/datas.ts';
import type { Banco, Dia, Livro, RegistroDia } from '../regras/tipos.ts';
import type { Mudanca } from './banco.ts';

export interface ValoresCheckin { sonoMin: number; exercicioMin: number; comida: 1 | 2 | 3; paginas: number; livroId: string | null }

const registroDe = (banco: Banco, d: Dia) => banco.dias.find((r) => r.id === d);

/** Falta registrar os hábitos de ontem? */
export function checkinPendente(hoje: Dia, banco: Banco): boolean {
  const ontem = registroDe(banco, adicionarDias(hoje, -1));
  return !ontem || ontem.habitos_em === null;
}

/** Começa com o que já foi salvo para aquela manhã/véspera; senão repete o último registro anterior. */
export function valoresIniciais(manha: Dia, banco: Banco): ValoresCheckin {
  const vespera = adicionarDias(manha, -1);
  const recentes = [...banco.dias].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));

  const daManha = registroDe(banco, manha);
  const sonoReg = daManha?.sono_min != null ? daManha : recentes.find((r) => r.data < manha && r.sono_min !== null);

  const daVespera = registroDe(banco, vespera);
  const salvoNaVespera = daVespera?.habitos_em != null;
  const habReg = salvoNaVespera ? daVespera : recentes.find((r) => r.data < vespera && r.habitos_em !== null);

  let livroId = habReg?.livro_id ?? null;
  // Repetindo um registro antigo, não sugere um livro que já foi terminado.
  if (!salvoNaVespera && livroId && banco.livros.some((l) => l.id === livroId && l.terminado_em !== null)) livroId = null;

  return {
    sonoMin: sonoReg?.sono_min ?? banco.config[0]?.meta_sono_min ?? 420,
    exercicioMin: habReg?.exercicio_min ?? 0,
    comida: habReg?.comida ?? 2,
    paginas: habReg?.paginas ?? 0,
    livroId,
  };
}

function vazio(d: Dia, agora: string): RegistroDia {
  return {
    id: d, data: d, sono_min: null, habitos_em: null, exercicio_min: null, comida: null,
    paginas: null, livro_id: null, atualizado_em: agora, excluido_em: null,
  };
}

/** Duas linhas: a manhã (sono) e a véspera (hábitos). Os outros campos de cada uma são preservados. */
export function salvarCheckin(manha: Dia, v: ValoresCheckin, banco: Banco, agora: string): Mudanca[] {
  const vespera = adicionarDias(manha, -1);
  const linhaManha: RegistroDia = { ...(registroDe(banco, manha) ?? vazio(manha, agora)), sono_min: v.sonoMin, atualizado_em: agora };
  const linhaVespera: RegistroDia = {
    ...(registroDe(banco, vespera) ?? vazio(vespera, agora)),
    exercicio_min: v.exercicioMin, comida: v.comida, paginas: v.paginas, livro_id: v.livroId,
    habitos_em: agora, atualizado_em: agora,
  };
  return [{ tabela: 'dias', linha: linhaManha }, { tabela: 'dias', linha: linhaVespera }];
}

export function novoLivro(titulo: string, novoId: () => string, agora: string): Mudanca {
  const linha: Livro = { id: novoId(), titulo, terminado_em: null, atualizado_em: agora, excluido_em: null };
  return { tabela: 'livros', linha };
}

export function terminarLivro(livro: Livro, dia: Dia, agora: string): Mudanca {
  return { tabela: 'livros', linha: { ...livro, terminado_em: dia, atualizado_em: agora } };
}
