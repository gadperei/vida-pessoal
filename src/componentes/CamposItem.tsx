import type { Area, Repeticao, TipoItem } from '../regras/tipos.ts';

export interface ValoresItem { tipo: TipoItem; data: string; hora: string | null; area: Area; repeticao: Repeticao }

const TIPOS: { v: TipoItem; r: string }[] = [
  { v: 'prova', r: 'Prova' }, { v: 'entrega', r: 'Entrega' }, { v: 'compromisso', r: 'Compromisso' }, { v: 'tarefa', r: 'Tarefa' },
];
const AREAS: { v: Area; r: string }[] = [
  { v: 'pessoal', r: 'Pessoal' }, { v: 'profissional', r: 'Profissional' }, { v: 'academica', r: 'Acadêmica' },
];
const REPETICOES: { v: Repeticao; r: string }[] = [
  { v: 'nenhuma', r: 'Não repete' }, { v: 'todo_dia', r: 'Todo dia' }, { v: 'folgas', r: 'Todas as folgas' }, { v: 'trabalho', r: 'Dias de trabalho' },
];

function Chips<T extends string>({ rotulo, opcoes, valor, aoMudar }: {
  rotulo: string; opcoes: { v: T; r: string }[]; valor: T; aoMudar(v: T): void;
}) {
  return (
    <div role="group" aria-label={rotulo}>
      <p className="rotulo">{rotulo}</p>
      <div className="chips">
        {opcoes.map((o) => (
          <button key={o.v} type="button" className={`chip ${valor === o.v ? 'chip-ativo' : ''}`} aria-pressed={valor === o.v} onClick={() => aoMudar(o.v)}>
            {o.r}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Tipo, data, hora, área e repetição de um item (a repetição só aparece para tarefa). */
export function CamposItem({ valores, aoMudar, mostrarRepeticao = true }: {
  valores: ValoresItem; aoMudar(v: Partial<ValoresItem>): void; mostrarRepeticao?: boolean;
}) {
  return (
    <>
      <Chips rotulo="Tipo" opcoes={TIPOS} valor={valores.tipo} aoMudar={(tipo) => aoMudar({ tipo })} />
      <div className="campos-lado">
        <div className="campo">
          <label htmlFor="item-data">Data</label>
          <input id="item-data" type="date" value={valores.data} onChange={(e) => e.target.value && aoMudar({ data: e.target.value })} />
        </div>
        <div className="campo">
          <label htmlFor="item-hora">Hora (opcional)</label>
          <input id="item-hora" type="time" value={valores.hora ?? ''} onChange={(e) => aoMudar({ hora: e.target.value || null })} />
        </div>
      </div>
      <Chips rotulo="Área" opcoes={AREAS} valor={valores.area} aoMudar={(area) => aoMudar({ area })} />
      {mostrarRepeticao && valores.tipo === 'tarefa' && (
        <Chips rotulo="Repetir" opcoes={REPETICOES} valor={valores.repeticao} aoMudar={(repeticao) => aoMudar({ repeticao })} />
      )}
    </>
  );
}
