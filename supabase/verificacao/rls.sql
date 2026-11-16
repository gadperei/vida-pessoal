-- Roteiro de verificação: colar no SQL Editor do Supabase e rodar.
-- Tudo acontece dentro de uma transação desfeita no fim (rollback): nada fica gravado.
-- Resultado esperado: uma linha "RLS OK". Qualquer outro resultado é um erro com a explicação.
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a@teste.invalid'),
  ('00000000-0000-0000-0000-0000000000b2', 'b@teste.invalid');

set local role authenticated;

-- Usuário A cria uma tarefa.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
insert into public.itens (id, tipo, titulo, data, area, repeticao, atualizado_em)
values ('i1', 'tarefa', 'Teste A', '2026-11-16', 'pessoal', 'nenhuma', '2026-11-16T12:00:00Z');

-- Usuário B não enxerga, não altera e ninguém apaga.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}';
do $$ begin
  assert (select count(*) from public.itens) = 0, 'B enxergou a linha de A';
end $$;
update public.itens set titulo = 'Invadido' where id = 'i1';
do $$ begin
  begin
    delete from public.itens where id = 'i1';
    raise exception 'DELETE deveria ter sido negado';
  exception when insufficient_privilege then null;
  end;
end $$;

-- De volta ao usuário A: a linha está intacta e vale a última alteração.
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
do $$ begin
  assert (select titulo from public.itens where id = 'i1') = 'Teste A', 'B conseguiu alterar a linha de A';
end $$;
update public.itens set titulo = 'Velho', atualizado_em = '2026-11-16T11:00:00Z' where id = 'i1';
do $$ begin
  assert (select titulo from public.itens where id = 'i1') = 'Teste A', 'uma alteração mais antiga sobrescreveu a mais nova';
end $$;
update public.itens set titulo = 'Novo', atualizado_em = '2026-11-16T13:00:00Z' where id = 'i1';
do $$ begin
  assert (select titulo from public.itens where id = 'i1') = 'Novo', 'a alteração mais nova não foi gravada';
end $$;

-- O app não lê os avisos enviados (só a Edge Function).
do $$ begin
  begin
    perform 1 from public.notificacoes_enviadas;
    raise exception 'notificacoes_enviadas deveria ser negado';
  exception when insufficient_privilege then null;
  end;
end $$;

select 'RLS OK' as resultado;
rollback;
