import { useEffect, useState } from 'react';
import { agoraIso, novoId } from '../dados/ids.ts';
import type { Mudanca } from '../dados/banco.ts';
import { novoLivro, salvarCheckin, terminarLivro, valoresIniciais, type ValoresCheckin } from '../dados/opsHabitos.ts';
import { useBanco } from '../estado/contexto.tsx';
import { adicionarDias, duracao, rotuloDia } from '../regras/datas.ts';
import type { Dia } from '../regras/tipos.ts';
import { Contador } from './Contador.tsx';
import { PainelInferior } from './PainelInferior.tsx';

interface Props { aberto: boolean; hoje: Dia; aoFechar(): void }

const EXERCICIO = [{ v: 0, r: 'Não' }, { v: 15, r: '15' }, { v: 30, r: '30' }, { v: 45, r: '45' }, { v: 60, r: '60+' }];
const COMIDA = [{ v: 1, r: '😞', a: 'Comi mal' }, { v: 2, r: '😐', a: 'Mais ou menos' }, { v: 3, r: '😀', a: 'Comi bem' }] as const;
const NOVO = '__novo__';

/** Registro do dia: sono desta noite e hábitos de ontem, sem digitar (§4.5). */
export function PainelCheckin({ aberto, hoje, aoFechar }: Props) {
  const { banco, salvar, avisar } = useBanco();
  const [manha, setManha] = useState(hoje);
  const [v, setV] = useState<ValoresCheckin>(() => valoresIniciais(hoje, banco));
  const [paginas, setPaginas] = useState('');
  const [terminei, setTerminei] = useState(false);
  const [tituloNovo, setTituloNovo] = useState<string | null>(null);

  // Ao abrir ou trocar o dia, recomeça com o que já foi salvo (ou com o último registro).
  useEffect(() => {
    if (!aberto) return;
    const iniciais = valoresIniciais(manha, banco);
    setV(iniciais);
    setPaginas(String(iniciais.paginas));
    setTerminei(false);
    setTituloNovo(null);
    // banco fica de fora de propósito: salvar outra coisa não deve apagar o que está sendo preenchido.
  }, [aberto, manha]);

  useEffect(() => { if (aberto) setManha(hoje); }, [aberto, hoje]);

  const vespera = adicionarDias(manha, -1);
  const mudar = (p: Partial<ValoresCheckin>) => setV((a) => ({ ...a, ...p }));
  const livroAtual = banco.livros.find((l) => l.id === v.livroId) ?? null;
  const opcoesLivro = banco.livros.filter((l) => l.terminado_em === null || l.id === v.livroId);
  const dias = Array.from({ length: 7 }, (_, i) => adicionarDias(hoje, -i));

  function escolherLivro(valor: string) {
    if (valor === NOVO) { setTituloNovo(''); return; }
    setTituloNovo(null);
    setTerminei(false);
    mudar({ livroId: valor || null });
  }

  function adicionarLivro() {
    const titulo = (tituloNovo ?? '').trim();
    if (!titulo) return;
    const m = novoLivro(titulo, novoId, agoraIso());
    salvar(m);
    mudar({ livroId: m.linha.id });
    setTituloNovo(null);
  }

  function guardar() {
    const agora = agoraIso();
    const valores: ValoresCheckin = { ...v, paginas: Math.max(0, Number.parseInt(paginas, 10) || 0) };
    const ms: Mudanca[] = salvarCheckin(manha, valores, banco, agora);
    if (terminei && livroAtual && livroAtual.terminado_em === null) ms.push(terminarLivro(livroAtual, vespera, agora));
    salvar(ms);
    avisar(manha === hoje ? 'Registro salvo' : `Registro salvo · manhã de ${rotuloDia(manha)}`);
    aoFechar();
  }

  return (
    <PainelInferior aberto={aberto} titulo="Como foi ontem?" aoFechar={aoFechar}>
      <div className="campo">
        <label htmlFor="checkin-manha">Manhã de</label>
        <select id="checkin-manha" value={manha} onChange={(e) => setManha(e.target.value)}>
          {dias.map((d, i) => (
            <option key={d} value={d}>{rotuloDia(d)}{i === 0 ? ' (hoje)' : i === 1 ? ' (ontem)' : ''}</option>
          ))}
        </select>
      </div>

      <Contador rotulo="Esta noite você dormiu" valor={v.sonoMin} texto={duracao(v.sonoMin)} passo={30} min={0} max={900} aoMudar={(sonoMin) => mudar({ sonoMin })} />

      <p className="rotulo">{manha === hoje ? 'Ontem' : `No dia ${rotuloDia(vespera)}`}</p>
      <div role="group" aria-label="Exercício (minutos)">
        <span className="campo-dica">Exercício (min)</span>
        <div className="chips">
          {EXERCICIO.map((o) => {
            const ativo = o.v === 60 ? v.exercicioMin >= 60 : v.exercicioMin === o.v;
            return (
              <button key={o.v} type="button" className={`chip ${ativo ? 'chip-ativo' : ''}`} aria-pressed={ativo} onClick={() => mudar({ exercicioMin: o.v })}>{o.r}</button>
            );
          })}
        </div>
      </div>
      <div role="group" aria-label="Comida">
        <span className="campo-dica">Comida</span>
        <div className="chips chips-emoji">
          {COMIDA.map((o) => (
            <button key={o.v} type="button" className={`chip ${v.comida === o.v ? 'chip-ativo' : ''}`} aria-pressed={v.comida === o.v} aria-label={o.a} onClick={() => mudar({ comida: o.v })}>{o.r}</button>
          ))}
        </div>
      </div>

      <div className="campos-lado">
        <div className="campo">
          <label htmlFor="checkin-paginas">Páginas lidas</label>
          <input id="checkin-paginas" type="number" inputMode="numeric" min={0} value={paginas} onFocus={(e) => e.target.select()} onChange={(e) => setPaginas(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="checkin-livro">Livro</label>
          <select id="checkin-livro" value={tituloNovo !== null ? NOVO : v.livroId ?? ''} onChange={(e) => escolherLivro(e.target.value)}>
            <option value="">Nenhum</option>
            {opcoesLivro.map((l) => <option key={l.id} value={l.id}>{l.titulo}</option>)}
            <option value={NOVO}>+ Novo livro…</option>
          </select>
        </div>
      </div>
      {tituloNovo !== null && (
        <div className="campo">
          <label htmlFor="checkin-livro-novo">Nome do livro</label>
          <div className="linha-acao">
            <input id="checkin-livro-novo" autoFocus value={tituloNovo} onChange={(e) => setTituloNovo(e.target.value)} />
            <button type="button" className="botao botao-secundario" disabled={!tituloNovo.trim()} onClick={adicionarLivro}>Adicionar</button>
          </div>
        </div>
      )}
      {livroAtual && livroAtual.terminado_em === null && (
        <label className="linha-opcao">
          <input type="checkbox" checked={terminei} onChange={(e) => setTerminei(e.target.checked)} />
          Terminei “{livroAtual.titulo}”
        </label>
      )}

      <button type="button" className="botao botao-primario botao-largo" onClick={guardar}>Salvar</button>
    </PainelInferior>
  );
}
