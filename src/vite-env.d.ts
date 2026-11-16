/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_CHAVE_PUBLICA: string;
  readonly VITE_VAPID_PUBLICA: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
