// Guarda o banco, a fila e os cursores no aparelho (IndexedDB), um registro por usuário.
import { del, get, set } from 'idb-keyval';
import type { EstadoLocal } from './sincronizador.ts';

const chave = (userId: string) => `vida-pessoal:${userId}`;

export async function carregarLocal(userId: string): Promise<EstadoLocal | null> {
  try {
    return (await get<EstadoLocal>(chave(userId))) ?? null;
  } catch {
    return null;
  }
}

export async function salvarLocal(userId: string, e: EstadoLocal): Promise<void> {
  try {
    await set(chave(userId), e);
  } catch {
    // Sem armazenamento (navegação privada): o app segue funcionando só em memória.
  }
}

export async function apagarLocal(userId: string): Promise<void> {
  try {
    await del(chave(userId));
  } catch {
    // nada a fazer
  }
}
