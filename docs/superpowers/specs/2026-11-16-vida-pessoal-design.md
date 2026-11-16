# Vida Pessoal — design (nome do app provisório)

Data: 2026-11-16 · Status: **aprovado pelo usuário em 2026-11-16**

**Legenda:** **(U)** = decidido pelo usuário na conversa · **(C)** = proposta/decisão do Claude, o usuário pode mudar.

---

## 1. Por que existe

O usuário sente que **todas as semanas estão sendo desperdiçadas** (U). A causa principal que ele descreveu: **não consegue lembrar das coisas**. O exemplo que o motivou foi uma prova de química que o pegou desprevenido, junto com uma atividade que tinha de entregar (U).

Ele quer um app que:
1. não o deixe ser pego de surpresa (provas, entregas, compromissos) (U);
2. mostre como está a "eficiência energética" dele, que para ele significa **hábitos**: quanto dorme, se se exercita, se come direito, se lê livros, com resumo por mês (U);
3. deixe a semana planejada em cima da escala de trabalho dele, sem ter que atualizar nada todo dia (U);
4. acompanhe metas com prazo e prioridade (U).

Tudo isso **rápido e fácil de usar** (U). Cobre três áreas da vida: pessoal, profissional e acadêmica (U).

### Contexto do usuário (relevante para o design)
- Trabalha em escala de revezamento. A dele hoje é **trabalha 3, folga 3, trabalha 2, folga 2** (ciclo de 10 dias), que ele chama de "3x2".
- O turno é **sempre no mesmo horário**: não tem turno da noite nem turno que passa da meia-noite (U). Por isso o dia vai da meia-noite à meia-noite, e um único horário de aviso basta. Às vezes ele faz **dia extra** (vira trabalho numa folga) ou hora extra (U).
- Faz faculdade à noite, de segunda a sexta, e em sábados alternados.
- Nas folgas quer: treino, projetos de renda extra e faculdade (U).
- Usa celular (o Painel Financeiro dele foi testado em Android e iPhone).
- Constrói apps gerando o código com IA; nível de programação básico. Já tem um app em produção: `c:\Users\win\Projetos\painel-financeiro` (React + TS + Vite + PWA, na Vercel). Já fez um laboratório de Supabase (tabela via SQL Editor, RLS, policies).

### Sucesso
- Nenhuma prova ou entrega pega ele de surpresa (U).
- No fim do mês ele vê quanto dormiu, quantos dias treinou, como comeu e quanto leu (U).
- No fim da semana ele vê o que planejou e o que fez, e entende onde a semana escapou (C).

---

## 2. Metas, não-metas, anti-metas

**Metas da v1**
- Anotar provas, entregas, compromissos e tarefas em segundos, digitando numa linha só (U: manual; C: linha única com leitura automática).
- Notificação no celular com antecedência, mesmo com o app fechado (U: escolheu o caminho com notificações).
- Registro diário de hábitos em ~10 segundos e resumo mensal (U).
- Escala de trabalho e calendário da faculdade configurados uma vez (U).
- Tela inicial em linha do tempo com metas no topo (U, escolhida nos mockups).
- Metas com prazo, prioridade e três tipos (U).

**Não-metas da v1**
- Integração com o Painel Financeiro. Vai para a v2 (U). O que ele quer na v2: abrir este app e ver a barra da reserva de emergência atualizada, sem digitar.
- Buscar datas automaticamente em portal da faculdade, WhatsApp etc. Tudo é manual (U).
- O app decidir sozinho quando estudar (U: retirado). A única coisa automática no plano do dia é o treino nas folgas, e só se ele ligar a opção (U).
- Contar calorias ou detalhar refeições (C: mataria a rapidez).
- Planejamento por hora (blocos de horário) (C).
- Mexer em configurações sem internet: escala, faculdade e notificações exigem conexão (C). O uso do dia a dia funciona sem internet (§6).
- Outras pessoas usando o app (C).
- App de loja (Play Store/App Store) (abordagem descartada, §3).

**Anti-metas** (se acontecer, falhou mesmo funcionando)
- O registro diário levar mais que ~15 segundos ou exigir digitar texto (U: "rápido e fácil").
- Ter que atualizar a escala ou a faculdade no dia a dia (U: "não quero ficar atualizando isso todo dia").
- O celular virar spam de notificações e ele passar a ignorá-las (C).

---

## 3. Abordagens consideradas

| | Como funciona | Por que sim | Por que não |
|---|---|---|---|
| 1. Igual ao Painel Financeiro | PWA, dados só no celular (localStorage), sem servidor | Mais rápido de construir, reaproveita a base existente | Avisos só aparecem ao abrir o app; para o celular apitar dependeria de um botão "Adicionar ao Google Agenda" em cada item. Se perder o celular sem backup, perde tudo. Integração com o financeiro difícil. |
| **2. PWA + Supabase (escolhida)** | PWA instalável; dados no Supabase com login; notificações push enviadas por um job no servidor | Único caminho em que o lembrete chega sem ele precisar lembrar de nada (o problema central). Funciona no celular e no PC, não perde dados ao trocar de aparelho, prepara a v2 (financeiro também no Supabase). Mesma stack que ele escolheu para os projetos de clientes. | Mais peças (login, RLS, push, agendamento); precisa de internet; no iPhone só notifica com o app instalado na tela inicial (iOS 16.4+). |
| 3. App Android nativo | React Native/Expo, notificações locais | Notificações sem servidor, offline | Tecnologia nova para ele, instalação por APK, iPhone fica de fora, nada reaproveitado. Descartada. |

**Escolha: 2 (U).**

---

## 4. O que o app faz

### 4.1 Configuração inicial (uma vez, ~1 minuto)

Passos na primeira vez, todos editáveis depois em Ajustes:

1. **Criar conta / entrar** (e-mail e senha, §7).
2. **Escala de trabalho** (U): escolhe um modelo pronto ou monta o próprio ciclo.
   - Tudo é tratado como **um ciclo que se repete** a partir de uma data (C). Os modelos só preenchem o ciclo:
     - 6x1 → `T T T T T T F`
     - 5x2 → `T T T T T F F`
     - 4x3 → `T T T T F F F`
     - 12x36 → `T F`
     - 3x2 alternado → `T T T F F F T T F F` (a escala atual dele)
     - **Montar meu ciclo**: toca em cada dia para alternar T/F, de 1 a 28 dias (C: limite).
   - Para ancorar o ciclo, ele **toca em qual dia do ciclo é hoje** (C: mais fácil que lembrar quando o ciclo começou). O app guarda a data de início calculada.
   - Mudar a escala depois vale **de hoje em diante**. O passado não é recalculado (C).
3. **Faculdade** (C, a partir do que ele contou): dias da semana com aula (padrão seg a sex) + "sábados alternados" (ele indica se o próximo sábado tem aula; repete a cada 14 dias). Data de fim do semestre opcional. Pode pular.
4. **Treino nas folgas** (U): opção liga/desliga. Ligada, cria a tarefa repetida "Treino" em todas as folgas.
5. **Metas dos hábitos** (C, valores padrão editáveis): dormir 7h por noite; treinar 3 vezes por semana; ler 1 livro por mês.
6. **Notificações** (C): horário dos avisos do dia (padrão 08:00) e o pedido de permissão. No iPhone, antes do pedido, uma tela explica como instalar na tela inicial, porque sem isso não há notificação.

**Exceções de dia** (C): qualquer data pode ser forçada para trabalho ou folga (troca de folga, feriado), e um **período** pode ser marcado como folga (férias). Também dá para marcar "sem aula" num dia ou período. Isso não exige mexer na escala.
- **Dia extra** (U: ele faz): atalho direto na linha do tempo. Tocar na etiqueta FOLGA de um dia → "Virou trabalho (dia extra)". O dia passa a contar como trabalho nos resumos, e as tarefas repetidas de folga (ex.: treino) saem dele (C).
- **Hora extra** não muda o tipo do dia e não é registrada na v1 (C).

### 4.2 Anotar rápido ("+ anotar")

Botão sempre visível na tela inicial (U: anotar à mão, rápido).

- Ele digita **uma linha**, por exemplo `prova química 20/11`, `entrega relatório sexta`, `dentista amanhã 14h`, `estudar cálculo` (C).
- O app lê a linha e mostra uma **prévia editável antes de salvar**: tipo, data, hora, área e repetição. Nunca salva sem mostrar a prévia (C).
- Leitura da linha (C):
  - **Data:** `dd/mm` (próxima ocorrência; se já passou neste ano, é do ano que vem), `dd/mm/aa`, `dd/mm/aaaa`, `dia 28` (próximo dia 28), `hoje`, `amanhã`, `depois de amanhã`, nomes de dia da semana (`seg`, `segunda`... `sex`, `sexta`, `sáb`, `dom`; a próxima ocorrência, contando hoje). Sem data → hoje.
  - **Hora (opcional):** `14h`, `14:30`, `às 14h`.
  - **Tipo:** `prova`, `avaliação`, `p1`/`p2`/`p3` → **prova**. `entrega`, `entregar`, `atividade`, `relatório`, `lista`, `seminário` → **entrega**. `consulta`, `médico`, `dentista`, `reunião`, `encontro` → **compromisso**. Qualquer outra coisa → **tarefa**. Ele pode trocar o tipo na prévia.
  - **Título:** a linha sem a data e a hora, com a primeira letra maiúscula.
- **Área** (C): pessoal, profissional ou acadêmica, porque ele pediu um app para as três vidas. Prova e entrega já vêm como acadêmica, o resto como pessoal; um toque troca. Serve para o resumo da semana por área.
- **Repetição** (U, a opção vale para qualquer tarefa; C, as opções): não repete · todo dia · todas as folgas · todos os dias de trabalho. Só para o tipo tarefa.

### 4.3 Tela inicial (U: escolhida nos mockups)

Ordem de cima para baixo:

1. **Meta em destaque**: a meta de prioridade alta, não concluída, com o **prazo mais próximo**. Cartão grande com degradê na cor da meta, ícone, nome, contagem regressiva grande ("45 dias até 31/12") e o progresso (etapas ou %).
   - Prazo vencido: "atrasada há N dias", em vermelho (C).
   - Sem metas de prioridade alta: um cartão discreto "Criar uma meta" (C).
2. **Cartões das outras metas de prioridade alta**, lado a lado (dois por vez, com rolagem horizontal se houver mais). Cada um com a cor da meta, ícone, nome, porcentagem grande, barra, valor e prazo curto. Tocar abre a meta.
   - (C) O destaque é fixo (sempre a mais urgente), e só os cartões menores rolam. No mockup havia pontinhos sugerindo arrastar o destaque; tirei para não ter dois carrosséis.
3. **"Como foi ontem?"**: cartão do registro diário, enquanto o dia anterior não foi registrado (§4.5). Some depois de salvo.
4. **Linha do tempo dos próximos dias** (U): cada dia mostra a data, a etiqueta **TRABALHO** ou **FOLGA**, "aula" quando houver e os itens do dia.
   - Hoje fica destacado e com caixas de marcar. Os outros dias mostram os itens resumidos (C).
   - Provas, entregas e compromissos aparecem com ⚠ e cor de alerta no dia em que caem.
   - Mostra 7 dias; "ver mais" carrega mais 7 (C).
   - **Pendências** (C): tarefas avulsas de dias anteriores não marcadas aparecem no topo do dia de hoje como "N pendentes", com ações marcar feito, mover (amanhã / próxima folga / escolher data) ou excluir. Tarefas repetidas não acumulam: a ocorrência não feita só conta como não feita.
   - Provas, entregas e compromissos podem ser marcados como feitos ("fiz a prova", "entreguei").
5. **Botão "+ anotar"** flutuante.

Mockups de referência: `vida-pessoal/.superpowers/brainstorm/790-1794851075/content/tela-inicial.html` (opção C) e `metas-v3.html` (opção A, a escolhida). O estilo visual fica para quem constrói (§8).

### 4.4 Avisos e notificações

Notificações push no celular, mesmo com o app fechado (U: escolheu o caminho 2 por causa disso). Regras (C):

| O quê | Quando |
|---|---|
| Registro diário | No horário configurado (padrão 08:00), se o dia anterior ainda não foi registrado. Uma por dia. |
| Prova | 7, 3 e 1 dia antes, e no dia, no horário configurado |
| Entrega | 3 e 1 dia antes, e no dia, no horário configurado |
| Compromisso com hora | 1 dia antes (horário configurado) e 1 hora antes |
| Compromisso sem hora | 1 dia antes e no dia, no horário configurado |
| Meta de prioridade alta | 30 e 7 dias antes do prazo |
| Tarefas | **sem notificação**, para não virar spam (anti-meta) |

- Vários avisos no mesmo horário viram **uma notificação agrupada** ("Hoje: prova de química em 3 dias · entrega do relatório amanhã") (C).
- Marcar um item como feito cancela os avisos seguintes dele.
- Tocar na notificação abre o app na tela certa.
- Em Ajustes: ligar/desligar notificações e mudar o horário. Liga/desliga por tipo fica para depois (C).

### 4.5 Registro diário de hábitos (U: hábitos; C: formato)

Um cartão rápido, sem digitar texto:

```
Esta noite você dormiu   6h30   [−] [+]        (passos de 30 min)
Ontem:
  Exercício   (Não) (15) (30) (45) (60+ min)
  Comida      😞  😐  😀
  Leitura     [ 15 ] páginas   · livro: "Nome do livro"  [terminei]
                                                  [Salvar]
```

- **Sono é guardado pela data em que ele acordou** ("esta noite"). Exercício, comida e leitura são guardados pela data de **ontem** (C). Assim o resumo compara as **noites antes de dia de trabalho** com as **noites antes de folga**.
- Os valores começam preenchidos com os do último registro (C), para salvar em 1 toque num dia típico.
- Leitura: páginas lidas + livro atual opcional (lembra o último). "Terminei" registra o livro como terminado naquela data.
- Dá para preencher ou corrigir qualquer dia dos **últimos 7 dias** (C). Dia sem registro fica como "sem registro", nunca como zero.

### 4.6 Resumos

**Resumo do mês, por hábito** (U: o que mostrar; C: as divisões). Navegável para meses anteriores.
- **Sono:** média por noite × meta, média nas noites antes de trabalho × antes de folga, e gráfico simples noite a noite colorido por trabalho/folga.
- **Exercício:** dias com treino × meta (meta semanal proporcional ao mês), minutos no mês, divisão trabalho/folga.
- **Comida:** % dos dias com 😀 e quantos dias 😞.
- **Leitura:** páginas no mês, livros terminados × meta.
- Sempre mostra quantos dias ficaram sem registro. A média só conta os dias registrados.

**Resumo da semana** (C, resposta à "semana desperdiçada"). Semana de segunda a domingo (C: é como a faculdade e a agenda funcionam).
- **Planejado × feito:** tarefas (avulsas + ocorrências repetidas) e provas/entregas/compromissos daquela semana, feitos ÷ total, por área. Lista do que não foi feito.
- Junto, os hábitos da semana: sono médio, treinos, dias 😀, páginas.
- Na segunda-feira, um cartão "Sua semana passada" aparece no topo da tela inicial até ser aberto ou dispensado (C).

### 4.7 Metas (U: manuais, prazo, prioridade, tipos pelos exemplos dele)

Exemplos dele: vender um projeto até o fim do ano; iniciar a reserva de emergência até o fim do ano; comprar coisas.

- **Campos:** nome, ícone (emoji), cor (paleta fixa de ~8 cores) (C), tipo, prazo (data), prioridade (alta, média, baixa) (U), observação opcional.
- **Tipos:**
  - **Conquista** (ex.: vender um projeto). Etapas opcionais (C, mostradas no mockup), uma lista que dá para marcar e reordenar. Progresso = etapas feitas ÷ total. Sem etapas, é só "feito / não feito".
  - **Valor** (ex.: reserva de emergência). Alvo em R$ e quanto já tem. Ele atualiza à mão ("+ adicionar valor" ou editar o total).
  - **Compra** (ex.: notebook). Igual a valor, com "preço" no lugar de "alvo".
- **Prioridade alta** → aparece na tela inicial (destaque ou cartão) (U). Média e baixa só na aba Metas.
- **Concluir:** a meta vai para "Concluídas", com data. Atingir 100% de valor/compra ou todas as etapas **pergunta** se quer concluir (C).
- **Aba Metas:** lista agrupada por prioridade; concluídas recolhidas no fim; "+ nova meta".

### 4.8 Navegação (C)

Barra inferior com 4 abas: **Início** (§4.3) · **Resumo** (semana e mês, §4.6) · **Metas** (§4.7) · **Ajustes** (escala, faculdade, exceções de dia, tarefas repetidas, metas dos hábitos, notificações, exportar dados, sair).

---

## 5. Dados (modelo conceitual)

Todas as tabelas têm `user_id` e RLS `user_id = auth.uid()` (C). Nomes finais ficam para quem constrói.

- **config** (1 por usuário): ciclo da escala (sequência T/F), data de início do ciclo, dias da semana com aula, sábado de referência com aula (ou nulo), fim do semestre, horário das notificações, metas dos hábitos (horas de sono, treinos/semana, livros/mês), treino nas folgas (sim/não), fuso (`America/Sao_Paulo`).
  - Mudança de escala "de hoje em diante" (§4.1) → guardar o **histórico de escalas** (vigente a partir de tal data), não só a atual (C).
- **excecoes_dia**: data início, data fim, força trabalho/folga e/ou sem aula.
- **itens**: tipo (prova, entrega, compromisso, tarefa), título, data, hora (opcional), área, feito_em (opcional), repetição (nenhuma, todo dia, folgas, trabalho), repetição vale até (opcional, para encerrar).
- **conclusoes_repetidas**: item, data da ocorrência.
- **sono**: data (em que acordou), horas.
- **registros_diarios**: data, minutos de exercício (0 = não), comida (1 a 3), páginas, livro (opcional).
- **livros**: título, terminado_em (opcional).
- **metas**: nome, ícone, cor, tipo, prazo, prioridade, alvo (centavos), atual (centavos), concluída_em, observação.
- **etapas_meta**: meta, texto, ordem, feita.
- **push_inscricoes**: endpoint, chaves, aparelho, criada_em.
- **notificacoes_enviadas**: chave única (ex.: `prova:<item>:7d`) para não repetir envio.

Datas de "dia" são `date` no fuso `America/Sao_Paulo`, nunca timestamp UTC (C).

---

## 6. Arquitetura

- **Front-end:** React + TypeScript + Vite + `vite-plugin-pwa`, a mesma base do Painel Financeiro (C: ele já conhece). Instalável, com o "shell" em cache para abrir rápido. Deploy na Vercel. Repositório GitHub novo; público ou privado é decisão dele, e nenhum dado pessoal vai para o repositório.
- **Supabase** (U: caminho 2), **projeto novo** separado do "teste", região São Paulo (C):
  - **Auth com e-mail e senha** (C). Motivo: no iPhone, o link mágico por e-mail abre no Safari e não no app instalado, e o login não chegaria ao app.
  - Cadastro público **desligado** depois de criar a conta dele (C: app pessoal).
  - Banco Postgres; **mudanças só por arquivos SQL versionados** (migrations), RLS em todas as tabelas, validações com `check` no banco (lições do laboratório Supabase dele).
- **Notificações push:** Web Push com chaves VAPID.
  - O front registra a inscrição (`push_inscricoes`) depois da permissão. O service worker trata `push` e `notificationclick`.
  - Uma **Edge Function** (`enviar-notificacoes`) roda **a cada 15 minutos** via `pg_cron` + `pg_net` (C). Ela calcula o que vence naquela janela no fuso de São Paulo, agrupa por pessoa, envia e grava em `notificacoes_enviadas`. Inscrições mortas (HTTP 404/410) são apagadas.
  - Chave privada VAPID e service role **só** nos secrets do Supabase, nunca no front nem no repositório.
- **Sem internet** (U: o celular dele pode ficar sem internet no trabalho ou na faculdade, na hora de anotar). O uso do dia a dia tem que funcionar offline:
  - O app abre e mostra os **últimos dados sincronizados**, guardados no aparelho (IndexedDB) (C).
  - Funcionam offline: **"+ anotar"**, **marcar item como feito**, **registro diário**, **atualizar meta** (valor, etapa) (C). A mudança aparece na hora na tela e entra numa **fila local** que é enviada quando a internet volta (ao reabrir o app, ao voltar a conexão ou periodicamente).
  - IDs gerados no aparelho (UUID), para o item existir antes de chegar ao servidor (C).
  - Conflito (mesmo registro mudado no celular e no PC sem sincronizar): **vence a última alteração**, por `atualizado_em` (C: usuário único, conflito é raro). Exclusões viram marcação "excluído" para sincronizar.
  - Um indicador discreto mostra "N alterações esperando internet" (C).
  - Ficam online: login, Ajustes (escala, faculdade, exceções, notificações) e exportar dados (C).
  - Limite aceito: um item anotado offline só recebe notificações depois de chegar ao servidor.
- **Exportar dados** (C): botão em Ajustes que baixa/compartilha um JSON com tudo. O Supabase grátis não tem backup automático.
- **Plano grátis do Supabase pausa o projeto após 7 dias sem uso.** O uso diário evita isso; o README deve explicar como reativar (C).
- **Como montar a infraestrutura** (C). Ele cria o projeto Supabase no painel (já sabe fazer) e gera um token de acesso. O Claude roda a Supabase CLI via `npx` (link, migrations, deploy da Edge Function, secrets), sempre explicando cada passo, porque ele quer aprender na prática. O PC dele **não tem Docker**, então não há Supabase local: RLS e o job de notificações são testados no projeto real com scripts de verificação. Vercel e GitHub seguem o mesmo caminho do Painel Financeiro. A pasta `.superpowers/` vai no `.gitignore`.
- **Testes:** Vitest para a lógica pura, como no Painel Financeiro: cálculo do ciclo/escala com exceções, leitura da linha do "+ anotar", agenda de notificações, resumos de semana e mês, metas (destaque, progresso). Essa lógica deve ficar em funções puras que tanto o front quanto a Edge Function usem (C).

---

## 7. Decisões do Claude para o usuário conferir

Estão marcadas com (C) ao longo do texto. As que mais mudam o uso:
1. Sono guardado pela data em que acordou; o resto pela data de ontem (§4.5).
2. Regras e antecedências das notificações; tarefas não notificam (§4.4).
3. Tarefas avulsas não feitas viram "pendentes" no dia de hoje (§4.3).
4. Semana de segunda a domingo no resumo semanal (§4.6).
5. Área (pessoal / profissional / acadêmica) em cada item (§4.2).
6. Login com e-mail e senha, cadastro público desligado (§6).
7. Sem internet: o dia a dia funciona e sincroniza depois; Ajustes exigem internet; em conflito vence a última alteração (§6).
8. Metas padrão dos hábitos: 7h de sono, 3 treinos/semana, 1 livro/mês (§4.1).
9. Destaque da tela inicial sempre fixo na meta mais urgente; só os cartões menores rolam (§4.3).

---

## 8. Fica para quem constrói

- Estilo visual (cores, fontes, ícones), desde que siga o layout escolhido nos mockups. Pode seguir a identidade do Painel Financeiro.
- Biblioteca de gráficos (o Painel Financeiro usa Recharts).
- Nomes de tabelas, colunas, componentes e pastas.
- Como compartilhar a lógica pura entre o front (Node/Vite) e a Edge Function (Deno).
- Textos dos estados vazios e das mensagens.
- Animação ao concluir uma meta.

## 9. Depois da v1

- **v2: integração com o Painel Financeiro** (U): ver aqui a barra da reserva de emergência atualizada sem digitar. Provável caminho: o Painel Financeiro também passar para o Supabase, na mesma conta.
- Liga/desliga de notificação por tipo; antecedências configuráveis.
- Ajustes funcionando sem internet.
- Registro de hora extra.
