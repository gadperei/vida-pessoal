-- "Vence a última alteração": uma gravação com atualizado_em mais antigo que o salvo é ignorada.
-- sincronizado_em é sempre definido aqui, para o app buscar só o que mudou.
create or replace function public.antes_de_gravar() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.atualizado_em < old.atualizado_em then
    return null;
  end if;
  new.sincronizado_em := clock_timestamp();
  return new;
end
$$;

do $$
declare t text;
begin
  foreach t in array array['config', 'escalas', 'excecoes', 'itens', 'conclusoes', 'dias', 'livros', 'metas', 'etapas'] loop
    execute format('create trigger antes_de_gravar before insert or update on public.%I for each row execute function public.antes_de_gravar()', t);
    execute format('create index %I on public.%I (user_id, sincronizado_em)', t || '_sincronizado', t);
  end loop;
end $$;
