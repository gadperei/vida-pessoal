import { tomDaOnda } from './cores.ts';

/**
 * O "nível" de progresso de uma meta: um tom mais fechado da cor sobe do pé do cartão
 * até a altura do percentual, com o topo ondulado. 0% deixa só uma lâmina no fundo.
 */
export function Onda({ cor, pct }: { cor: string; pct: number }) {
  const y = 100 - Math.max(4, Math.min(100, pct));
  const a = 4; // altura da ondulação, em % do cartão
  const d = `M0 ${y} C 17 ${y - a}, 33 ${y + a}, 50 ${y} S 83 ${y - a}, 100 ${y} V 100 H 0 Z`;
  return (
    <svg className="onda" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={d} fill={tomDaOnda(cor)} />
    </svg>
  );
}
