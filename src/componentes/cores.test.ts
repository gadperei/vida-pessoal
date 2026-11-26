import { expect, it } from 'vitest';
import { CORES_META, TINTA, contraste, corDaMeta, tomDaOnda } from './cores.ts';

it('8 cores pastel, a primeira é a lavanda', () => {
  expect(CORES_META).toHaveLength(8);
  expect(CORES_META[0]).toBe('#a8a4ff');
});

it('o texto escuro (tinta) é bem legível em todas as cores (contraste ≥ 7:1)', () => {
  for (const c of CORES_META) expect(contraste(c, TINTA), c).toBeGreaterThanOrEqual(7);
});

it('a "onda" de progresso é um tom mais fechado da cor e o texto continua legível sobre ela (≥ 4,5:1)', () => {
  for (const c of CORES_META) {
    const onda = tomDaOnda(c);
    expect(onda).not.toBe(c);
    expect(contraste(onda, TINTA), `${c} → ${onda}`).toBeGreaterThanOrEqual(4.5);
  }
});

it('metas salvas com a paleta antiga aparecem na cor pastel equivalente', () => {
  expect(corDaMeta('#6c4cf0')).toBe(CORES_META[0]);
  expect(corDaMeta('#087f5b')).toBe(CORES_META[1]);
  expect(corDaMeta('#495057')).toBe(CORES_META[7]);
});

it('cores da paleta nova e cores desconhecidas passam como estão', () => {
  expect(corDaMeta(CORES_META[3])).toBe(CORES_META[3]);
  expect(corDaMeta('#123456')).toBe('#123456');
});
