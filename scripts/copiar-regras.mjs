// Copia as regras puras (src/regras) para a Edge Function, que roda em Deno e não enxerga src/.
// Os testes ficam de fora. A pasta de destino é recriada e não vai para o git.
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const raiz = join(import.meta.dirname, '..');
const origem = join(raiz, 'src', 'regras');
const destino = join(raiz, 'supabase', 'functions', '_shared', 'regras');

rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });
const arquivos = readdirSync(origem).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
for (const f of arquivos) copyFileSync(join(origem, f), join(destino, f));
console.log(`regras copiadas: ${arquivos.join(', ')}`);
