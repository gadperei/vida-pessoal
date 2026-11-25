import { createClient } from '@supabase/supabase-js';

// Endereço do projeto e chave PUBLICÁVEL: os dois são públicos (todo navegador que abre o app os recebe)
// e a proteção dos dados é o RLS + login. Ficam no código para o app não depender de variáveis na Vercel.
// A chave secreta (service role) NUNCA entra aqui.
const URL_SUPABASE = 'https://jnhuuhrzebxfminnhfiz.supabase.co';
const CHAVE_PUBLICAVEL = 'sb_publishable_sCU3slda8MzES5sJ1Z_-RA_AC3rEL8n';

export const cliente = createClient(URL_SUPABASE, CHAVE_PUBLICAVEL);
