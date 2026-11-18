import { describe, expect, it } from 'vitest';
import { CHAVE_VAPID_PUBLICA, base64UrlParaBytes, resumoAparelho } from './push.ts';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';
const EDGE = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 Edg/140.0';

describe('push', () => {
  it('converte a chave VAPID de base64url', () => {
    expect(Array.from(base64UrlParaBytes('AQID-_8'))).toEqual([1, 2, 3, 251, 255]);
  });

  it('a chave pública VAPID do app é um ponto P-256 válido (65 bytes, começa com 4)', () => {
    const bytes = base64UrlParaBytes(CHAVE_VAPID_PUBLICA);
    expect(bytes).toHaveLength(65);
    expect(bytes[0]).toBe(4);
  });

  it('resume o aparelho a partir do userAgent', () => {
    expect(resumoAparelho(IPHONE)).toBe('iPhone · Safari');
    expect(resumoAparelho(ANDROID)).toBe('Android · Chrome');
    expect(resumoAparelho(EDGE)).toBe('Windows · Edge');
    expect(resumoAparelho('curl/8')).toBe('Outro');
  });
});
