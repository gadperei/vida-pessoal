import { expect, it } from 'vitest';
import type { Config, Escala, Item } from '../regras/tipos.ts';
import { AGORA, config, escala, HOJE, ids, item } from '../testes/fabrica.ts';
import { configuracaoInicial, desligarTreino, ligarTreino, trocarEscala, type RespostasConfig } from './opsConfig.ts';

const r: RespostasConfig = { ciclo: 'TTTFFFTTFF', posicaoHoje: 3, faculdade: { dias: [1, 2, 3, 4, 5], sabadoComAula: true, semestreFim: null }, treinoNasFolgas: true, metaSonoMin: 420, metaTreinosSemana: 3, metaLivrosMes: 1, horarioAvisos: '08:00' };

it('gera config, escala e treino', () => {
  const m = configuracaoInicial(r, HOJE, ids(), AGORA);
  expect(m.map((x) => x.tabela)).toEqual(['config', 'escalas', 'itens']);
  const cfg = m[0].linha as Config;
  const esc = m[1].linha as Escala;
  const tr = m[2].linha as Item;
  expect([esc.inicio, esc.vigente_desde, esc.ciclo]).toEqual(['2026-11-13', HOJE, 'TTTFFFTTFF']);
  expect(cfg).toMatchObject({ id: 'config', aula_dias_semana: [1, 2, 3, 4, 5], sabado_referencia: '2026-11-21', horario_avisos: '08:00', notificacoes_ligadas: true, configurado_em: AGORA, excluido_em: null });
  expect(cfg.treino_item_id).toBe(tr.id);
  expect(tr).toMatchObject({ tipo: 'tarefa', titulo: 'Treino', repeticao: 'folgas', data: HOJE, area: 'pessoal', excluido_em: null });
});
it('sábado sem aula e sem faculdade', () => {
  expect((configuracaoInicial({ ...r, faculdade: { ...r.faculdade!, sabadoComAula: false } }, HOJE, ids(), AGORA)[0].linha as Config).sabado_referencia).toBe('2026-11-28');
  const sem = configuracaoInicial({ ...r, faculdade: null, treinoNasFolgas: false }, HOJE, ids(), AGORA);
  expect(sem.map((x) => x.tabela).sort()).toEqual(['config', 'escalas']);
  expect((sem[0].linha as Config).aula_dias_semana).toEqual([]);
  expect((sem[0].linha as Config).sabado_referencia).toBeNull();
});
it('no sábado, o "próximo sábado" é hoje', () => {
  expect((configuracaoInicial(r, '2026-11-21', ids(), AGORA)[0].linha as Config).sabado_referencia).toBe('2026-11-21');
});
it('trocar escala duas vezes no mesmo dia atualiza a mesma', () => {
  const novo = ids();
  const e1 = trocarEscala([escala()], 'TF', 0, HOJE, novo, AGORA);
  expect(e1.vigente_desde).toBe(HOJE);
  const e2 = trocarEscala([escala(), e1], 'TTFF', 1, HOJE, novo, AGORA);
  expect(e2.id).toBe(e1.id);
  expect([e2.ciclo, e2.inicio]).toEqual(['TTFF', '2026-11-15']);
});
it('ligar treino cria o item e guarda o id', () => {
  const ms = ligarTreino(config(), HOJE, () => 'tr', AGORA);
  expect((ms.find((m) => m.tabela === 'config')!.linha as Config).treino_item_id).toBe('tr');
  expect(ms.find((m) => m.tabela === 'itens')!.linha).toMatchObject({ id: 'tr', repeticao: 'folgas', data: HOJE });
});
it('desligar treino encerra ontem ou exclui se começou hoje', () => {
  const t = item({ id: 't', data: '2026-11-13', repeticao: 'folgas' });
  const ms = desligarTreino(config({ treino_item_id: 't' }), t, HOJE, AGORA);
  expect((ms.find((m) => m.tabela === 'itens')!.linha as Item).repete_ate).toBe('2026-11-15');
  expect((ms.find((m) => m.tabela === 'config')!.linha as Config).treino_item_id).toBeNull();
  expect((desligarTreino(config({ treino_item_id: 't' }), { ...t, data: HOJE }, HOJE, AGORA).find((m) => m.tabela === 'itens')!.linha as Item).excluido_em).toBe(AGORA);
});
