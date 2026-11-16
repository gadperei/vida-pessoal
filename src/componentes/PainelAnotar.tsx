import { useState, type FormEvent } from 'react';
import { agoraIso, novoId } from '../dados/ids.ts';
import { criarItem } from '../dados/opsAgenda.ts';
import { useBanco } from '../estado/contexto.tsx';
import { lerLinha } from '../regras/anotar.ts';
import { rotuloDia } from '../regras/datas.ts';
import type { Dia } from '../regras/tipos.ts';
import { CamposItem, type ValoresItem } from './CamposItem.tsx';
import { PainelInferior } from './PainelInferior.tsx';

interface Props { aberto: boolean; hoje: Dia; aoFechar(): void }

/** "+ anotar": uma linha de texto, prévia ao vivo e ajustes antes de salvar. */
export function PainelAnotar({ aberto, hoje, aoFechar }: Props) {
  const { salvar, avisar } = useBanco();
  const [texto, setTexto] = useState('');
  const [ajustes, setAjustes] = useState<Partial<ValoresItem>>({});

  const previa = lerLinha(texto, hoje);
  const tipo = ajustes.tipo ?? previa.tipo;
  const valores: ValoresItem = {
    tipo,
    data: ajustes.data ?? previa.data,
    hora: ajustes.hora !== undefined ? ajustes.hora : previa.hora,
    area: ajustes.area ?? (ajustes.tipo ? (tipo === 'prova' || tipo === 'entrega' ? 'academica' : 'pessoal') : previa.area),
    repeticao: ajustes.repeticao ?? 'nenhuma',
  };
  const titulo = previa.titulo.trim();

  function fechar() {
    setTexto('');
    setAjustes({});
    aoFechar();
  }

  function enviar(ev: FormEvent) {
    ev.preventDefault();
    if (!titulo) return;
    salvar(criarItem({ ...previa, ...valores, titulo }, valores.repeticao, novoId, agoraIso()));
    avisar(`Anotado: ${titulo} · ${rotuloDia(valores.data)}`);
    fechar();
  }

  return (
    <PainelInferior aberto={aberto} titulo="Anotar" aoFechar={fechar}>
      <form onSubmit={enviar}>
        <div className="campo">
          <label htmlFor="anotar-texto">O que é e quando?</label>
          <input
            id="anotar-texto"
            autoFocus
            autoComplete="off"
            placeholder="ex.: prova química 20/11"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </div>
        <div className="previa" aria-live="polite">
          <p className="previa-titulo">{titulo || <span className="campo-dica">O título aparece aqui</span>}</p>
          <p className="campo-dica">{rotuloDia(valores.data)}{valores.hora ? ` · ${valores.hora}` : ''}</p>
        </div>
        <CamposItem valores={valores} aoMudar={(v) => setAjustes((a) => ({ ...a, ...v }))} />
        <button type="submit" className="botao botao-primario botao-largo" disabled={!titulo}>Salvar</button>
      </form>
    </PainelInferior>
  );
}
