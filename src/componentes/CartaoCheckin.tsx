import { checkinPendente } from '../dados/opsHabitos.ts';
import { useBanco } from '../estado/contexto.tsx';
import type { Dia } from '../regras/tipos.ts';

/** No Início: chama para o registro de ontem; depois de feito, vira um atalho discreto para corrigir. */
export function CartaoCheckin({ hoje, aoAbrir }: { hoje: Dia; aoAbrir(): void }) {
  const { banco } = useBanco();
  if (checkinPendente(hoje, banco)) {
    return (
      <button type="button" className="cartao-checkin" onClick={aoAbrir}>
        <span>Como foi ontem?</span>
        <span className="campo-dica">10 s</span>
      </button>
    );
  }
  return (
    <button type="button" className="botao botao-texto checkin-feito" onClick={aoAbrir}>
      ✓ Ontem registrado · corrigir
    </button>
  );
}
