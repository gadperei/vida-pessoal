import { expect, it } from 'vitest';
import { banco, item } from '../testes/fabrica.ts';
import type { Linha, Tabela } from '../regras/tipos.ts';
import { sincronizar, type EstadoLocal, type Remoto } from './sincronizador.ts';

type Resposta = 'ok' | 'rede' | 'recusado';
function remotoFalso(respostas: Record<string, Resposta>, busca: Partial<Record<Tabela, Linha[]>> = {}) {
  const enviados: string[] = [];
  const buscas: [Tabela, string | null][] = [];
  const remoto: Remoto = {
    async enviar(_t, linha) { enviados.push(linha.id); return respostas[linha.id] ?? 'ok'; },
    async buscar(t, desde) { buscas.push([t, desde]); return busca[t] ?? []; },
  };
  return { remoto, enviados, buscas };
}
const estado = (ids: string[], cursores: EstadoLocal['cursores'] = {}): EstadoLocal => ({
  banco: banco({ itens: ids.map((id) => item({ id })) }),
  fila: ids.map((id) => ({ tabela: 'itens' as const, linha: item({ id }) })),
  cursores,
});

it('envia tudo, esvazia a fila e avança cursores', async () => {
  const novo = { ...item({ id: 'x', titulo: 'Do servidor' }), sincronizado_em: '2026-11-16T12:00:05+00:00' };
  const velho = { ...item({ id: 'y' }), sincronizado_em: '2026-11-16T12:00:01+00:00' };
  const f = remotoFalso({}, { itens: [velho, novo] });
  const r = await sincronizar(estado(['a', 'b'], { itens: '2026-11-16T11:00:00+00:00' }), f.remoto);
  expect(f.enviados).toEqual(['a', 'b']);
  expect(r.estado.fila).toEqual([]);
  expect(r.offline).toBe(false);
  expect(r.rejeitadas).toEqual([]);
  expect(r.estado.cursores.itens).toBe('2026-11-16T12:00:05+00:00');
  expect(f.buscas.find(([t]) => t === 'itens')?.[1]).toBe('2026-11-16T11:00:00+00:00');
  expect(r.estado.banco.itens.find((i) => i.id === 'x')?.titulo).toBe('Do servidor');
});
it('sem rede no meio: para, mantém o resto, não busca', async () => {
  const f = remotoFalso({ b: 'rede' });
  const r = await sincronizar(estado(['a', 'b', 'c']), f.remoto);
  expect(f.enviados).toEqual(['a', 'b']);
  expect(r.estado.fila.map((m) => m.linha.id)).toEqual(['b', 'c']);
  expect(r.offline).toBe(true);
  expect(f.buscas).toEqual([]);
});
it('recusada não trava a fila', async () => {
  const f = remotoFalso({ a: 'recusado' });
  const r = await sincronizar(estado(['a', 'b']), f.remoto);
  expect(r.rejeitadas.map((m) => m.linha.id)).toEqual(['a']);
  expect(r.estado.fila).toEqual([]);
  expect(r.offline).toBe(false);
});
it('cai a rede durante a busca: devolve offline e mantém os cursores', async () => {
  const remoto: Remoto = { async enviar() { return 'ok'; }, async buscar() { return 'rede'; } };
  const r = await sincronizar(estado([], { itens: 'c0' }), remoto);
  expect(r.offline).toBe(true);
  expect(r.estado.cursores).toEqual({ itens: 'c0' });
});
