-- Tabelas do Vida Pessoal. Toda tabela sincronizada tem (user_id, id) como chave,
-- atualizado_em (definido pelo app), excluido_em (exclusão marcada) e sincronizado_em (definido pelo banco).

create table public.config (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null check (id = 'config'),
  aula_dias_semana smallint[] not null default '{}' check (aula_dias_semana <@ array[0,1,2,3,4,5,6]::smallint[]),
  sabado_referencia date,
  semestre_fim date,
  horario_avisos text not null default '08:00' check (horario_avisos ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  notificacoes_ligadas boolean not null default true,
  meta_sono_min integer not null default 420 check (meta_sono_min between 0 and 1440),
  meta_treinos_semana integer not null default 3 check (meta_treinos_semana between 0 and 14),
  meta_livros_mes integer not null default 1 check (meta_livros_mes between 0 and 100),
  treino_item_id text,
  configurado_em timestamptz,
  atualizado_em timestamptz not null,
  excluido_em timestamptz,
  sincronizado_em timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.escalas (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  ciclo text not null check (ciclo ~ '^[TF]{1,28}$'),
  inicio date not null,
  vigente_desde date not null,
  atualizado_em timestamptz not null,
  excluido_em timestamptz,
  sincronizado_em timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.excecoes (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  inicio date not null,
  fim date not null,
  tipo_dia text check (tipo_dia in ('T', 'F')),
  sem_aula boolean not null default false,
  atualizado_em timestamptz not null,
  excluido_em timestamptz,
  sincronizado_em timestamptz not null default now(),
  primary key (user_id, id),
  check (fim >= inicio)
);

create table public.itens (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  tipo text not null check (tipo in ('prova', 'entrega', 'compromisso', 'tarefa')),
  titulo text not null check (char_length(titulo) between 1 and 200),
  data date not null,
  hora text check (hora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  area text not null check (area in ('pessoal', 'profissional', 'academica')),
  feito_em timestamptz,
  repeticao text not null default 'nenhuma' check (repeticao in ('nenhuma', 'todo_dia', 'folgas', 'trabalho')),
  repete_ate date,
  atualizado_em timestamptz not null,
  excluido_em timestamptz,
  sincronizado_em timestamptz not null default now(),
  primary key (user_id, id),
  check (repeticao = 'nenhuma' or tipo = 'tarefa')
);

create table public.conclusoes (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  item_id text not null,
  data date not null,
  atualizado_em timestamptz not null,
  excluido_em timestamptz,
  sincronizado_em timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.dias (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  data date not null,
  sono_min integer check (sono_min between 0 and 1440),
  habitos_em timestamptz,
  exercicio_min integer check (exercicio_min between 0 and 1440),
  comida smallint check (comida between 1 and 3),
  paginas integer check (paginas between 0 and 10000),
  livro_id text,
  atualizado_em timestamptz not null,
  excluido_em timestamptz,
  sincronizado_em timestamptz not null default now(),
  primary key (user_id, id),
  check (id = data::text)
);

create table public.livros (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  titulo text not null check (char_length(titulo) between 1 and 200),
  terminado_em date,
  atualizado_em timestamptz not null,
  excluido_em timestamptz,
  sincronizado_em timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.metas (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  nome text not null check (char_length(nome) between 1 and 200),
  icone text not null check (char_length(icone) between 1 and 16),
  cor text not null check (cor ~ '^#[0-9a-fA-F]{6}$'),
  tipo text not null check (tipo in ('conquista', 'valor', 'compra')),
  prazo date not null,
  prioridade text not null check (prioridade in ('alta', 'media', 'baixa')),
  alvo_centavos bigint check (alvo_centavos >= 0),
  atual_centavos bigint check (atual_centavos >= 0),
  concluida_em date,
  observacao text check (char_length(observacao) <= 2000),
  atualizado_em timestamptz not null,
  excluido_em timestamptz,
  sincronizado_em timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.etapas (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  meta_id text not null,
  texto text not null check (char_length(texto) between 1 and 200),
  ordem integer not null default 0,
  feita boolean not null default false,
  atualizado_em timestamptz not null,
  excluido_em timestamptz,
  sincronizado_em timestamptz not null default now(),
  primary key (user_id, id)
);

-- Inscrições de push de cada aparelho.
create table public.push_inscricoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  aparelho text,
  criada_em timestamptz not null default now()
);

-- Avisos já enviados (para não repetir). Só a Edge Function usa.
create table public.notificacoes_enviadas (
  user_id uuid not null references auth.users on delete cascade,
  chave text not null,
  enviada_em timestamptz not null default now(),
  primary key (user_id, chave)
);
