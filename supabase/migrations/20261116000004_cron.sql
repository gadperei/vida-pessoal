-- A cada 15 minutos, chama a Edge Function enviar-notificacoes.
-- A URL e o segredo ficam no cofre (vault), não neste arquivo.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- cron.schedule com o mesmo nome substitui o job: rodar de novo é seguro.
select cron.schedule(
  'enviar-notificacoes',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'url_funcao_notificacoes'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-segredo', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_segredo')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
