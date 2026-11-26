import { expect, it } from 'vitest';
import type { Config, Escala, Excecao, Item } from '../regras/tipos.ts';
import { AGORA, config, escala, HOJE, ids, item } from '../testes/fabrica.ts';
import { configuracaoInicial, criarExcecao, desligarTreino, editarConfig, editarFaculdade, ligarTreino, trocarEscala, type RespostasConfig } from './opsConfig.ts';

const r: RespostasConfig = { ciclo: 'TTTFFFTTFF', posicaoHoje: 3, faculdade: { dias: [1, 2, 3, 4, 5], sabadosAlternados: true, sabadoComAula: true, semestreFim: null }, treinoNasFolgas: true, metaSonoMin: 420, metaTreinosSemana: 3, metaLivrosMes: 1, horarioAvisos: '08:00' };

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
it('sem sábados alternados, nenhum sábado tem aula', () => {
  const m = configuracaoInicial({ ...r, faculdade: { ...r.faculdade!, sabadosAlternados: false, sabadoComAula: false } }, HOJE, ids(), AGORA);
  expect((m[0].linha as Config).sabado_referencia).toBeNull();
});
it('editar faculdade nos Ajustes', () => {
  const c = config({ sabado_referencia: '2026-11-21' });
  const f = { dias: [2, 4], sabadosAlternados: true, sabadoComAula: false, semestreFim: '2026-12-15' };
  expect(editarFaculdade(c, f, HOJE, AGORA).linha).toMatchObject({ aula_dias_semana: [2, 4], sabado_referencia: '2026-11-28', semestre_fim: '2026-12-15', atualizado_em: AGORA });
  expect(editarFaculdade(c, { ...f, sabadosAlternados: false }, HOJE, AGORA).linha).toMatchObject({ sabado_referencia: null });
  expect(editarFaculdade(c, null, HOJE, AGORA).linha).toMatchObject({ aula_dias_semana: [], sabado_referencia: null, semestre_fim: null });
});
it('editar config troca só os campos pedidos', () => {
  expect(editarConfig(config({ horario_avisos: '08:00', meta_sono_min: 420 }), { horario_avisos: '07:30' }, AGORA).linha).toMatchObject({ id: 'config', horario_avisos: '07:30', meta_sono_min: 420, atualizado_em: AGORA });
});
it('exceção: folga, trabalho ou sem aula; datas invertidas são desviradas', () => {
  const f = criarExcecao({ inicio: '2026-12-20', fim: '2026-12-10', tipo: 'folga' }, ids(), AGORA).linha as Excecao;
  expect(f).toMatchObject({ id: 'n1', inicio: '2026-12-10', fim: '2026-12-20', tipo_dia: 'F', sem_aula: false, excluido_em: null });
  expect(criarExcecao({ inicio: HOJE, fim: HOJE, tipo: 'trabalho' }, ids(), AGORA).linha).toMatchObject({ tipo_dia: 'T', sem_aula: false });
  expect(criarExcecao({ inicio: HOJE, fim: HOJE, tipo: 'sem_aula' }, ids(), AGORA).linha).toMatchObject({ tipo_dia: null, sem_aula: true });
});
