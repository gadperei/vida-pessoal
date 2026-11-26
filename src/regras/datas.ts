// Datas como texto 'AAAA-MM-DD'. Contas feitas em UTC para não sofrer com horário de verão.
// Este arquivo é copiado para a Edge Function: nada de imports externos.
import type { Dia } from './tipos.ts';

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const NOMES_MES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const dois = (n: number) => String(n).padStart(2, '0');

function paraUTC(d: Dia): number {
  const [a, m, dia] = d.split('-').map(Number);
  return Date.UTC(a, m - 1, dia);
}

function deUTC(ms: number): Dia {
  const x = new Date(ms);
  return `${x.getUTCFullYear()}-${dois(x.getUTCMonth() + 1)}-${dois(x.getUTCDate())}`;
}

export function adicionarDias(d: Dia, n: number): Dia {
  return deUTC(paraUTC(d) + n * MS_POR_DIA);
}

/** Dias corridos de `de` até `ate` (positivo se `ate` for depois). */
export function diasEntre(de: Dia, ate: Dia): number {
  return Math.round((paraUTC(ate) - paraUTC(de)) / MS_POR_DIA);
}

/** 0 = domingo … 6 = sábado. */
export function diaDaSemana(d: Dia): number {
  return new Date(paraUTC(d)).getUTCDay();
}

/** A segunda-feira da semana de `d`. */
export function inicioDaSemana(d: Dia): Dia {
  return adicionarDias(d, -((diaDaSemana(d) + 6) % 7));
}

/** '2026-11-16' → '2026-11'. */
export function mesDe(d: Dia): string {
  return d.slice(0, 7);
}

/** '2026-11' + (-1) → '2026-10'. */
export function adicionarMeses(mes: string, n: number): string {
  const [a, m] = mes.split('-').map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

/** Quantos dias tem o mês 'AAAA-MM'. */
export function diasDoMes(mes: string): number {
  const [a, m] = mes.split('-').map(Number);
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
}

/** '2026-11' → 'novembro'. */
export function nomeMes(mes: string): string {
  return NOMES_MES[Number(mes.split('-')[1]) - 1];
}

/** '2026-11-16' → 'Seg 16/11'. */
export function rotuloDia(d: Dia): string {
  const [, m, dia] = d.split('-');
  return `${DIAS_CURTOS[diaDaSemana(d)]} ${dia}/${m}`;
}

/** '08:00' → 480. */
export function minutosDeHora(h: string): number {
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + mm;
}

/** 780 → '13:00'. */
export function horaDeMinutos(m: number): string {
  return `${dois(Math.floor(m / 60))}:${dois(m % 60)}`;
}

/** Data local do aparelho. Só a interface usa (a Edge Function usa agoraEmSaoPaulo). */
export function hojeLocal(agora: Date = new Date()): Dia {
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`;
}

const FORMATO_SP = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

/** Dia e minutos desde a meia-noite em São Paulo, para um instante qualquer. */
export function agoraEmSaoPaulo(agora: Date): { dia: Dia; minutos: number } {
  const p = Object.fromEntries(FORMATO_SP.formatToParts(agora).map((x) => [x.type, x.value]));
  return { dia: `${p.year}-${p.month}-${p.day}`, minutos: Number(p.hour) * 60 + Number(p.minute) };
}

/** 420 → '7h', 390 → '6h30'. */
export function duracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h}h` : `${h}h${dois(m)}`;
}
