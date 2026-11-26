// Paleta fixa das metas. Todas deixam o texto branco legível (contraste ≥ 4,5:1, ver cores.test.ts).
export const CORES_META = [
  '#6c4cf0', // roxo
  '#087f5b', // verde
  '#c2410c', // laranja
  '#c2255c', // rosa
  '#1864ab', // azul
  '#0b7285', // azul-petróleo
  '#9c36b5', // uva
  '#495057', // grafite
] as const;

const canais = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function luminancia(hex: string): number {
  const [r, g, b] = canais(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste WCAG entre duas cores '#rrggbb' (1 a 21). */
export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Mistura com preto: fator 0.25 = 25% mais escuro. */
function escurecer(hex: string, fator: number): string {
  return `#${canais(hex).map((v) => Math.round(v * (1 - fator)).toString(16).padStart(2, '0')).join('')}`;
}

/** Fundo dos cartões: da cor da meta para um tom mais escuro dela. */
export function degrade(cor: string): string {
  return `linear-gradient(135deg, ${cor}, ${escurecer(cor, 0.3)})`;
}
