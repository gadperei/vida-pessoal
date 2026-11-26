// Paleta fixa das metas: tons pastel com texto escuro (tinta) por cima (contraste ≥ 7:1, ver cores.test.ts).
export const CORES_META = [
  '#a8a4ff', // lavanda
  '#7fdc8e', // verde
  '#f7bd5e', // mostarda
  '#f6a6c9', // rosa
  '#93c8ff', // azul
  '#82dccf', // menta
  '#e2a9f7', // lilás
  '#cdd0d9', // cinza
] as const;

/** Cor do texto e dos contornos sobre os cartões coloridos. */
export const TINTA = '#1d1b26';

// Paleta antiga (cores fortes com texto branco), na mesma ordem da nova.
const ANTIGAS = ['#6c4cf0', '#087f5b', '#c2410c', '#c2255c', '#1864ab', '#0b7285', '#9c36b5', '#495057'];

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

/** A cor com que a meta aparece: metas criadas com a paleta antiga ganham o pastel equivalente. */
export function corDaMeta(cor: string): string {
  const i = ANTIGAS.indexOf(cor.toLowerCase());
  return i >= 0 ? CORES_META[i] : cor;
}

/** Tom da "onda" que sobe no cartão conforme o progresso: a mesma cor, um pouco mais fechada. */
export function tomDaOnda(cor: string): string {
  return escurecer(cor, 0.14);
}

/** Nomes para o leitor de tela, na ordem de CORES_META. */
export const NOMES_CORES = ['lavanda', 'verde', 'mostarda', 'rosa', 'azul', 'menta', 'lilás', 'cinza'] as const;
