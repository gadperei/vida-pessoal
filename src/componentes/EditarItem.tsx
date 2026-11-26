import { useEffect, useState } from 'react';
import { agoraIso, novoId } from '../dados/ids.ts';
import { alternarFeito, editarItem, editarRepeticao, encerrarRepeticao, excluirLinha } from '../dados/opsAgenda.ts';
import { desligarTreino } from '../dados/opsConfig.ts';
import type { Mudanca } from '../dados/banco.ts';
import { useBanco } from '../estado/contexto.tsx';
import type { Ocorrencia } from '../regras/agenda.ts';
import { rotuloDia } from '../regras/datas.ts';
import type { Dia } from '../regras/tipos.ts';
import { CamposItem, type ValoresItem } from './CamposItem.tsx';
import { PainelInferior } from './PainelInferior.tsx';

interface Props { ocorrencia: Ocorrencia | null; hoje: Dia; aoFechar(): void }

/** Ver e mudar um item: campos, marcar feito, excluir ou parar de repetir. */
export function EditarItem({ ocorrencia, hoje, aoFechar }: Props) {
  const { banco, salvar } = useBanco();
  const item = ocorrencia?.item ?? null;
  const [titulo, setTitulo] = useState('');
  const [valores, setValores] = useState<ValoresItem | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  useEffect(() => {
    if (!item) return;
    setTitulo(item.titulo);
    setValores({ tipo: item.tipo, data: item.data, hora: item.hora, area: item.area, repeticao: item.repeticao });
    setConfirmarExclusao(false);
  }, [item]);

  if (!ocorrencia || !item || !valores) return <PainelInferior aberto={false} titulo="" aoFechar={aoFechar}>{null}</PainelInferior>;
  const repetido = item.repeticao !== 'nenhuma';
  const ehTreino = banco.config[0]?.treino_item_id === item.id;

  function guardar() {
    if (!item || !valores || !titulo.trim()) return;
    const agora = agoraIso();
    const ms: Mudanca[] = [];
    const campos = { titulo: titulo.trim(), tipo: valores.tipo, area: valores.area, hora: valores.hora, data: repetido ? item.data : valores.data };
    const editado = editarItem(item, campos, agora);
    if (valores.repeticao !== item.repeticao && valores.tipo === 'tarefa') {
      const base = editado.linha as typeof item;
      ms.push(...editarRepeticao(base, valores.repeticao, hoje, novoId, agora));
    } else {
      ms.push(editado);
    }
    salvar(ms);
    aoFechar();
  }

  function excluir() {
    if (!item) return;
    const agora = agoraIso();
    const config = banco.config[0];
    if (ehTreino && config) salvar(desligarTreino(config, item, hoje, agora));
    else if (repetido) salvar(encerrarRepeticao(item, hoje, agora));
    else salvar(excluirLinha('itens', item, agora));
    aoFechar();
  }

  return (
    <PainelInferior aberto titulo={repetido ? `${item.titulo} · ${rotuloDia(ocorrencia.dia)}` : item.titulo} aoFechar={aoFechar}>
      <div className="campo">
        <label htmlFor="editar-titulo">Título</label>
        <input id="editar-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>
      <CamposItem valores={repetido ? { ...valores, data: item.data } : valores} aoMudar={(v) => setValores((a) => (a ? { ...a, ...v } : a))} />
      {repetido && <p className="campo-dica">Item repetido: a mudança de repetição vale de hoje em diante.</p>}

      <div className="botoes">
        <button type="button" className="botao botao-secundario" onClick={() => { salvar(alternarFeito(ocorrencia, banco, agoraIso())); aoFechar(); }}>
          {ocorrencia.feito ? 'Desmarcar feito' : 'Marcar feito'}
        </button>
        <button type="button" className="botao botao-primario" disabled={!titulo.trim()} onClick={guardar}>Salvar</button>
      </div>

      {!confirmarExclusao ? (
        <button type="button" className="botao botao-texto botao-largo" onClick={() => setConfirmarExclusao(true)}>
          {repetido ? 'Parar de repetir' : 'Excluir'}
        </button>
      ) : (
        <div className="confirmar">
          <p>{repetido ? 'Parar de repetir a partir de hoje? Os dias passados continuam no histórico.' : 'Excluir este item?'}</p>
          <div className="botoes">
            <button type="button" className="botao botao-secundario" onClick={() => setConfirmarExclusao(false)}>Cancelar</button>
            <button type="button" className="botao botao-perigo" onClick={excluir}>{repetido ? 'Parar' : 'Excluir'}</button>
          </div>
        </div>
      )}
    </PainelInferior>
  );
}
