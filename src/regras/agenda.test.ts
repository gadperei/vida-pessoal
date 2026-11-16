import { expect, it } from 'vitest';
import { AGORA, banco, conclusao, excecao, HOJE, item } from '../testes/fabrica.ts';
import { chaveConclusao, linhaDoTempo, ocorrenciasDoDia, ocorreEm, pendentes, proximaFolga } from './agenda.ts';

const treino = item({ id: 't', titulo: 'Treino', data: '2026-11-13', repeticao: 'folgas' });

it('chave da conclusão', () => expect(chaveConclusao('t', HOJE)).toBe('t:2026-11-16'));
it('regras de repetição', () => {
  expect(ocorreEm(item({ repeticao: 'todo_dia', data: '2026-11-10' }), HOJE, 'T')).toBe(true);
  expect(ocorreEm(item({ repeticao: 'trabalho', data: '2026-11-10' }), HOJE, 'T')).toBe(true);
  expect(ocorreEm(item({ repeticao: 'trabalho', data: '2026-11-10' }), HOJE, 'F')).toBe(false);
  expect(ocorreEm(item({ data: '2026-11-17' }), HOJE, 'F')).toBe(false);
});
it('repetida nas folgas respeita início, fim e dia extra', () => {
  const b = banco({ itens: [treino] });
  expect(ocorrenciasDoDia('2026-11-16', b).map((o) => o.item.id)).toEqual(['t']);
  expect(ocorrenciasDoDia('2026-11-19', b)).toEqual([]);
  expect(ocorrenciasDoDia('2026-11-12', b)).toEqual([]);
  expect(ocorrenciasDoDia('2026-11-16', banco({ itens: [treino], excecoes: [excecao({ tipo_dia: 'T' })] }))).toEqual([]);
  expect(ocorrenciasDoDia('2026-11-22', banco({ itens: [{ ...treino, repete_ate: '2026-11-21' }] }))).toEqual([]);
});
it('feito: conclusão por dia na repetida, feito_em na avulsa', () => {
  const b = banco({ itens: [treino, item({ id: 'a', feito_em: AGORA })], conclusoes: [conclusao('t', '2026-11-16')] });
  expect(ocorrenciasDoDia('2026-11-16', b).map((o) => o.feito)).toEqual([true, true]);
  expect(ocorrenciasDoDia('2026-11-17', b).map((o) => o.feito)).toEqual([false]);
});
it('ordem: avisos por hora, depois tarefas', () => {
  const b = banco({ itens: [
    item({ id: 'tar', titulo: 'Estudar' }), item({ id: 'c14', tipo: 'compromisso', hora: '14:00' }),
    item({ id: 'pr', tipo: 'prova' }), item({ id: 'c09', tipo: 'compromisso', hora: '09:00' }),
  ] });
  expect(ocorrenciasDoDia(HOJE, b).map((o) => o.item.id)).toEqual(['c09', 'c14', 'pr', 'tar']);
});
it('linha do tempo marca tipo, aula e dia extra', () => {
  const l = linhaDoTempo(HOJE, 3, banco({ excecoes: [excecao({ tipo_dia: 'T' })] }));
  expect(l.map((d) => [d.dia, d.tipo, d.extra, d.aula])).toEqual([
    ['2026-11-16', 'T', true, true], ['2026-11-17', 'F', false, true], ['2026-11-18', 'F', false, true],
  ]);
});
it('pendentes: só tarefas avulsas de dias anteriores e não feitas', () => {
  const itens = [
    item({ id: 'p', data: '2026-11-14' }), item({ id: 'f', data: '2026-11-13', feito_em: AGORA }),
    item({ id: 'pr', tipo: 'prova', data: '2026-11-14' }), { ...treino }, item({ id: 'h' }),
    item({ id: 'p0', data: '2026-11-10' }),
  ];
  expect(pendentes(HOJE, itens).map((i) => i.id)).toEqual(['p0', 'p']);
});
it('próxima folga', () => {
  expect(proximaFolga('2026-11-16', banco())).toBe('2026-11-17');
  expect(proximaFolga('2026-11-18', banco())).toBe('2026-11-21');
});
