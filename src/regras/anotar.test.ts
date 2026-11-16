import { expect, it } from 'vitest';
import { lerLinha } from './anotar.ts';

const H = '2026-11-16'; // segunda
const p = (t: string) => lerLinha(t, H);

it('exemplos da spec', () => {
  expect(p('prova química 20/11')).toEqual({ titulo: 'Prova química', tipo: 'prova', data: '2026-11-20', hora: null, area: 'academica' });
  expect(p('entrega relatório sexta')).toEqual({ titulo: 'Entrega relatório', tipo: 'entrega', data: '2026-11-20', hora: null, area: 'academica' });
  expect(p('dentista amanhã 14h')).toEqual({ titulo: 'Dentista', tipo: 'compromisso', data: '2026-11-17', hora: '14:00', area: 'pessoal' });
  expect(p('estudar cálculo')).toEqual({ titulo: 'Estudar cálculo', tipo: 'tarefa', data: H, hora: null, area: 'pessoal' });
});
it('formatos de data', () => {
  expect(p('reunião dia 28 às 9:30')).toMatchObject({ titulo: 'Reunião', data: '2026-11-28', hora: '09:30' });
  expect(p('p2 física 05/01').data).toBe('2027-01-05');
  expect(p('aniversário 16/11').data).toBe('2026-11-16');
  expect(p('vencimento 15/11').data).toBe('2027-11-15');
  expect(p('x 20/11/27').data).toBe('2027-11-20');
  expect(p('x 20/11/2027').data).toBe('2027-11-20');
  expect(p('x depois de amanhã').data).toBe('2026-11-18');
  expect(p('x dia 10').data).toBe('2026-12-10');
  expect(p('x dia 31').data).toBe('2026-12-31');
  expect(p('academia seg').data).toBe('2026-11-16');
  expect(p('PROVA Química SÁBADO')).toMatchObject({ tipo: 'prova', data: '2026-11-21', titulo: 'PROVA Química' });
  expect(p('feira sabado').data).toBe('2026-11-21');
  expect(p('x quarta-feira').data).toBe('2026-11-18');
});
it('horas', () => {
  expect(p('x 14h30').hora).toBe('14:30');
  expect(p('x às 9h').hora).toBe('09:00');
  expect(p('x 25h')).toMatchObject({ hora: null, titulo: 'X 25h' });
});
it('datas impossíveis não viram data', () => {
  expect(p('prova 31/02')).toMatchObject({ data: H, titulo: 'Prova 31/02' });
  expect(p('prova 29/02')).toMatchObject({ data: H, titulo: 'Prova 29/02' });
});
it('"trabalho" não é palavra-chave (é ambíguo)', () => expect(p('trabalho de física').tipo).toBe('tarefa'));
it('linha vazia ou só com data', () => {
  expect(p('   ').titulo).toBe('');
  expect(p(' amanhã ')).toMatchObject({ titulo: '', data: '2026-11-17' });
});
