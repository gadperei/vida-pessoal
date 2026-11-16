-- Cada pessoa só enxerga e altera as próprias linhas. Sem DELETE: exclusão é marcada (excluido_em).
do $$
declare t text;
begin
  foreach t in array array['config', 'escalas', 'excecoes', 'itens', 'conclusoes', 'dias', 'livros', 'metas', 'etapas'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy dono on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update on public.%I to authenticated', t);
  end loop;
end $$;

alter table public.push_inscricoes enable row level security;
create policy dono on public.push_inscricoes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.push_inscricoes from anon, authenticated;
grant select, insert, update, delete on public.push_inscricoes to authenticated;

alter table public.notificacoes_enviadas enable row level security;
revoke all on public.notificacoes_enviadas from anon, authenticated;
