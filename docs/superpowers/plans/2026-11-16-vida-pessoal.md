# Vida Pessoal — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** construir e publicar a v1 do app pessoal de semana, hábitos e metas. É um PWA com login, dados no Supabase, funcionamento offline no dia a dia e notificações push.

**Arquitetura:** React no front. Todas as regras ficam em funções puras em `src/regras/`, testadas com Vitest e copiadas para a Edge Function, que calcula as notificações. `src/dados/` guarda o banco local (IndexedDB) e uma fila de alterações, e sincroniza com o Supabase pela regra "vence a última alteração". O Supabase tem Postgres com RLS, Auth por e-mail e senha, uma Edge Function e um job `pg_cron` que roda a cada 15 minutos.

**Tecnologias:** React 19, Vite, TypeScript (strict), Vitest, vite-plugin-pwa (`injectManifest`), Workbox, `@supabase/supabase-js`, `idb-keyval`, Recharts, Supabase CLI (via `npx`), `web-push` (na Edge Function, via `npm:`), Vercel.

**Spec:** `docs/superpowers/specs/2026-11-16-vida-pessoal-design.md`. Leia a spec junto com este plano; os números de seção (§) citados aqui são dela.

**Executor e pessoa:** o Gabriel é iniciante em Supabase CLI, push e deploy e quer aprender fazendo. Os passos marcados com **👤 Gabriel** são dele. Neles, o executor para, explica o que vai acontecer e espera. Senhas, a senha do banco e o token do Supabase **nunca** passam pelo executor: o Gabriel digita no terminal dele.

## Restrições globais

- Todo texto da interface em português. Nome do app numa constante só, `NOME_APP = 'Vida Pessoal'` (`src/regras/tipos.ts`), porque o nome é provisório.
- Dia no formato `"AAAA-MM-DD"`, mês em `"AAAA-MM"` e hora em `"HH:MM"` (texto). Fuso `America/Sao_Paulo`. No front, "hoje" é a data **local** do aparelho (`hojeLocal`). Na Edge Function, é `agoraEmSaoPaulo(new Date())`. Nunca usar `toISOString().slice(0, 10)` para obter um dia.
- `src/regras/` é **puro e portátil**, porque é copiado para a Edge Function (Deno):
  - só importa outros arquivos de `src/regras/`, sempre com a extensão `.ts` explícita (`import { x } from './datas.ts'`);
  - não usa pacotes, DOM, `window`, Node ou Deno;
  - recebe `hoje`/`agora` por parâmetro;
  - assume um `Banco` já **sem linhas excluídas**.
- Os campos das linhas usam `snake_case`, iguais às colunas do banco. Toda tabela sincronizada tem `id text`, `user_id`, `atualizado_em`, `excluido_em` e `sincronizado_em`. Linha sincronizada nunca é apagada de verdade: recebe `excluido_em`.
- Timestamps (`atualizado_em`, `feito_em`, `habitos_em`) são texto ISO. Para comparar, usar `Date.parse`, nunca comparação de strings: o Postgres devolve `+00:00` e o front grava `Z`.
- Dinheiro sempre em centavos inteiros.
- Mudanças no banco só por arquivos em `supabase/migrations/`. Toda tabela com RLS.
- Segredos (service role, chave privada VAPID, `CRON_SEGREDO`, senha do banco) nunca vão para o repositório nem para o front. O front só recebe `VITE_SUPABASE_URL`, `VITE_SUPABASE_CHAVE_PUBLICA` e `VITE_VAPID_PUBLICA`, por `.env.local` e pelas variáveis da Vercel.
- Nenhum dado pessoal real em código, testes, README ou prints. Exemplos fictícios.
- Layout pensado primeiro para o celular. No PC, coluna centralizada com `max-width: 560px`. Alvos de toque com no mínimo 44 px, contraste WCAG AA, tema claro e escuro por `prefers-color-scheme`, fonte do sistema e nenhuma fonte ou script de CDN.
- Proibido `innerHTML` e `dangerouslySetInnerHTML`.
- Testes automáticos só para `src/regras/`, `src/dados/` e as funções puras de `src/pwa/`. Telas não têm teste automático: cada task de tela termina com uma verificação manual no navegador, no modo celular (DevTools → Android).
- Todo commit do agente termina com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. A partir da Task 2, todo commit é seguido de `git push`, e a Vercel publica sozinha.
- `.gitignore`: `node_modules/`, `dist/`, `.env*`, `.superpowers/`, `supabase/.temp/`, `supabase/functions/_shared/regras/`.

## Pontos de atenção na revisão

1. **Dia errado por causa do fuso.** A Edge Function roda em UTC: depois das 21h em São Paulo, o "hoje" UTC já é amanhã, e os avisos sairiam no dia errado. Teste de `agoraEmSaoPaulo` na Task 1, e teste de aviso às 22h30 na Task 9.
2. **Abrir sem internet com a sessão vencida.** O app precisa mostrar os últimos dados e aceitar alterações, não a tela de login. Uma alteração recusada pelo banco não pode travar a fila para sempre. Testes do sincronizador e da comparação de datas com formatos diferentes na Task 11; teste em modo avião nas Tasks 12 e 16.
3. **Linha estranha no "+ anotar":** data impossível (`31/02`, `29/02` em ano não bissexto), `dia 31` em mês de 30 dias, maiúsculas e sem acento, só a data, texto vazio. O app nunca inventa data inválida nem quebra. Testes na Task 4.
4. **Escala antes do início do ciclo, troca de escala e dia extra.** Dia anterior ao início (módulo negativo), troca de escala que não pode reescrever o passado, e dia extra numa folga que tem que tirar o treino daquele dia. Testes nas Tasks 3 e 5.
5. **Notificação repetida ou atrasada.** O job roda a cada 15 minutos: o mesmo aviso não pode sair duas vezes, um aviso de ontem não sai hoje, e um item marcado como feito para de avisar. Testes na Task 9.

---

## Estrutura de arquivos

```
vida-pessoal/
├── index.html · package.json · vite.config.ts · tsconfig*.json · .gitignore · .env.local (não versionado)
├── README.md · docs/ (spec, plano, teste-manual.md, prints/)
├── public/                         logo.svg + ícones gerados
├── scripts/copiar-regras.mjs       copia src/regras → supabase/functions/_shared/regras
├── supabase/
│   ├── config.toml
│   ├── migrations/                 20261116000001_tabelas.sql · …02_rls.sql · …03_sincronizacao.sql · …04_cron.sql
│   ├── verificacao/rls.sql         roteiro para colar no SQL Editor
│   └── functions/enviar-notificacoes/index.ts
└── src/
    ├── main.tsx · App.tsx · estilos.css · supabase.ts
    ├── regras/   tipos, datas, dinheiro, escala, anotar, agenda, metas, habitos, semana, notificacoes (+ *.test.ts)
    ├── dados/    banco, fila, mesclar, sincronizador, remoto, persistencia, ids,
    │             opsConfig, opsAgenda, opsHabitos, opsMetas (+ *.test.ts)
    ├── testes/fabrica.ts
    ├── estado/   contexto.tsx, useSessao.ts, useHoje.ts, useOnline.ts
    ├── componentes/  BarraAbas, PainelInferior, Toast, IndicadorSync, EditorCiclo, LinhaDoTempo,
    │                 PainelAnotar, EditarItem, CartaoCheckin, PainelCheckin, MetaDestaque,
    │                 CartoesMetas, GraficoSono, cores.ts, arquivos.ts
    ├── telas/    Entrar, ConfiguracaoInicial, Inicio, Resumo, Metas, DetalheMeta, Ajustes, formularios/FormMeta
    └── pwa/      sw.ts, plataforma.ts (+ teste), push.ts (+ teste), AvisoAtualizacao, ComoInstalar
```

---

### Task 1: Projeto base, Git, tipos e datas

**Arquivos:**
- Criar: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/estilos.css`, `.gitignore`
- Criar: `src/regras/tipos.ts`, `src/regras/datas.ts`, `src/regras/dinheiro.ts`
- Testes: `src/regras/datas.test.ts`, `src/regras/dinheiro.test.ts`

**Interfaces:**
- Produz, em `tipos.ts` (escrever exatamente estes tipos):

```ts
export const NOME_APP = 'Vida Pessoal';
export type Dia = string;            // 'AAAA-MM-DD'
export type TipoDia = 'T' | 'F';
export type TipoItem = 'prova' | 'entrega' | 'compromisso' | 'tarefa';
export type Area = 'pessoal' | 'profissional' | 'academica';
export type Repeticao = 'nenhuma' | 'todo_dia' | 'folgas' | 'trabalho';
export type Prioridade = 'alta' | 'media' | 'baixa';
export type TipoMeta = 'conquista' | 'valor' | 'compra';

export interface Base { id: string; atualizado_em: string; excluido_em: string | null; sincronizado_em?: string }
export interface Config extends Base {      // id sempre 'config'
  aula_dias_semana: number[];               // 0=dom … 6=sáb
  sabado_referencia: Dia | null;            // um sábado com aula; repete a cada 14 dias
  semestre_fim: Dia | null;
  horario_avisos: string;                   // 'HH:MM'
  notificacoes_ligadas: boolean;
  meta_sono_min: number; meta_treinos_semana: number; meta_livros_mes: number;
  treino_item_id: string | null;
  configurado_em: string | null;
}
export interface Escala extends Base { ciclo: string; inicio: Dia; vigente_desde: Dia }  // ciclo ex.: 'TTTFFFTTFF'; inicio = dia 1 do ciclo
export interface Excecao extends Base { inicio: Dia; fim: Dia; tipo_dia: TipoDia | null; sem_aula: boolean }
export interface Item extends Base {
  tipo: TipoItem; titulo: string; data: Dia; hora: string | null; area: Area;
  feito_em: string | null; repeticao: Repeticao; repete_ate: Dia | null;
}
export interface Conclusao extends Base { item_id: string; data: Dia }   // id = `${item_id}:${data}`
export interface RegistroDia extends Base {                               // id = data
  data: Dia; sono_min: number | null;                                     // sono da noite que terminou na manhã de `data`
  habitos_em: string | null; exercicio_min: number | null;                // hábitos vividos em `data`
  comida: 1 | 2 | 3 | null; paginas: number | null; livro_id: string | null;
}
export interface Livro extends Base { titulo: string; terminado_em: Dia | null }
export interface Meta extends Base {
  nome: string; icone: string; cor: string; tipo: TipoMeta; prazo: Dia; prioridade: Prioridade;
  alvo_centavos: number | null; atual_centavos: number | null; concluida_em: Dia | null; observacao: string | null;
}
export interface Etapa extends Base { meta_id: string; texto: string; ordem: number; feita: boolean }

export const TABELAS = ['config', 'escalas', 'excecoes', 'itens', 'conclusoes', 'dias', 'livros', 'metas', 'etapas'] as const;
export type Tabela = typeof TABELAS[number];
export interface Banco {
  config: Config[]; escalas: Escala[]; excecoes: Excecao[]; itens: Item[]; conclusoes: Conclusao[];
  dias: RegistroDia[]; livros: Livro[]; metas: Meta[]; etapas: Etapa[];
}
export type Linha = Banco[Tabela][number];
export function bancoVazio(): Banco   // todas as listas vazias
```

- Produz, em `datas.ts`: `adicionarDias(d: Dia, n: number): Dia` · `diasEntre(de: Dia, ate: Dia): number` · `diaDaSemana(d: Dia): number` (0=dom) · `inicioDaSemana(d: Dia): Dia` (segunda) · `mesDe(d: Dia): string` · `diasDoMes(mes: string): number` · `nomeMes(mes: string): string` · `rotuloDia(d: Dia): string` · `minutosDeHora(h: string): number` · `horaDeMinutos(m: number): string` · `hojeLocal(agora?: Date): Dia` · `agoraEmSaoPaulo(agora: Date): { dia: Dia; minutos: number }`
- Produz, em `dinheiro.ts`: `formatarReais(c: number): string` e `centavosDeDigitos(texto: string): number`

- [ ] **Passo 1: criar o projeto à mão**, sem `npm create vite`, porque ele faz perguntas interativas. Copiar do `../painel-financeiro` o `tsconfig.json`, o `tsconfig.node.json` e o `tsconfig.app.json`, acrescentando `"allowImportingTsExtensions": true` no app (exigido pelas importações com `.ts`).
  - Scripts: `dev`, `build: "tsc -b && vite build"`, `preview` e `test: "vitest run"`.
  - Dependências:

```bash
npm install react react-dom @supabase/supabase-js idb-keyval recharts
npm install -D vite @vitejs/plugin-react typescript vitest @types/react @types/react-dom supabase
```

  - `vite.config.ts`: plugin react e `test: { environment: 'node' }`. O PWA entra na Task 16.
  - `App.tsx`: mostra "Vida Pessoal — em construção".
  - `estilos.css`: variáveis de cor para o tema claro e para o escuro, fonte do sistema, `max-width: 560px`.
  - `.gitignore`: como nas Restrições globais.
- [ ] **Passo 2: escrever os testes que devem falhar.**

```ts
// datas.test.ts
it('soma e conta dias atravessando o ano', () => {
  expect(adicionarDias('2026-12-30', 3)).toBe('2027-01-02');
  expect(adicionarDias('2026-11-16', -3)).toBe('2026-11-13');
  expect(diasEntre('2026-11-16', '2026-12-31')).toBe(45);
});
it('semana começa na segunda', () => {
  expect(diaDaSemana('2026-11-16')).toBe(1);
  expect(inicioDaSemana('2026-11-22')).toBe('2026-11-16');
  expect(inicioDaSemana('2026-11-16')).toBe('2026-11-16');
});
it('mês e rótulos', () => {
  expect(mesDe('2026-11-16')).toBe('2026-11');
  expect(diasDoMes('2026-11')).toBe(30);
  expect(diasDoMes('2028-02')).toBe(29);
  expect(nomeMes('2026-11')).toBe('novembro');
  expect(rotuloDia('2026-11-16')).toBe('Seg 16/11');
});
it('horas em minutos', () => {
  expect(minutosDeHora('08:00')).toBe(480);
  expect(horaDeMinutos(780)).toBe('13:00');
});
it('hoje usa a data local, não UTC', () => {
  expect(hojeLocal(new Date(2026, 10, 30, 22, 30))).toBe('2026-11-30');
});
it('agora em São Paulo a partir de um instante UTC', () => {
  expect(agoraEmSaoPaulo(new Date('2026-11-17T01:30:00Z'))).toEqual({ dia: '2026-11-16', minutos: 1350 });
  expect(agoraEmSaoPaulo(new Date('2026-11-16T11:00:00Z'))).toEqual({ dia: '2026-11-16', minutos: 480 });
});

// dinheiro.test.ts
it('formata reais', () => {
  expect(formatarReais(123456)).toBe('R$ 1.234,56');
  expect(formatarReais(0)).toBe('R$ 0,00');
});
it('centavos só dos dígitos, até 12', () => {
  expect(centavosDeDigitos('R$ 1.234,56')).toBe(123456);
  expect(centavosDeDigitos('')).toBe(0);
  expect(centavosDeDigitos('1234567890123')).toBe(123456789012);
});
```

- [ ] **Passo 3: rodar e ver falhar.** `npm test` → FAIL (módulos não existem).
- [ ] **Passo 4: implementar.**
  - Datas: contas com `Date.UTC`, como no `../painel-financeiro/src/regras/datas.ts` (pode copiar o que servir).
  - `agoraEmSaoPaulo`: `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts`.
  - `dinheiro.ts`: copiar do Painel Financeiro.
  - `rotuloDia`: dias abreviados `Dom Seg Ter Qua Qui Sex Sáb`.
- [ ] **Passo 5: verificar.** `npm test` → PASS. `npm run build` → sem erros.
- [ ] **Passo 6: Git e commit.** `git init -b main`. Conferir que `git config user.email` é o e-mail noreply do GitHub. Commit com a spec, o plano e o projeto: `git add -A && git commit -m "feat: projeto base, tipos e datas"`.

---

### Task 2: Publicar o esqueleto no GitHub e na Vercel

**Arquivos:** Criar `README.md` (só `# Vida Pessoal` e "em construção").

- [ ] **Passo 1 (👤 Gabriel): criar o repositório** `vida-pessoal` no GitHub, sem README e sem licença. Público (vira portfólio; nenhum dado pessoal vai para o repositório) ou privado: decisão dele.
- [ ] **Passo 2: ligar e enviar.** `git remote add origin https://github.com/<usuario>/vida-pessoal.git` e `git push -u origin main`. Verificar: os arquivos aparecem no GitHub.
- [ ] **Passo 3 (👤 Gabriel): importar na Vercel**, igual ao Painel Financeiro (Framework Vite, `npm run build`, saída `dist`). Verificar: o link `*.vercel.app` mostra "em construção".
- [ ] **Passo 4: testar o deploy automático.** Criar o README, `git commit -m "docs: README inicial"` e `git push`. Verificar: aparece um deploy "Ready" na Vercel.

---

### Task 3: Escala de trabalho e faculdade (§4.1)

**Arquivos:**
- Criar: `src/regras/escala.ts`, `src/testes/fabrica.ts`
- Teste: `src/regras/escala.test.ts`

**Interfaces:**
- Consome: `tipos.ts` e `datas.ts` (Task 1).
- Produz, em `escala.ts`:
  - `PRESETS: { nome: string; ciclo: string }[]`, exatamente: `6x1 'TTTTTTF'`, `5x2 'TTTTTFF'`, `4x3 'TTTTFFF'`, `12x36 'TF'`, `3x2 alternado 'TTTFFFTTFF'`
  - `inicioPelaPosicao(hoje: Dia, posicao: number): Dia` (posição de hoje no ciclo, começando em 0)
  - `posicaoNoCiclo(dia: Dia, escala: Escala): number`
  - `escalaVigente(dia: Dia, escalas: Escala[]): Escala | null`: a de maior `vigente_desde <= dia`; empate → maior `atualizado_em`. Dia anterior a todas → a mais antiga.
  - `tipoDoDia(dia: Dia, escalas: Escala[], excecoes: Excecao[]): TipoDia`: uma exceção com `tipo_dia` que cubra o dia vence (se houver várias, a de maior `atualizado_em`); senão vale o ciclo; sem escala → `'F'`.
  - `tipoDoCiclo(dia: Dia, escalas: Escala[]): TipoDia`: o mesmo, ignorando exceções.
  - `temAula(dia: Dia, config: Config, excecoes: Excecao[]): boolean`
- Produz, em `fabrica.ts` (só os testes importam): `HOJE = '2026-11-16'` (uma segunda-feira), `AGORA = '2026-11-16T12:00:00.000Z'`, `ids(): () => string` (gerador `'n1'`, `'n2'`…) e construtores `config(p?)`, `escala(p?)`, `excecao(p?)`, `item(p?)`, `conclusao(itemId, data, p?)`, `dia(data, p?)`, `livro(p?)`, `meta(p?)`, `etapa(metaId, p?)`, `banco(p?)`. Padrões:
  - Base: `id` sequencial `id-N`, `atualizado_em: AGORA`, `excluido_em: null`.
  - `config`: `id 'config'`, aula `[1,2,3,4,5]`, sem sábado e sem fim de semestre, `'08:00'`, notificações ligadas, `420 / 3 / 1`, `treino_item_id null`, `configurado_em: AGORA`.
  - `escala`: `'TTTFFFTTFF'`, `inicio` e `vigente_desde` `'2026-11-13'`.
  - `excecao`: `HOJE..HOJE`, `tipo_dia null`, `sem_aula false`.
  - `item`: tarefa `'Tarefa'` em `HOJE`, sem hora, área pessoal, `repeticao 'nenhuma'`.
  - `dia(data)`: `id = data`, todo o resto `null`.
  - `meta`: `'Meta'`, `'🎯'`, `'#7b5cff'`, conquista, prazo `'2026-12-31'`, prioridade alta, sem valores.
  - `etapa`: `'Etapa'`, ordem 0, não feita.
  - `banco(p)` = `{ ...bancoVazio(), config: [config()], escalas: [escala()], ...p }`.

- [ ] **Passo 1: escrever os testes que devem falhar.**

```ts
const E = [escala()];
it('ciclo 3x2 alternado a partir de 13/11', () => {
  const dias = ['2026-11-13', '2026-11-15', '2026-11-16', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23'];
  expect(dias.map((d) => tipoDoDia(d, E, []))).toEqual(['T', 'T', 'F', 'F', 'T', 'T', 'F', 'F', 'T']);
});
it('dias antes do início voltam no ciclo', () => {
  expect(tipoDoDia('2026-11-12', E, [])).toBe('F');
  expect(tipoDoDia('2026-11-04', E, [])).toBe('T');
});
it('exceção vence o ciclo (dia extra e férias)', () => {
  expect(tipoDoDia('2026-11-16', E, [excecao({ tipo_dia: 'T' })])).toBe('T');
  const ferias = [excecao({ inicio: '2026-11-19', fim: '2026-11-20', tipo_dia: 'F' })];
  expect(tipoDoDia('2026-11-19', E, ferias)).toBe('F');
  expect(tipoDoDia('2026-11-23', E, ferias)).toBe('T');
  expect(tipoDoDia('2026-11-16', E, [excecao({ sem_aula: true })])).toBe('F');
  expect(tipoDoCiclo('2026-11-16', E)).toBe('F');
});
it('troca de escala vale só daquele dia em diante', () => {
  const duas = [...E, escala({ ciclo: 'TTTTTFF', inicio: '2026-11-23', vigente_desde: '2026-11-23' })];
  expect(tipoDoDia('2026-11-22', duas, [])).toBe('F');
  expect(tipoDoDia('2026-11-23', duas, [])).toBe('T');
  expect(tipoDoDia('2026-11-28', duas, [])).toBe('F');
});
it('duas escalas no mesmo dia: vale a última alterada', () => {
  const a = escala({ ciclo: 'TF', vigente_desde: '2026-11-16', inicio: '2026-11-16', atualizado_em: '2026-11-16T10:00:00.000Z' });
  const b = escala({ ciclo: 'FT', vigente_desde: '2026-11-16', inicio: '2026-11-16', atualizado_em: '2026-11-16T11:00:00+00:00' });
  expect(escalaVigente('2026-11-16', [b, a])?.ciclo).toBe('FT');
});
it('sem escala é folga', () => expect(tipoDoDia('2026-11-16', [], [])).toBe('F'));
it('posição e início', () => {
  expect(inicioPelaPosicao('2026-11-16', 3)).toBe('2026-11-13');
  expect(posicaoNoCiclo('2026-11-16', E[0])).toBe(3);
});
it('faculdade: dias da semana, sábados alternados, fim do semestre e sem aula', () => {
  const c = config({ sabado_referencia: '2026-11-21', semestre_fim: '2026-12-10' });
  expect(temAula('2026-11-16', c, [])).toBe(true);
  expect(temAula('2026-11-22', c, [])).toBe(false);
  expect(temAula('2026-11-21', c, [])).toBe(true);
  expect(temAula('2026-11-28', c, [])).toBe(false);
  expect(temAula('2026-12-05', c, [])).toBe(true);
  expect(temAula('2026-11-07', c, [])).toBe(true);
  expect(temAula('2026-12-11', c, [])).toBe(false);
  expect(temAula('2026-11-17', c, [excecao({ inicio: '2026-11-17', fim: '2026-11-18', sem_aula: true })])).toBe(false);
  expect(temAula('2026-11-21', config(), [])).toBe(false);
});
```

- [ ] **Passo 2: rodar e ver falhar.** `npm test` → FAIL.
- [ ] **Passo 3: implementar `escala.ts` e `fabrica.ts`.** Usar módulo positivo, `((n % m) + m) % m`, tanto no ciclo quanto nos 14 dias do sábado.
- [ ] **Passo 4: verificar.** `npm test` → PASS.
- [ ] **Passo 5: commit e push.** `feat: regras de escala e faculdade`

---

### Task 4: Leitura da linha do "+ anotar" (§4.2)

**Arquivos:** Criar `src/regras/anotar.ts`. Teste: `src/regras/anotar.test.ts`.

**Interfaces:**
- Produz: `interface Previa { titulo: string; tipo: TipoItem; data: Dia; hora: string | null; area: Area }` e `lerLinha(texto: string, hoje: Dia): Previa`.
- Regras (§4.2):
  - Tokens separados por espaço. A comparação ignora maiúsculas e acentos; o título mantém a grafia original.
  - Data: `dd/mm`, `dd/mm/aa`, `dd/mm/aaaa`, `dia N`, `hoje`, `amanhã`, `depois de amanhã` e dias da semana (`dom domingo seg segunda segunda-feira ter terça qua quarta qui quinta sex sexta sab sáb sábado`, com ou sem `-feira`). Dia da semana = a próxima ocorrência, contando hoje.
  - `dia N`: este mês, se N ≥ hoje; senão o próximo mês que tenha o dia N.
  - Data impossível → não é data: o texto fica no título e a data vira hoje.
  - Hora: `14h`, `14h30`, `14:30`, com `às`/`as` opcional antes. Hora acima de 23 ou minuto acima de 59 → não é hora.
  - Tipo, pela primeira palavra-chave encontrada, nesta prioridade: prova (`prova avaliação p1 p2 p3`) > entrega (`entrega entregar atividade relatório lista seminário`) > compromisso (`consulta médico dentista reunião encontro`) > tarefa.
  - Área: prova e entrega → `academica`; o resto → `pessoal`.
  - Título: os tokens que sobram (sem data, hora, `às` e `dia`), com espaços simples e a primeira letra maiúscula.

- [ ] **Passo 1: escrever os testes que devem falhar.**

```ts
const H = '2026-11-16'; // segunda
const p = (t: string) => lerLinha(t, H);
it('exemplos da spec', () => {
  expect(p('prova química 20/11')).toEqual({ titulo: 'Prova química', tipo: 'prova', data: '2026-11-20', hora: null, area: 'academica' });
  expect(p('entrega relatório sexta')).toEqual({ titulo: 'Entrega relatório', tipo: 'entrega', data: '2026-11-20', hora: null, area: 'academica' });
  expect(p('dentista amanhã 14h')).toEqual({ titulo: 'Dentista', tipo: 'compromisso', data: '2026-11-17', hora: '14:00', area: 'pessoal' });
  expect(p('estudar cálculo')).toEqual({ titulo: 'Estudar cálculo', tipo: 'tarefa', data: H, hora: null, area: 'pessoal' });
});
it('formatos de data', () => {
  expect(p('reunião dia 28 às 9:30')).toMatchObject({ titulo: 'Reunião', data: '2026-11-28', hora: '09:30' });
  expect(p('p2 física 05/01').data).toBe('2027-01-05');
  expect(p('aniversário 16/11').data).toBe('2026-11-16');
  expect(p('vencimento 15/11').data).toBe('2027-11-15');
  expect(p('x 20/11/27').data).toBe('2027-11-20');
  expect(p('x 20/11/2027').data).toBe('2027-11-20');
  expect(p('x depois de amanhã').data).toBe('2026-11-18');
  expect(p('x dia 10').data).toBe('2026-12-10');
  expect(p('x dia 31').data).toBe('2026-12-31');
  expect(p('academia seg').data).toBe('2026-11-16');
  expect(p('PROVA Química SÁBADO')).toMatchObject({ tipo: 'prova', data: '2026-11-21', titulo: 'PROVA Química' });
  expect(p('feira sabado').data).toBe('2026-11-21');
  expect(p('x quarta-feira').data).toBe('2026-11-18');
});
it('horas', () => {
  expect(p('x 14h30').hora).toBe('14:30');
  expect(p('x às 9h').hora).toBe('09:00');
  expect(p('x 25h')).toMatchObject({ hora: null, titulo: 'X 25h' });
});
it('datas impossíveis não viram data', () => {
  expect(p('prova 31/02')).toMatchObject({ data: H, titulo: 'Prova 31/02' });
  expect(p('prova 29/02')).toMatchObject({ data: H, titulo: 'Prova 29/02' });
});
it('"trabalho" não é palavra-chave (é ambíguo)', () => expect(p('trabalho de física').tipo).toBe('tarefa'));
it('linha vazia ou só com data', () => {
  expect(p('   ').titulo).toBe('');
  expect(p(' amanhã ')).toMatchObject({ titulo: '', data: '2026-11-17' });
});
```

- [ ] **Passo 2: rodar e ver falhar.**
- [ ] **Passo 3: implementar `lerLinha`.** Validar a data montando-a com `Date.UTC` e conferindo se dia e mês continuam iguais.
- [ ] **Passo 4: verificar.** `npm test` → PASS.
- [ ] **Passo 5: commit e push.** `feat: leitura da linha do anotar`

---

### Task 5: Agenda: ocorrências, linha do tempo e pendentes (§4.3)

**Arquivos:** Criar `src/regras/agenda.ts`. Teste: `src/regras/agenda.test.ts`.

**Interfaces:**
- Consome: `tipoDoDia`, `tipoDoCiclo`, `temAula` (Task 3).
- Produz:
  - `chaveConclusao(itemId: string, dia: Dia): string` → `${itemId}:${dia}`
  - `ocorreEm(item: Item, dia: Dia, tipoDia: TipoDia): boolean`: avulsa → `data === dia`; repetida → `dia >= data`, `repete_ate` nulo ou `dia <= repete_ate`, e a regra (`todo_dia`, `folgas` = F, `trabalho` = T).
  - `interface Ocorrencia { item: Item; dia: Dia; feito: boolean }`
  - `ocorrenciasDoDia(dia: Dia, banco: Banco): Ocorrencia[]`: ordena com não-tarefas primeiro, depois por hora (sem hora por último), depois por título. `feito`: avulsa → `feito_em !== null`; repetida → existe a conclusão `chaveConclusao`.
  - `interface DiaDaLinha { dia: Dia; tipo: TipoDia; extra: boolean; aula: boolean; ocorrencias: Ocorrencia[] }`. `extra` = o ciclo diz F e o dia é T.
  - `linhaDoTempo(hoje: Dia, quantos: number, banco: Banco): DiaDaLinha[]`
  - `pendentes(hoje: Dia, itens: Item[]): Item[]`: tarefas avulsas com `data < hoje` e não feitas, por data.
  - `proximaFolga(depoisDe: Dia, banco: Banco): Dia`: o primeiro dia F depois de `depoisDe`, procurando até 60 dias; se não achar, `depoisDe + 1`.

- [ ] **Passo 1: escrever os testes que devem falhar.**

```ts
const treino = item({ id: 't', titulo: 'Treino', data: '2026-11-13', repeticao: 'folgas' });
it('repetida nas folgas respeita início, fim e dia extra', () => {
  const b = banco({ itens: [treino] });
  expect(ocorrenciasDoDia('2026-11-16', b).map((o) => o.item.id)).toEqual(['t']);
  expect(ocorrenciasDoDia('2026-11-19', b)).toEqual([]);
  expect(ocorrenciasDoDia('2026-11-12', b)).toEqual([]);
  expect(ocorrenciasDoDia('2026-11-16', banco({ itens: [treino], excecoes: [excecao({ tipo_dia: 'T' })] }))).toEqual([]);
  expect(ocorrenciasDoDia('2026-11-22', banco({ itens: [{ ...treino, repete_ate: '2026-11-21' }] }))).toEqual([]);
});
it('feito: conclusão por dia na repetida, feito_em na avulsa', () => {
  const b = banco({ itens: [treino, item({ id: 'a', feito_em: AGORA })], conclusoes: [conclusao('t', '2026-11-16')] });
  expect(ocorrenciasDoDia('2026-11-16', b).map((o) => o.feito)).toEqual([true, true]);
  expect(ocorrenciasDoDia('2026-11-17', b).map((o) => o.feito)).toEqual([false]);
});
it('ordem: avisos por hora, depois tarefas', () => {
  const b = banco({ itens: [
    item({ id: 'tar', titulo: 'Estudar' }), item({ id: 'c14', tipo: 'compromisso', hora: '14:00' }),
    item({ id: 'pr', tipo: 'prova' }), item({ id: 'c09', tipo: 'compromisso', hora: '09:00' }),
  ] });
  expect(ocorrenciasDoDia(HOJE, b).map((o) => o.item.id)).toEqual(['c09', 'c14', 'pr', 'tar']);
});
it('linha do tempo marca tipo, aula e dia extra', () => {
  const l = linhaDoTempo(HOJE, 3, banco({ excecoes: [excecao({ tipo_dia: 'T' })] }));
  expect(l.map((d) => [d.dia, d.tipo, d.extra, d.aula])).toEqual([
    ['2026-11-16', 'T', true, true], ['2026-11-17', 'F', false, true], ['2026-11-18', 'F', false, true],
  ]);
});
it('pendentes: só tarefas avulsas de dias anteriores e não feitas', () => {
  const itens = [
    item({ id: 'p', data: '2026-11-14' }), item({ id: 'f', data: '2026-11-13', feito_em: AGORA }),
    item({ id: 'pr', tipo: 'prova', data: '2026-11-14' }), { ...treino }, item({ id: 'h' }),
    item({ id: 'p0', data: '2026-11-10' }),
  ];
  expect(pendentes(HOJE, itens).map((i) => i.id)).toEqual(['p0', 'p']);
});
it('próxima folga', () => {
  expect(proximaFolga('2026-11-16', banco())).toBe('2026-11-17');
  expect(proximaFolga('2026-11-18', banco())).toBe('2026-11-21');
});
```

- [ ] **Passo 2: rodar e ver falhar.**
- [ ] **Passo 3: implementar `agenda.ts`.**
- [ ] **Passo 4: verificar.** `npm test` → PASS.
- [ ] **Passo 5: commit e push.** `feat: regras da agenda e da linha do tempo`

---

### Task 6: Regras das metas (§4.7 e §4.3 itens 1 e 2)

**Arquivos:** Criar `src/regras/metas.ts`. Teste: `src/regras/metas.test.ts`.

**Interfaces:**
- Produz:
  - `progresso(meta: Meta, etapas: Etapa[]): number`, de 0 a 1. Conquista sem etapas → 1 se concluída, senão 0. Conquista com etapas → feitas ÷ total (só as etapas dessa meta). Valor e compra → `min(1, atual/alvo)`, e 0 se o alvo for nulo ou 0.
  - `diasAtePrazo(meta: Meta, hoje: Dia): number` (negativo = atrasada)
  - `metasDoInicio(metas: Meta[], hoje: Dia): { destaque: Meta | null; cartoes: Meta[] }`: só alta e não concluída, por prazo crescente, empate pelo nome.
  - `sugerirConcluir(meta: Meta, etapas: Etapa[]): boolean`: não concluída, progresso 1 e (não é conquista ou tem etapas).
  - `agruparMetas(metas: Meta[]): { alta: Meta[]; media: Meta[]; baixa: Meta[]; concluidas: Meta[] }`. Cada grupo por prazo; concluídas pela `concluida_em` mais recente primeiro.

- [ ] **Passo 1: escrever os testes que devem falhar.**

```ts
it('progresso por tipo', () => {
  const m = meta({ id: 'm' });
  expect(progresso(m, [])).toBe(0);
  expect(progresso({ ...m, concluida_em: HOJE }, [])).toBe(1);
  expect(progresso(m, [etapa('m', { feita: true }), etapa('m'), etapa('m'), etapa('outra', { feita: true })])).toBeCloseTo(1 / 3);
  expect(progresso(meta({ tipo: 'valor', alvo_centavos: 600000, atual_centavos: 120000 }), [])).toBe(0.2);
  expect(progresso(meta({ tipo: 'compra', alvo_centavos: 100, atual_centavos: 150 }), [])).toBe(1);
  expect(progresso(meta({ tipo: 'valor', alvo_centavos: 0, atual_centavos: 50 }), [])).toBe(0);
});
it('prazo', () => {
  expect(diasAtePrazo(meta({ prazo: '2026-12-31' }), HOJE)).toBe(45);
  expect(diasAtePrazo(meta({ prazo: '2026-11-10' }), HOJE)).toBe(-6);
});
it('início: destaque é a alta mais urgente; empate pelo nome', () => {
  const v = meta({ nome: 'Vender um projeto', prazo: '2026-12-31' });
  const r = meta({ nome: 'Reserva', prazo: '2026-12-31', tipo: 'valor' });
  const n = meta({ nome: 'Notebook', prazo: '2027-03-01', tipo: 'compra' });
  const media = meta({ prioridade: 'media', prazo: '2026-11-20' });
  const feita = meta({ prazo: '2026-11-17', concluida_em: HOJE });
  const r1 = metasDoInicio([n, media, v, feita, r], HOJE);
  expect(r1.destaque?.nome).toBe('Reserva');
  expect(r1.cartoes.map((x) => x.nome)).toEqual(['Vender um projeto', 'Notebook']);
  expect(metasDoInicio([media], HOJE)).toEqual({ destaque: null, cartoes: [] });
});
it('sugere concluir só quando faz sentido', () => {
  expect(sugerirConcluir(meta({ tipo: 'valor', alvo_centavos: 10, atual_centavos: 10 }), [])).toBe(true);
  expect(sugerirConcluir(meta({ id: 'c' }), [etapa('c', { feita: true })])).toBe(true);
  expect(sugerirConcluir(meta(), [])).toBe(false);
});
```

- [ ] **Passo 2: rodar e ver falhar.** · [ ] **Passo 3: implementar.** · [ ] **Passo 4: `npm test` → PASS.**
- [ ] **Passo 5: commit e push.** `feat: regras das metas`

---

### Task 7: Resumo do mês dos hábitos (§4.5 e §4.6)

**Arquivos:** Criar `src/regras/habitos.ts`. Teste: `src/regras/habitos.test.ts`.

**Interfaces:**
- Produz `resumoDoMes(mes: string, banco: Banco, hoje: Dia): ResumoMes`:

```ts
interface ResumoMes {
  diasConsiderados: number;   // dias do mês até ontem (mês atual) ou o mês inteiro (meses passados)
  semRegistro: number;        // dias considerados sem habitos_em
  sono: { mediaMin: number | null; antesTrabalhoMin: number | null; antesFolgaMin: number | null; metaMin: number;
          noites: { dia: Dia; minutos: number; tipo: TipoDia }[] };   // noites com sono, data ≤ hoje, em ordem
  exercicio: { dias: number; metaDias: number; minutos: number; diasTrabalho: number; diasFolga: number };
  comida: { pctBem: number | null; diasRuim: number };
  leitura: { paginas: number; livrosTerminados: number; meta: number };
}
```

- Definições:
  - Os hábitos (exercício, comida, leitura) só contam dias considerados com `habitos_em`.
  - "Antes de trabalho / antes de folga" é o `tipoDoDia` da `data` da noite, que é o dia em que ele acordou.
  - `metaDias = round(meta_treinos_semana × diasDoMes / 7)`.
  - `pctBem` = dias com comida 3 ÷ dias com comida registrada.
  - Médias arredondadas para o minuto inteiro.

- [ ] **Passo 1: escrever os testes que devem falhar.**

```ts
const b = banco({
  dias: [
    dia('2026-11-16', { sono_min: 480, habitos_em: AGORA, exercicio_min: 30, comida: 3, paginas: 10 }),
    dia('2026-11-17', { sono_min: 450, habitos_em: AGORA, exercicio_min: 0, comida: 2, paginas: 0 }),
    dia('2026-11-19', { sono_min: 360, habitos_em: AGORA, exercicio_min: 45, comida: 3, paginas: 20 }),
    dia('2026-11-20', { sono_min: 330 }),
  ],
  livros: [livro({ terminado_em: '2026-11-18' }), livro({ terminado_em: '2026-10-30' })],
});
it('novembro até 20/11', () => {
  const r = resumoDoMes('2026-11', b, '2026-11-20');
  expect(r.diasConsiderados).toBe(19);
  expect(r.semRegistro).toBe(16);
  expect(r.sono).toMatchObject({ mediaMin: 405, antesTrabalhoMin: 345, antesFolgaMin: 465, metaMin: 420 });
  expect(r.sono.noites.map((n) => n.tipo)).toEqual(['F', 'F', 'T', 'T']);
  expect(r.exercicio).toEqual({ dias: 2, metaDias: 13, minutos: 75, diasTrabalho: 1, diasFolga: 1 });
  expect(r.comida.pctBem).toBeCloseTo(2 / 3);
  expect(r.comida.diasRuim).toBe(0);
  expect(r.leitura).toEqual({ paginas: 30, livrosTerminados: 1, meta: 1 });
});
it('mês passado conta o mês inteiro; mês sem dados não quebra', () => {
  const r = resumoDoMes('2026-10', b, '2026-11-20');
  expect(r.diasConsiderados).toBe(31);
  expect(r.sono.mediaMin).toBeNull();
  expect(r.comida.pctBem).toBeNull();
  expect(r.leitura.livrosTerminados).toBe(1);
});
```

- [ ] **Passo 2: rodar e ver falhar.** · [ ] **Passo 3: implementar.** · [ ] **Passo 4: `npm test` → PASS.**
- [ ] **Passo 5: commit e push.** `feat: resumo do mês dos hábitos`

---

### Task 8: Resumo da semana (§4.6)

**Arquivos:** Criar `src/regras/semana.ts`. Teste: `src/regras/semana.test.ts`.

**Interfaces:**
- Consome: `ocorrenciasDoDia` (Task 5).
- Produz:
  - `resumoDaSemana(segunda: Dia, ate: Dia, banco: Banco): ResumoSemana`, que considera os dias de `segunda` até `min(ate, domingo)`:

```ts
interface ResumoSemana {
  segunda: Dia; domingo: Dia; total: number; feitos: number;
  porArea: Record<Area, { total: number; feitos: number }>;
  naoFeitos: Ocorrencia[];
  sonoMediaMin: number | null; treinos: number; diasBem: number; paginas: number;
}
```

  - `cartaoSemanaVisivel(hoje: Dia, dispensadaPara: Dia | null): boolean`: é segunda e `dispensadaPara !== adicionarDias(hoje, -7)`.

- [ ] **Passo 1: escrever os testes que devem falhar.**

```ts
const b = banco({
  itens: [
    item({ id: 't', titulo: 'Treino', data: '2026-11-13', repeticao: 'folgas' }),
    item({ id: 'pr', tipo: 'prova', area: 'academica', data: '2026-11-20', feito_em: AGORA }),
    item({ id: 'es', titulo: 'Estudar', area: 'academica', data: '2026-11-18' }),
    item({ id: 'co', tipo: 'compromisso', area: 'profissional', data: '2026-11-19' }),
  ],
  conclusoes: [conclusao('t', '2026-11-16'), conclusao('t', '2026-11-21')],
  dias: [
    dia('2026-11-16', { sono_min: 480, habitos_em: AGORA, exercicio_min: 30, comida: 3, paginas: 10 }),
    dia('2026-11-17', { sono_min: 450, habitos_em: AGORA, exercicio_min: 0, comida: 2, paginas: 0 }),
  ],
});
it('semana inteira', () => {
  const r = resumoDaSemana('2026-11-16', '2026-11-22', b);
  expect([r.total, r.feitos, r.domingo]).toEqual([8, 3, '2026-11-22']);
  expect(r.porArea).toEqual({ pessoal: { total: 5, feitos: 2 }, academica: { total: 2, feitos: 1 }, profissional: { total: 1, feitos: 0 } });
  expect(r.naoFeitos).toHaveLength(5);
  expect([r.sonoMediaMin, r.treinos, r.diasBem, r.paginas]).toEqual([465, 1, 1, 10]);
});
it('semana em andamento conta só até hoje', () => {
  const r = resumoDaSemana('2026-11-16', '2026-11-17', b);
  expect([r.total, r.feitos]).toEqual([2, 1]);
});
it('cartão da semana passada só na segunda e até dispensar', () => {
  expect(cartaoSemanaVisivel('2026-11-16', null)).toBe(true);
  expect(cartaoSemanaVisivel('2026-11-16', '2026-11-09')).toBe(false);
  expect(cartaoSemanaVisivel('2026-11-17', null)).toBe(false);
});
```

- [ ] **Passo 2: rodar e ver falhar.** · [ ] **Passo 3: implementar.** · [ ] **Passo 4: `npm test` → PASS.**
- [ ] **Passo 5: commit e push.** `feat: resumo da semana`

---

### Task 9: Notificações devidas (§4.4)

**Arquivos:** Criar `src/regras/notificacoes.ts`. Teste: `src/regras/notificacoes.test.ts`.

**Interfaces:**
- Produz:
  - `interface Aviso { chave: string; texto: string; abrir: 'inicio' | 'checkin' | 'metas'; diasRestantes: number }`
  - `avisosDevidos(agora: { dia: Dia; minutos: number }, banco: Banco, enviadas: Set<string>): Aviso[]`
  - `montarNotificacao(avisos: Aviso[]): { titulo: string; corpo: string; url: string } | null`
- Regras (§4.4). `H = minutosDeHora(config.horario_avisos)`. Um aviso é devido quando o dia dele **é** `agora.dia`, o minuto dele é ≤ `agora.minutos` e a chave não está em `enviadas`. Notificações desligadas → `[]`.

| Origem | Dias antes (n) e minuto | Chave | Texto |
|---|---|---|---|
| Registro diário: `dias[ontem]` sem `habitos_em` | hoje, H | `checkin:${dia}` | `Como foi ontem? Registre em 10 segundos.` |
| Prova não feita | 7, 3, 1, 0 · H | `item:${id}:${n}d` | n=0 `Hoje: ${titulo}` · n=1 `${titulo} amanhã` · n>1 `${titulo} em ${n} dias` |
| Entrega não feita | 3, 1, 0 · H | idem | idem |
| Compromisso sem hora | 1, 0 · H | idem | idem |
| Compromisso com hora | 1 · H, e no dia à `hora − 60 min` (mínimo 0) | `item:${id}:1d` e `item:${id}:1h` | 1d como acima · 1h `${titulo} às ${hora}` |
| Meta alta não concluída | 30, 7 · H | `meta:${id}:${n}d` | `Meta "${nome}": faltam ${n} dias` |

  - Ordem: check-in primeiro, depois `diasRestantes` crescente, depois a chave.
  - `abrir`: check-in → `'checkin'`; meta → `'metas'`; o resto → `'inicio'`.
  - `montarNotificacao`:
    - lista vazia → `null`;
    - `titulo = NOME_APP`;
    - `corpo` = textos unidos por `' · '`;
    - `url` = `'/?abrir=checkin'` se todos forem check-in, `'/?aba=metas'` se todos forem metas, senão `'/'`.

- [ ] **Passo 1: escrever os testes que devem falhar.**

```ts
const base = () => banco({
  itens: [
    item({ id: 'p1', tipo: 'prova', titulo: 'Prova química', data: '2026-11-20' }),
    item({ id: 'e1', tipo: 'entrega', titulo: 'Entrega relatório', data: '2026-11-17' }),
    item({ id: 'c1', tipo: 'compromisso', titulo: 'Dentista', data: '2026-11-16', hora: '14:00' }),
    item({ id: 't1', titulo: 'Estudar' }),
  ],
  metas: [meta({ id: 'm1', nome: 'Vender um projeto', prazo: '2026-12-16' })],
});
const chaves = (a: Aviso[]) => a.map((x) => [x.chave, x.texto]);
it('às 08:00 de 16/11', () => {
  expect(chaves(avisosDevidos({ dia: '2026-11-16', minutos: 480 }, base(), new Set()))).toEqual([
    ['checkin:2026-11-16', 'Como foi ontem? Registre em 10 segundos.'],
    ['item:e1:1d', 'Entrega relatório amanhã'],
    ['meta:m1:30d', 'Meta "Vender um projeto": faltam 30 dias'],
  ]);
});
it('não repete o que já foi enviado e respeita o horário', () => {
  const env = new Set(['checkin:2026-11-16', 'item:e1:1d', 'meta:m1:30d']);
  expect(chaves(avisosDevidos({ dia: '2026-11-16', minutos: 780 }, base(), env))).toEqual([['item:c1:1h', 'Dentista às 14:00']]);
  expect(avisosDevidos({ dia: '2026-11-16', minutos: 479 }, base(), new Set())).toEqual([]);
});
it('aviso de ontem não sai hoje; feito para de avisar', () => {
  const b = base();
  b.dias = [dia('2026-11-16', { habitos_em: AGORA })];
  expect(chaves(avisosDevidos({ dia: '2026-11-17', minutos: 480 }, b, new Set()))).toEqual([
    ['item:e1:0d', 'Hoje: Entrega relatório'],
    ['item:p1:3d', 'Prova química em 3 dias'],
  ]);
  b.itens = b.itens.map((i) => (i.id === 'e1' ? { ...i, feito_em: AGORA } : i));
  expect(chaves(avisosDevidos({ dia: '2026-11-17', minutos: 480 }, b, new Set()))).toEqual([['item:p1:3d', 'Prova química em 3 dias']]);
});
it('22h30 em São Paulo ainda é o mesmo dia', () => {
  const b = banco({ itens: [item({ id: 'c2', tipo: 'compromisso', titulo: 'Plantão', data: '2026-11-16', hora: '23:30' })], dias: [dia('2026-11-15', { habitos_em: AGORA })] });
  expect(chaves(avisosDevidos({ dia: '2026-11-16', minutos: 1350 }, b, new Set()))).toEqual([['item:c2:1h', 'Plantão às 23:30']]);
});
it('compromisso à 00:30 avisa à meia-noite; desligado não avisa', () => {
  const b = banco({ itens: [item({ id: 'c3', tipo: 'compromisso', titulo: 'X', data: '2026-11-16', hora: '00:30' })], dias: [dia('2026-11-15', { habitos_em: AGORA })] });
  expect(chaves(avisosDevidos({ dia: '2026-11-16', minutos: 0 }, b, new Set()))).toEqual([['item:c3:1h', 'X às 00:30']]);
  b.config = [config({ notificacoes_ligadas: false })];
  expect(avisosDevidos({ dia: '2026-11-16', minutos: 900 }, b, new Set())).toEqual([]);
});
it('monta a notificação', () => {
  const a = avisosDevidos({ dia: '2026-11-16', minutos: 480 }, base(), new Set());
  expect(montarNotificacao([])).toBeNull();
  expect(montarNotificacao([a[0]])).toEqual({ titulo: 'Vida Pessoal', corpo: 'Como foi ontem? Registre em 10 segundos.', url: '/?abrir=checkin' });
  expect(montarNotificacao([a[2]])?.url).toBe('/?aba=metas');
  expect(montarNotificacao(a)?.corpo).toBe('Como foi ontem? Registre em 10 segundos. · Entrega relatório amanhã · Meta "Vender um projeto": faltam 30 dias');
});
```

- [ ] **Passo 2: rodar e ver falhar.** · [ ] **Passo 3: implementar.** · [ ] **Passo 4: `npm test` → PASS.**
- [ ] **Passo 5: commit e push.** `feat: regras das notificações`

---

### Task 10: Supabase: projeto, tabelas, RLS e conta (§5 e §6)

**Arquivos:**
- Criar: `supabase/config.toml` (via `npx supabase init`), `supabase/migrations/20261116000001_tabelas.sql`, `…02_rls.sql`, `…03_sincronizacao.sql`, `supabase/verificacao/rls.sql`, `.env.local` (não versionado)

**Interfaces:**
- Produz: tabelas `public.config`, `escalas`, `excecoes`, `itens`, `conclusoes`, `dias`, `livros`, `metas` e `etapas`, com as colunas de `tipos.ts`, mais `push_inscricoes` e `notificacoes_enviadas`.

- [ ] **Passo 1 (👤 Gabriel): criar o projeto.** Em supabase.com, criar um projeto **novo** chamado `vida-pessoal`, na região São Paulo, separado do "teste". Guardar a senha do banco no gerenciador de senhas dele. Em Project Settings → API, copiar a URL e a chave publicável (ou "anon") para o `.env.local`, como `VITE_SUPABASE_URL` e `VITE_SUPABASE_CHAVE_PUBLICA`.
- [ ] **Passo 2 (👤 Gabriel): ligar a CLI.** No terminal do VS Code: `npx supabase login` (abre o navegador) e `npx supabase link --project-ref <ref>` (pede a senha do banco). O executor roda antes `npx supabase init`.
- [ ] **Passo 3: escrever `…01_tabelas.sql`.**
  - Toda tabela sincronizada:
    - `user_id uuid not null default auth.uid() references auth.users on delete cascade`;
    - `id text not null`, com `primary key (user_id, id)`;
    - `atualizado_em timestamptz not null`, `excluido_em timestamptz`, `sincronizado_em timestamptz not null default now()`.
  - Tipos das colunas: `Dia` → `date`; `hora` e `horario_avisos` → `text`; `aula_dias_semana` → `smallint[]`; centavos → `bigint`.
  - Checks:
    - `ciclo ~ '^[TF]{1,28}$'`;
    - hora e horário `~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'`;
    - enums com `in (...)`, iguais aos de `tipos.ts`;
    - `comida between 1 and 3`; `sono_min` e `exercicio_min between 0 and 1440`; `paginas >= 0`;
    - `char_length(titulo) between 1 and 200` (o mesmo vale para `nome`);
    - valores em centavos `>= 0`;
    - `config.id = 'config'`.
  - `push_inscricoes`: `id uuid pk default gen_random_uuid()`, `user_id` (default `auth.uid()`), `endpoint text unique not null`, `p256dh text not null`, `auth text not null`, `aparelho text`, `criada_em timestamptz default now()`.
  - `notificacoes_enviadas`: `user_id`, `chave text`, `enviada_em timestamptz default now()`, `primary key (user_id, chave)`.
- [ ] **Passo 4: escrever `…02_rls.sql`.**
  - Em cada tabela sincronizada:
    - `enable row level security`;
    - uma policy `dono` `for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))`;
    - `grant select, insert, update` para `authenticated`, **sem** `delete`.
  - `push_inscricoes`: a mesma policy, mais `delete`.
  - `notificacoes_enviadas`: RLS ligado e nenhuma policy ou grant para `authenticated`, porque só a Edge Function usa.
- [ ] **Passo 5: escrever `…03_sincronizacao.sql`.** Uma função de trigger `before insert or update`, em cada tabela sincronizada:

```sql
if tg_op = 'UPDATE' and new.atualizado_em < old.atualizado_em then
  return null;  -- alteração mais antiga que a gravada: ignora (vence a última)
end if;
new.sincronizado_em := clock_timestamp();
return new;
```

  Mais um índice `(user_id, sincronizado_em)` em cada tabela.
- [ ] **Passo 6: aplicar.** `npx supabase db push`. Esperado: as três migrations aplicadas, sem erro.
- [ ] **Passo 7: escrever `supabase/verificacao/rls.sql`.** Um roteiro dentro de `begin; … rollback;` que:
  - cria duas linhas de `itens` como o usuário A (com `set local role authenticated` e `set local request.jwt.claims = '{"sub":"<uuid A>"}'`);
  - troca para o usuário B e confere, com `do $$ … assert … $$`, que B não lê nem atualiza as linhas de A;
  - confere que um `delete` falha por permissão;
  - confere que um update com `atualizado_em` mais antigo não muda a linha;
  - termina com `select 'RLS OK'`.
- [ ] **Passo 8 (👤 Gabriel): verificar e criar a conta.**
  1. Colar o `rls.sql` no SQL Editor. Esperado: `RLS OK`.
  2. Em Authentication → Users → Add user, criar o usuário dele com "Auto Confirm".
  3. Em Authentication → Sign In / Providers, **desligar "Allow new users to sign up"** (§6).
- [ ] **Passo 9: commit e push.** `feat: banco no Supabase com RLS e sincronização`

---

### Task 11: Dados locais e sincronização (§6 Sem internet)

**Arquivos:**
- Criar: `src/dados/banco.ts`, `fila.ts`, `mesclar.ts`, `sincronizador.ts`, `remoto.ts`, `persistencia.ts`, `ids.ts`, `src/supabase.ts`
- Testes: `src/dados/banco.test.ts`, `fila.test.ts`, `mesclar.test.ts`, `sincronizador.test.ts`

**Interfaces:**
- `banco.ts`:
  - `semExcluidos(b: Banco): Banco`
  - `aplicar(b: Banco, m: Mudanca): Banco`: troca pelo id ou acrescenta.
  - `type Mudanca = { tabela: Tabela; linha: Linha }`
- `fila.ts`: `enfileirar(fila: Mudanca[], m: Mudanca): Mudanca[]`. Remove a mudança pendente com a mesma tabela e id e põe a nova no fim.
- `mesclar.ts`: `mesclar(local: Banco, remotos: Partial<Record<Tabela, Linha[]>>, fila: Mudanca[]): Banco`. Para cada linha remota, mantém a local se ela (ou a pendente na fila) tiver `Date.parse(atualizado_em)` maior; senão fica com a remota (inclusive se a remota estiver excluída).
- `sincronizador.ts`:

```ts
export interface Remoto {
  enviar(tabela: Tabela, linha: Linha): Promise<'ok' | 'rede' | 'recusado'>;
  buscar(tabela: Tabela, desde: string | null): Promise<Linha[] | 'rede'>;  // inclui excluídas; ordenado por sincronizado_em
}
export interface EstadoLocal { banco: Banco; fila: Mudanca[]; cursores: Partial<Record<Tabela, string>> }
export function sincronizar(e: EstadoLocal, r: Remoto): Promise<{ estado: EstadoLocal; rejeitadas: Mudanca[]; offline: boolean }>
```

  - Envia a fila **uma mudança por vez**, em ordem:
    - `'rede'` → para, mantém o restante e devolve `offline: true`, sem buscar;
    - `'recusado'` → tira a mudança da fila, ela vai para `rejeitadas`, e segue com as próximas.
  - Depois busca as tabelas a partir de `cursores[t]` (`gte`), mescla e avança cada cursor para o maior `sincronizado_em` recebido.
- `remoto.ts`: `criarRemoto(cliente: SupabaseClient, userId: string): Remoto`.
  - Faz `upsert({ ...linha, user_id }, { onConflict: 'user_id,id' })` sem o campo `sincronizado_em`.
  - Erro de rede (`TypeError`/`fetch failed`, ou `navigator.onLine === false`) → `'rede'`. Qualquer outro erro → `'recusado'`.
- `persistencia.ts`, com `idb-keyval` e chave `vida-pessoal:${userId}`: `carregarLocal(userId): Promise<EstadoLocal | null>`, `salvarLocal(userId, e: EstadoLocal): Promise<void>`, `apagarLocal(userId)`.
- `ids.ts`: `novoId(): string` (`crypto.randomUUID()`) e `agoraIso(): string`.
- `supabase.ts`: `cliente = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_CHAVE_PUBLICA)`.

- [ ] **Passo 1: escrever os testes que devem falhar.**

```ts
// banco.test.ts
it('semExcluidos esconde as excluídas; aplicar troca pelo id', () => {
  const b = banco({ itens: [item({ id: 'a' }), item({ id: 'b', excluido_em: AGORA })] });
  expect(semExcluidos(b).itens.map((i) => i.id)).toEqual(['a']);
  const novo = aplicar(b, { tabela: 'itens', linha: item({ id: 'a', titulo: 'Novo' }) });
  expect(novo.itens.find((i) => i.id === 'a')?.titulo).toBe('Novo');
  expect(novo.itens).toHaveLength(2);
});
// fila.test.ts
it('compacta mudanças da mesma linha', () => {
  const f = enfileirar(enfileirar([], { tabela: 'itens', linha: item({ id: 'a' }) }), { tabela: 'itens', linha: item({ id: 'b' }) });
  const g = enfileirar(f, { tabela: 'itens', linha: item({ id: 'a', titulo: 'X' }) });
  expect(g.map((m) => (m.linha as Item).id)).toEqual(['b', 'a']);
});
// mesclar.test.ts
it('vence a última alteração, com formatos de data diferentes', () => {
  const local = banco({ itens: [item({ id: 'a', titulo: 'Local', atualizado_em: '2026-11-16T12:00:00.000Z' })] });
  const remotoNovo = item({ id: 'a', titulo: 'Remoto', atualizado_em: '2026-11-16T12:00:01+00:00' });
  const remotoVelho = item({ id: 'a', titulo: 'Velho', atualizado_em: '2026-11-16T11:59:59+00:00' });
  expect(mesclar(local, { itens: [remotoNovo] }, []).itens[0].titulo).toBe('Remoto');
  expect(mesclar(local, { itens: [remotoVelho] }, []).itens[0].titulo).toBe('Local');
});
it('pendente na fila vence remota mais antiga; excluída remota entra', () => {
  const pend = item({ id: 'a', titulo: 'Pendente', atualizado_em: '2026-11-16T13:00:00.000Z' });
  const local = banco({ itens: [pend] });
  const r = mesclar(local, { itens: [item({ id: 'a', titulo: 'R', atualizado_em: '2026-11-16T12:30:00+00:00' }), item({ id: 'z', excluido_em: AGORA })] }, [{ tabela: 'itens', linha: pend }]);
  expect(r.itens.map((i) => [i.id, i.titulo])).toEqual([['a', 'Pendente'], ['z', 'Tarefa']]);
  expect(semExcluidos(r).itens).toHaveLength(1);
});
// sincronizador.test.ts — Remoto falso que registra chamadas e responde por id
it('envia tudo, esvazia a fila e avança cursores', async () => { /* fila [a,b] → 'ok','ok'; buscar devolve itens com sincronizado_em '2026-11-16T12:00:05+00:00' → fila [] e cursores.itens === esse valor */ });
it('sem rede no meio: para, mantém o resto, não busca', async () => { /* a → 'ok', b → 'rede' → fila [b], offline true, buscar nunca chamado */ });
it('recusada não trava a fila', async () => { /* a → 'recusado', b → 'ok' → rejeitadas [a], fila [] */ });
```

  Os três testes do sincronizador são escritos por inteiro, com as asserções descritas nos comentários.
- [ ] **Passo 2: rodar e ver falhar.** · [ ] **Passo 3: implementar os arquivos.** `remoto.ts` e `persistencia.ts` não têm teste (são finos e só chamam bibliotecas).
- [ ] **Passo 4: `npm test` → PASS. `npm run build` → sem erros.**
- [ ] **Passo 5: commit e push.** `feat: banco local, fila e sincronização`

---

### Task 12: Estrutura do app: login, contexto, abas e componentes base (§4.8)

**Arquivos:**
- Criar: `src/estado/useSessao.ts`, `useHoje.ts`, `useOnline.ts`, `contexto.tsx`; `src/telas/Entrar.tsx`; `src/componentes/BarraAbas.tsx`, `PainelInferior.tsx`, `Toast.tsx`, `IndicadorSync.tsx`
- Modificar: `src/App.tsx`, `src/estilos.css`

**Interfaces:**
- `useSessao(): { estado: 'carregando' | 'fora' | 'dentro'; userId: string | null; offlineSemSessao: boolean }`.
  - Usa `cliente.auth.getSession()` e `onAuthStateChange`.
  - Se não houver sessão, o aparelho estiver offline e existir `localStorage['vida-pessoal:ultimo-usuario']` → `'dentro'` com esse userId e `offlineSemSessao: true`, para abrir com os dados guardados (Ponto de atenção 2).
- `contexto.tsx`: `BancoProvider({ userId, children })` e `useBanco(): { banco: Banco /* já semExcluidos */; salvar(m: Mudanca | Mudanca[]): void; status: { pendentes: number; online: boolean; sincronizando: boolean }; userId: string }`.
  - Ao abrir: `carregarLocal` e depois sincroniza.
  - `salvar`: aplica na hora, enfileira, chama `salvarLocal` e agenda uma sincronização em 1 s.
  - Também sincroniza no evento `online`, ao voltar para o app (`visibilitychange`) e a cada 60 s com o app visível.
  - `rejeitadas` → toast "Uma alteração não pôde ser salva."
- `useHoje()`: copiar do Painel Financeiro, trocando o import para `../regras/datas`.
- `useOnline(): boolean`
- `Aba = 'inicio' | 'resumo' | 'metas' | 'ajustes'`. `PainelInferior` e `Toast`: copiar do Painel Financeiro e adaptar.

- [ ] **Passo 1: Entrar.** Campos e-mail e senha, `signInWithPassword` e nenhum botão de cadastro. Erros: "E-mail ou senha incorretos." e, sem internet, "Sem internet. Conecte-se para entrar pela primeira vez." Ao entrar, gravar `vida-pessoal:ultimo-usuario`.
- [ ] **Passo 2: App.** Fluxo de telas:
  - sessão carregando → tela neutra;
  - `'fora'` → Entrar;
  - `'dentro'` → `BancoProvider`.
  
  Dentro do provider:
  - sem `config` depois da primeira sincronização (ou offline sem dados) → espaço reservado "Configuração inicial (Task 13)";
  - com `config` → abas com espaços reservados.
  
  `IndicadorSync`: quando `pendentes > 0` e offline, mostra "N alterações esperando internet".
- [ ] **Passo 3: verificar manualmente** (`npm run dev`, DevTools no modo Android):
  1. Senha errada → mensagem.
  2. Entrar com a conta da Task 10 → aparece o espaço da configuração inicial.
  3. DevTools → Network → Offline e recarregar → continua dentro, sem a tela de login.
  4. Voltar a ficar online → sem erros no console.
- [ ] **Passo 4: commit e push.** `feat: login, contexto do banco e abas`

---

### Task 13: Configuração inicial (§4.1)

**Arquivos:**
- Criar: `src/dados/opsConfig.ts` (+ `opsConfig.test.ts`), `src/componentes/EditorCiclo.tsx`, `src/telas/ConfiguracaoInicial.tsx`
- Modificar: `src/App.tsx` (troca o espaço reservado pela tela)

**Interfaces:**
- `opsConfig.ts`:
  - `interface RespostasConfig { ciclo: string; posicaoHoje: number; faculdade: { dias: number[]; sabadoComAula: boolean; semestreFim: Dia | null } | null; treinoNasFolgas: boolean; metaSonoMin: number; metaTreinosSemana: number; metaLivrosMes: number; horarioAvisos: string }`
  - `configuracaoInicial(r: RespostasConfig, hoje: Dia, novoId: () => string, agora: string): Mudanca[]`, devolvidas nesta ordem: config, escala e, se houver, o treino.
    - gera a `config` (`notificacoes_ligadas: true`, `configurado_em: agora`);
    - gera a `escala` (`inicio = inicioPelaPosicao(hoje, posicaoHoje)`, `vigente_desde = hoje`);
    - se o treino estiver ligado, gera o item (tarefa `'Treino'`, `folgas`, `data = hoje`, área pessoal) e grava o id dele em `treino_item_id`.
    - `sabado_referencia`: o próximo sábado ≥ hoje, se `sabadoComAula`; senão esse sábado + 7. Sem faculdade → `aula_dias_semana: []` e `null`.
  - `trocarEscala(escalas: Escala[], ciclo: string, posicaoHoje: number, hoje: Dia, novoId: () => string, agora: string): Escala`: se já existe uma escala com `vigente_desde === hoje`, atualiza essa; senão cria uma nova.
  - `ligarTreino(config: Config, hoje: Dia, novoId, agora): Mudanca[]` e `desligarTreino(config: Config, treino: Item, hoje: Dia, agora): Mudanca[]`. Desligar: `repete_ate = ontem`, ou exclui o item se `data >= hoje`; e `treino_item_id = null`.

- [ ] **Passo 1: escrever os testes que devem falhar.**

```ts
const r: RespostasConfig = { ciclo: 'TTTFFFTTFF', posicaoHoje: 3, faculdade: { dias: [1, 2, 3, 4, 5], sabadoComAula: true, semestreFim: null }, treinoNasFolgas: true, metaSonoMin: 420, metaTreinosSemana: 3, metaLivrosMes: 1, horarioAvisos: '08:00' };
it('gera config, escala e treino', () => {
  const m = configuracaoInicial(r, HOJE, ids(), AGORA);
  const cfg = m.find((x) => x.tabela === 'config')!.linha as Config;
  const esc = m.find((x) => x.tabela === 'escalas')!.linha as Escala;
  const tr = m.find((x) => x.tabela === 'itens')!.linha as Item;
  expect([esc.inicio, esc.vigente_desde]).toEqual(['2026-11-13', HOJE]);
  expect(cfg.sabado_referencia).toBe('2026-11-21');
  expect(cfg.treino_item_id).toBe(tr.id);
  expect(tr).toMatchObject({ tipo: 'tarefa', titulo: 'Treino', repeticao: 'folgas', data: HOJE });
});
it('sábado sem aula e sem faculdade', () => {
  expect((configuracaoInicial({ ...r, faculdade: { ...r.faculdade!, sabadoComAula: false } }, HOJE, ids(), AGORA)[0].linha as Config).sabado_referencia).toBe('2026-11-28');
  const sem = configuracaoInicial({ ...r, faculdade: null, treinoNasFolgas: false }, HOJE, ids(), AGORA);
  expect(sem.map((x) => x.tabela).sort()).toEqual(['config', 'escalas']);
  expect((sem[0].linha as Config).aula_dias_semana).toEqual([]);
});
it('trocar escala duas vezes no mesmo dia atualiza a mesma', () => {
  const e1 = trocarEscala([escala()], 'TF', 0, HOJE, ids(), AGORA);
  const e2 = trocarEscala([escala(), e1], 'TTFF', 1, HOJE, ids(), AGORA);
  expect(e2.id).toBe(e1.id);
  expect([e2.ciclo, e2.inicio]).toEqual(['TTFF', '2026-11-15']);
});
it('desligar treino encerra ontem ou exclui se começou hoje', () => {
  const t = item({ id: 't', data: '2026-11-13', repeticao: 'folgas' });
  expect((desligarTreino(config({ treino_item_id: 't' }), t, HOJE, AGORA).find((m) => m.tabela === 'itens')!.linha as Item).repete_ate).toBe('2026-11-15');
  expect((desligarTreino(config({ treino_item_id: 't' }), { ...t, data: HOJE }, HOJE, AGORA).find((m) => m.tabela === 'itens')!.linha as Item).excluido_em).toBe(AGORA);
});
```

- [ ] **Passo 2: rodar e ver falhar.** · [ ] **Passo 3: implementar `opsConfig.ts`.** · [ ] **Passo 4: `npm test` → PASS.**
- [ ] **Passo 5: telas.**
  - `EditorCiclo`: chips dos `PRESETS` mais "Montar meu ciclo" (toques alternam T/F; botões +/− dia, de 1 a 28). Depois, a pergunta "Qual destes é hoje?": toque numa casa do ciclo.
  - `ConfiguracaoInicial`: passos Escala → Faculdade (com "Pular") → Treino nas folgas → Metas dos hábitos (padrões 7h, 3 e 1) → Horário dos avisos. O passo Notificações entra na Task 17.
  - Concluir chama `salvar(configuracaoInicial(...))`. É preciso estar online: offline, o botão fica desabilitado com o texto "Conecte-se para concluir".
- [ ] **Passo 6: verificar manualmente.**
  1. Fazer a configuração com o 3x2 alternado, tocando no 4º dia.
  2. Conferir no Table Editor do Supabase que `config`, `escalas` e `itens` foram criados.
  3. Recarregar: abre direto nas abas.
- [ ] **Passo 7: commit e push.** `feat: configuração inicial`

---

### Task 14: Início: linha do tempo, marcar feito, pendentes e dia extra (§4.3 item 4)

**Arquivos:**
- Criar: `src/dados/opsAgenda.ts` (+ `opsAgenda.test.ts`), `src/componentes/LinhaDoTempo.tsx`, `src/telas/Inicio.tsx`

**Interfaces:**
- `opsAgenda.ts`:
  - `alternarFeito(o: Ocorrencia, banco: Banco, agora: string): Mudanca`. Avulsa → `feito_em` vira `agora` ou `null`. Repetida → cria ou atualiza a conclusão `chaveConclusao`; ao desmarcar, a conclusão recebe `excluido_em`.
  - `moverItem(item: Item, data: Dia, agora: string): Mudanca`
  - `excluirLinha(tabela: Tabela, linha: Linha, agora: string): Mudanca`
  - `marcarDiaExtra(dia: Dia, novoId: () => string, agora: string): Mudanca` (exceção `T` de um dia só)
  - `desfazerDiaExtra(ex: Excecao, agora: string): Mudanca`

- [ ] **Passo 1: escrever os testes que devem falhar.**

```ts
it('marcar e desmarcar repetida usa conclusão', () => {
  const t = item({ id: 't', repeticao: 'folgas', data: '2026-11-13' });
  const m1 = alternarFeito({ item: t, dia: HOJE, feito: false }, banco({ itens: [t] }), AGORA);
  expect(m1).toMatchObject({ tabela: 'conclusoes', linha: { id: 't:2026-11-16', item_id: 't', data: HOJE, excluido_em: null } });
  const b2 = banco({ itens: [t], conclusoes: [m1.linha as Conclusao] });
  expect((alternarFeito({ item: t, dia: HOJE, feito: true }, b2, AGORA).linha as Conclusao).excluido_em).toBe(AGORA);
});
it('avulsa usa feito_em', () => {
  const a = item({ id: 'a' });
  expect((alternarFeito({ item: a, dia: HOJE, feito: false }, banco(), AGORA).linha as Item).feito_em).toBe(AGORA);
  expect((alternarFeito({ item: { ...a, feito_em: AGORA }, dia: HOJE, feito: true }, banco(), AGORA).linha as Item).feito_em).toBeNull();
});
it('dia extra é uma exceção T de um dia', () => {
  expect(marcarDiaExtra('2026-11-17', () => 'x', AGORA)).toMatchObject({ tabela: 'excecoes', linha: { id: 'x', inicio: '2026-11-17', fim: '2026-11-17', tipo_dia: 'T', sem_aula: false } });
});
```

- [ ] **Passo 2: rodar e ver falhar.** · [ ] **Passo 3: implementar.** · [ ] **Passo 4: `npm test` → PASS.**
- [ ] **Passo 5: telas.**
  - `Inicio`: espaços reservados para as metas (Task 20) e o check-in (Task 18), depois a linha do tempo.
  - `LinhaDoTempo`, seguindo o mockup "C" (`.superpowers/brainstorm/…/tela-inicial.html`):
    - 7 dias e o botão "ver mais", que carrega mais 7;
    - cabeçalho do dia com `rotuloDia`, a etiqueta TRABALHO/FOLGA e "aula" quando houver;
    - hoje destacado, com caixas de marcar; os outros dias mostram os itens resumidos (toque abre o item, Task 15);
    - provas, entregas e compromissos com ⚠ e cor de alerta.
  - Pendentes: no topo de hoje, "N pendentes" abre um painel com marcar feito, mover (Amanhã / Próxima folga / Escolher data) e excluir.
  - Toque na etiqueta FOLGA → "Virou trabalho (dia extra)". Toque na etiqueta de um dia extra → "Desfazer dia extra". Os dois funcionam offline (vão pela fila).
  - Botão flutuante "+ anotar" (abre o painel da Task 15; até lá, fica desabilitado).
- [ ] **Passo 6: verificar manualmente.**
  1. O treino aparece nas folgas.
  2. Marcar o treino de hoje, recarregar: continua marcado.
  3. Transformar uma folga em dia extra: o treino some do dia, e desfazer traz de volta.
  4. Offline: marcar um item, ver "1 alteração esperando internet", voltar online e ver o aviso sumir.
- [ ] **Passo 7: commit e push.** `feat: início com linha do tempo`

---

### Task 15: "+ anotar" e edição de item (§4.2)

**Arquivos:**
- Criar: `src/componentes/PainelAnotar.tsx`, `src/componentes/EditarItem.tsx`
- Modificar: `src/dados/opsAgenda.ts` (+ testes), `src/telas/Inicio.tsx`

**Interfaces:**
- `criarItem(p: Previa, repeticao: Repeticao, novoId: () => string, agora: string): Mudanca`. Força `repeticao = 'nenhuma'` quando `p.tipo !== 'tarefa'`.
- `editarItem(item: Item, campos: Partial<Pick<Item, 'titulo' | 'tipo' | 'data' | 'hora' | 'area'>>, agora: string): Mudanca`
- `editarRepeticao(item: Item, nova: Repeticao, hoje: Dia, novoId: () => string, agora: string): Mudanca[]`. Se `item.data >= hoje`, muda o item. Senão, encerra o antigo (`repete_ate = ontem`) e cria uma cópia a partir de hoje com a regra nova, preservando o histórico das semanas passadas.

- [ ] **Passo 1: escrever os testes que devem falhar.**

```ts
it('criarItem a partir da prévia', () => {
  const m = criarItem(lerLinha('prova química 20/11', HOJE), 'folgas', () => 'i1', AGORA);
  expect(m.linha).toMatchObject({ id: 'i1', tipo: 'prova', repeticao: 'nenhuma', feito_em: null, excluido_em: null, atualizado_em: AGORA });
});
it('mudar a repetição não reescreve o passado', () => {
  const t = item({ id: 't', data: '2026-11-13', repeticao: 'folgas' });
  const ms = editarRepeticao(t, 'todo_dia', HOJE, () => 'n', AGORA);
  expect(ms.map((m) => [(m.linha as Item).id, (m.linha as Item).repeticao, (m.linha as Item).repete_ate, (m.linha as Item).data])).toEqual([
    ['t', 'folgas', '2026-11-15', '2026-11-13'], ['n', 'todo_dia', null, HOJE],
  ]);
  expect(editarRepeticao({ ...t, data: HOJE }, 'todo_dia', HOJE, () => 'n', AGORA)).toHaveLength(1);
});
```

- [ ] **Passo 2: rodar e ver falhar.** · [ ] **Passo 3: implementar.** · [ ] **Passo 4: `npm test` → PASS.**
- [ ] **Passo 5: telas.**
  - `PainelAnotar`: um campo de texto com foco automático e a prévia ao vivo (`lerLinha` a cada tecla), mostrada como chips editáveis: tipo, data (seletor), hora, área e repetição (só para tarefa).
  - "Salvar" fica desabilitado com título vazio. Nunca salva sem a prévia na tela (§4.2). Placeholder: `ex.: prova química 20/11`.
  - `EditarItem`, aberto ao tocar num item: edita os mesmos campos e tem "Excluir" (com confirmação), "Mover" e "Marcar feito".
- [ ] **Passo 6: verificar manualmente.** Anotar os 4 exemplos da spec e conferir onde cada um aparece na linha do tempo. Anotar offline, voltar online e conferir no Table Editor.
- [ ] **Passo 7: commit e push.** `feat: anotar rápido e edição de itens`

---

### Task 16: PWA: service worker, instalação e funcionamento sem internet (§6)

**Arquivos:**
- Criar: `src/pwa/sw.ts`, `src/pwa/plataforma.ts` (+ teste, copiado do Painel Financeiro), `src/pwa/AvisoAtualizacao.tsx` (copiado), `src/pwa/ComoInstalar.tsx` (copiado e adaptado), `public/logo.svg` e ícones
- Modificar: `vite.config.ts`, `index.html`, `src/main.tsx`

**Interfaces:**
- `vite.config.ts`:
  - `VitePWA({ strategies: 'injectManifest', srcDir: 'src/pwa', filename: 'sw.ts', registerType: 'prompt', manifest: { name: NOME_APP, short_name: 'Vida', lang: 'pt-BR', display: 'standalone', start_url: '/', … } })`;
  - `injectManifest.globPatterns: ['**/*.{js,css,html,svg,png,ico}']`.
- `sw.ts`: `precacheAndRoute(self.__WB_MANIFEST)`, `cleanupOutdatedCaches()`, `NavigationRoute` para `index.html`, e a mensagem `SKIP_WAITING` (usada pelo `AvisoAtualizacao`). Os eventos `push` e `notificationclick` entram na Task 17.

- [ ] **Passo 1: instalar** `npm install -D vite-plugin-pwa workbox-precaching workbox-routing @vite-pwa/assets-generator`. Gerar os ícones a partir do `logo.svg`, como no Painel Financeiro.
- [ ] **Passo 2: implementar** a configuração, o `sw.ts` e o registro com o aviso de atualização.
- [ ] **Passo 3: verificar.**
  1. `npm test` → PASS (inclui `plataforma.test.ts`).
  2. `npm run build && npm run preview`.
  3. DevTools → Application → Service Worker "activated".
  4. Network → Offline e recarregar → o app abre com os dados guardados.
  5. Anotar algo offline, voltar online → sincroniza.
- [ ] **Passo 4: commit e push.** `feat: PWA instalável e offline`
- [ ] **Passo 5 (👤 Gabriel): instalar no celular** pelo link da Vercel (Android: "Instalar app"; iPhone: Compartilhar → "Adicionar à Tela de Início"). Abrir em modo avião e confirmar que mostra os dados.

---

### Task 17: Notificações push ponta a ponta (§4.4 e §6)

**Arquivos:**
- Criar: `src/pwa/push.ts` (+ `push.test.ts`), `scripts/copiar-regras.mjs`, `supabase/functions/enviar-notificacoes/index.ts`, `supabase/migrations/20261116000004_cron.sql`
- Modificar: `src/pwa/sw.ts`, `src/telas/ConfiguracaoInicial.tsx` (passo Notificações), `src/App.tsx` (lê `?abrir=` e `?aba=`), `package.json` (script `deploy:funcoes`)

**Interfaces:**
- `push.ts`:
  - `base64UrlParaBytes(b64: string): Uint8Array` (pura, testada)
  - `situacaoPush(): 'sem-suporte' | 'precisa-instalar' | 'negado' | 'pode-pedir' | 'ativo'`
  - `ativarPush(cliente: SupabaseClient): Promise<'ok' | 'negado' | 'sem-suporte'>`. Pede a permissão (sempre a partir de um toque), assina com `applicationServerKey = base64UrlParaBytes(import.meta.env.VITE_VAPID_PUBLICA)` e faz upsert em `push_inscricoes` (`onConflict: 'endpoint'`), guardando `p256dh`, `auth` e o `navigator.userAgent` resumido em `aparelho`.
- Carga útil do push: JSON `{ titulo, corpo, url }`, igual ao retorno de `montarNotificacao`.
- `sw.ts`:
  - `push` → `showNotification(titulo, { body: corpo, icon: '/pwa-192x192.png', data: { url } })`;
  - `notificationclick` → se há uma janela do app aberta, `navigate(url)` e `focus()`; senão `openWindow(url)`.
- `App.tsx`: na abertura, `?abrir=checkin` abre o painel do check-in (Task 18) e `?aba=metas` abre a aba Metas. Depois, `history.replaceState` limpa a URL.
- `copiar-regras.mjs`: copia `src/regras/*.ts`, menos `*.test.ts`, para `supabase/functions/_shared/regras/`.
- Script `deploy:funcoes`: `node scripts/copiar-regras.mjs && npx supabase functions deploy enviar-notificacoes --no-verify-jwt --use-api`.
- `index.ts` da Edge Function:
  - `Deno.serve`: sem o cabeçalho `x-cron-segredo` igual a `Deno.env.get('CRON_SEGREDO')` → 401.
  - Cria o cliente com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (`npm:@supabase/supabase-js@2`) e calcula `agora = agoraEmSaoPaulo(new Date())`.
  - Importa as regras de `../_shared/regras/datas.ts` e `../_shared/regras/notificacoes.ts`.
  - Para cada `user_id` com inscrição (a service role ignora o RLS, então **toda** consulta filtra por `user_id`):
    1. carrega as 9 tabelas com `excluido_em is null` num `Banco`;
    2. carrega as chaves de `notificacoes_enviadas` dos últimos 2 dias;
    3. chama `avisosDevidos` e depois `montarNotificacao`;
    4. envia a cada inscrição com `npm:web-push@3.6.7` (`setVapidDetails(VAPID_CONTATO, VAPID_PUBLICA, VAPID_PRIVADA)`);
    5. grava as chaves enviadas;
    6. apaga as inscrições que responderem 404 ou 410.
  - Apaga as `notificacoes_enviadas` com mais de 60 dias. Responde `{ usuarios, enviadas }`.
  - Se `web-push` falhar no Deno, trocar só a função de envio por `jsr:@negrel/webpush`, sem mexer no resto.
- `…04_cron.sql`:
  - `create extension if not exists pg_cron with schema pg_catalog;` e `create extension if not exists pg_net;`
  - `cron.schedule('enviar-notificacoes', '*/15 * * * *', …)` com `net.http_post`, usando a URL e o cabeçalho `x-cron-segredo` lidos de `vault.decrypted_secrets` (nomes `url_funcao_notificacoes` e `cron_segredo`).

- [ ] **Passo 1: escrever o teste que deve falhar.**

```ts
it('converte a chave VAPID de base64url', () => {
  expect(Array.from(base64UrlParaBytes('AQID-_8'))).toEqual([1, 2, 3, 251, 255]);
});
```

- [ ] **Passo 2: rodar, ver falhar, implementar `push.ts`, ver passar.**
- [ ] **Passo 3: chaves e segredos.**
  1. O executor roda `npx web-push generate-vapid-keys --json`.
  2. Coloca a chave pública no `.env.local` (`VITE_VAPID_PUBLICA`).
  3. Roda `npx supabase secrets set VAPID_PUBLICA=… VAPID_PRIVADA=… CRON_SEGREDO=<uuid aleatório>`.
- [ ] **Passo 4 (👤 Gabriel): contato e cofre.**
  1. Rodar `npx supabase secrets set VAPID_CONTATO=mailto:<e-mail dele, pode ser o noreply>`.
  2. No SQL Editor, rodar `select vault.create_secret('<CRON_SEGREDO>', 'cron_segredo');` e `select vault.create_secret('https://<ref>.supabase.co/functions/v1/enviar-notificacoes', 'url_funcao_notificacoes');`.
  3. Na Vercel → Settings → Environment Variables, criar `VITE_SUPABASE_URL`, `VITE_SUPABASE_CHAVE_PUBLICA` e `VITE_VAPID_PUBLICA`, e depois fazer um Redeploy.
- [ ] **Passo 5: implementar** a Edge Function, os eventos do `sw.ts`, o passo Notificações da configuração inicial e o tratamento da URL no `App`.
  - O passo Notificações: no iPhone sem instalar, mostra `ComoInstalar` antes do botão. Os botões são "Ativar notificações" e "Agora não".
- [ ] **Passo 6: publicar.** `npm run deploy:funcoes`, depois `npx supabase db push` (cron), commit e push.
- [ ] **Passo 7: verificar de ponta a ponta.**
  1. No celular instalado, ativar as notificações.
  2. Anotar `entrega teste amanhã`.
  3. Ajustar `horario_avisos` para alguns minutos antes da hora atual, direto no Table Editor (a tela de Ajustes vem na Task 22).
  4. Em até 15 minutos chega **uma** notificação agrupada. Tocar nela abre o app.
  5. Em Integrations → Cron → Job runs, as execuções aparecem com sucesso.
  6. Rodar o job de novo à mão: nada repetido chega.
  7. Voltar o horário para 08:00.
- [ ] **Passo 8: commit e push.** `feat: notificações push`

---

### Task 18: Registro diário de hábitos (§4.5 e §4.3 item 3)

**Arquivos:**
- Criar: `src/dados/opsHabitos.ts` (+ teste), `src/componentes/CartaoCheckin.tsx`, `src/componentes/PainelCheckin.tsx`
- Modificar: `src/telas/Inicio.tsx`, `src/App.tsx` (`?abrir=checkin`)

**Interfaces:**
- `interface ValoresCheckin { sonoMin: number; exercicioMin: number; comida: 1 | 2 | 3; paginas: number; livroId: string | null }`
- `checkinPendente(hoje: Dia, banco: Banco): boolean`: `dias[ontem]` não existe ou está sem `habitos_em`.
- `valoresIniciais(manha: Dia, banco: Banco): ValoresCheckin`. Valores já salvos daquela manhã e da véspera; senão os do último registro; senão sono = `meta_sono_min`, exercício 0, comida 2, páginas 0, e o livro do último registro ou `null`.
- `salvarCheckin(manha: Dia, v: ValoresCheckin, banco: Banco, agora: string): Mudanca[]`. Duas linhas de `dias`: `manha` com `sono_min`, e `manha − 1` com os hábitos e `habitos_em = agora`. Os outros campos de cada linha são preservados.
- `novoLivro(titulo: string, novoId, agora): Mudanca` e `terminarLivro(livro: Livro, dia: Dia, agora): Mudanca`.

- [ ] **Passo 1: escrever os testes que devem falhar.**

```ts
it('sono vai para a manhã; hábitos vão para ontem, preservando o resto', () => {
  const b = banco({ dias: [dia('2026-11-15', { sono_min: 400 })] });
  const ms = salvarCheckin(HOJE, { sonoMin: 390, exercicioMin: 30, comida: 3, paginas: 12, livroId: 'l' }, b, AGORA);
  const porId = Object.fromEntries(ms.map((m) => [m.linha.id, m.linha as RegistroDia]));
  expect(porId['2026-11-16']).toMatchObject({ data: HOJE, sono_min: 390, habitos_em: null });
  expect(porId['2026-11-15']).toMatchObject({ sono_min: 400, exercicio_min: 30, comida: 3, paginas: 12, livro_id: 'l', habitos_em: AGORA });
});
it('pendente até registrar ontem', () => {
  expect(checkinPendente(HOJE, banco())).toBe(true);
  expect(checkinPendente(HOJE, banco({ dias: [dia('2026-11-15', { habitos_em: AGORA })] }))).toBe(false);
});
it('valores iniciais', () => {
  expect(valoresIniciais(HOJE, banco())).toEqual({ sonoMin: 420, exercicioMin: 0, comida: 2, paginas: 0, livroId: null });
  const b = banco({ dias: [dia('2026-11-13', { sono_min: 380, habitos_em: AGORA, exercicio_min: 45, comida: 3, paginas: 8, livro_id: 'l' }), dia('2026-11-14', { sono_min: 410 })] });
  expect(valoresIniciais(HOJE, b)).toEqual({ sonoMin: 410, exercicioMin: 45, comida: 3, paginas: 8, livroId: 'l' });
});
```

- [ ] **Passo 2: rodar e ver falhar.** · [ ] **Passo 3: implementar.** · [ ] **Passo 4: `npm test` → PASS.**
- [ ] **Passo 5: telas.**
  - `CartaoCheckin` no Início, enquanto `checkinPendente`: "Como foi ontem? · 10 s".
  - `PainelCheckin`, seguindo o desenho da §4.5:
    - sono com −/+ de 30 min, mostrado como `6h30`;
    - chips de exercício: Não, 15, 30, 45, 60+ (60+ = 60);
    - comida: 😞 😐 😀;
    - páginas com teclado numérico;
    - livro atual: escolher, novo ou "Terminei".
  - Um seletor "Manhã de:" com os últimos 7 dias (padrão hoje) permite preencher ou corrigir dias anteriores.
  - Salvar em 1 toque, sem digitar, num dia típico (anti-meta: no máximo ~15 s).
- [ ] **Passo 6: verificar manualmente.**
  1. O cartão aparece. Salvar sem mudar nada leva 1 toque e o cartão some.
  2. Corrigir o dia de anteontem.
  3. Offline: o check-in salva e sincroniza depois.
  4. A notificação `?abrir=checkin` abre o painel.
- [ ] **Passo 7: commit e push.** `feat: registro diário de hábitos`

---

### Task 19: Resumo do mês (§4.6)

**Arquivos:** Criar `src/telas/Resumo.tsx`, `src/componentes/GraficoSono.tsx`. Modificar `src/App.tsx`.

- [ ] **Passo 1: tela.**
  - Aba Resumo com seletor `Semana | Mês`; a semana entra na Task 21, até lá fica um espaço reservado.
  - Mês: setas para meses anteriores (não passa do mês atual) e o título com `nomeMes`.
  - Blocos, a partir de `resumoDoMes`:
    - **Sono:** média × meta, antes de trabalho × antes de folga, e `GraficoSono` (Recharts, barras noite a noite coloridas por T/F, com a linha da meta);
    - **Exercício:** `dias / metaDias`, minutos, divisão trabalho/folga;
    - **Comida:** `% dos dias 😀`, dias 😞;
    - **Leitura:** páginas, livros × meta.
  - Sempre mostra "N dias sem registro". Os campos `null` aparecem como "—".
  - Durações no formato `6h10`.
- [ ] **Passo 2: verificar manualmente.** Com alguns registros feitos na Task 18, os números batem com a conta à mão. Um mês sem dados mostra "—" e não quebra. O gráfico fica legível no tema escuro.
- [ ] **Passo 3: commit e push.** `feat: resumo do mês`

---

### Task 20: Metas (§4.7 e §4.3 itens 1 e 2)

**Arquivos:**
- Criar: `src/dados/opsMetas.ts` (+ teste), `src/componentes/cores.ts`, `MetaDestaque.tsx`, `CartoesMetas.tsx`, `src/telas/Metas.tsx`, `DetalheMeta.tsx`, `formularios/FormMeta.tsx`
- Modificar: `src/telas/Inicio.tsx`, `src/App.tsx`

**Interfaces:**
- `opsMetas.ts`:
  - `criarMeta(campos: Pick<Meta, 'nome' | 'icone' | 'cor' | 'tipo' | 'prazo' | 'prioridade' | 'alvo_centavos' | 'observacao'>, etapas: string[], novoId, agora): Mudanca[]`. `atual_centavos` começa em 0 para valor/compra e `null` para conquista; as etapas têm `ordem` 0..n.
  - `adicionarValor(meta: Meta, centavos: number, agora): Mudanca`: soma, sem deixar ficar abaixo de 0.
  - `alternarEtapa(e: Etapa, agora): Mudanca`
  - `reordenarEtapas(etapas: Etapa[], agora): Mudanca[]`: reescreve `ordem` pela posição.
  - `concluirMeta(meta: Meta, hoje: Dia, agora): Mudanca` e `reabrirMeta(meta: Meta, agora): Mudanca`
- `cores.ts`: `CORES_META`, uma paleta fixa de 8 cores (a primeira é `'#7b5cff'`), e `degrade(cor): string` para o fundo dos cartões.

- [ ] **Passo 1: escrever os testes que devem falhar.**

```ts
it('criar meta de conquista com etapas e de valor', () => {
  const ms = criarMeta({ nome: 'Vender um projeto', icone: '🚀', cor: '#7b5cff', tipo: 'conquista', prazo: '2026-12-31', prioridade: 'alta', alvo_centavos: null, observacao: null }, ['Portfólio', 'Proposta', 'Fechar'], ids(), AGORA);
  expect(ms.filter((m) => m.tabela === 'etapas').map((m) => [(m.linha as Etapa).texto, (m.linha as Etapa).ordem])).toEqual([['Portfólio', 0], ['Proposta', 1], ['Fechar', 2]]);
  const v = criarMeta({ nome: 'Reserva', icone: '🛟', cor: '#0f9d74', tipo: 'valor', prazo: '2026-12-31', prioridade: 'alta', alvo_centavos: 600000, observacao: null }, [], ids(), AGORA);
  expect((v[0].linha as Meta).atual_centavos).toBe(0);
});
it('adicionar valor não fica negativo', () => {
  const m = meta({ tipo: 'valor', alvo_centavos: 600000, atual_centavos: 120000 });
  expect((adicionarValor(m, 5000, AGORA).linha as Meta).atual_centavos).toBe(125000);
  expect((adicionarValor(m, -999999, AGORA).linha as Meta).atual_centavos).toBe(0);
});
it('concluir e reabrir', () => {
  expect((concluirMeta(meta(), HOJE, AGORA).linha as Meta).concluida_em).toBe(HOJE);
  expect((reabrirMeta(meta({ concluida_em: HOJE }), AGORA).linha as Meta).concluida_em).toBeNull();
});
```

- [ ] **Passo 2: rodar e ver falhar.** · [ ] **Passo 3: implementar.** · [ ] **Passo 4: `npm test` → PASS.**
- [ ] **Passo 5: telas.**
  - **Início**, no lugar do espaço reservado, seguindo o mockup `metas-v3.html` opção A:
    - `MetaDestaque` com `metasDoInicio(...).destaque`: degradê da cor, ícone e nome, "N dias até dd/mm" grande, e progresso em etapas (barrinhas) ou em %;
    - prazo vencido → "atrasada há N dias" em vermelho;
    - sem destaque → cartão discreto "Criar uma meta".
  - `CartoesMetas` mostra os `cartoes`, dois por vez, com rolagem horizontal.
  - **Aba Metas**: `agruparMetas`, concluídas recolhidas e "+ nova meta".
  - **`FormMeta`**: nome, emoji, cor (`CORES_META`), tipo, prazo, prioridade, alvo ("preço" quando for compra), etapas (para conquista) e observação.
  - **`DetalheMeta`**:
    - marcar e reordenar etapas;
    - "+ adicionar valor" e editar o total;
    - quando `sugerirConcluir`, perguntar "Concluir esta meta?";
    - concluir/reabrir e excluir.
- [ ] **Passo 6: verificar manualmente.** Criar as três metas de exemplo da spec (com dados fictícios). Conferir:
  - a mais urgente vira o destaque;
  - uma de prioridade média não aparece no Início;
  - concluir tira a meta do Início.
  
  Abrir `?aba=metas` → cai na aba Metas.
- [ ] **Passo 7: commit e push.** `feat: metas`

---

### Task 21: Resumo da semana (§4.6)

**Arquivos:** Modificar `src/telas/Resumo.tsx` e `src/telas/Inicio.tsx`.

- [ ] **Passo 1: tela.**
  - Na aba Resumo → Semana, com setas para as semanas anteriores (a atual vai até hoje):
    - "planejado × feito" (`feitos/total` e uma barra);
    - os números por área;
    - a lista "não feito" (dia e título);
    - os hábitos da semana: sono médio, treinos, dias 😀, páginas.
  - No Início, o cartão "Sua semana passada" aparece no topo quando `cartaoSemanaVisivel(hoje, localStorage['vida-pessoal:semana-dispensada'])`. "Ver" abre o Resumo naquela semana. Abrir ou dispensar grava a segunda da semana resumida nessa chave.
- [ ] **Passo 2: verificar manualmente.** Mudar a data do sistema, ou usar dados de uma segunda-feira, para ver o cartão. Dispensar faz o cartão sumir e ele não volta ao recarregar. Os números batem com a linha do tempo.
- [ ] **Passo 3: commit e push.** `feat: resumo da semana`

---

### Task 22: Ajustes, exportar dados e sair (§4.1, §4.4 e §6)

**Arquivos:**
- Criar: `src/telas/Ajustes.tsx`, `src/componentes/arquivos.ts` (copiado de `../painel-financeiro/src/componentes/arquivos.ts`, só `compartilharOuBaixar` e o que ela usa)
- Modificar: `src/dados/opsConfig.ts` (+ testes, se surgir função nova)

- [ ] **Passo 1: tela.** Seções:
  1. **Escala**: `EditorCiclo` com a posição atual e `trocarEscala`, mais o aviso "vale de hoje em diante".
  2. **Faculdade**: dias, sábados alternados e fim do semestre.
  3. **Exceções**: lista e "+ período". Tipo: folga (férias), trabalho ou sem aula. Excluir.
  4. **Tarefas repetidas**: lista das repetições em vigor; editar título ou repetição (`editarRepeticao`); "Encerrar" (`repete_ate = ontem`).
  5. **Treino nas folgas**: liga/desliga (`ligarTreino`/`desligarTreino`).
  6. **Metas dos hábitos**.
  7. **Notificações**: liga/desliga, horário e o estado do push neste aparelho (`situacaoPush`), com o botão "Ativar".
  8. **Exportar dados**: um JSON com `{ app: NOME_APP, exportado_em, dados: banco }`, gerado pelo `compartilharOuBaixar`.
  9. **Sair**: `signOut`, `apagarLocal` e limpar `ultimo-usuario`, depois de confirmar quando houver alterações pendentes ("N alterações ainda não foram enviadas. Sair mesmo assim?").
  
  Offline: as seções 1 a 7 ficam desabilitadas com "Conecte-se para mudar os ajustes"; Exportar e Sair continuam funcionando (§2 e §6).
- [ ] **Passo 2: verificar manualmente.**
  1. Trocar a escala: o passado não muda na Resumo do mês, e os próximos dias seguem a nova.
  2. Marcar férias: a linha do tempo mostra folga.
  3. Mudar o horário dos avisos e conferir no Table Editor.
  4. Exportar no celular: abre a tela de compartilhar.
  5. Offline: os ajustes ficam desabilitados.
  6. Sair e entrar de novo: os dados voltam pela sincronização.
- [ ] **Passo 3: commit e push.** `feat: ajustes, exportar e sair`

---

### Task 23: README, roteiro de teste manual e entrega (§1 Sucesso e §6)

**Arquivos:** Modificar `README.md`. Criar `docs/teste-manual.md` e `docs/prints/`.

- [ ] **Passo 1: README** com:
  - o que o app faz;
  - prints com dados fictícios;
  - como rodar (`.env.local`: as 3 variáveis, sem valores);
  - como funcionam a sincronização offline e as notificações;
  - **como reativar o Supabase pausado** (plano grátis, 7 dias sem uso: Dashboard → Restore);
  - como trocar os segredos (`npx supabase secrets set` e o cofre);
  - `npm run deploy:funcoes`.
- [ ] **Passo 2: `docs/teste-manual.md`.** Um roteiro curto que repete as verificações das Tasks 12 a 22, para fazer no Android e no iPhone.
- [ ] **Passo 3 (👤 Gabriel): teste no celular de verdade**, seguindo o roteiro, com:
  - a notificação real do dia seguinte às 08:00;
  - um check-in em modo avião;
  - um dia extra.
  
  Anotar o que falhar.
- [ ] **Passo 4: corrigir** o que o teste mostrar (cada correção com teste quando for regra) e repetir o item que falhou.
- [ ] **Passo 5: commit, push e tag.** `docs: README e roteiro de teste` e `git tag v1.0.0 && git push --tags`.
