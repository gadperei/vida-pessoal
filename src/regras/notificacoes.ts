// Quais avisos devem sair agora. Usado pela Edge Function a cada 15 minutos.
import { adicionarDias, minutosDeHora } from './datas.ts';
import { NOME_APP, type Banco, type Dia } from './tipos.ts';

export interface Aviso { chave: string; texto: string; abrir: 'inicio' | 'checkin' | 'metas'; diasRestantes: number }
interface Candidato extends Aviso { dia: Dia; minuto: number }

const ANTECEDENCIA = { prova: [7, 3, 1, 0], entrega: [3, 1, 0], compromisso: [1, 0] } as const;

function textoDias(titulo: string, n: number): string {
  if (n === 0) return `Hoje: ${titulo}`;
  if (n === 1) return `${titulo} amanhã`;
  return `${titulo} em ${n} dias`;
}

function candidatos(agora: { dia: Dia }, banco: Banco, H: number): Candidato[] {
  const lista: Candidato[] = [];
  const ontem = adicionarDias(agora.dia, -1);
  const registroOntem = banco.dias.find((d) => d.id === ontem);
  if (!registroOntem || registroOntem.habitos_em === null) {
    lista.push({
      dia: agora.dia, minuto: H, chave: `checkin:${agora.dia}`,
      texto: 'Como foi ontem? Registre em 10 segundos.', abrir: 'checkin', diasRestantes: 0,
    });
  }

  for (const it of banco.itens) {
    if (it.tipo === 'tarefa' || it.feito_em !== null) continue;
    const comHora = it.tipo === 'compromisso' && it.hora !== null;
    const ns = comHora ? [1] : ANTECEDENCIA[it.tipo];
    for (const n of ns) {
      lista.push({
        dia: adicionarDias(it.data, -n), minuto: H, chave: `item:${it.id}:${it.data}:${n}d`,
        texto: textoDias(it.titulo, n), abrir: 'inicio', diasRestantes: n,
      });
    }
    if (comHora) {
      lista.push({
        dia: it.data, minuto: Math.max(0, minutosDeHora(it.hora as string) - 60), chave: `item:${it.id}:${it.data}T${it.hora}:1h`,
        texto: `${it.titulo} às ${it.hora}`, abrir: 'inicio', diasRestantes: 0,
      });
    }
  }

  for (const m of banco.metas) {
    if (m.prioridade !== 'alta' || m.concluida_em !== null) continue;
    for (const n of [30, 7]) {
      lista.push({
        dia: adicionarDias(m.prazo, -n), minuto: H, chave: `meta:${m.id}:${m.prazo}:${n}d`,
        texto: `Meta "${m.nome}": faltam ${n} dias`, abrir: 'metas', diasRestantes: n,
      });
    }
  }
  return lista;
}

export function avisosDevidos(agora: { dia: Dia; minutos: number }, banco: Banco, enviadas: Set<string>): Aviso[] {
  const config = banco.config[0];
  if (!config || !config.notificacoes_ligadas) return [];
  const H = minutosDeHora(config.horario_avisos);
  const peso = (a: Aviso) => (a.abrir === 'checkin' ? -1 : a.diasRestantes);
  return candidatos(agora, banco, H)
    .filter((c) => c.dia === agora.dia && c.minuto <= agora.minutos && !enviadas.has(c.chave))
    .sort((a, b) => peso(a) - peso(b) || (a.chave < b.chave ? -1 : a.chave > b.chave ? 1 : 0))
    .map(({ chave, texto, abrir, diasRestantes }) => ({ chave, texto, abrir, diasRestantes }));
}

/** Uma notificação só, agrupando os avisos. */
export function montarNotificacao(avisos: Aviso[]): { titulo: string; corpo: string; url: string } | null {
  if (avisos.length === 0) return null;
  const todos = (abrir: Aviso['abrir']) => avisos.every((a) => a.abrir === abrir);
  const url = todos('checkin') ? '/?abrir=checkin' : todos('metas') ? '/?aba=metas' : '/';
  return { titulo: NOME_APP, corpo: avisos.map((a) => a.texto).join(' · '), url };
}
