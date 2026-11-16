// Fila de alterações esperando internet.
import type { Mudanca } from './banco.ts';

/** Acrescenta no fim, tirando a alteração pendente da mesma linha (fica só a mais nova). */
export function enfileirar(fila: Mudanca[], m: Mudanca): Mudanca[] {
  return [...fila.filter((x) => !(x.tabela === m.tabela && x.linha.id === m.linha.id)), m];
}
