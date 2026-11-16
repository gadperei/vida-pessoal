// Envia a fila e busca o que mudou no servidor.
import { TABELAS, type Banco, type Linha, type Tabela } from '../regras/tipos.ts';
import type { Mudanca } from './banco.ts';
import { mesclar } from './mesclar.ts';

export interface Remoto {
  enviar(tabela: Tabela, linha: Linha): Promise<'ok' | 'rede' | 'recusado'>;
  /** Inclui as excluídas; em ordem de sincronizado_em. */
  buscar(tabela: Tabela, desde: string | null): Promise<Linha[] | 'rede'>;
}
export interface EstadoLocal { banco: Banco; fila: Mudanca[]; cursores: Partial<Record<Tabela, string>> }

export async function sincronizar(
  e: EstadoLocal,
  r: Remoto,
): Promise<{ estado: EstadoLocal; rejeitadas: Mudanca[]; offline: boolean }> {
  const fila = [...e.fila];
  const rejeitadas: Mudanca[] = [];
  while (fila.length > 0) {
    const m = fila[0];
    const res = await r.enviar(m.tabela, m.linha);
    if (res === 'rede') return { estado: { ...e, fila }, rejeitadas, offline: true };
    fila.shift();
    if (res === 'recusado') rejeitadas.push(m);
  }

  const remotos: Partial<Record<Tabela, Linha[]>> = {};
  for (const t of TABELAS) {
    const linhas = await r.buscar(t, e.cursores[t] ?? null);
    if (linhas === 'rede') return { estado: { ...e, fila }, rejeitadas, offline: true };
    remotos[t] = linhas;
  }

  const cursores = { ...e.cursores };
  for (const t of TABELAS) {
    for (const l of remotos[t] ?? []) {
      const s = l.sincronizado_em;
      if (s && (!cursores[t] || Date.parse(s) > Date.parse(cursores[t] as string))) cursores[t] = s;
    }
  }
  return { estado: { banco: mesclar(e.banco, remotos, fila), fila, cursores }, rejeitadas, offline: false };
}
