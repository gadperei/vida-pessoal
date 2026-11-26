import { describe, expect, it } from 'vitest';
import {
  adicionarDias, adicionarMeses, agoraEmSaoPaulo, diaDaSemana, diasDoMes, diasEntre, hojeLocal, horaDeMinutos,
  inicioDaSemana, mesDe, minutosDeHora, nomeMes, rotuloDia,
} from './datas.ts';

describe('datas', () => {
  it('soma e conta dias atravessando o ano', () => {
    expect(adicionarDias('2026-12-30', 3)).toBe('2027-01-02');
    expect(adicionarDias('2026-11-16', -3)).toBe('2026-11-13');
    expect(diasEntre('2026-11-16', '2026-12-31')).toBe(45);
  });
  it('semana começa na segunda', () => {
    expect(diaDaSemana('2026-11-16')).toBe(1);
    expect(inicioDaSemana('2026-11-22')).toBe('2026-11-16');
    expect(inicioDaSemana('2026-11-16')).toBe('2026-11-16');
  });
  it('mês e rótulos', () => {
    expect(mesDe('2026-11-16')).toBe('2026-11');
    expect(diasDoMes('2026-11')).toBe(30);
    expect(diasDoMes('2028-02')).toBe(29);
    expect(nomeMes('2026-11')).toBe('novembro');
    expect(rotuloDia('2026-11-16')).toBe('Seg 16/11');
  });
  it('horas em minutos', () => {
    expect(minutosDeHora('08:00')).toBe(480);
    expect(horaDeMinutos(780)).toBe('13:00');
  });
  it('hoje usa a data local, não UTC', () => {
    expect(hojeLocal(new Date(2026, 10, 30, 22, 30))).toBe('2026-11-30');
  });
  it('agora em São Paulo a partir de um instante UTC', () => {
    expect(agoraEmSaoPaulo(new Date('2026-11-17T01:30:00Z'))).toEqual({ dia: '2026-11-16', minutos: 1350 });
    expect(agoraEmSaoPaulo(new Date('2026-11-16T11:00:00Z'))).toEqual({ dia: '2026-11-16', minutos: 480 });
  });
});

it('duração em horas', async () => {
  const { duracao } = await import('./datas.ts');
  expect(duracao(420)).toBe('7h');
  expect(duracao(390)).toBe('6h30');
  expect(duracao(365)).toBe('6h05');
  expect(duracao(45)).toBe('0h45');
});

it('soma meses atravessando o ano', () => {
  expect(adicionarMeses('2026-11', -1)).toBe('2026-10');
  expect(adicionarMeses('2026-01', -1)).toBe('2025-12');
  expect(adicionarMeses('2026-12', 1)).toBe('2027-01');
  expect(adicionarMeses('2026-11', -13)).toBe('2025-10');
});
