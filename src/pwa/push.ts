import type { SupabaseClient } from '@supabase/supabase-js';
import { estaInstalado, plataformaInstalacao } from './plataforma.ts';

export type SituacaoPush = 'sem-suporte' | 'precisa-instalar' | 'negado' | 'pode-pedir' | 'ativo';

/** Chave VAPID (base64url, sem "=") → bytes, como o pushManager.subscribe pede. */
export function base64UrlParaBytes(b64: string): Uint8Array<ArrayBuffer> {
  const normal = b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(normal);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** "iPhone · Safari", "Android · Chrome"… para reconhecer a inscrição na tabela. */
export function resumoAparelho(ua: string): string {
  const sistema = /iPhone|iPad|iPod/i.test(ua) ? 'iPhone'
    : /Android/i.test(ua) ? 'Android'
    : /Windows/i.test(ua) ? 'Windows'
    : /Mac OS X/i.test(ua) ? 'Mac'
    : 'Outro';
  const navegador = /Edg\//.test(ua) ? 'Edge'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Safari\//.test(ua) ? 'Safari'
    : '';
  return navegador ? `${sistema} · ${navegador}` : sistema;
}

function temSuporte(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function situacaoPush(): SituacaoPush {
  // No iPhone, o push só existe no app instalado (aberto pelo ícone).
  if (plataformaInstalacao(navigator.userAgent, estaInstalado()) === 'ios') return 'precisa-instalar';
  if (!temSuporte()) return 'sem-suporte';
  if (Notification.permission === 'denied') return 'negado';
  if (Notification.permission === 'granted') return 'ativo';
  return 'pode-pedir';
}

function mesmaChave(a: ArrayBuffer | null, b: Uint8Array): boolean {
  if (!a || a.byteLength !== b.byteLength) return false;
  const x = new Uint8Array(a);
  return x.every((v, i) => v === b[i]);
}

/**
 * Pede a permissão (chamar sempre a partir de um toque), assina o push e guarda a inscrição.
 * Se a permissão já foi dada, só confere a inscrição e regrava (serve para "renovar" ao abrir o app).
 * Lança erro se não conseguir gravar no Supabase (ex.: sem internet).
 */
export async function ativarPush(cliente: SupabaseClient): Promise<'ok' | 'negado' | 'sem-suporte'> {
  if (!temSuporte()) return 'sem-suporte';
  const permissao = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permissao !== 'granted') return 'negado';

  const registro = await navigator.serviceWorker.ready;
  const chave = base64UrlParaBytes(import.meta.env.VITE_VAPID_PUBLICA);
  let inscricao = await registro.pushManager.getSubscription();
  if (inscricao && !mesmaChave(inscricao.options.applicationServerKey, chave)) {
    await inscricao.unsubscribe();
    inscricao = null;
  }
  inscricao ??= await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chave });

  const { keys } = inscricao.toJSON();
  const { error } = await cliente.from('push_inscricoes').upsert(
    { endpoint: inscricao.endpoint, p256dh: keys?.p256dh, auth: keys?.auth, aparelho: resumoAparelho(navigator.userAgent) },
    { onConflict: 'endpoint' },
  );
  if (error) throw new Error(error.message);
  return 'ok';
}
