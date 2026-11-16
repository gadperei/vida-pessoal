// Lê a linha digitada no "+ anotar" (ex.: "prova química 20/11") e monta a prévia do item.
import { adicionarDias, diaDaSemana, diasDoMes } from './datas.ts';
import type { Area, Dia, TipoItem } from './tipos.ts';

export interface Previa { titulo: string; tipo: TipoItem; data: Dia; hora: string | null; area: Area }

const DIAS_SEMANA: Record<string, number> = {
  dom: 0, domingo: 0, seg: 1, segunda: 1, ter: 2, terca: 2, qua: 3, quarta: 3,
  qui: 4, quinta: 4, sex: 5, sexta: 5, sab: 6, sabado: 6,
};
const PALAVRAS: [TipoItem, string[]][] = [
  ['prova', ['prova', 'avaliacao', 'p1', 'p2', 'p3']],
  ['entrega', ['entrega', 'entregar', 'atividade', 'relatorio', 'lista', 'seminario']],
  ['compromisso', ['consulta', 'medico', 'dentista', 'reuniao', 'encontro']],
];

const dois = (n: number) => String(n).padStart(2, '0');
const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** 'AAAA-MM-DD' se a data existe; senão null. */
function montarData(a: number, m: number, d: number): Dia | null {
  const x = new Date(Date.UTC(a, m - 1, d));
  if (m < 1 || m > 12 || d < 1 || x.getUTCMonth() !== m - 1 || x.getUTCDate() !== d) return null;
  return `${a}-${dois(m)}-${dois(d)}`;
}

function dataBarra(t: string, hoje: Dia): Dia | null {
  const r = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/.exec(t);
  if (!r) return null;
  const [d, m] = [Number(r[1]), Number(r[2])];
  if (r[3]) return montarData(r[3].length === 2 ? 2000 + Number(r[3]) : Number(r[3]), m, d);
  const ano = Number(hoje.slice(0, 4));
  const desteAno = montarData(ano, m, d);
  if (desteAno === null || desteAno >= hoje) return desteAno;
  return montarData(ano + 1, m, d);
}

/** "dia N": este mês se N ≥ hoje; senão o próximo mês que tenha o dia N. */
function dataDiaN(n: number, hoje: Dia): Dia | null {
  if (n < 1 || n > 31) return null;
  let [a, m] = hoje.split('-').map(Number);
  if (n < Number(hoje.slice(8, 10))) m += 1;
  for (let i = 0; i < 13; i++, m++) {
    if (m > 12) { m = 1; a += 1; }
    if (diasDoMes(`${a}-${dois(m)}`) >= n) return `${a}-${dois(m)}-${dois(n)}`;
  }
  return null;
}

function hora(t: string): string | null {
  const r = /^(\d{1,2})(?:h(\d{2})?|:(\d{2}))$/.exec(t);
  if (!r) return null;
  const h = Number(r[1]);
  const min = Number(r[2] ?? r[3] ?? 0);
  return h > 23 || min > 59 ? null : `${dois(h)}:${dois(min)}`;
}

export function lerLinha(texto: string, hoje: Dia): Previa {
  const tokens = texto.trim().split(/\s+/).filter(Boolean);
  const norm = tokens.map(normalizar);
  const usado = tokens.map(() => false);
  let data: Dia | null = null;
  let hh: string | null = null;

  for (let i = 0; i < tokens.length; i++) {
    if (usado[i]) continue;
    const n = norm[i];
    if (data === null) {
      let achou: Dia | null = null;
      let ocupa = 1;
      if (n === 'depois' && norm[i + 1] === 'de' && norm[i + 2] === 'amanha') { achou = adicionarDias(hoje, 2); ocupa = 3; }
      else if (n === 'hoje') achou = hoje;
      else if (n === 'amanha') achou = adicionarDias(hoje, 1);
      else if (n === 'dia' && /^\d{1,2}$/.test(norm[i + 1] ?? '')) { achou = dataDiaN(Number(norm[i + 1]), hoje); ocupa = 2; }
      else if (n.replace(/-feira$/, '') in DIAS_SEMANA) {
        const alvo = DIAS_SEMANA[n.replace(/-feira$/, '')];
        achou = adicionarDias(hoje, (alvo - diaDaSemana(hoje) + 7) % 7);
      } else achou = dataBarra(n, hoje);
      if (achou !== null) {
        data = achou;
        for (let k = 0; k < ocupa; k++) usado[i + k] = true;
        continue;
      }
    }
    if (hh === null) {
      const h = hora(n);
      if (h !== null) {
        hh = h;
        usado[i] = true;
        if (i > 0 && !usado[i - 1] && norm[i - 1] === 'as') usado[i - 1] = true;
      }
    }
  }

  const tipo = PALAVRAS.find(([, ps]) => norm.some((n) => ps.includes(n)))?.[0] ?? 'tarefa';
  const resto = tokens.filter((_, i) => !usado[i]).join(' ');
  return {
    titulo: resto.charAt(0).toUpperCase() + resto.slice(1),
    tipo,
    data: data ?? hoje,
    hora: hh,
    area: tipo === 'prova' || tipo === 'entrega' ? 'academica' : 'pessoal',
  };
}
