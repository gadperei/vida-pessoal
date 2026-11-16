import { expect, it } from 'vitest';
import { AGORA, banco, config, dia, item, meta } from '../testes/fabrica.ts';
import { avisosDevidos, montarNotificacao, type Aviso } from './notificacoes.ts';

const base = () => banco({
  itens: [
    item({ id: 'p1', tipo: 'prova', titulo: 'Prova química', data: '2026-11-20' }),
    item({ id: 'e1', tipo: 'entrega', titulo: 'Entrega relatório', data: '2026-11-17' }),
    item({ id: 'c1', tipo: 'compromisso', titulo: 'Dentista', data: '2026-11-16', hora: '14:00' }),
    item({ id: 't1', titulo: 'Estudar' }),
  ],
  metas: [meta({ id: 'm1', nome: 'Vender um projeto', prazo: '2026-12-16' })],
});
const chaves = (a: Aviso[]) => a.map((x) => [x.chave, x.texto]);

it('às 08:00 de 16/11', () => {
  expect(chaves(avisosDevidos({ dia: '2026-11-16', minutos: 480 }, base(), new Set()))).toEqual([
    ['checkin:2026-11-16', 'Como foi ontem? Registre em 10 segundos.'],
    ['item:e1:1d', 'Entrega relatório amanhã'],
    ['meta:m1:30d', 'Meta "Vender um projeto": faltam 30 dias'],
  ]);
});
it('não repete o que já foi enviado e respeita o horário', () => {
  const env = new Set(['checkin:2026-11-16', 'item:e1:1d', 'meta:m1:30d']);
  expect(chaves(avisosDevidos({ dia: '2026-11-16', minutos: 780 }, base(), env))).toEqual([['item:c1:1h', 'Dentista às 14:00']]);
  expect(avisosDevidos({ dia: '2026-11-16', minutos: 479 }, base(), new Set())).toEqual([]);
});
it('aviso de ontem não sai hoje; feito para de avisar', () => {
  const b = base();
  b.dias = [dia('2026-11-16', { habitos_em: AGORA })];
  expect(chaves(avisosDevidos({ dia: '2026-11-17', minutos: 480 }, b, new Set()))).toEqual([
    ['item:e1:0d', 'Hoje: Entrega relatório'],
    ['item:p1:3d', 'Prova química em 3 dias'],
  ]);
  b.itens = b.itens.map((i) => (i.id === 'e1' ? { ...i, feito_em: AGORA } : i));
  expect(chaves(avisosDevidos({ dia: '2026-11-17', minutos: 480 }, b, new Set()))).toEqual([['item:p1:3d', 'Prova química em 3 dias']]);
});
it('22h30 em São Paulo ainda é o mesmo dia', () => {
  const b = banco({ itens: [item({ id: 'c2', tipo: 'compromisso', titulo: 'Plantão', data: '2026-11-16', hora: '23:30' })], dias: [dia('2026-11-15', { habitos_em: AGORA })] });
  expect(chaves(avisosDevidos({ dia: '2026-11-16', minutos: 1350 }, b, new Set()))).toEqual([['item:c2:1h', 'Plantão às 23:30']]);
});
it('compromisso à 00:30 avisa à meia-noite; desligado não avisa', () => {
  const b = banco({ itens: [item({ id: 'c3', tipo: 'compromisso', titulo: 'X', data: '2026-11-16', hora: '00:30' })], dias: [dia('2026-11-15', { habitos_em: AGORA })] });
  expect(chaves(avisosDevidos({ dia: '2026-11-16', minutos: 0 }, b, new Set()))).toEqual([['item:c3:1h', 'X às 00:30']]);
  b.config = [config({ notificacoes_ligadas: false })];
  expect(avisosDevidos({ dia: '2026-11-16', minutos: 900 }, b, new Set())).toEqual([]);
});
it('compromisso sem hora: 1 dia antes e no dia', () => {
  const b = banco({ itens: [item({ id: 'c4', tipo: 'compromisso', titulo: 'Banco', data: '2026-11-17' })], dias: [dia('2026-11-15', { habitos_em: AGORA })] });
  expect(chaves(avisosDevidos({ dia: '2026-11-16', minutos: 480 }, b, new Set()))).toEqual([['item:c4:1d', 'Banco amanhã']]);
});
it('monta a notificação', () => {
  const a = avisosDevidos({ dia: '2026-11-16', minutos: 480 }, base(), new Set());
  expect(montarNotificacao([])).toBeNull();
  expect(montarNotificacao([a[0]])).toEqual({ titulo: 'Vida Pessoal', corpo: 'Como foi ontem? Registre em 10 segundos.', url: '/?abrir=checkin' });
  expect(montarNotificacao([a[2]])?.url).toBe('/?aba=metas');
  expect(montarNotificacao(a)?.url).toBe('/');
  expect(montarNotificacao(a)?.corpo).toBe('Como foi ontem? Registre em 10 segundos. · Entrega relatório amanhã · Meta "Vender um projeto": faltam 30 dias');
});
