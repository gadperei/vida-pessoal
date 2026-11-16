/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_CHAVE_PUBLICA: string;
  readonly VITE_VAPID_PUBLICA: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
