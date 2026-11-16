// Junta o que veio do servidor com o banco local: vence a última alteração.
import type { Banco, Linha, Tabela } from '../regras/tipos.ts';
import { aplicar, type Mudanca } from './banco.ts';

const instante = (l: Linha | undefined) => (l ? Date.parse(l.atualizado_em) : -Infinity);

export function mesclar(local: Banco, remotos: Partial<Record<Tabela, Linha[]>>, fila: Mudanca[]): Banco {
  let b = local;
  for (const [tabela, linhas] of Object.entries(remotos) as [Tabela, Linha[]][]) {
    for (const remota of linhas) {
      const doLocal = (b[tabela] as Linha[]).find((l) => l.id === remota.id);
      const pendente = fila.find((m) => m.tabela === tabela && m.linha.id === remota.id)?.linha;
      if (Math.max(instante(doLocal), instante(pendente)) > instante(remota)) continue;
      b = aplicar(b, { tabela, linha: remota });
    }
  }
  return b;
}
