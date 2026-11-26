import { expect, it } from 'vitest';
import type { Etapa, Meta } from '../regras/tipos.ts';
import { AGORA, etapa, HOJE, ids, meta } from '../testes/fabrica.ts';
import {
  adicionarEtapa, adicionarValor, alternarEtapa, concluirMeta, criarMeta, editarMeta, excluirMeta, reabrirMeta, reordenarEtapas,
} from './opsMetas.ts';

it('criar meta de conquista com etapas e de valor', () => {
  const ms = criarMeta({ nome: 'Vender um projeto', icone: '🚀', cor: '#7b5cff', tipo: 'conquista', prazo: '2026-12-31', prioridade: 'alta', alvo_centavos: null, observacao: null }, ['Portfólio', 'Proposta', 'Fechar'], ids(), AGORA);
  expect(ms.filter((m) => m.tabela === 'etapas').map((m) => [(m.linha as Etapa).texto, (m.linha as Etapa).ordem])).toEqual([['Portfólio', 0], ['Proposta', 1], ['Fechar', 2]]);
  expect((ms[0].linha as Meta).atual_centavos).toBeNull();
  expect(ms.filter((m) => m.tabela === 'etapas').every((m) => (m.linha as Etapa).meta_id === ms[0].linha.id)).toBe(true);
  const v = criarMeta({ nome: 'Reserva', icone: '🛟', cor: '#0f9d74', tipo: 'valor', prazo: '2026-12-31', prioridade: 'alta', alvo_centavos: 600000, observacao: null }, [], ids(), AGORA);
  expect((v[0].linha as Meta).atual_centavos).toBe(0);
});

it('adicionar valor não fica negativo', () => {
  const m = meta({ tipo: 'valor', alvo_centavos: 600000, atual_centavos: 120000 });
  expect((adicionarValor(m, 5000, AGORA).linha as Meta).atual_centavos).toBe(125000);
  expect((adicionarValor(m, -999999, AGORA).linha as Meta).atual_centavos).toBe(0);
});

it('concluir e reabrir', () => {
  expect((concluirMeta(meta(), HOJE, AGORA).linha as Meta).concluida_em).toBe(HOJE);
  expect((reabrirMeta(meta({ concluida_em: HOJE }), AGORA).linha as Meta).concluida_em).toBeNull();
});

it('marcar etapa e reordenar pela posição', () => {
  const e = etapa('m', { id: 'a', feita: false });
  expect((alternarEtapa(e, AGORA).linha as Etapa).feita).toBe(true);
  const ms = reordenarEtapas([etapa('m', { id: 'c', ordem: 2 }), etapa('m', { id: 'a', ordem: 0 }), etapa('m', { id: 'b', ordem: 1 })], AGORA);
  expect(ms.map((m) => [m.linha.id, (m.linha as Etapa).ordem])).toEqual([['c', 0], ['a', 1], ['b', 2]]);
});

it('editar meta troca só os campos pedidos; nova etapa vai para o fim', () => {
  const m = meta({ id: 'm', nome: 'Antigo', atual_centavos: 500 });
  expect(editarMeta(m, { nome: 'Novo', prioridade: 'baixa' }, AGORA).linha).toMatchObject({ id: 'm', nome: 'Novo', prioridade: 'baixa', atual_centavos: 500 });
  const nova = adicionarEtapa(m, 'Última', [etapa('m', { ordem: 0 }), etapa('m', { ordem: 4 })], ids(), AGORA);
  expect(nova.linha).toMatchObject({ id: 'n1', meta_id: 'm', texto: 'Última', ordem: 5, feita: false });
});

it('excluir meta marca a meta e as etapas dela como excluídas', () => {
  const m = meta({ id: 'm' });
  const ms = excluirMeta(m, [etapa('m', { id: 'e1' }), etapa('outra', { id: 'e2' })], AGORA);
  expect(ms.map((x) => `${x.tabela}:${x.linha.id}:${x.linha.excluido_em}`)).toEqual([`metas:m:${AGORA}`, `etapas:e1:${AGORA}`]);
});
